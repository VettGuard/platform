# SSH keys registered with Hetzner project. Reuse if a key with the same
# fingerprint already exists.
resource "hcloud_ssh_key" "operators" {
  for_each   = { for i, k in var.ssh_public_keys : tostring(i) => k }
  name       = "${local.cluster_name}-op-${each.key}"
  public_key = each.value
  labels     = local.common_labels
}
