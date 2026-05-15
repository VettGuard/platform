# Private network — nodes talk to each other over 10.0.0.0/16, never the public internet.
resource "hcloud_network" "main" {
  name     = "${local.cluster_name}-net"
  ip_range = "10.0.0.0/16"
  labels   = local.common_labels
}

resource "hcloud_network_subnet" "nodes" {
  network_id   = hcloud_network.main.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = "10.0.1.0/24"
}
