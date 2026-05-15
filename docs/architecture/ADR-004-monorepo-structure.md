# ADR-004: Monorepo with per-language workspaces

- **Status:** Accepted
- **Date:** 2026-05-15
- **Owner:** Founder

## Context

Foundation phase requires four frontends, six Go services, one Python AI
service, and shared protobuf/i18n/UI packages. We need a layout where:

- Cross-language changes (a new proto field updates Go server, TS client, Python AI) are one PR.
- Each language uses its native workspace tooling, not a forced abstraction.
- Local builds remain fast; CI parallelizes per package.

## Decision

Adopt a **monorepo with native per-language workspaces**:

- **TypeScript/JS** — pnpm workspaces + Turborepo (`apps/*`, `packages/*`).
- **Go** — Go workspaces (`go.work`) registering each service module under `services/*`. Shared code lives in `services/shared`.
- **Python** — uv workspaces rooted at the repo `pyproject.toml`, members under `ai/*`.
- **Cross-language contracts** — `packages/proto` generates Go, TS, and Python stubs via Buf.
- **Single CI** — GitHub Actions with per-language matrix jobs.

Directory shape:

```
apps/{landing,dashboard,admin,extension}
services/{shared,gateway,identity,billing,notifier,audit,eld}
ai/ai-gateway
packages/{ui,proto,sdk,i18n,config}
infra/{terraform,k3s,compose}
ops/{otel,grafana,runbooks}
docs/{architecture,api,security}
```

## Alternatives considered

- **Polyrepo per service** — friction on cross-cutting changes (proto, shared lib).
- **Nx covering all languages** — Nx Go support is shallow; we'd fight the tool.
- **Single Go module + frontend repo** — locks the front-end to back-end release cycle.

## Consequences

### Positive
- One `git clone` gives a new engineer the whole system.
- Proto changes are atomic across Go server, TS client, Python AI.
- Renovate/Dependabot can group related upgrades.

### Negative
- Repo size grows faster; we'll prune `node_modules` / `.next` aggressively in CI caches.
- Two CI runners may need to be tuned (one for JS heavy, one for Go heavy) as we scale.

## References

- pnpm workspaces, Turborepo, Go workspaces (`cmd/go/internal/workcmd`), uv workspaces
