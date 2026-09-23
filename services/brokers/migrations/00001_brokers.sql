-- Brokers service schema — vetted brokers per tenant.
--
-- Each tenant has their own list of brokers they've vetted; the global
-- broker database (FMCSA + carrier-reported pay data) lives separately
-- and will land in services/brokers Phase 2. For now we model the
-- per-tenant "I vetted broker MC-NNN, here was the score on that day"
-- table — enough to power the customer dashboard's Brokers page.

-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS vetted_brokers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL,
  -- Broker primary key — FMCSA Motor Carrier number. Stored as text so we
  -- preserve the "MC-NNNN" prefix the dashboard displays.
  mc             text NOT NULL,
  name           text NOT NULL DEFAULT '',
  city           text NOT NULL DEFAULT '',
  -- Score snapshot at last vetting (0..100). The real "current" score is
  -- recomputed on demand by the AI gateway; this column is the read-side
  -- cache for cheap dashboard rendering.
  score          smallint NOT NULL CHECK (score BETWEEN 0 AND 100),
  pay_days       smallint NOT NULL DEFAULT 30 CHECK (pay_days BETWEEN 0 AND 365),
  loads          integer  NOT NULL DEFAULT 0  CHECK (loads >= 0),
  recovered_cents bigint  NOT NULL DEFAULT 0  CHECK (recovered_cents >= 0),
  -- Status enum drives the colour pill in the dashboard table.
  status         text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('preferred','active','watch','blocked')),
  -- Last AI evaluation timestamp (read-only — set by the service, not by
  -- the dashboard). Lets us age out stale scores in the UI.
  last_scored_at timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- One row per (tenant, broker). Re-vetting the same MC updates in place.
CREATE UNIQUE INDEX IF NOT EXISTS vetted_brokers_tenant_mc_uq
  ON vetted_brokers (tenant_id, mc);

-- Dashboard list endpoint sorts by score desc (most-preferred first).
CREATE INDEX IF NOT EXISTS vetted_brokers_tenant_score
  ON vetted_brokers (tenant_id, score DESC);

-- RLS — the only way to read a row is to set app.tenant_id first.
ALTER TABLE vetted_brokers ENABLE ROW LEVEL SECURITY;
CREATE POLICY vetted_brokers_tenant ON vetted_brokers
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- Trigger to maintain updated_at on UPDATE.
CREATE OR REPLACE FUNCTION vetted_brokers_set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vetted_brokers_updated_at
  BEFORE UPDATE ON vetted_brokers
  FOR EACH ROW EXECUTE FUNCTION vetted_brokers_set_updated_at();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS vetted_brokers;
DROP FUNCTION IF EXISTS vetted_brokers_set_updated_at();
-- +goose StatementEnd
