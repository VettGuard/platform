# ADR-003: JWT + refresh token session strategy

- **Status:** Accepted
- **Date:** 2026-05-15
- **Owner:** Founder

## Context

VettGuard runs four clients (landing, dashboard, admin, browser extension)
plus inter-service mTLS. We need a session model that supports:

- Stateless verification at the edge gateway (no DB round-trip per request).
- Short-lived credentials so a leaked token expires quickly.
- Revocation (logout, force-sign-out).
- A clean story for the Chrome extension (chrome.storage.session).

## Decision

**Short-lived access JWT + sliding-window refresh token, both rotated on
every refresh.**

- **Access token** — JWT, 15 minute lifetime, signed with EdDSA (Ed25519).
  Claims: `sub` (user id), `tid` (tenant id), `role`, `jti`, standard exp/iat/iss.
  Verified statelessly by the gateway via the identity service's JWKS endpoint.
- **Refresh token** — opaque 256-bit random string, stored hashed in `sessions`,
  7-day lifetime, **sliding** (every successful refresh extends to 7d), rotated
  (each refresh issues a new refresh token and revokes the previous).
- **Storage** — browsers: httpOnly + Secure + SameSite=Strict cookies for both
  tokens. Extension: chrome.storage.session.
- **Revocation** — identity service maintains a `revoked_jti` set in Redis with
  TTL = max access token lifetime. Gateway checks set on every request.
- **Service-to-service** — short-lived (5 min) JWT with `svc` claim, signed by
  an internal CA; combined with mTLS for hard isolation.

## Alternatives considered

- **Long-lived JWT, no refresh** — can't revoke without DB lookup or short TTL.
- **Stateful sessions (cookie → DB lookup every request)** — extra DB load; we
  pay this only at refresh time, not every API call.
- **OAuth provider only (no email/password)** — locks out users when a provider has an outage.

## Consequences

### Positive
- Stateless gateway scales horizontally without a session DB hit per request.
- Revocation works within ≤ 15 minutes worst case (next access expiry); explicit logout is immediate via revoked_jti set.
- Refresh rotation defeats replay attacks where a refresh token leaks.

### Negative
- We must operate JWKS and a key-rotation schedule. Identity service has a job that rotates the Ed25519 key every 30 days, with 2-day overlap.
- Clock skew between services matters; we standardize on NTP + 30s leeway.

## References

- RFC 7519 (JWT), RFC 8032 (EdDSA)
- "OAuth 2.0 Threat Model" (RFC 6819)
