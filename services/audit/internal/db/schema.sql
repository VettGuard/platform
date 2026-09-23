-- Flat schema for sqlc code generation only. The real production table is
-- declared in migrations/00001_initial_schema.sql with monthly RANGE
-- partitioning on occurred_at. Keep the columns in sync between the two.
CREATE TABLE audit_events (
  id           UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id    UUID,
  actor_id     UUID,
  actor_type   TEXT NOT NULL,
  action       TEXT NOT NULL,
  target_type  TEXT,
  target_id    TEXT,
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip           INET,
  user_agent   TEXT,
  request_id   TEXT,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
