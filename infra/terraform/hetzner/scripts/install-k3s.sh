#!/usr/bin/env bash
# install-k3s.sh — installs k3s on the control plane, then joins workers.
#
# Inputs (from terraform output OR env):
#   VG_CP_IP            — control plane public IPv4
#   VG_WORKER_IPS       — space-separated worker public IPv4s
#   VG_SSH_USER         — defaults to "root" (Hetzner Ubuntu image)
#   K3S_VERSION         — pinned k3s version (defaults to v1.31.3+k3s1)
#
# Idempotent: re-running on an already-installed cluster is safe.
set -euo pipefail
shopt -s inherit_errexit

K3S_VERSION="${K3S_VERSION:-v1.31.3+k3s1}"
SSH_USER="${VG_SSH_USER:-root}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30)

require() {
  if [[ -z "${!1:-}" ]]; then
    echo "✗ $1 not set" >&2
    exit 2
  fi
}
require VG_CP_IP
require VG_WORKER_IPS

log()  { printf "\033[36m▸\033[0m %s\n" "$*"; }
done_() { printf "\033[32m✓\033[0m %s\n" "$*"; }

# ── 1. Control plane ─────────────────────────────────────────────────────
log "Installing k3s control plane on ${VG_CP_IP} (version ${K3S_VERSION})"

ssh "${SSH_OPTS[@]}" "${SSH_USER}@${VG_CP_IP}" bash -se <<EOF
  set -euo pipefail
  if command -v k3s >/dev/null 2>&1; then
    echo "k3s already installed; skipping bootstrap"
  else
    curl -sfL https://get.k3s.io | \\
      INSTALL_K3S_VERSION='${K3S_VERSION}' \\
      INSTALL_K3S_EXEC='server --disable=traefik --disable=servicelb --node-taint=CriticalAddonsOnly=true:NoExecute --tls-san=${VG_CP_IP} --write-kubeconfig-mode=0644' \\
      sh -
  fi
  systemctl is-active --quiet k3s
EOF
done_ "Control plane up"

# ── 2. Fetch join token ──────────────────────────────────────────────────
log "Fetching cluster join token"
TOKEN=$(ssh "${SSH_OPTS[@]}" "${SSH_USER}@${VG_CP_IP}" "cat /var/lib/rancher/k3s/server/node-token")
[[ -n "$TOKEN" ]] || { echo "✗ failed to read join token"; exit 1; }
done_ "Token retrieved"

# ── 3. Workers ───────────────────────────────────────────────────────────
for ip in $VG_WORKER_IPS; do
  log "Joining worker ${ip}"
  ssh "${SSH_OPTS[@]}" "${SSH_USER}@${ip}" bash -se <<EOF
    set -euo pipefail
    if command -v k3s >/dev/null 2>&1 && systemctl is-active --quiet k3s-agent; then
      echo "k3s-agent already running; skipping"
    else
      curl -sfL https://get.k3s.io | \\
        INSTALL_K3S_VERSION='${K3S_VERSION}' \\
        K3S_URL='https://${VG_CP_IP}:6443' \\
        K3S_TOKEN='${TOKEN}' \\
        INSTALL_K3S_EXEC='agent' \\
        sh -
    fi
    systemctl is-active --quiet k3s-agent
EOF
  done_ "Worker ${ip} joined"
done

log "Verifying cluster"
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${VG_CP_IP}" "kubectl get nodes -o wide"
done_ "k3s cluster ready. Run scripts/fetch-kubeconfig.sh next."
