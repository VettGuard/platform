# ADR-001: Microservice boundaries

- **Status:** Accepted
- **Date:** 2026-05-15
- **Owner:** Founder

## Context

VettGuard has two distinct business domains (detention recovery and broker
vetting), four user-facing surfaces (landing, dashboard, admin, extension),
and a Python AI service that must be isolable for cost/scaling reasons.
A monolith would entangle these concerns; a service-per-table extreme would
choke on inter-service chatter. We need clear, durable seams.

## Decision

Seven services aligned with domain boundaries:

1. **gateway** — sole external entrypoint; auth, rate limit, fan-out to internals.
2. **identity** — tenants, users, sessions, OAuth, RBAC, MFA.
3. **billing** — Stripe customer/subscription/invoice lifecycle; success-fee invoices.
4. **notifier** — email, SMS, in-app, webhooks; templated, idempotent.
5. **audit** — append-only event log; queryable by admin only.
6. **eld** — Motive/Samsara OAuth adapters and webhook receivers; dwell event publisher.
7. **ai-gateway** (Python) — routes typed tasks to Claude with prompt caching.

Phase 2 adds **detention** and **vetting** as separate services.

Each service owns its database schema; cross-service reads go through
gRPC/Connect or NATS events — never shared SQL.

## Alternatives considered

- **Monolith with packages** — simpler ops, but conflates AI cost/scaling with web traffic.
- **Service-per-table** — premature; coupling tax > isolation benefit at this size.
- **Function-as-service** — cold-start latency on the dispatcher hot path is unacceptable.

## Consequences

### Positive
- Each team (when we have teams) owns a deployable unit.
- AI service scales independently on token-budget metrics.
- Failure of `notifier` does not block login or billing.

### Negative
- More deploy targets; mitigated by GitOps + ArgoCD and the shared `services/shared` Go lib.
- Cross-service refactors require coordinated changes; mitigated by gRPC contracts in `packages/proto`.

## References

- [[project-architecture]] memory
- DDD bounded contexts (Evans 2003)
