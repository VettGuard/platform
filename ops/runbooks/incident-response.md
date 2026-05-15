# Incident response

## Severity classifications

| SEV | Definition | Examples | Response |
|---|---|---|---|
| **SEV1** | Production unusable / data loss / security breach | Database unreachable, broker data leak, mass auth failure | Page on-call now, declare incident, write public status |
| **SEV2** | Major feature broken, customers affected | Detention claim send failing, Stripe webhooks dropping | Page on-call within 30m, status update |
| **SEV3** | Degraded UX, no data loss | Slow page loads, single broker vetting failing | Ticket, next business day |

## Incident lifecycle

1. **Detect** — Alertmanager / Sentry / customer report
2. **Declare** — Post in Slack `#incidents`: `INC-2026-005 [SEV2] gateway 5xx surging`
3. **Triage** — Pick Incident Commander (IC). IC owns comms.
4. **Mitigate** — Fix forward OR roll back. Mitigation > fix.
5. **Communicate** — IC posts every 30 min to `#incidents` + status page
6. **Resolve** — Mark resolved when error rate < 0.1% for 30 min
7. **Postmortem** — Within 5 business days, blameless writeup. See `postmortem-template.md`

## Common scenarios

### Service returning 5xx > 1%

```bash
# 1. Identify the affected service via Grafana → "Service health"
# 2. Check pod logs
kubectl logs -n vettguard -l app=gateway --tail=200 --since=10m

# 3. Check recent deploys
argocd app history vettguard-services

# 4. If deploy correlates → roll back
argocd app rollback vettguard-services <last-good-revision>

# 5. If no recent deploy → likely upstream dep (Stripe, Anthropic, ELD)
#    Check status pages, then add a fast-fail circuit breaker if needed.
```

### Postgres connection exhaustion

```bash
# Symptom: services log "remaining connection slots are reserved"
# 1. Confirm
kubectl exec -n vettguard <cnpg-cluster>-1 -- \
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
# 2. Identify long-running queries
kubectl exec -n vettguard <cnpg-cluster>-1 -- \
  psql -U postgres -c "SELECT pid, now() - query_start AS age, state, query FROM pg_stat_activity ORDER BY age DESC LIMIT 20;"
# 3. Kill if safe
kubectl exec -n vettguard <cnpg-cluster>-1 -- \
  psql -U postgres -c "SELECT pg_terminate_backend(<pid>);"
# 4. Scale up connection limit OR add pgbouncer (CNPG: enable poolers)
```

### OOMKilled pods

```bash
# 1. Identify
kubectl get events -n vettguard --sort-by='.lastTimestamp' | grep -i oom

# 2. Inspect resource usage
kubectl top pods -n vettguard

# 3. Bump limits in the Helm values for that service (PR + auto-deploy)
# 4. Profile in dev to find the leak (pprof for Go, memray for Python)
```

### Anthropic API outage

VettGuard depends on Claude for detention claim drafting + broker vetting.
When the Anthropic API is down:

1. AI Gateway returns 503 with `Retry-After`
2. Affected services (`detention`, `vetting` — Phase 2+) queue the work in NATS
3. Dispatcher dashboard shows banner: "AI temporarily unavailable. Tasks will resume automatically."
4. Once Anthropic recovers (poll status.anthropic.com or health probe), workers drain the queue

If the outage exceeds 2 hours: post status page, email affected tenants.

### Stripe webhook signature failures

```bash
# 1. Confirm clock skew is not the cause
kubectl exec -n vettguard <billing-pod> -- date
# 2. Verify the webhook secret matches Stripe dashboard
kubectl get secret stripe-webhook -n vettguard -o jsonpath='{.data.secret}' | base64 -d
# 3. Replay the failed events from Stripe dashboard
```

## Communications templates

**Customer-facing status page** (markdown):

```markdown
### Investigating: Elevated error rate on Dashboard
*Posted YYYY-MM-DD HH:MM UTC*

We are investigating reports of slow page loads on the customer dashboard.
Detention claim submission and broker vetting are unaffected. Updates every
30 minutes.
```

**Resolved**:

```markdown
### Resolved
*Posted YYYY-MM-DD HH:MM UTC*

Root cause: <one sentence>. Fix: <one sentence>. Affected customers will see
normal performance within 5 minutes. A postmortem will be published within
5 business days.
```
