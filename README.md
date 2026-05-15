# VettGuard

AI-native detention recovery and broker vetting for US truck dispatchers.

- **Detention Recovery** — 18% success fee on broker payments recovered for driver wait time.
- **Broker Vetting** — $199/month subscription for continuous broker risk scoring.
- **Chrome extension** lives inside DAT, Truckstop, and 123Loadboard — dispatcher never leaves the load board.
- **AI-native** — Claude Sonnet 4.6 + Haiku 4.5 do the work; dispatcher approves.

This README covers the developer onboarding loop. For product context see
[`docs/architecture/`](docs/architecture/) (ADRs) and the founder plan.

## Repository layout

```
apps/
  landing/       Next.js 15 public marketing site (6 langs)
  dashboard/     Next.js customer (dispatcher) app
  admin/         Next.js internal staff console
  extension/     Chrome MV3 extension (DAT, Truckstop, 123Loadboard)
services/
  shared/        Go shared lib (config, logger, middleware, server, tracing)
  gateway/       Go API gateway (external HTTP entrypoint)
  identity/      Go auth + tenants + RBAC + MFA
  billing/       Go Stripe integration
  notifier/      Go email + SMS
  audit/         Go append-only audit log
  eld/           Go Motive + Samsara adapters
ai/
  ai-gateway/    Python FastAPI orchestrator (Anthropic SDK)
packages/
  ui/            Shared Tailwind v4 + shadcn/ui + theme system
  proto/         Connect-RPC protobuf contracts (Go, TS, Python codegen)
  sdk/           TypeScript browser/extension SDK
  i18n/          next-intl catalogs (en, uz, ru, es, tr, uk)
  config/        Shared tsconfig / ESLint / Prettier
infra/
  terraform/     Hetzner Cloud provisioning
  k3s/           Helm charts + ArgoCD apps
  compose/       Local docker-compose dev stack
ops/, docs/      Observability config, runbooks, ADRs
```

## Prerequisites

Install via your package manager or [`mise`](https://mise.jdx.dev) (recommended):

```bash
curl https://mise.run | sh
mise install     # picks versions from mise.toml
```

If you prefer not to use mise:

- Node.js 22+ and **pnpm 9+**
- Go 1.23+
- Python 3.12+ and [`uv`](https://docs.astral.sh/uv/)
- Docker Engine 24+ (or Docker Desktop)

## First-run setup

```bash
# 1. Clone + cd into the repo (already done if you're reading this).
# 2. Install JS/TS deps (pnpm workspaces resolves apps/* + packages/*):
pnpm install

# 3. Sync Go workspace modules:
go work sync

# 4. Install Python deps:
cd ai/ai-gateway && uv sync && cd -

# 5. Copy env example and fill in real secrets when ready:
cp .env.example .env.local

# 6. Bring up the local backing services (Postgres, Redis, NATS, MinIO, Mailpit, Jaeger):
make up
```

Mailpit catches outgoing email at <http://localhost:8025>.
Jaeger UI: <http://localhost:16686>. MinIO console: <http://localhost:9001>
(`minioadmin` / `minioadmin`).

## Running services in dev

Each service is a separate process. Open a terminal per service or use
[`overmind`](https://github.com/DarthSim/overmind) / `mprocs`.

```bash
# Go services
cd services/gateway  && SERVICE_NAME=gateway  JWT_SIGNING_KEY=dev go run ./cmd
cd services/identity && SERVICE_NAME=identity JWT_SIGNING_KEY=dev ENCRYPTION_KEY=dev go run ./cmd
cd services/billing  && SERVICE_NAME=billing  STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_... go run ./cmd
cd services/notifier && SERVICE_NAME=notifier go run ./cmd
cd services/audit    && SERVICE_NAME=audit    go run ./cmd
cd services/eld      && SERVICE_NAME=eld      go run ./cmd

# Python AI gateway
cd ai/ai-gateway && uv run uvicorn ai_gateway.main:app --reload --port 8090

# Frontend apps
pnpm -F @vettguard/landing dev      # → http://localhost:3000
pnpm -F @vettguard/dashboard dev    # → http://localhost:3001
pnpm -F @vettguard/admin dev        # → http://localhost:3002

# Chrome extension
pnpm -F @vettguard/extension dev    # Vite watcher; load apps/extension/dist as unpacked extension in chrome://extensions
```

## Common dev commands

```bash
make help                  # show all Make targets
make up / make down        # docker-compose dev stack
make reset                 # wipe volumes (DESTRUCTIVE)
pnpm lint                  # eslint + prettier check across all JS/TS
pnpm type-check            # tsc --noEmit across workspaces
pnpm -F @vettguard/i18n check-keys   # detect drift between locale catalogs
pnpm -F @vettguard/proto generate    # buf generate Go + TS + Python stubs
```

## Architecture references

- [ADR-001](docs/architecture/ADR-001-microservice-boundaries.md) — service boundaries
- [ADR-002](docs/architecture/ADR-002-row-level-security.md) — multi-tenancy via Postgres RLS
- [ADR-003](docs/architecture/ADR-003-jwt-session-strategy.md) — JWT + refresh token strategy
- [ADR-004](docs/architecture/ADR-004-monorepo-structure.md) — monorepo layout
- [ADR-005](docs/architecture/ADR-005-connect-rpc.md) — Connect-RPC contracts

## License

Proprietary — © 2026 VettGuard. All rights reserved.
