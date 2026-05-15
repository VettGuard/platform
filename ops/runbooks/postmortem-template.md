# Postmortem — INC-YYYY-NNN: <one-line summary>

- **Severity:** SEV1 | SEV2 | SEV3
- **Status:** Draft | In review | Published
- **Owner:** <person>
- **Reviewed by:** <person>
- **Incident dates:** start UTC → end UTC (duration: X hours Y minutes)
- **Customer impact:** <bounded — "X% of dispatchers saw 5xx on detention claim submit">

## Summary

One paragraph in plain English. What broke, who noticed first, how it was
fixed. Avoid jargon — this might be read by an investor.

## Timeline (UTC)

| Time | Event |
|---|---|
| HH:MM | First alert fires (`HighErrorRate` on gateway) |
| HH:MM | On-call ACKs |
| HH:MM | IC declared, war room opened in `#incidents` |
| HH:MM | Root cause hypothesis: <X> |
| HH:MM | Mitigation deployed: <Y> |
| HH:MM | Error rate returns to baseline |
| HH:MM | Status page marked resolved |

## Root cause

What was the underlying cause? Trace it past the proximate cause to the
systemic issue. (e.g., "Postgres ran out of connections" is proximate.
"Notifier pool size was 50 but Postgres `max_connections` was 100 with 5 other
services" is systemic.)

## Resolution

What did we change to make it stop hurting? Was it temporary (rollback,
restart) or permanent (config change, code fix)?

## What went well

- Alerting fired before any customer reported
- Rollback completed in 3 minutes thanks to ArgoCD
- ...

## What went poorly (blameless)

- No staging signal — staging missed the bug
- Runbook for "Postgres connection exhaustion" was stale
- ...

## Action items

| # | Action | Owner | Due | Ticket |
|---|---|---|---|---|
| 1 | Add pgbouncer to all DB clusters | <person> | YYYY-MM-DD | #123 |
| 2 | Update runbook with new diagnostic step | <person> | YYYY-MM-DD | #124 |
| 3 | Add chaos test: kill 50% of conn pool | <person> | YYYY-MM-DD | #125 |

## Lessons

Two or three sentences. What does this incident teach us about our system,
our process, or our assumptions?
