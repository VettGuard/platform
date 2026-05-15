output "cluster_name" {
  value = local.cluster_name
}

output "controlplane_ipv4" {
  value       = hcloud_server.controlplane.ipv4_address
  description = "SSH here to bootstrap k3s"
}

output "worker_ipv4" {
  value = [for w in hcloud_server.workers : w.ipv4_address]
}

output "loadbalancer_ipv4" {
  value       = hcloud_load_balancer.edge.ipv4
  description = "Points to Traefik ingress on workers"
}

output "loadbalancer_ipv6" {
  value = hcloud_load_balancer.edge.ipv6
}

# Hostfile-style block, paste into the operator's /etc/hosts for quick access.
output "etc_hosts_block" {
  value = <<-EOT
    # Add to /etc/hosts (operator workstation):
    ${hcloud_server.controlplane.ipv4_address}  ${local.cluster_name}-cp-1
    ${join("\n    ", [for i, w in hcloud_server.workers : "${w.ipv4_address}  ${local.cluster_name}-w-${i + 1}"])}
  EOT
}

# Bootstrap reminder. After `terraform apply`, run:
#   scripts/install-k3s.sh
# which uses the IPs above to SSH in and install k3s + join workers.
output "next_step" {
  value = "Run scripts/install-k3s.sh to install k3s on the cluster."
}
