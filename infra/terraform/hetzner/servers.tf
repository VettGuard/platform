# Control plane (single node). For HA: bump to 3 and front with an internal LB.
resource "hcloud_server" "controlplane" {
  name        = "${local.cluster_name}-cp-1"
  image       = var.image
  server_type = var.control_plane_type
  location    = var.location
  user_data   = local.cloudinit
  ssh_keys    = [for k in hcloud_ssh_key.operators : k.id]
  firewall_ids = [hcloud_firewall.cluster.id]
  labels      = merge(local.common_labels, { role = "controlplane" })

  network {
    network_id = hcloud_network.main.id
    ip         = "10.0.1.10"
  }

  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }

  depends_on = [hcloud_network_subnet.nodes]
}

# Worker nodes
resource "hcloud_server" "workers" {
  count       = var.worker_count
  name        = "${local.cluster_name}-w-${count.index + 1}"
  image       = var.image
  server_type = var.worker_type
  location    = var.location
  user_data   = local.cloudinit
  ssh_keys    = [for k in hcloud_ssh_key.operators : k.id]
  firewall_ids = [hcloud_firewall.cluster.id]
  labels      = merge(local.common_labels, { role = "worker" })

  network {
    network_id = hcloud_network.main.id
    ip         = "10.0.1.${20 + count.index}"
  }

  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }

  depends_on = [hcloud_network_subnet.nodes]
}

# Encrypted volume for stateful workloads (Postgres data via CloudNativePG, MinIO).
# Mounted to controlplane initially; in HA the cluster's CSI driver will manage.
resource "hcloud_volume" "data" {
  name      = "${local.cluster_name}-data-1"
  size      = 100 # GB, scale up later
  location  = var.location
  format    = "ext4"
  automount = false
  labels    = merge(local.common_labels, { purpose = "stateful" })
}

resource "hcloud_volume_attachment" "data" {
  volume_id = hcloud_volume.data.id
  server_id = hcloud_server.controlplane.id
  automount = false
}
