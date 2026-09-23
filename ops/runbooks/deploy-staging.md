# Deploy staging — first-time bring-up

End-to-end runbook for putting `staging.vettguard.com` (and friends) live.
Assumes Sprint 1 infra exists: Hetzner k3s cluster, ArgoCD installed,
Cloudflare DNS, Sealed Secrets controller, CloudNativePG operator.

If any of the above isn't running yet, see `infra/terraform/hetzner/README.md`
and `infra/k3s/argocd/apps/` first.

---

## Step 0 — Prerequisites

On your laptop:
- `kubectl` pointed at the staging cluster (`infra/terraform/hetzner/scripts/fetch-kubeconfig.sh`)
- `kubeseal` ≥ 0.27 (`brew install kubeseal` / `apt install kubeseal`)
- `gh` (GitHub CLI) for triggering the image build manually if needed
- Domain ownership of `vettguard.com` with the Cloudflare API token already
  in Terraform state (Sprint 1)

Sanity check:

```bash
kubectl cluster-info
kubectl -n argocd get applications
kubectl -n sealed-secrets get pods    # bitnami-sealed-secrets-controller Running
```

---

## Step 1 — Build the first set of images

The `build-images` workflow runs on every push to `main`. Trigger it
manually for the initial deploy:

```bash
gh workflow run build-images.yml --ref main
gh run watch
```

After ~10 min there should be 11 packages at
`https://github.com/orgs/vettguard/packages`:
`identity`, `gateway`, `brokers`, `billing`, `notifier`, `audit`, `eld`,
`ai-gateway`, `landing`, `dashboard`, `admin`.

If the repo is private, the cluster needs a pull secret:

```bash
kubectl -n vettguard create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=<your-github-username> \
  --docker-password=<github PAT with read:packages>
kubectl -n vettguard patch serviceaccount default \
  -p '{"imagePullSecrets":[{"name":"ghcr-pull"}]}'
```

---

## Step 2 — Provision the Postgres database

CloudNativePG cluster `vettguard-pg` should already be Running. Create
a database + role for identity (which also owns the `marketing` and
`vetted_brokers` schemas):

```bash
kubectl -n vettguard exec -it vettguard-pg-1 -- psql -U postgres <<'SQL'
CREATE ROLE vettguard LOGIN PASSWORD 'change-me';
CREATE DATABASE vettguard OWNER vettguard;
GRANT ALL ON DATABASE vettguard TO vettguard;
SQL
```

Run identity migrations (they include the `marketing.waitlist_signups`
table too). Identity + brokers each ship `/migrate` as a second binary
in the same image — invoke it directly:

```bash
kubectl -n vettguard run identity-migrate --rm -i --tty \
  --image=ghcr.io/vettguard/identity:latest \
  --restart=Never \
  --env="DATABASE_URL=postgres://vettguard:change-me@vettguard-pg-rw:5432/vettguard?sslmode=disable" \
  --command -- /migrate up
```

Same for brokers:

```bash
kubectl -n vettguard run brokers-migrate --rm -i --tty \
  --image=ghcr.io/vettguard/brokers:latest \
  --restart=Never \
  --env="DATABASE_URL=postgres://vettguard:change-me@vettguard-pg-rw:5432/vettguard?sslmode=disable" \
  --command -- /migrate up
```

`billing` and `audit` do not ship `/migrate` yet — their schemas land via
the existing CNPG bootstrap path. Add `cmd/migrate/main.go` for each when
the first real schema change is needed.

---

## Step 3 — Generate sealed secrets

Each service Deployment references a `<service>-env` secret. Build the
unsealed envs first, then `kubeseal` them.

```bash
# identity
cat <<EOF > /tmp/identity-env.yaml
apiVersion: v1
kind: Secret
metadata:
  name: identity-env
  namespace: vettguard
stringData:
  DATABASE_URL: "postgres://vettguard:change-me@vettguard-pg-rw:5432/vettguard?sslmode=disable"
  JWT_SIGNING_KEY: "$(openssl rand -base64 32)"
  DASHBOARD_BASE_URL: "https://app.vettguard.com"
  OAUTH_REDIRECT_URL: "https://app.vettguard.com/auth/callback"
  GOOGLE_OAUTH_CLIENT_ID: "<from Google Cloud Console>"
  GOOGLE_OAUTH_CLIENT_SECRET: "<from Google Cloud Console>"
  MICROSOFT_OAUTH_CLIENT_ID: "<from Azure Portal>"
  MICROSOFT_OAUTH_CLIENT_SECRET: "<from Azure Portal>"
  AEAD_KEY: "$(openssl rand -base64 32)"
EOF

kubeseal -f /tmp/identity-env.yaml -w infra/k3s/_secrets/identity-env.sealed.yaml \
  --controller-namespace sealed-secrets
rm /tmp/identity-env.yaml    # never commit unsealed env

git add infra/k3s/_secrets/identity-env.sealed.yaml
```

Repeat for each service. Minimum envs per service:

