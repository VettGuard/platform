#!/usr/bin/env bash
# fetch-kubeconfig.sh — pulls the k3s kubeconfig from the control plane and
# rewrites the server URL to the public control-plane IP.
#
# Output: ~/.kube/vettguard-${VG_ENV}.kubeconfig (defaults: env=staging)
set -euo pipefail

VG_CP_IP="${VG_CP_IP:?set to control-plane public IPv4}"
VG_ENV="${VG_ENV:-staging}"
SSH_USER="${VG_SSH_USER:-root}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new)

mkdir -p "${HOME}/.kube"
OUT="${HOME}/.kube/vettguard-${VG_ENV}.kubeconfig"

scp "${SSH_OPTS[@]}" "${SSH_USER}@${VG_CP_IP}:/etc/rancher/k3s/k3s.yaml" "${OUT}"
sed -i.bak "s|server: https://127.0.0.1:6443|server: https://${VG_CP_IP}:6443|" "${OUT}"
rm -f "${OUT}.bak"
chmod 0600 "${OUT}"

echo "✓ kubeconfig written to ${OUT}"
echo "  export KUBECONFIG=${OUT}"
echo "  kubectl get nodes"
