# Multi-Cloud Architecture for Nephio O-RAN
# This Terraform configuration provides cloud-agnostic deployment across AWS, Azure, and GCP
# with proper cost optimization, disaster recovery, and edge computing integration

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
  
  # Multi-cloud state management
  backend "s3" {
    bucket         = "nephio-oran-terraform-state"
    key            = "multi-cloud/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

# Variables for multi-cloud configuration
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "nephio-oran"
}

variable "regions" {
  description = "Regions for multi-cloud deployment"
  type = object({
    aws   = list(string)
    azure = list(string)
    gcp   = list(string)
  })
  default = {
    aws   = ["us-west-2", "us-east-1", "eu-west-1"]
    azure = ["West US 2", "East US", "West Europe"]
    gcp   = ["us-west1", "us-east1", "europe-west1"]
  }
}

variable "enable_disaster_recovery" {
  description = "Enable disaster recovery across regions"
  type        = bool
  default     = true
}

variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

variable "edge_locations" {
  description = "Edge computing locations"
  type        = list(string)
  default     = ["us-west-2", "eu-west-1", "ap-southeast-1"]
}

# Local values for common tags and naming
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Purpose     = "nephio-oran-deployment"
    CostCenter  = "telecom-infrastructure"
  }
  
  resource_prefix = "${var.project_name}-${var.environment}"
}

# AWS Provider Configuration
provider "aws" {
  region = var.regions.aws[0]
  
  default_tags {
    tags = local.common_tags
  }
}

# Additional AWS provider for multi-region
provider "aws" {
  alias  = "east"
  region = var.regions.aws[1]
  
  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "eu"
  region = var.regions.aws[2]
  
  default_tags {
    tags = local.common_tags
  }
}

# Azure Provider Configuration
provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

# GCP Provider Configuration
provider "google" {
  project = "nephio-oran-${var.environment}"
  region  = var.regions.gcp[0]
}

provider "google" {
  alias   = "east"
  project = "nephio-oran-${var.environment}"
  region  = var.regions.gcp[1]
}

provider "google" {
  alias   = "eu"
  project = "nephio-oran-${var.environment}"
  region  = var.regions.gcp[2]
}

# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

data "azurerm_client_config" "current" {}

# Random password for databases
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Random ID for unique resource naming
resource "random_id" "suffix" {
  byte_length = 4
}

# Output common values
output "resource_prefix" {
  value = local.resource_prefix
}

output "common_tags" {
  value = local.common_tags
}

output "deployment_regions" {
  value = {
    aws   = var.regions.aws
    azure = var.regions.azure
    gcp   = var.regions.gcp
  }
}