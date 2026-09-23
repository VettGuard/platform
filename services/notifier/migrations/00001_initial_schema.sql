-- +goose Up
-- +goose StatementBegin

-- Idempotency + audit log for sent messages. `idempotency_key` is supplied
-- by the caller (e.g. identity.signup uses the verification token id);
-- re-send with the same key returns the original message_id.
CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,                            -- nullable for unauth flows (signup verify)
  channel           TEXT NOT NULL CHECK (channel IN ('email','sms')),
  template          TEXT NOT NULL,
  recipient         TEXT NOT NULL,
  idempotency_key   TEXT NOT NULL,
  provider_msg_id   TEXT,
  status            TEXT NOT NULL DEFAULT 'sent',    -- sent | bounced | complained | dropped | failed
  error             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX messages_idem_idx ON messages (idempotency_key);
CREATE INDEX messages_recipient_idx   ON messages (recipient);
CREATE INDEX messages_tenant_idx      ON messages (tenant_id);

-- Suppression list: bounced/complained recipients. Future SendEmail looks
-- this up first and short-circuits to status='dropped'.
CREATE TABLE suppressions (
  recipient   TEXT PRIMARY KEY,
  reason      TEXT NOT NULL,                          -- hard_bounce | complaint | manual
  source      TEXT NOT NULL,                          -- postmark | admin
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS suppressions;
DROP TABLE IF EXISTS messages;
-- +goose StatementEnd
