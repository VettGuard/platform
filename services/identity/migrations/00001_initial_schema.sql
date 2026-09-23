-- +goose Up
-- +goose StatementBegin

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ─── tenants ────────────────────────────────────────────────────────────────
-- A tenant = a trucking company / customer of VettGuard.
CREATE TABLE tenants (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  slug               CITEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  country            TEXT NOT NULL DEFAULT 'US' CHECK (length(country) = 2),
  mc_number          TEXT,
  dot_number         TEXT,
  stripe_customer_id TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ
);
CREATE INDEX tenants_active_idx ON tenants (id) WHERE deleted_at IS NULL;

-- ─── users ──────────────────────────────────────────────────────────────────
-- Users are GLOBAL (a single user may belong to multiple tenants via memberships).
-- Visibility from a tenant context is enforced at the application layer via JOIN.
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               CITEXT NOT NULL UNIQUE,
  email_verified_at   TIMESTAMPTZ,
  password_hash       TEXT,  -- Argon2id; NULL for OAuth-only accounts
  full_name           TEXT NOT NULL DEFAULT '' CHECK (length(full_name) <= 200),
  locale              TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en','uz','ru','es','tr','uk')),
  failed_login_count  INT  NOT NULL DEFAULT 0,
  locked_until        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX users_email_lower_idx ON users (lower(email));

-- ─── memberships ────────────────────────────────────────────────────────────
-- A user's role within a tenant. Composite PK prevents duplicates.
CREATE TABLE memberships (
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('owner','admin','dispatcher','viewer')),
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);
CREATE INDEX memberships_user_idx ON memberships (user_id);

-- ─── sessions ───────────────────────────────────────────────────────────────
-- Refresh tokens are server-side and stored as sha256 hashes.
-- Access tokens are stateless JWTs (15 min). See ADR-003.
CREATE TABLE sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  refresh_token_hash  TEXT NOT NULL UNIQUE,
  user_agent          TEXT,
  ip                  INET,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at          TIMESTAMPTZ NOT NULL,
  revoked_at          TIMESTAMPTZ,
  revoked_reason      TEXT
);
CREATE INDEX sessions_user_idx          ON sessions (user_id);
CREATE INDEX sessions_active_expires_idx ON sessions (expires_at) WHERE revoked_at IS NULL;

-- ─── oauth_links ────────────────────────────────────────────────────────────
CREATE TABLE oauth_links (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL CHECK (provider IN ('google','microsoft')),
  external_id TEXT NOT NULL,
  email       CITEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, external_id)
);
CREATE INDEX oauth_links_user_idx ON oauth_links (user_id);

-- ─── mfa_factors ────────────────────────────────────────────────────────────
-- TOTP secrets are AES-GCM encrypted at the application layer before insert.
CREATE TABLE mfa_factors (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('totp','recovery')),
  secret_encrypted BYTEA NOT NULL,
  label            TEXT,
  verified_at      TIMESTAMPTZ,
  used_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mfa_factors_user_idx ON mfa_factors (user_id);

-- ─── email_verifications & password_resets ──────────────────────────────────
-- Single-use tokens (stored as hash for replay protection).
CREATE TABLE email_verifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email       CITEXT NOT NULL,
  token_hash  TEXT   NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE password_resets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── updated_at trigger ─────────────────────────────────────────────────────
-- +goose StatementEnd
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd
-- +goose StatementBegin
CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- ─── Row-Level Security ─────────────────────────────────────────────────────
-- Tenant-scoped tables enforce isolation at the database layer.
-- The application sets `app.tenant_id` per request via SET LOCAL.
-- See ADR-002 for the full multi-tenancy model.

-- +goose StatementBegin
ALTER TABLE tenants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions    ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_self ON tenants
  USING (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY memberships_tenant ON memberships
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY sessions_tenant ON sessions
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
-- +goose StatementEnd

-- NOTE: users, oauth_links, mfa_factors, email_verifications, password_resets are
-- GLOBAL (not tenant-scoped). Access is gated at the application layer:
-- the gateway/service verifies the requesting user has a membership in the
-- tenant of any user record it queries.

-- +goose Down
-- +goose StatementBegin
DROP TRIGGER IF EXISTS users_updated_at   ON users;
DROP TRIGGER IF EXISTS tenants_updated_at ON tenants;
DROP FUNCTION IF EXISTS set_updated_at();

DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS email_verifications;
DROP TABLE IF EXISTS mfa_factors;
DROP TABLE IF EXISTS oauth_links;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;
-- +goose StatementEnd
