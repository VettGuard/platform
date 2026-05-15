terraform {
  required_version = ">= 1.9.0"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.51"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }

  # State lives in Hetzner Object Storage (S3-compatible).
  # Uncomment + set bucket once created.
  # backend "s3" {
  #   bucket = "vettguard-tfstate"
  #   key    = "hetzner/prod.tfstate"
  #   region = "us-east-1"   # ignored by Hetzner S3, but required by provider
  #   endpoints = { s3 = "https://fsn1.your-objectstorage.com" }
  #   skip_credentials_validation = true
  #   skip_metadata_api_check     = true
  #   skip_region_validation      = true
  #   skip_requesting_account_id  = true
  #   use_path_style              = true
  # }
}

provider "hcloud" {
  token = var.hcloud_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
