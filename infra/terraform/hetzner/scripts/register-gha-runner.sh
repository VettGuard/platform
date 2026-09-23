#!/usr/bin/env bash
# Register the Hetzner box as a self-hosted GitHub Actions runner for the
# vettguard/vettguard repository.
#
# Prereq: an admin gh CLI session (`gh auth login`).
# Run from the operator workstation; it SSHes into the runner box.
set -euo pipefail

VG_RUNNER_IP="${VG_RUNNER_IP:?set to runner public IPv4 from terraform output}"
GH_REPO="${GH_REPO:-vettguard/vettguard}"
SSH_USER="${VG_SSH_USER:-root}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new)

echo "→ Requesting registration token for ${GH_REPO}"
TOKEN=$(gh api -X POST "/repos/${GH_REPO}/actions/runners/registration-token" -q .token)

echo "→ Configuring runner on ${VG_RUNNER_IP}"
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${VG_RUNNER_IP}" bash -se <<EOF
  set -euo pipefail
  cd /home/runner/actions-runner
  sudo -u runner ./config.sh \\
    --unattended \\
    --url "https://github.com/${GH_REPO}" \\
    --token "${TOKEN}" \\
    --name "hetzner-${VG_RUNNER_IP}" \\
    --labels "self-hosted,linux,x64,vettguard" \\
    --work _work
  sudo ./svc.sh install runner
  sudo ./svc.sh start
EOF

echo "✓ Runner registered. Confirm at https://github.com/${GH_REPO}/settings/actions/runners"
