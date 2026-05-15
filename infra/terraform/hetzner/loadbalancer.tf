# Public LB — terminates TCP, forwards to Traefik on workers (port 80/443).
# Traefik does TLS termination inside the cluster.
resource "hcloud_load_balancer" "edge" {
  name               = "${local.cluster_name}-lb"
  load_balancer_type = "lb11"
  location           = var.location
  labels             = local.common_labels
}

resource "hcloud_load_balancer_network" "edge" {
  load_balancer_id = hcloud_load_balancer.edge.id
  network_id       = hcloud_network.main.id
  ip               = "10.0.1.5"
  enable_public_interface = true
}

resource "hcloud_load_balancer_target" "workers" {
  count            = var.worker_count
  type             = "server"
  load_balancer_id = hcloud_load_balancer.edge.id
  server_id        = hcloud_server.workers[count.index].id
  use_private_ip   = true

  depends_on = [hcloud_load_balancer_network.edge]
}

resource "hcloud_load_balancer_service" "http" {
  load_balancer_id = hcloud_load_balancer.edge.id
  protocol         = "tcp"
  listen_port      = 80
  destination_port = 80
  proxyprotocol    = true
  health_check {
    protocol = "tcp"
    port     = 80
    interval = 10
    timeout  = 5
    retries  = 3
  }
}

resource "hcloud_load_balancer_service" "https" {
  load_balancer_id = hcloud_load_balancer.edge.id
  protocol         = "tcp"
  listen_port      = 443
  destination_port = 443
  proxyprotocol    = true
  health_check {
    protocol = "tcp"
    port     = 443
    interval = 10
    timeout  = 5
    retries  = 3
  }
}