| Service     | Envs needed |
|-------------|-------------|
| gateway     | `JWT_SIGNING_KEY` (same value as identity), `REDIS_ADDR`, `CORS_ORIGINS` |
| brokers     | `DATABASE_URL`, `AI_GATEWAY_URL=http://ai-gateway.vettguard.svc.cluster.local:8090` |
| billing     | `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_VETTING_PRICE_ID` |
| notifier    | `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM_EMAIL=ops@vettguard.com` |
| audit       | `DATABASE_URL`, `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` |
| ai-gateway  | `ANTHROPIC_API_KEY`, `DAILY_TENANT_TOKEN_BUDGET=200000` |
| landing     | (none in this phase — public site) |
| dashboard   | `NEXT_PUBLIC_GATEWAY_URL=https://api.vettguard.com` |
| admin       | `ADMIN_TOKEN="$(openssl rand -hex 32)"` |

Add the sealed-secret files at `infra/k3s/_secrets/` (gitignored on the
unsealed side — only commit `*.sealed.yaml`).

The Sealed Secrets controller decrypts them in-cluster and creates the
real `Secret` objects.

---

## Step 4 — Register OAuth callback URLs

### Google Cloud Console

1. APIs & Services → Credentials → OAuth 2.0 Client ID
2. Authorized redirect URIs: add `https://app.vettguard.com/auth/callback`
3. Copy the client ID + secret into `identity-env`.

### Microsoft Entra (Azure Portal)

1. App registrations → New registration → Web platform
2. Redirect URI: `https://app.vettguard.com/auth/callback`
3. API permissions: `openid`, `email`, `profile`, `User.Read`
4. Certificates & secrets → New client secret
5. Copy the (Application) Client ID + secret into `identity-env`.

### Stripe

1. Dashboard → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://api.vettguard.com/v1/billing/stripe/webhook`
3. Events: `customer.subscription.{created,updated,deleted}`,
   `invoice.payment_succeeded`, `invoice.payment_failed`
4. Copy the signing secret into `billing-env` as `STRIPE_WEBHOOK_SECRET`.

---

## Step 5 — Push secrets + trigger sync

```bash
git add infra/k3s/_secrets/*.sealed.yaml
git commit -m "secrets: staging envs"
git push
```

ArgoCD's selfHeal picks up the new commits within ~30s. Watch:

```bash
kubectl -n argocd get applications
kubectl -n vettguard get pods -w
```

All pods should reach `Running` within 2-3 min.

---

## Step 6 — DNS

Cloudflare DNS is managed by Terraform (`infra/terraform/hetzner/cloudflare.tf`).
Apply the staging records:

```bash
cd infra/terraform/hetzner
terraform apply -target=cloudflare_record.staging_landing \
                -target=cloudflare_record.staging_app \
                -target=cloudflare_record.staging_admin \
                -target=cloudflare_record.staging_api
```

Records:
- `vettguard.com` → load-balancer IP
- `app.vettguard.com` → same
- `admin.vettguard.com` → same
- `api.vettguard.com` → same

cert-manager auto-issues Let's Encrypt certs for each Ingress via
Cloudflare DNS-01. First issuance takes ~60s.

```bash
kubectl -n vettguard get ingress
kubectl -n vettguard get certificate
```

`READY=True` on all certs.

---

## Step 7 — Smoke test

```bash
curl -s https://api.vettguard.com/v1/health | jq
curl -sI https://vettguard.com    | head -3
curl -sI https://app.vettguard.com | head -3
curl -sI https://admin.vettguard.com | head -3
```

All should return `200`.

End-to-end check:
1. Open `https://vettguard.com` → landing renders, locale-switcher works.
2. Open `https://vettguard.com#waitlist` → submit email → check ops inbox
   for the confirmation email (or `kubectl logs deploy/identity -n vettguard | grep waitlist`).
3. Open `https://app.vettguard.com/sign-up` → register → verify email →
   sign in → vet a broker → real Claude score should land in 1-2s.

---

## Step 8 — Cut over

- Update `gh-pages` / wiki if needed.
- Announce in #ops Slack: "staging.vettguard.com is live".
- Add the staging URL to Uptime Kuma (`status.vettguard.com`).
- Watch Sentry + Grafana for the first 24h.

---

## Common failures

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `ImagePullBackOff` | Missing `ghcr-pull` secret on default SA | See Step 1 patch command |
| `CrashLoopBackOff: missing DATABASE_URL` | Sealed secret never decrypted | `kubectl logs -n sealed-secrets …` |
| `502 Bad Gateway` on `api.vettguard.com` | Ingress points at wrong service | `kubectl describe ingress -n vettguard` |
| `cert-manager.io/cluster-issuer not found` | Issuer ClusterIssuer not installed | `kubectl apply -f infra/k3s/helm/cert-manager-cluster-issuer.yaml` |
| OAuth → "redirect_uri_mismatch" | Console URL doesn't match callback | Re-check Step 4 |

---

## Rollback

ArgoCD UI → vettguard-services → History → Rollback to previous revision.
Or `argocd app rollback vettguard-services <revision>` from CLI.
