-- Marketing waitlist signups from the landing page.
--
-- Schema isolation: lives in its own `marketing` schema so that future
-- non-identity surfaces (referral codes, content drips) can co-locate
-- without bloating the identity-owned table list. NOT subject to RLS —
-- signups are pre-tenant and accessed by ops via direct admin queries.

-- +goose Up
-- +goose StatementBegin
CREATE SCHEMA IF NOT EXISTS marketing;

CREATE TABLE IF NOT EXISTS marketing.waitlist_signups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext NOT NULL,
  -- Normalized lowercase for uniqueness; citext keeps the case-insensitive
  -- read path while preserving display casing for outbound mail.
  role            text NOT NULL DEFAULT '',
  locale          text NOT NULL DEFAULT '',
  source          text NOT NULL DEFAULT 'landing',
  ip              inet,
  user_agent      text NOT NULL DEFAULT '',
  -- Double-opt-in: NULL until the recipient clicks the confirm link.
  confirmed_at    timestamptz,
  confirm_token   text,
  -- Soft-state: lets ops mark a signup as bouncing / unsubscribed without
  -- losing the row (useful for compliance / re-engagement reporting).
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','bounced','unsubscribed')),
  notes           text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Re-signups update existing rows rather than create duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_signups_email_uq
  ON marketing.waitlist_signups (email);
CREATE INDEX IF NOT EXISTS waitlist_signups_status_created
  ON marketing.waitlist_signups (status, created_at DESC);

CREATE TRIGGER waitlist_signups_updated_at
  BEFORE UPDATE ON marketing.waitlist_signups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS marketing.waitlist_signups;
DROP SCHEMA IF EXISTS marketing;
-- +goose StatementEnd
