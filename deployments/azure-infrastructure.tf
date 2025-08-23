# Azure Infrastructure for Nephio O-RAN
# This module creates Azure-specific resources for the O-RAN deployment

# Azure Resource Groups
resource "azurerm_resource_group" "main" {
  for_each = toset(var.regions.azure)
  
  name     = "${local.resource_prefix}-rg-${replace(lower(each.key), " ", "-")}"
  location = each.key
  
  tags = local.common_tags
}

# Azure Virtual Networks
resource "azurerm_virtual_network" "main" {
  for_each = toset(var.regions.azure)
  
  name                = "${local.resource_prefix}-vnet-${replace(lower(each.key), " ", "-")}"
  address_space       = ["10.${index(var.regions.azure, each.key) + 10}.0.0/16"]
  location            = azurerm_resource_group.main[each.key].location
  resource_group_name = azurerm_resource_group.main[each.key].name
  
  tags = local.common_tags
}

# Subnets for AKS
resource "azurerm_subnet" "aks" {
  for_each = toset(var.regions.azure)
  
  name                 = "${local.resource_prefix}-aks-subnet-${replace(lower(each.key), " ", "-")}"
  resource_group_name  = azurerm_resource_group.main[each.key].name
  virtual_network_name = azurerm_virtual_network.main[each.key].name
  address_prefixes     = ["10.${index(var.regions.azure, each.key) + 10}.1.0/24"]
}

