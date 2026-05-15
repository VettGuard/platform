# Deploy runbook

VettGuard uses **GitOps with ArgoCD**. Code arrives in production by pushing
to `main`; nothing is `kubectl apply`-ed by humans.

## Normal release flow

1. PR merges to `main` after CI passes (lint + tests + security scans).
2. GitHub Actions builds + pushes images to `ghcr.io/vettguard/<service>:<sha>`.
3. The CI job at `.github/workflows/release.yml` (Phase 2: TBD) opens an
   automated PR bumping the image tag in `infra/k3s/helm/vettguard/`.
4. That PR auto-merges if it touches only image tags and CI is green.
5. ArgoCD detects the change, syncs, rolls workloads. Rolling update — no downtime.
6. Slack `#deploys` gets the success message via Alertmanager webhook.

## Manual override (emergency only)

When you must bypass GitOps (e.g., ArgoCD is broken):

```bash
export KUBECONFIG=~/.kube/vettguard-production.kubeconfig

# 1. Take the lock — post in #ops "manual override on staging|prod, why"
# 2. Apply the change
kubectl apply -f <manifest>
# 3. Re-sync ArgoCD to reconcile state with git AFTERWARDS
argocd app sync vettguard-services
# 4. Open a follow-up PR codifying the change. Lock cleared.
```

Never leave production in a state that drifts from `main`. If you must, file
an incident and resolve within 24 hours.

## Rollback

```bash
# Identify the previous good tag
argocd app history vettguard-services

# Roll back to revision N
argocd app rollback vettguard-services N

# OR (if ArgoCD is down) — revert the image tag PR on GitHub
git revert <commit> && gh pr create --base main
```

## Pre-flight checks before risky changes

- [ ] Staging mirrors production for at least 24h before prod release
- [ ] Migration PR has `migration:safe` label (no downtime SQL)
- [ ] Backup taken within last hour (`backup-restore.md`)
- [ ] Slack `#ops` notified

## Image promotion staging → production

```bash
# Find the staging tag
STG_TAG=$(argocd app get vettguard-services --refresh -o json \
  | jq -r '.status.summary.images[] | select(contains("gateway")) | split(":")[1]')

# Open a PR that promotes the same tag to production values:
sed -i.bak "s|tag: .*|tag: ${STG_TAG}|" infra/k3s/helm/vettguard/values-production.yaml
git checkout -b promote/${STG_TAG}
git commit -am "feat: promote ${STG_TAG} to production"
gh pr create --base main
```
