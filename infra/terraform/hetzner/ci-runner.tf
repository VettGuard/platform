# Self-hosted GitHub Actions runner on a separate Hetzner box.
# Kept off the k3s cluster so a runaway build cannot exhaust cluster resources.
#
# Bootstrap:
#  1. terraform apply provisions the box with cloud-init (Docker + actions-runner deps).
#  2. SSH in and register the runner: see scripts/register-gha-runner.sh
#     (needs a GitHub runner registration token from the repo settings page).
resource "hcloud_server" "ci_runner" {
  name        = "${local.cluster_name}-runner"
  image       = var.image
  server_type = "cx22"
  location    = var.location
  ssh_keys    = [for k in hcloud_ssh_key.operators : k.id]
  firewall_ids = [hcloud_firewall.cluster.id]
  labels      = merge(local.common_labels, { role = "ci-runner" })

  user_data = <<-CLOUD
    #cloud-config
    package_update: true
    packages:
      - curl
      - jq
      - docker.io
      - docker-compose-v2
      - git
      - build-essential
    users:
      - name: runner
        groups: [docker, sudo]
        shell: /bin/bash
        sudo: "ALL=(ALL) NOPASSWD:ALL"
    runcmd:
      - systemctl enable --now docker
      - sudo -u runner mkdir -p /home/runner/actions-runner
      - cd /home/runner/actions-runner && sudo -u runner curl -fsSL -o runner.tar.gz https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-linux-x64-2.321.0.tar.gz
      - cd /home/runner/actions-runner && sudo -u runner tar xzf runner.tar.gz && rm runner.tar.gz
  CLOUD

  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }
}

output "ci_runner_ipv4" {
  value       = hcloud_server.ci_runner.ipv4_address
  description = "SSH here and run scripts/register-gha-runner.sh once."
}
