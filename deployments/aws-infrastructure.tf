# AWS Infrastructure for Nephio O-RAN
# This module creates AWS-specific resources for the O-RAN deployment

# AWS VPC and Networking
module "aws_vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  for_each = toset(var.regions.aws)
  
  providers = {
    aws = aws
  }
  
  name = "${local.resource_prefix}-vpc-${each.key}"
  cidr = "10.${index(var.regions.aws, each.key) + 1}.0.0/16"
  
  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = ["10.${index(var.regions.aws, each.key) + 1}.1.0/24", "10.${index(var.regions.aws, each.key) + 1}.2.0/24", "10.${index(var.regions.aws, each.key) + 1}.3.0/24"]
  public_subnets  = ["10.${index(var.regions.aws, each.key) + 1}.101.0/24", "10.${index(var.regions.aws, each.key) + 1}.102.0/24", "10.${index(var.regions.aws, each.key) + 1}.103.0/24"]
  
  enable_nat_gateway     = true
  enable_vpn_gateway     = true
  enable_dns_hostnames   = true
  enable_dns_support     = true
  
  # Cost optimization: Single NAT gateway
  single_nat_gateway = var.enable_cost_optimization
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-vpc-${each.key}"
    "kubernetes.io/cluster/${local.resource_prefix}-eks-${each.key}" = "shared"
  })
}

# EKS Cluster for Kubernetes workloads
module "aws_eks" {
  source = "terraform-aws-modules/eks/aws"
  
  for_each = toset(var.regions.aws)
  
  cluster_name    = "${local.resource_prefix}-eks-${each.key}"
  cluster_version = "1.28"
  
  vpc_id     = module.aws_vpc[each.key].vpc_id
  subnet_ids = module.aws_vpc[each.key].private_subnets
  
  # Cluster endpoint configuration
  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true
  cluster_endpoint_public_access_cidrs = ["0.0.0.0/0"]
  
  # OIDC Provider
  enable_irsa = true
  
  # Cluster logging
  cluster_enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  
  # Node groups
  eks_managed_node_groups = {
    # Main node group for O-RAN workloads
    main = {
      instance_types = var.enable_cost_optimization ? ["t3.large"] : ["c5.2xlarge"]
      
      min_size     = 3
      max_size     = 20
      desired_size = 6
      
      disk_size = 100
      
      labels = {
        workload = "oran-main"
      }
      
      taints = []
      
      update_config = {
        max_unavailable_percentage = 33
      }
      
      # Use Spot instances for cost optimization
      capacity_type = var.enable_cost_optimization ? "SPOT" : "ON_DEMAND"
    }
    
    # Edge computing nodes
    edge = {
      instance_types = ["c5n.large"]
      
      min_size     = 2
      max_size     = 10
      desired_size = 3
      
      disk_size = 50
      
      labels = {
        workload = "oran-edge"
        node-type = "edge"
      }
      
      taints = [
        {
          key    = "edge-only"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      ]
      
      capacity_type = "ON_DEMAND"
    }
    
    # GPU nodes for AI/ML workloads
    gpu = {
      instance_types = ["p3.2xlarge"]
      
      min_size     = 0
      max_size     = 5
      desired_size = 1
      
      disk_size = 200
      
      labels = {
        workload = "oran-ai-ml"
        node-type = "gpu"
      }
      
      taints = [
        {
          key    = "gpu-only"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      ]
      
      capacity_type = "ON_DEMAND"
    }
  }
  
  tags = local.common_tags
}

# RDS for database workloads
resource "aws_db_subnet_group" "main" {
  for_each = toset(var.regions.aws)
  
  name       = "${local.resource_prefix}-db-subnet-group-${each.key}"
  subnet_ids = module.aws_vpc[each.key].private_subnets
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-subnet-group-${each.key}"
  })
}

resource "aws_security_group" "rds" {
  for_each = toset(var.regions.aws)
  
  name_prefix = "${local.resource_prefix}-rds-${each.key}-"
  vpc_id      = module.aws_vpc[each.key].vpc_id
  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [module.aws_vpc[each.key].vpc_cidr_block]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = local.common_tags
}

resource "aws_db_instance" "nephio_db" {
  for_each = var.enable_disaster_recovery ? toset(var.regions.aws) : toset([var.regions.aws[0]])
  
  identifier = "${local.resource_prefix}-db-${each.key}-${random_id.suffix.hex}"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.enable_cost_optimization ? "db.t3.micro" : "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type          = "gp3"
  storage_encrypted     = true
  
  db_name  = "nephio"
  username = "nephio_admin"
  password = random_password.db_password.result
  
  vpc_security_group_ids = [aws_security_group.rds[each.key].id]
  db_subnet_group_name   = aws_db_subnet_group.main[each.key].name
  
  backup_retention_period = var.enable_disaster_recovery ? 7 : 1
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = var.environment != "prod"
  deletion_protection = var.environment == "prod"
  
  # Performance monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring[each.key].arn
  
  tags = local.common_tags
}

