# Hetzner Cloud Firewall — applied to all nodes.
# Defaults to deny-all inbound except: SSH (22), HTTP/HTTPS (80/443), k3s API (6443),
# Kubelet (10250 — restricted to private net), etcd (2379-2380 — private net only).
#
# Egress is permissive; restrict in Phase 2 with egress firewall rules.
resource "hcloud_firewall" "cluster" {
  name   = "${local.cluster_name}-fw"
  labels = local.common_labels

  # SSH from anywhere (in prod tighten to operator IPs / WireGuard mesh)
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Public HTTP(S) — Traefik ingress listens
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # k3s API (kubectl access) — keep open during bootstrap; lock to LB only later
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "6443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Kubelet, etcd, flannel — private network only
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "10250"
    source_ips = ["10.0.0.0/16"]
  }
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "2379-2380"
    source_ips = ["10.0.0.0/16"]
  }
  rule {
    direction  = "in"
    protocol   = "udp"
    port       = "8472"  # VXLAN flannel
    source_ips = ["10.0.0.0/16"]
  }

  # ICMP for diagnostics
  rule {
    direction  = "in"
    protocol   = "icmp"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}
