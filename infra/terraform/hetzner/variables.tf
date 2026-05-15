# Required secrets (set via env: TF_VAR_hcloud_token, TF_VAR_cloudflare_api_token)
variable "hcloud_token" {
  type        = string
  sensitive   = true
  description = "Hetzner Cloud API token (read+write)"
}

variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Cloudflare API token with Zone:DNS:Edit + Zone:Zone:Read on vettguard.com"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare Zone ID for vettguard.com"
}

# Cluster config
variable "environment" {
  type        = string
  default     = "staging"
  description = "Environment name (staging | production)"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production."
  }
}

variable "location" {
  type        = string
  default     = "fsn1" # Falkenstein, Germany
  description = "Hetzner datacenter location (fsn1, nbg1, hel1, ash, hil, sin)"
}

variable "control_plane_type" {
  type        = string
  default     = "ccx13" # 2 vCPU, 8 GB RAM dedicated
  description = "Server type for control plane"
}

variable "worker_type" {
  type        = string
  default     = "ccx13"
  description = "Server type for worker nodes"
}

variable "worker_count" {
  type        = number
  default     = 2
  description = "Number of worker nodes (control plane is +1)"
}

variable "image" {
  type        = string
  default     = "ubuntu-24.04"
  description = "Base OS image for nodes"
}

# Operator SSH access
variable "ssh_public_keys" {
  type        = list(string)
  description = "SSH public key strings to add to all nodes"
}

# Domain
variable "domain" {
  type        = string
  default     = "vettguard.com"
  description = "Root domain (Cloudflare-managed)"
}

# Subdomain prefix for environment isolation
locals {
  subdomain_prefix = var.environment == "production" ? "" : "${var.environment}."
  cluster_name     = "vg-${var.environment}"
  common_labels = {
    project     = "vettguard"
    environment = var.environment
    managed_by  = "terraform"
  }
}