# Subnets for databases
resource "azurerm_subnet" "database" {
  for_each = toset(var.regions.azure)
  
  name                 = "${local.resource_prefix}-db-subnet-${replace(lower(each.key), " ", "-")}"
  resource_group_name  = azurerm_resource_group.main[each.key].name
  virtual_network_name = azurerm_virtual_network.main[each.key].name
  address_prefixes     = ["10.${index(var.regions.azure, each.key) + 10}.2.0/24"]
  
  service_endpoints = ["Microsoft.Sql"]
  
  delegation {
    name = "fs"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

# Network Security Groups
resource "azurerm_network_security_group" "main" {
  for_each = toset(var.regions.azure)
  
  name                = "${local.resource_prefix}-nsg-${replace(lower(each.key), " ", "-")}"
  location            = azurerm_resource_group.main[each.key].location
  resource_group_name = azurerm_resource_group.main[each.key].name
  
  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  
  security_rule {
    name                       = "AllowKubernetesAPI"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "6443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  
  tags = local.common_tags
}

# Associate NSG with AKS subnet
resource "azurerm_subnet_network_security_group_association" "aks" {
  for_each = toset(var.regions.azure)
  
  subnet_id                 = azurerm_subnet.aks[each.key].id
  network_security_group_id = azurerm_network_security_group.main[each.key].id
}

# Azure Kubernetes Service (AKS)
resource "azurerm_kubernetes_cluster" "main" {
  for_each = toset(var.regions.azure)
  
  name                = "${local.resource_prefix}-aks-${replace(lower(each.key), " ", "-")}"
  location            = azurerm_resource_group.main[each.key].location
  resource_group_name = azurerm_resource_group.main[each.key].name
  dns_prefix          = "${local.resource_prefix}-aks-${replace(lower(each.key), " ", "-")}"
  kubernetes_version  = "1.28.5"
  
  # Cost optimization: Use Basic SKU for non-prod
  sku_tier = var.environment == "prod" ? "Standard" : "Free"
  
  default_node_pool {
    name                = "system"
    node_count          = var.enable_cost_optimization ? 2 : 3
    vm_size            = var.enable_cost_optimization ? "Standard_B2s" : "Standard_D4s_v3"
    vnet_subnet_id     = azurerm_subnet.aks[each.key].id
    enable_auto_scaling = true
    min_count          = 2
    max_count          = 10
    
    upgrade_settings {
      max_surge = "33%"
    }
    
    tags = local.common_tags
  }
  
  identity {
    type = "SystemAssigned"
  }
  
  network_profile {
    network_plugin    = "azure"
    network_policy    = "azure"
    dns_service_ip    = "10.${index(var.regions.azure, each.key) + 10}.0.10"
    service_cidr      = "10.${index(var.regions.azure, each.key) + 10}.0.0/16"
  }
  
  # Enable monitoring
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main[each.key].id
  }
  
  # Enable Azure AD integration
  azure_active_directory_role_based_access_control {
    managed                = true
    admin_group_object_ids = []
    azure_rbac_enabled     = true
  }
  
  tags = local.common_tags
}

# Additional node pool for O-RAN workloads
resource "azurerm_kubernetes_cluster_node_pool" "oran" {
  for_each = toset(var.regions.azure)
  
  name                  = "oran"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main[each.key].id
  vm_size              = "Standard_D8s_v3"
  node_count           = 3
  vnet_subnet_id       = azurerm_subnet.aks[each.key].id
  
  enable_auto_scaling = true
  min_count          = 1
  max_count          = 20
  
  node_labels = {
    "workload" = "oran-main"
  }
  
  node_taints = [
    "oran-workload=true:NoSchedule"
  ]
  
  upgrade_settings {
    max_surge = "33%"
  }
  
  tags = local.common_tags
}

# Edge computing node pool
resource "azurerm_kubernetes_cluster_node_pool" "edge" {
  for_each = var.enable_cost_optimization ? [] : toset(var.regions.azure)
  
  name                  = "edge"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main[each.key].id
  vm_size              = "Standard_F4s_v2"
  node_count           = 2
  vnet_subnet_id       = azurerm_subnet.aks[each.key].id
  
  enable_auto_scaling = true
  min_count          = 1
  max_count          = 10
  
  node_labels = {
    "workload"  = "oran-edge"
    "node-type" = "edge"
  }
  
  node_taints = [
    "edge-only=true:NoSchedule"
  ]
  
  upgrade_settings {
    max_surge = "33%"
  }
  
  tags = local.common_tags
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  for_each = toset(var.regions.azure)
  
  name                = "${local.resource_prefix}-logs-${replace(lower(each.key), " ", "-")}"
  location            = azurerm_resource_group.main[each.key].location
  resource_group_name = azurerm_resource_group.main[each.key].name
  sku                = var.enable_cost_optimization ? "PerGB2018" : "Premium"
  retention_in_days   = var.enable_cost_optimization ? 30 : 90
  
  tags = local.common_tags
}

# Azure Database for PostgreSQL
resource "azurerm_postgresql_flexible_server" "main" {
  for_each = var.enable_disaster_recovery ? toset(var.regions.azure) : toset([var.regions.azure[0]])
  
  name                   = "${local.resource_prefix}-psql-${replace(lower(each.key), " ", "-")}-${random_id.suffix.hex}"
  resource_group_name    = azurerm_resource_group.main[each.key].name
  location              = azurerm_resource_group.main[each.key].location
  version               = "15"
  
  administrator_login    = "nephio_admin"
  administrator_password = random_password.db_password.result
  
  sku_name = var.enable_cost_optimization ? "B_Standard_B1ms" : "GP_Standard_D4s_v3"
  
  storage_mb = 32768
  
  delegated_subnet_id = azurerm_subnet.database[each.key].id
  
  backup_retention_days        = var.enable_disaster_recovery ? 7 : 1
  geo_redundant_backup_enabled = var.enable_disaster_recovery
  
  high_availability {
    mode = var.enable_disaster_recovery ? "ZoneRedundant" : "SameZone"
  }
  
  tags = local.common_tags
}

# Azure Cache for Redis
resource "azurerm_redis_cache" "main" {
  for_each = toset(var.regions.azure)
  
  name                = "${local.resource_prefix}-redis-${replace(lower(each.key), " ", "-")}-${random_id.suffix.hex}"
  location            = azurerm_resource_group.main[each.key].location
  resource_group_name = azurerm_resource_group.main[each.key].name
  capacity            = var.enable_cost_optimization ? 0 : 1
  family              = var.enable_cost_optimization ? "C" : "P"
  sku_name           = var.enable_cost_optimization ? "Basic" : "Premium"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
  
  redis_configuration {
    enable_authentication = true
    maxmemory_policy     = "allkeys-lru"
  }
  
  tags = local.common_tags
}

# Storage Account
resource "azurerm_storage_account" "main" {
  for_each = toset(var.regions.azure)
  
  name                     = "${replace(local.resource_prefix, "-", "")}st${replace(lower(each.key), " ", "")}${random_id.suffix.hex}"
  resource_group_name      = azurerm_resource_group.main[each.key].name
  location                = azurerm_resource_group.main[each.key].location
  account_tier            = "Standard"
  account_replication_type = var.enable_disaster_recovery ? "GRS" : "LRS"
  
  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["DELETE", "GET", "HEAD", "MERGE", "POST", "OPTIONS", "PUT"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 200
    }
    
    delete_retention_policy {
      days = var.enable_cost_optimization ? 7 : 30
    }
    
    versioning_enabled = var.enable_disaster_recovery
  }
  
  tags = local.common_tags
}

# Storage container for Nephio artifacts
resource "azurerm_storage_container" "nephio" {
  for_each = toset(var.regions.azure)
  
  name                  = "nephio-artifacts"
  storage_account_name  = azurerm_storage_account.main[each.key].name
  container_access_type = "private"
}

# Azure Container Registry (shared across regions)
resource "azurerm_container_registry" "main" {
  count = var.enable_cost_optimization ? 1 : length(var.regions.azure)
  
  name                = "${replace(local.resource_prefix, "-", "")}acr${count.index}${random_id.suffix.hex}"
  resource_group_name = azurerm_resource_group.main[var.regions.azure[0]].name
  location           = azurerm_resource_group.main[var.regions.azure[0]].location
  sku                = var.enable_cost_optimization ? "Basic" : "Premium"
  admin_enabled      = true
  
  dynamic "georeplications" {
    for_each = var.enable_disaster_recovery && !var.enable_cost_optimization ? slice(var.regions.azure, 1, length(var.regions.azure)) : []
    content {
      location                = georeplications.value
      zone_redundancy_enabled = true
      tags                   = local.common_tags
    }
  }
  
  tags = local.common_tags
}

# Application Insights for monitoring
resource "azurerm_application_insights" "main" {
  for_each = toset(var.regions.azure)
  
  name                = "${local.resource_prefix}-insights-${replace(lower(each.key), " ", "-")}"
  location            = azurerm_resource_group.main[each.key].location
  resource_group_name = azurerm_resource_group.main[each.key].name
  workspace_id        = azurerm_log_analytics_workspace.main[each.key].id
  application_type    = "other"
  
  tags = local.common_tags
}

# Key Vault for secrets management
resource "azurerm_key_vault" "main" {
  for_each = toset(var.regions.azure)
  
  name                       = "${local.resource_prefix}-kv-${replace(lower(each.key), " ", "-")}-${random_id.suffix.hex}"
  location                   = azurerm_resource_group.main[each.key].location
  resource_group_name        = azurerm_resource_group.main[each.key].name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id
    
    key_permissions = [
      "Create",
      "Get",
    ]
    
    secret_permissions = [
      "Set",
      "Get",
      "Delete",
      "Purge",
      "Recover"
    ]
  }
  
  tags = local.common_tags
}

