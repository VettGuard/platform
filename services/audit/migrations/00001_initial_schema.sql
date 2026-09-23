-- +goose Up
-- +goose NO TRANSACTION
-- (DO blocks to create partitions must run outside an implicit transaction.)

-- audit_events is RANGE-partitioned on occurred_at. We pre-create monthly
-- partitions for the past month + the next 12 months. A future cron job
-- (Phase 4 ops) extends the window and archives + DETACHes the oldest.
CREATE TABLE audit_events (
  id           UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id    UUID,                                      -- nullable for system events
  actor_id     UUID,                                      -- nullable for system actor
  actor_type   TEXT NOT NULL CHECK (actor_type IN ('user','service','system')),
  action       TEXT NOT NULL,
  target_type  TEXT,
  target_id    TEXT,
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip           INET,
  user_agent   TEXT,
  request_id   TEXT,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE INDEX audit_events_tenant_idx   ON audit_events (tenant_id, occurred_at DESC);
CREATE INDEX audit_events_actor_idx    ON audit_events (actor_id, occurred_at DESC);
CREATE INDEX audit_events_action_idx   ON audit_events (action, occurred_at DESC);

-- Pre-create partitions: previous month + next 12. Naming: audit_events_YYYY_MM.
DO $$
DECLARE
  start_date DATE := date_trunc('month', now())::date - INTERVAL '1 month';
  i INT;
  pstart DATE;
  pend   DATE;
  pname  TEXT;
BEGIN
  FOR i IN 0..13 LOOP
    pstart := (start_date + (i || ' months')::INTERVAL)::date;
    pend   := (start_date + ((i+1) || ' months')::INTERVAL)::date;
    pname  := 'audit_events_' || to_char(pstart, 'YYYY_MM');
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF audit_events FOR VALUES FROM (%L) TO (%L)',
      pname, pstart, pend);
  END LOOP;
END $$;

-- +goose Down
-- +goose NO TRANSACTION
DROP TABLE IF EXISTS audit_events CASCADE;
