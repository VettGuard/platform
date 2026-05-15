# On-call

## Rotation

Solo founder for the foreseeable future. When team > 2 engineers, weekly
rotation with primary + secondary.

## Tools

- **Paging:** email + SMS via Alertmanager → Twilio. (PagerDuty when revenue justifies it.)
- **Slack:** `#alerts` (everything), `#alerts-critical` (page), `#incidents` (live war-room)
- **Dashboards:** `https://grafana.vettguard.com` — bookmark "Service health", "Cluster overview", "Postgres", "Anthropic spend"
- **Logs:** Grafana → Explore → Loki
- **Traces:** Grafana → Explore → Tempo
- **ArgoCD:** `https://argocd.vettguard.com`
- **Status page:** `https://status.vettguard.com`

## Shift expectations

- Acknowledge SEV1 within 5 min, SEV2 within 30 min, SEV3 next business day
- Always post in `#incidents` even if it turns out to be nothing — leave a paper trail
- Hand off open issues in `#ops` at end of shift

## What pages you

Alertmanager rules live in `infra/k3s/helm/kube-prometheus-stack-values.yaml`
(`prometheusSpec.additionalPrometheusRulesMap`). Active alerts:

| Alert | Condition | Severity |
|---|---|---|
| `ServiceDown` | `up{job="vg-*"} == 0` for 2 min | critical |
| `HighErrorRate` | `>1% 5xx for 5 min` | critical |
| `HighLatency` | `p99 > 2s for 5 min` | warning |
| `PodOOMKilled` | `kube_pod_container_status_last_terminated_reason="OOMKilled"` | warning |
| `PVCAlmostFull` | `>90% used` | warning |
| `CertExpiringSoon` | `<7 days to expiry` | warning |
| `BackupFailed` | CNPG Backup phase=failed | critical |
| `AnthropicSpendOverBudget` | daily token cost > $threshold | warning |

## First-day-on-call checklist

- [ ] Confirm phone has Slack push notifications
- [ ] Test SMS alert: `kubectl create event ... --type=Warning` and observe
- [ ] Review runbooks (this directory)
- [ ] Verify `kubectl` access to staging + prod kubeconfigs
- [ ] Verify ArgoCD login (`argocd login argocd.vettguard.com`)
- [ ] Verify Stripe dashboard access (test mode + live)
- [ ] Verify Anthropic console access (token usage)
