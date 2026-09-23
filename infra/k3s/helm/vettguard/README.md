# VettGuard service manifests

ArgoCD's `vettguard-services` Application syncs this tree recursively into
the `vettguard` namespace. Each subdirectory ships one workload:

```
infra/k3s/helm/vettguard/
├── identity/       Go · Connect-RPC · port 8081
├── gateway/        Go · external edge · port 8080
├── brokers/        Go · REST · port 8086
├── billing/        Go · Connect-RPC + Stripe webhook · port 8082
├── notifier/       Go · Postmark · port 8083
├── audit/          Go · append-only events · port 8084
├── ai-gateway/     Python FastAPI · port 8090
├── landing/        Next.js · port 3000
├── dashboard/      Next.js · port 3001
└── admin/          Next.js · port 3002
```

Each directory contains the same three files:

- `deployment.yaml` — 1 replica today; HPA lands in Phase 4.
- `service.yaml`    — ClusterIP. The gateway is the only thing reachable
                      from outside the cluster, plus the three Next.js
                      apps via Ingress.
- `ingress.yaml`    — only for `landing` / `dashboard` / `admin` / `gateway`.
                      Internal services aren't on Ingress; cluster
                      NetworkPolicy blocks direct ingress to them.

## Secrets

Each Deployment references a `sealed-secret` named `<service>-env` for
DB URLs, JWT key, Stripe key, Anthropic key, OAuth client secrets, etc.
The unsealed example is checked in at `_secrets/<service>.example.env`.
Founder rotates secrets via the Sealed Secrets recipe in
`docs/ops/deploy-staging.md`.

## Images

The image tag is `ghcr.io/vettguard/<service>:latest` until ArgoCD Image
Updater is wired (Phase 4). CI workflow `.github/workflows/build-images.yml`
builds + pushes on every push to `main`.
