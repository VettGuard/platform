# Sentry wiring

Sentry project creation is a **founder action** (needs a sentry.io account
on the team plan). Once the project exists:

1. Copy the DSN from `Settings → Projects → vettguard-<env> → Client Keys`.
2. Seal it as a Kubernetes Secret:

   ```bash
   kubectl create secret generic sentry-dsn \
     --from-literal=frontend=https://<key>@sentry.io/<project> \
     --from-literal=backend=https://<key>@sentry.io/<project> \
     --from-literal=ai=https://<key>@sentry.io/<project> \
     -n vettguard --dry-run=client -o yaml \
     | kubeseal --controller-namespace=kube-system -o yaml \
     > infra/k3s/sealed/sentry-dsn.yaml
   ```

3. PR `infra/k3s/sealed/sentry-dsn.yaml`; ArgoCD decrypts on apply.

## Where each runtime picks it up

| Runtime | Env var | File initializing the SDK |
|---|---|---|
| Next.js (landing/dashboard/admin) | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | TBD: `apps/<app>/sentry.{client,server}.config.ts` |
| Go services | `SENTRY_DSN` | TBD: `services/shared/pkg/observability/sentry.go` (Sprint 2 add) |
| Python ai-gateway | `SENTRY_DSN` | TBD: `ai/ai-gateway/src/ai_gateway/main.py` startup |
| Chrome extension | n/a (Sentry blocks ext context) | use the gateway's error-report endpoint instead |

## Project naming convention

- `vettguard-frontend-prod` / `vettguard-frontend-staging`
- `vettguard-backend-prod` / `vettguard-backend-staging`
- `vettguard-ai-prod` / `vettguard-ai-staging`

(One Sentry "project" per runtime + env so quota and noise stay separated.)

## Source maps

Frontend builds upload source maps via `@sentry/wizard` in CI. Add to the
release workflow once it exists (Sprint 2 deliverable):

```yaml
- uses: getsentry/action-release@v1
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: vettguard
    SENTRY_PROJECT: vettguard-frontend-prod
  with:
    environment: production
    sourcemaps: ./apps/dashboard/.next/static
```
