# Hetzner Cloud — Terraform

Provisions VettGuard's k3s cluster + load balancer + Cloudflare DNS.

## Prerequisites

- Terraform ≥ 1.9
- Hetzner Cloud API token (Project → Security → API Tokens, read+write)
- Cloudflare API token (Zone:DNS:Edit + Zone:Zone:Read on `vettguard.com`)
- Cloudflare zone ID for `vettguard.com`
- SSH keypair (Ed25519 recommended)

## First-time setup

```bash
cd infra/terraform/hetzner

# 1. Configure providers
cp terraform.tfvars.example terraform.tfvars
$EDITOR terraform.tfvars       # fill in ssh_public_keys, environment

# 2. Provide secrets via env (preferred over .tfvars for sensitive values):
export TF_VAR_hcloud_token="..."
export TF_VAR_cloudflare_api_token="..."
export TF_VAR_cloudflare_zone_id="..."

# 3. Init + plan
terraform init
terraform plan

# 4. Apply
terraform apply
```

After apply, `terraform output` shows the load balancer IPs and SSH addresses.

## Bootstrap k3s

```bash
# Set vars from terraform output:
export VG_CP_IP=$(terraform output -raw controlplane_ipv4)
export VG_WORKER_IPS="$(terraform output -json worker_ipv4 | jq -r '. | join(" ")')"

../../../infra/terraform/hetzner/scripts/install-k3s.sh
../../../infra/terraform/hetzner/scripts/fetch-kubeconfig.sh
```

That writes `~/.kube/vettguard-<env>.kubeconfig`. Use it:

```bash
export KUBECONFIG=~/.kube/vettguard-staging.kubeconfig
kubectl get nodes        # expect 1 control + 2 worker = Ready
```

## Bootstrap ArgoCD

```bash
kubectl apply -k ../../k3s/argocd/bootstrap
kubectl -n argocd wait --for=condition=Available deployment/argocd-server --timeout=5m
kubectl apply -f ../../k3s/argocd/apps/root.yaml
```

ArgoCD then takes over and installs everything else from the GitOps repo
(cert-manager, traefik, sealed-secrets, CloudNativePG, observability stack).

## Tear-down

```bash
terraform destroy
```

Cloudflare DNS records and Hetzner volumes are removed. **Backup data first**
(see `ops/runbooks/backup-restore.md`).

## State storage

Local state by default. To enable S3-compatible state (Hetzner Object Storage),
uncomment the `backend "s3"` block in `versions.tf` and re-init with
`terraform init -migrate-state`.