# Store database password in Key Vault
resource "azurerm_key_vault_secret" "db_password" {
  for_each = toset(var.regions.azure)
  
  name         = "database-password"
  value        = random_password.db_password.result
  key_vault_id = azurerm_key_vault.main[each.key].id
  
  tags = local.common_tags
}

# Output values
output "azure_aks_clusters" {
  value = {
    for region in var.regions.azure : region => {
      cluster_id            = azurerm_kubernetes_cluster.main[region].id
      kube_config          = azurerm_kubernetes_cluster.main[region].kube_config
      cluster_fqdn         = azurerm_kubernetes_cluster.main[region].fqdn
      node_resource_group  = azurerm_kubernetes_cluster.main[region].node_resource_group
    }
  }
  sensitive = true
}

output "azure_resource_groups" {
  value = {
    for region in var.regions.azure : region => {
      name     = azurerm_resource_group.main[region].name
      location = azurerm_resource_group.main[region].location
      id       = azurerm_resource_group.main[region].id
    }
  }
}

output "azure_postgresql_servers" {
  value = {
    for region, db in azurerm_postgresql_flexible_server.main : region => {
      fqdn = db.fqdn
      id   = db.id
    }
  }
  sensitive = true
}

output "azure_redis_endpoints" {
  value = {
    for region, redis in azurerm_redis_cache.main : region => {
      hostname    = redis.hostname
      ssl_port   = redis.ssl_port
      primary_key = redis.primary_access_key
    }
  }
  sensitive = true
}

output "azure_storage_accounts" {
  value = {
    for region in var.regions.azure : region => {
      name                = azurerm_storage_account.main[region].name
      primary_blob_endpoint = azurerm_storage_account.main[region].primary_blob_endpoint
    }
  }
}

output "azure_container_registries" {
  value = {
    for i, acr in azurerm_container_registry.main : i => {
      login_server = acr.login_server
      admin_username = acr.admin_username
      admin_password = acr.admin_password
    }
  }
  sensitive = true
}