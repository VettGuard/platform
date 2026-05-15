# Cloudflare DNS — all customer-facing hostnames front the Hetzner LB.
# Proxied (orange-cloud) for WAF/DDoS in production; unproxied in staging
# so we can hit cert-manager DNS-01 challenge cleanly.

locals {
  lb_ipv4 = hcloud_load_balancer.edge.ipv4
  lb_ipv6 = hcloud_load_balancer.edge.ipv6

  # Subdomains served by the cluster. Each one is created twice (A + AAAA).
  hostnames = [
    "${local.subdomain_prefix}vettguard.com",       # apex / landing
    "${local.subdomain_prefix}app.vettguard.com",   # dashboard
    "${local.subdomain_prefix}admin.vettguard.com", # admin
    "${local.subdomain_prefix}api.vettguard.com",   # gateway
    "${local.subdomain_prefix}status.vettguard.com",
    "${local.subdomain_prefix}grafana.vettguard.com",
    "${local.subdomain_prefix}argocd.vettguard.com",
  ]

  # Production gets orange-cloud (proxied); staging stays grey for cert flexibility.
  proxied = var.environment == "production"
}

resource "cloudflare_dns_record" "a" {
  for_each = toset(local.hostnames)
  zone_id  = var.cloudflare_zone_id
  name     = each.value
  content  = local.lb_ipv4
  type     = "A"
  ttl      = 1
  proxied  = local.proxied
  comment  = "managed-by:terraform | ${local.cluster_name}"
}

resource "cloudflare_dns_record" "aaaa" {
  for_each = toset(local.hostnames)
  zone_id  = var.cloudflare_zone_id
  name     = each.value
  content  = local.lb_ipv6
  type     = "AAAA"
  ttl      = 1
  proxied  = local.proxied
  comment  = "managed-by:terraform | ${local.cluster_name}"
}

# CAA — only Let's Encrypt is allowed to issue.
resource "cloudflare_dns_record" "caa_letsencrypt" {
  zone_id = var.cloudflare_zone_id
  name    = "vettguard.com"
  type    = "CAA"
  ttl     = 3600
  data = {
    flags = 0
    tag   = "issue"
    value = "letsencrypt.org"
  }
}