# Enhanced monitoring role for RDS
resource "aws_iam_role" "rds_enhanced_monitoring" {
  for_each = toset(var.regions.aws)
  
  name = "${local.resource_prefix}-rds-monitoring-role-${each.key}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  for_each = toset(var.regions.aws)
  
  role       = aws_iam_role.rds_enhanced_monitoring[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ElastiCache for Redis caching
resource "aws_elasticache_subnet_group" "main" {
  for_each = toset(var.regions.aws)
  
  name       = "${local.resource_prefix}-cache-subnet-group-${each.key}"
  subnet_ids = module.aws_vpc[each.key].private_subnets
  
  tags = local.common_tags
}

resource "aws_security_group" "elasticache" {
  for_each = toset(var.regions.aws)
  
  name_prefix = "${local.resource_prefix}-elasticache-${each.key}-"
  vpc_id      = module.aws_vpc[each.key].vpc_id
  
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [module.aws_vpc[each.key].vpc_cidr_block]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "redis" {
  for_each = toset(var.regions.aws)
  
  replication_group_id         = "${local.resource_prefix}-redis-${each.key}"
  description                  = "Redis cluster for Nephio O-RAN"
  
  node_type                   = var.enable_cost_optimization ? "cache.t3.micro" : "cache.r6g.large"
  port                        = 6379
  parameter_group_name        = "default.redis7"
  
  num_cache_clusters         = var.enable_disaster_recovery ? 3 : 1
  automatic_failover_enabled = var.enable_disaster_recovery
  multi_az_enabled          = var.enable_disaster_recovery
  
  subnet_group_name = aws_elasticache_subnet_group.main[each.key].name
  security_group_ids = [aws_security_group.elasticache[each.key].id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = random_password.db_password.result
  
  tags = local.common_tags
}

# S3 buckets for storage
resource "aws_s3_bucket" "nephio_storage" {
  for_each = toset(var.regions.aws)
  
  bucket = "${local.resource_prefix}-storage-${each.key}-${random_id.suffix.hex}"
  
  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "nephio_storage" {
  for_each = toset(var.regions.aws)
  
  bucket = aws_s3_bucket.nephio_storage[each.key].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "nephio_storage" {
  for_each = toset(var.regions.aws)
  
  bucket = aws_s3_bucket.nephio_storage[each.key].id
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

# Cost optimization: S3 lifecycle policy
resource "aws_s3_bucket_lifecycle_configuration" "nephio_storage" {
  count = var.enable_cost_optimization ? length(var.regions.aws) : 0
  
  bucket = aws_s3_bucket.nephio_storage[var.regions.aws[count.index]].id
  
  rule {
    id     = "cost_optimization"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
    
    expiration {
      days = 2555  # 7 years
    }
  }
}

# CloudWatch for monitoring
resource "aws_cloudwatch_log_group" "eks_cluster" {
  for_each = toset(var.regions.aws)
  
  name              = "/aws/eks/${local.resource_prefix}-eks-${each.key}/cluster"
  retention_in_days = var.enable_cost_optimization ? 7 : 30
  
  tags = local.common_tags
}

# Output values
output "aws_eks_clusters" {
  value = {
    for region in var.regions.aws : region => {
      cluster_id                = module.aws_eks[region].cluster_id
      cluster_arn              = module.aws_eks[region].cluster_arn
      cluster_endpoint         = module.aws_eks[region].cluster_endpoint
      cluster_security_group_id = module.aws_eks[region].cluster_security_group_id
      cluster_iam_role_arn     = module.aws_eks[region].cluster_iam_role_arn
      oidc_provider_arn        = module.aws_eks[region].oidc_provider_arn
    }
  }
  sensitive = true
}

output "aws_vpc_info" {
  value = {
    for region in var.regions.aws : region => {
      vpc_id             = module.aws_vpc[region].vpc_id
      vpc_cidr_block     = module.aws_vpc[region].vpc_cidr_block
      private_subnet_ids = module.aws_vpc[region].private_subnets
      public_subnet_ids  = module.aws_vpc[region].public_subnets
    }
  }
}

output "aws_rds_endpoints" {
  value = {
    for region, db in aws_db_instance.nephio_db : region => {
      endpoint = db.endpoint
      port     = db.port
    }
  }
  sensitive = true
}

output "aws_redis_endpoints" {
  value = {
    for region, redis in aws_elasticache_replication_group.redis : region => {
      primary_endpoint = redis.configuration_endpoint_address
      port            = redis.port
    }
  }
  sensitive = true
}

output "aws_s3_buckets" {
  value = {
    for region in var.regions.aws : region => aws_s3_bucket.nephio_storage[region].bucket
  }
}