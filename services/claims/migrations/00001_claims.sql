-- Claims service schema — detention claims per tenant.
--
-- One row per detention event the dispatcher (or eventually the ELD
-- auto-trigger) wants to recover. Lifecycle:
--   draft   → AI has drafted the email body but nothing was sent yet.
--   sent    → email left our outbox, awaiting broker reply.
--   paid    → broker paid; success-fee invoice can be created.
--   denied  → broker formally refused — claim closed.
--   disputed→ broker pushing back; ops team owns it.

-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS claims (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL,
  -- Human-facing identifier — shown in the dashboard ("CLM-4827").
  -- Generated as `'CLM-' || lpad(serial::text, 4, '0')` at insert time.
  ref                text NOT NULL,
  broker_mc          text NOT NULL,
  broker_name        text NOT NULL DEFAULT '',
  load_ref           text NOT NULL DEFAULT '',
  dwell_hours        numeric(5,2) NOT NULL CHECK (dwell_hours >= 0 AND dwell_hours <= 168),
  -- Money is always cents in pgxdb (Go int64) to dodge float drift.
  claim_amount_cents bigint NOT NULL CHECK (claim_amount_cents >= 0),
  recovered_cents    bigint NOT NULL DEFAULT 0 CHECK (recovered_cents >= 0),
  status             text NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','sent','paid','denied','disputed')),
  -- AI-drafted email body. Dispatcher previews + edits before send.
  drafted_subject    text NOT NULL DEFAULT '',
  drafted_body       text NOT NULL DEFAULT '',
  -- AI-flag: dispatcher hit "approve" without edits.
  ai_drafted         boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  drafted_at         timestamptz,
  sent_at            timestamptz,
  paid_at            timestamptz,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Dashboard sorts newest-first; status filter is the second hot query.
CREATE UNIQUE INDEX IF NOT EXISTS claims_tenant_ref_uq
  ON claims (tenant_id, ref);
CREATE INDEX IF NOT EXISTS claims_tenant_created
  ON claims (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS claims_tenant_status
  ON claims (tenant_id, status, created_at DESC);

-- Auto-incrementing per-tenant sequence for the ref column. We use a
-- single global sequence + ref-with-padding because re-using a true
-- per-tenant counter would force a separate sequence-create per signup.
-- Collisions across tenants don't matter — `(tenant_id, ref)` is unique.
CREATE SEQUENCE IF NOT EXISTS claims_ref_seq START 4800;

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY claims_tenant ON claims
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE OR REPLACE FUNCTION claims_set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION claims_set_updated_at();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS claims;
DROP SEQUENCE IF EXISTS claims_ref_seq;
DROP FUNCTION IF EXISTS claims_set_updated_at();
-- +goose StatementEnd
