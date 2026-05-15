# ADR-002: Multi-tenancy via Postgres Row-Level Security

- **Status:** Accepted
- **Date:** 2026-05-15
- **Owner:** Founder

## Context

VettGuard is multi-tenant from day one. Trucking company data — broker
relationships, detention claims, ELD traces — is sensitive and competitive.
A single cross-tenant leak destroys trust. The auth layer alone cannot
guarantee isolation: a missing WHERE clause is enough to spill.

## Decision

Adopt **Postgres Row-Level Security (RLS)** as the enforcement boundary,
backed by:

1. Every business table has `tenant_id UUID NOT NULL`.
2. Every table enables RLS with a policy `USING (tenant_id = current_setting('app.tenant_id')::uuid)`.
3. App connections call `SET LOCAL app.tenant_id = $1` at the start of every request.
4. Each service uses a dedicated Postgres role that lacks `BYPASSRLS`.
5. Admin tooling uses a separate role with `BYPASSRLS` and is always audited.

## Alternatives considered

- **Schema-per-tenant** — operationally heavy past 100 tenants; migration tooling weak.
- **Database-per-tenant** — connection-pool explosion; ops complexity.
- **App-layer filtering only** — one missing WHERE = data leak. Unacceptable.

## Consequences

### Positive
- Defense in depth: even a buggy query cannot return another tenant's rows.
- Backups, replicas, restore drills work on a single cluster.
- Cross-tenant analytics queries are explicit and audited (must use bypass role).

### Negative
- All ORMs and SQL builders must respect the `SET LOCAL` discipline; we enforce in code review and via an integration test that asserts queries fail without the setting.
- Some Postgres operators (e.g., upserts on partial indexes) interact unintuitively with RLS — documented in the runbook.

## References

- PostgreSQL docs: Row Security Policies
- [Andy Pavlo "Multi-Tenancy" lecture, CMU 15-721](https://15721.courses.cs.cmu.edu/)
