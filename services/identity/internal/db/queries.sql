-- ─── tenants ────────────────────────────────────────────────────────────────

-- name: CreateTenant :one
INSERT INTO tenants (name, slug, country, mc_number, dot_number)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetTenantByID :one
SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL;

-- name: GetTenantBySlug :one
SELECT * FROM tenants WHERE slug = $1 AND deleted_at IS NULL;

-- name: SetTenantStripeCustomer :exec
UPDATE tenants SET stripe_customer_id = $2 WHERE id = $1;

-- ─── users ──────────────────────────────────────────────────────────────────

-- name: CreateUser :one
INSERT INTO users (email, password_hash, full_name, locale)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL;

-- name: SetUserPassword :exec
UPDATE users SET password_hash = $2, failed_login_count = 0, locked_until = NULL WHERE id = $1;

-- name: MarkUserVerified :exec
UPDATE users SET email_verified_at = now() WHERE id = $1 AND email_verified_at IS NULL;

-- name: IncrementFailedLogin :one
UPDATE users
  SET failed_login_count = failed_login_count + 1,
      locked_until = CASE
        WHEN failed_login_count + 1 >= 5 THEN now() + INTERVAL '15 minutes'
        ELSE locked_until
      END
  WHERE id = $1
  RETURNING failed_login_count, locked_until;

-- name: ResetFailedLogin :exec
UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = $1;

-- ─── memberships ────────────────────────────────────────────────────────────

-- name: CreateMembership :one
INSERT INTO memberships (tenant_id, user_id, role, invited_by)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetMembership :one
SELECT * FROM memberships WHERE tenant_id = $1 AND user_id = $2;

-- name: ListMembershipsForUser :many
SELECT m.*, t.name AS tenant_name, t.slug AS tenant_slug
  FROM memberships m
  JOIN tenants t ON t.id = m.tenant_id
  WHERE m.user_id = $1 AND t.deleted_at IS NULL
  ORDER BY m.created_at;

-- name: ListMembersForTenant :many
SELECT m.*, u.email, u.full_name
  FROM memberships m
  JOIN users u ON u.id = m.user_id
  WHERE m.tenant_id = $1 AND u.deleted_at IS NULL
  ORDER BY m.created_at;

-- name: UpdateMembershipRole :exec
UPDATE memberships SET role = $3 WHERE tenant_id = $1 AND user_id = $2;

-- name: DeleteMembership :exec
DELETE FROM memberships WHERE tenant_id = $1 AND user_id = $2;

-- ─── sessions ───────────────────────────────────────────────────────────────

-- name: CreateSession :one
INSERT INTO sessions (user_id, tenant_id, refresh_token_hash, user_agent, ip, expires_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetSessionByHash :one
SELECT * FROM sessions
  WHERE refresh_token_hash = $1
    AND revoked_at IS NULL
    AND expires_at > now();

-- name: FindSessionByHashIncludingRevoked :one
-- Used by refresh-reuse detection: an already-revoked row indicates the
-- presented token has been seen and rotated/revoked before.
SELECT * FROM sessions WHERE refresh_token_hash = $1;

-- name: RevokeAllUserSessionsWithReason :exec
UPDATE sessions SET revoked_at = now(), revoked_reason = $2
  WHERE user_id = $1 AND revoked_at IS NULL;

-- name: TouchSession :exec
UPDATE sessions SET last_used_at = now() WHERE id = $1;

-- name: RotateSession :one
UPDATE sessions
  SET refresh_token_hash = $2,
      expires_at = $3,
      last_used_at = now()
  WHERE id = $1 AND revoked_at IS NULL
  RETURNING *;

-- name: RevokeSession :exec
UPDATE sessions SET revoked_at = now(), revoked_reason = $2 WHERE id = $1 AND revoked_at IS NULL;

-- name: RevokeAllUserSessions :exec
UPDATE sessions SET revoked_at = now(), revoked_reason = 'user_logout_all'
  WHERE user_id = $1 AND revoked_at IS NULL;

-- name: PurgeExpiredSessions :exec
DELETE FROM sessions WHERE expires_at < now() - INTERVAL '30 days';

-- ─── oauth_links ────────────────────────────────────────────────────────────

-- name: UpsertOAuthLink :one
INSERT INTO oauth_links (user_id, provider, external_id, email)
VALUES ($1, $2, $3, $4)
ON CONFLICT (provider, external_id) DO UPDATE SET email = EXCLUDED.email
RETURNING *;

-- name: GetOAuthLink :one
SELECT * FROM oauth_links WHERE provider = $1 AND external_id = $2;

-- name: ListOAuthLinksForUser :many
SELECT * FROM oauth_links WHERE user_id = $1;

-- ─── mfa_factors ────────────────────────────────────────────────────────────

-- name: CreateMFAFactor :one
INSERT INTO mfa_factors (user_id, type, secret_encrypted, label)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListMFAFactorsForUser :many
SELECT * FROM mfa_factors WHERE user_id = $1 ORDER BY created_at;

-- name: VerifyMFAFactor :exec
UPDATE mfa_factors SET verified_at = now(), used_at = now() WHERE id = $1;

-- name: DeleteMFAFactor :exec
DELETE FROM mfa_factors WHERE id = $1 AND user_id = $2;

-- ─── email_verifications & password_resets ──────────────────────────────────

-- name: CreateEmailVerification :one
INSERT INTO email_verifications (user_id, email, token_hash, expires_at)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ConsumeEmailVerification :one
UPDATE email_verifications
  SET used_at = now()
  WHERE token_hash = $1
    AND used_at IS NULL
    AND expires_at > now()
  RETURNING *;

-- name: CreatePasswordReset :one
INSERT INTO password_resets (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ConsumePasswordReset :one
UPDATE password_resets
  SET used_at = now()
  WHERE token_hash = $1
    AND used_at IS NULL
    AND expires_at > now()
  RETURNING *;
