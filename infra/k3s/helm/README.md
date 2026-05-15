# Helm values

Each file here is a `values.yaml` for one ArgoCD Application defined under
`../argocd/apps/`. Edit here, push, ArgoCD reconciles.

## Files

| File | Used by | Notes |
|---|---|---|
| `cert-manager-values.yaml` | `cert-manager` Application | Let's Encrypt + Cloudflare DNS-01 |
| `cert-manager-cluster-issuer.yaml` | (applied manually post-install) | ClusterIssuer for `letsencrypt-prod` and `-staging` |
| `traefik-values.yaml` | `traefik` Application | Hetzner LB integration, TLS 1.3 |
| `kube-prometheus-stack-values.yaml` | `observability-kube-prometheus` | Prom + Alertmanager + Grafana |
| `loki-values.yaml` | `observability-loki` | Log aggregation, MinIO-backed |
| `otel-collector-values.yaml` | `observability-otel-collector` | DaemonSet, OTLP receivers |

## Bootstrapping secrets

ClusterIssuer + Loki + Grafana need real credentials. Workflow:

```bash
# 1. Create the plaintext Secret locally (do NOT commit):
kubectl create secret generic cf-api-token \
  --from-literal=token="$CLOUDFLARE_TOKEN" \
  -n cert-manager --dry-run=client -o yaml > /tmp/cf.yaml

# 2. Seal it:
kubeseal --controller-namespace=kube-system \
  -f /tmp/cf.yaml -o yaml > sealed/cf-api-token.yaml

# 3. Commit `sealed/cf-api-token.yaml` to the repo.
# 4. ArgoCD picks it up; sealed-secrets-controller decrypts to a real Secret.
```

Same pattern for `grafana-admin-password`, `minio-creds`, `slack-webhook`.

## After cert-manager is up

Apply the cluster-issuer manifest once (ArgoCD picks up subsequent edits):

```bash
kubectl apply -f cert-manager-cluster-issuer.yaml
```
