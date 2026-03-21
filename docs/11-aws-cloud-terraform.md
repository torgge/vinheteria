# 11. AWS Cloud Architecture & Infrastructure as Code


### 11.1 AWS Region & Service Mapping

> **Região primária: `us-east-1` (N. Virginia)**. Custo reduzido (~20-30% menor que sa-east-1), maior disponibilidade de instance types e serviços. CloudFront edge locations no Brasil e Paraguai garantem baixa latência para o mercado primário.

| Componente Vinheria    | Serviço AWS                          | Justificativa                                    |
|------------------------|--------------------------------------|--------------------------------------------------|
| Kubernetes (apps)      | **Amazon EKS** (Managed Node Groups) | Control plane gerenciado, Karpenter para scaling |
| Container Registry     | **Amazon ECR**                       | Private registry, integrado ao EKS/IAM          |
| Database (PostgreSQL)  | **Amazon RDS PostgreSQL 16**         | Multi-AZ, automated backups, WAL logical suportado |
| Cache (Valkey)         | **Amazon ElastiCache for Valkey**    | Managed Valkey, cluster mode, encryption at rest |
| Broker (Kafka)         | **Amazon MSK** (KRaft mode)          | Managed Kafka sem Zookeeper, MSK Connect para CDC |
| CDC (Debezium)         | **MSK Connect**                      | Managed Kafka Connect, Debezium plugin built-in  |
| Search (OpenSearch)    | **Amazon OpenSearch Service**        | Managed cluster, UltraWarm para dados históricos |
| Saga Orchestration     | **Orkes Cloud** (Conductor)          | Managed Conductor em produção, hospedado na AWS  |
| Frontend SPA           | **CloudFront + S3**                  | CDN global, Angular SPA estático                 |
| DNS                    | **Route 53**                         | DNS com health checks e failover                 |
| SSL/TLS                | **AWS Certificate Manager (ACM)**    | Certificados grátis, auto-renew                  |
| Load Balancer          | **ALB** (via AWS LB Controller)      | Ingress K8s, path-based routing, WAF integration |
| WAF                    | **AWS WAF**                          | Rate limiting, SQL injection, XSS protection     |
| Secrets                | **AWS Secrets Manager**              | Rotação automática, integrado ao EKS via IRSA    |
| Encryption Keys        | **AWS KMS**                          | CMK para encryption at rest em RDS, ElastiCache  |
| Observability Traces   | **AWS Distro for OTel (ADOT)**       | OTel Collector gerenciado como DaemonSet no EKS  |
| Observability Metrics  | **Amazon Managed Prometheus (AMP)**  | Prometheus gerenciado, scrape via ADOT           |
| Observability Dashboards| **Amazon Managed Grafana (AMG)**    | Grafana gerenciado, SSO via IAM Identity Center  |
| Observability Logs     | **Amazon CloudWatch Logs** + **OpenSearch** | Logs via Fluent Bit DaemonSet            |
| Terraform State        | **S3 + DynamoDB**                    | Remote state com locking                         |
| CI/CD                  | **GitHub Actions** (OIDC → AWS)      | Sem access keys, assume role via OIDC federation |
| Auth (Identity)        | **Amazon Cognito** (User Pool)       | OAuth 2.0 / OIDC, JWT, MFA, custom attributes (role, currency) |

### 11.2 AWS Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  AWS Cloud — us-east-1 (N. Virginia)                                             │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  Route 53 (DNS) → ACM (SSL) → CloudFront (CDN)                         │   │
│  │       │                              │                                   │   │
│  │       │  api.vinheria.com.br         │  app.vinheria.com.br             │   │
│  │       ▼                              ▼                                   │   │
│  │  ┌─────────┐                   ┌──────────┐                             │   │
│  │  │   ALB   │                   │  S3      │                             │   │
│  │  │ + WAF   │                   │ (Angular │                             │   │
│  │  │         │                   │  SPA)    │                             │   │
│  │  └────┬────┘                   └──────────┘                             │   │
│  │       │                                                                  │   │
│  │  ┌────┴─────────────────────────────────────────────────────────────┐   │   │
│  │  │  Amazon EKS Cluster                                              │   │   │
│  │  │  ┌────────────────────────────────────────────────────────────┐  │   │   │
│  │  │  │  Managed Node Group (Karpenter autoscaling)                │  │   │   │
│  │  │  │                                                            │  │   │   │
│  │  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │   │   │
│  │  │  │  │ catalog │ │  order  │ │inventory│ │ pricing │        │  │   │   │
│  │  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │  │   │   │
│  │  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                    │  │   │   │
│  │  │  │  │ payment │ │shipping │ │identity │  (Quarkus Native)  │  │   │   │
│  │  │  │  └─────────┘ └─────────┘ └─────────┘                    │  │   │   │
│  │  │  │                                                            │  │   │   │
│  │  │  │  ┌──────────────┐  ┌────────────────────┐                │  │   │   │
│  │  │  │  │ ADOT Collector│  │ Fluent Bit DaemonSet│               │  │   │   │
│  │  │  │  │ (OTel traces │  │ (logs → CloudWatch) │               │  │   │   │
│  │  │  │  │  + metrics)  │  └────────────────────┘                │  │   │   │
│  │  │  │  └──────────────┘                                         │  │   │   │
│  │  │  └────────────────────────────────────────────────────────────┘  │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─── Data Layer ──────────────────────────────────────────────────┐   │   │
│  │  │                                                                  │   │   │
│  │  │  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │   │
│  │  │  │ RDS Postgres │  │ ElastiCache      │  │ OpenSearch       │  │   │   │
│  │  │  │ 16 Multi-AZ  │  │ for Valkey       │  │ Service          │  │   │   │
│  │  │  │ (7 databases)│  │ (cluster mode)   │  │ (wine facets)    │  │   │   │
│  │  │  └──────────────┘  └──────────────────┘  └──────────────────┘  │   │   │
│  │  │                                                                  │   │   │
│  │  │  ┌──────────────┐  ┌──────────────────┐                        │   │   │
│  │  │  │ Amazon MSK   │  │ MSK Connect      │                        │   │   │
│  │  │  │ (Kafka KRaft)│◄─│ (Debezium CDC)   │                        │   │   │
│  │  │  │              │  │ Outbox EventRouter│                        │   │   │
│  │  │  └──────────────┘  └──────────────────┘                        │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─── Observability ───────────────────────────────────────────────┐   │   │
│  │  │  Amazon Managed   Amazon Managed     Amazon Managed             │   │   │
│  │  │  Prometheus (AMP) Grafana (AMG)      CloudWatch Logs            │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─── Security ────────────────────────────────────────────────────┐   │   │
│  │  │  Secrets Manager    KMS (CMK)     IAM (IRSA)    WAF             │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 11.3 Terraform — Estrutura de Módulos AWS

```
infra/terraform/
├── modules/
│   ├── vpc/                           # VPC, subnets, NAT Gateway, flow logs
│   ├── eks/                           # EKS cluster, Karpenter, IRSA, ADOT
│   ├── rds-postgres/                  # RDS PostgreSQL Multi-AZ, parameter groups
│   ├── elasticache-valkey/            # ElastiCache for Valkey, cluster mode
│   ├── msk/                           # Amazon MSK (Kafka KRaft), MSK Connect
│   ├── opensearch/                    # OpenSearch Service domain
│   ├── ecr/                           # ECR repositories (1 per microservice)
│   ├── alb-ingress/                   # ALB + WAF + ACM certificate
│   ├── cloudfront-spa/                # CloudFront + S3 (Angular SPA)
│   ├── observability/                 # AMP + AMG + ADOT + CloudWatch
│   ├── secrets/                       # Secrets Manager + KMS
│   ├── cognito/                       # Cognito User Pool + App Client
│   └── microservice/                  # K8s Deployment + Service + HPA (template)
│
├── environments/
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf                 # S3 + DynamoDB locking
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       ├── terraform.tfvars
│       └── backend.tf
│
└── .tflint.hcl
```

### 11.4 Módulos Terraform — Principais Configurações AWS

#### VPC (3 AZs, public + private subnets)

```hcl
# modules/vpc/main.tf
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "vinheria-${var.environment}"
  cidr = var.vpc_cidr   # staging: 10.1.0.0/16, prod: 10.0.0.0/16

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment == "staging"  # 1 NAT em staging, 3 em prod
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Tags requeridas pelo EKS e ALB Controller
  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }

  tags = local.common_tags
}
```

#### EKS (Karpenter + IRSA + ADOT)

```hcl
# modules/eks/main.tf
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "vinheria-${var.environment}"
  cluster_version = "1.31"

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnet_ids

  # EKS Managed Node Group
  eks_managed_node_groups = {
    app = {
      instance_types = var.environment == "production" ? ["m7g.large"] : ["m7g.medium"]
      min_size       = var.environment == "production" ? 3 : 2
      max_size       = var.environment == "production" ? 12 : 4
      desired_size   = var.environment == "production" ? 6 : 2

      labels = { workload = "app" }
    }
  }

  # OIDC para IRSA (IAM Roles for Service Accounts)
  enable_irsa = true

  # Cluster addons
  cluster_addons = {
    coredns                = { most_recent = true }
    vpc-cni                = { most_recent = true }
    kube-proxy             = { most_recent = true }
    aws-ebs-csi-driver     = { most_recent = true }
    adot                   = { most_recent = true }   # AWS Distro for OTel
  }

  tags = local.common_tags
}
```

#### RDS PostgreSQL (Multi-AZ, WAL logical)

```hcl
# modules/rds-postgres/main.tf
resource "aws_db_instance" "postgres" {
  identifier     = "vinheria-${var.service_name}-${var.environment}"
  engine         = "postgres"
  engine_version = "16.4"
  instance_class = var.instance_class  # staging: db.t4g.medium, prod: db.r7g.large

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage  # autoscaling
  storage_encrypted     = true
  kms_key_id            = var.kms_key_arn

  db_name  = "vinheria_${var.service_name}"
  username = "vinheria"
  password = aws_secretsmanager_secret_version.db_password.secret_string

  multi_az               = var.environment == "production"
  db_subnet_group_name   = var.db_subnet_group
  vpc_security_group_ids = [var.db_security_group_id]

  # Requerido pelo Debezium CDC
  parameter_group_name = aws_db_parameter_group.postgres.name

  backup_retention_period = var.environment == "production" ? 30 : 7
  deletion_protection     = var.environment == "production"

  tags = merge(local.common_tags, { Service = var.service_name })
}

# Parameter group com WAL logical para Debezium
resource "aws_db_parameter_group" "postgres" {
  name   = "vinheria-${var.service_name}-${var.environment}"
  family = "postgres16"

  parameter {
    name  = "rds.logical_replication"
    value = "1"                          # Habilita WAL logical para Debezium
  }
  parameter {
    name  = "max_replication_slots"
    value = "4"
  }
  parameter {
    name  = "max_wal_senders"
    value = "4"
  }
}
```

#### ElastiCache for Valkey

```hcl
# modules/elasticache-valkey/main.tf
resource "aws_elasticache_replication_group" "valkey" {
  replication_group_id = "vinheria-${var.environment}"
  description          = "Vinheria Valkey cluster"
  engine               = "valkey"
  engine_version       = "8.0"
  node_type            = var.node_type  # staging: cache.t4g.medium, prod: cache.r7g.large
  num_cache_clusters   = var.environment == "production" ? 3 : 1

  port                 = 6379
  subnet_group_name    = var.subnet_group
  security_group_ids   = [var.security_group_id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  kms_key_id                 = var.kms_key_arn

  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled           = var.environment == "production"

  # Maintenance window e snapshots
  snapshot_retention_limit = var.environment == "production" ? 7 : 1
  maintenance_window       = "sun:05:00-sun:06:00"

  tags = local.common_tags
}
```

#### Amazon MSK (Kafka KRaft)

```hcl
# modules/msk/main.tf
resource "aws_msk_cluster" "kafka" {
  cluster_name           = "vinheria-${var.environment}"
  kafka_version          = "3.7.x.kraft"     # KRaft mode — sem Zookeeper
  number_of_broker_nodes = var.environment == "production" ? 3 : 2

  broker_node_group_info {
    instance_type  = var.environment == "production" ? "kafka.m7g.large" : "kafka.t3.small"
    client_subnets = var.private_subnet_ids
    storage_info {
      ebs_storage_info {
        volume_size = var.environment == "production" ? 500 : 100
      }
    }
    security_groups = [var.security_group_id]
  }

  encryption_info {
    encryption_at_rest_kms_key_arn = var.kms_key_arn
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  configuration_info {
    arn      = aws_msk_configuration.kafka.arn
    revision = aws_msk_configuration.kafka.latest_revision
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = "/aws/msk/vinheria-${var.environment}"
      }
    }
  }

  tags = local.common_tags
}

resource "aws_msk_configuration" "kafka" {
  name              = "vinheria-${var.environment}"
  kafka_versions    = ["3.7.x.kraft"]

  server_properties = <<PROPERTIES
auto.create.topics.enable=false
default.replication.factor=${var.environment == "production" ? 3 : 2}
min.insync.replicas=${var.environment == "production" ? 2 : 1}
num.partitions=3
log.retention.hours=168
PROPERTIES
}
```

#### CloudFront + S3 (Angular SPA)

```hcl
# modules/cloudfront-spa/main.tf
resource "aws_s3_bucket" "spa" {
  bucket = "vinheria-web-${var.environment}"
  tags   = local.common_tags
}

resource "aws_cloudfront_distribution" "spa" {
  enabled             = true
  default_root_object = "index.html"
  aliases             = [var.domain_name]  # app.vinheria.com.br

  origin {
    domain_name              = aws_s3_bucket.spa.bucket_regional_domain_name
    origin_id                = "s3-spa"
    origin_access_control_id = aws_cloudfront_origin_access_control.spa.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-spa"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_optimized.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.cors_s3.id
  }

  # SPA: todas as rotas retornam index.html (Angular routing)
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  tags = local.common_tags
}
```

### 11.5 Environment — Production (Composição)

```hcl
# environments/production/main.tf
terraform {
  required_version = ">= 1.9"
  required_providers {
    aws        = { source = "hashicorp/aws", version = "~> 5.80" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.35" }
  }
}

provider "aws" {
  region = "us-east-1"
  default_tags {
    tags = {
      Project     = "vinheria"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}

# ─── Networking ────────────────────────────────────────
module "vpc" {
  source          = "../../modules/vpc"
  environment     = "production"
  vpc_cidr        = "10.0.0.0/16"
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# ─── EKS ───────────────────────────────────────────────
module "eks" {
  source             = "../../modules/eks"
  environment        = "production"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
}

# ─── Databases (1 RDS per microservice) ────────────────
locals {
  databases = {
    catalog   = { instance_class = "db.r7g.large",  storage = 100 }
    order     = { instance_class = "db.r7g.large",  storage = 100 }
    inventory = { instance_class = "db.r7g.medium", storage = 50 }
    pricing   = { instance_class = "db.r7g.medium", storage = 50 }
    payment   = { instance_class = "db.r7g.large",  storage = 100 }
    shipping  = { instance_class = "db.r7g.medium", storage = 50 }
    identity  = { instance_class = "db.r7g.medium", storage = 50 }
  }
}

module "rds" {
  source   = "../../modules/rds-postgres"
  for_each = local.databases

  environment           = "production"
  service_name          = each.key
  instance_class        = each.value.instance_class
  allocated_storage     = each.value.storage
  max_allocated_storage = each.value.storage * 4
  db_subnet_group       = module.vpc.database_subnet_group
  db_security_group_id  = module.vpc.database_security_group_id
  kms_key_arn           = module.secrets.kms_key_arn
}

# ─── Valkey (ElastiCache) ──────────────────────────────
module "valkey" {
  source            = "../../modules/elasticache-valkey"
  environment       = "production"
  node_type         = "cache.r7g.large"
  subnet_group      = module.vpc.elasticache_subnet_group
  security_group_id = module.vpc.cache_security_group_id
  kms_key_arn       = module.secrets.kms_key_arn
}

# ─── Kafka (MSK) ──────────────────────────────────────
module "msk" {
  source             = "../../modules/msk"
  environment        = "production"
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_id  = module.vpc.kafka_security_group_id
  kms_key_arn        = module.secrets.kms_key_arn
}

# ─── OpenSearch ────────────────────────────────────────
module "opensearch" {
  source            = "../../modules/opensearch"
  environment       = "production"
  instance_type     = "r7g.large.search"
  instance_count    = 3
  subnet_ids        = module.vpc.private_subnet_ids
  security_group_id = module.vpc.search_security_group_id
}

# ─── Frontend (CloudFront + S3) ───────────────────────
module "frontend" {
  source             = "../../modules/cloudfront-spa"
  environment        = "production"
  domain_name        = "app.vinheria.com.br"
  acm_certificate_arn = module.dns.acm_certificate_arn
}

# ─── Observability ─────────────────────────────────────
module "observability" {
  source      = "../../modules/observability"
  environment = "production"
  eks_cluster = module.eks.cluster_name
}

# ─── Secrets + KMS ─────────────────────────────────────
module "secrets" {
  source      = "../../modules/secrets"
  environment = "production"
}

# ─── Auth (Cognito) ───────────────────────────────────
module "cognito" {
  source               = "../../modules/cognito"
  environment          = "production"
  create_initial_admin = true
  admin_email          = var.admin_email
}

# ─── Microservices ─────────────────────────────────────
locals {
  services = {
    catalog   = { cpu = "500m", memory = "1Gi", replicas = 3, max_replicas = 8 }
    order     = { cpu = "500m", memory = "1Gi", replicas = 3, max_replicas = 8 }
    inventory = { cpu = "250m", memory = "512Mi", replicas = 2, max_replicas = 6 }
    pricing   = { cpu = "250m", memory = "512Mi", replicas = 2, max_replicas = 4 }
    payment   = { cpu = "500m", memory = "1Gi", replicas = 3, max_replicas = 8 }
    shipping  = { cpu = "250m", memory = "512Mi", replicas = 2, max_replicas = 4 }
    identity  = { cpu = "250m", memory = "512Mi", replicas = 2, max_replicas = 4 }
  }
}

module "microservice" {
  source   = "../../modules/microservice"
  for_each = local.services

  service_name     = "vinheria-${each.key}"
  namespace        = "production"
  environment      = "production"
  image_repository = "${module.ecr.repository_urls[each.key]}"
  image_tag        = var.image_tag
  cpu_request      = each.value.cpu
  memory_request   = each.value.memory
  replicas         = each.value.replicas
  min_replicas     = each.value.replicas
  max_replicas     = each.value.max_replicas
  otel_endpoint    = module.observability.adot_endpoint

  # Injetar endpoints AWS via env vars
  env_vars = {
    QUARKUS_DATASOURCE_REACTIVE_URL = "postgresql://${module.rds[each.key].endpoint}:5432/vinheria_${each.key}"
    QUARKUS_REDIS_HOSTS             = "rediss://${module.valkey.endpoint}:6379"
    KAFKA_BOOTSTRAP_SERVERS         = module.msk.bootstrap_brokers_tls
    OPENSEARCH_URL                  = "https://${module.opensearch.endpoint}"
    COGNITO_USER_POOL_ID            = module.cognito.user_pool_id
    COGNITO_APP_CLIENT_ID           = module.cognito.app_client_id
  }
}
```

### 11.6 Remote State & GitHub Actions OIDC

```hcl
# environments/production/backend.tf
terraform {
  backend "s3" {
    bucket         = "vinheria-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "vinheria-terraform-locks"
    encrypt        = true
  }
}
```

```yaml
# .github/workflows/deploy.yml — Trecho OIDC (sem access keys)
permissions:
  id-token: write
  contents: read

steps:
  - name: Configure AWS Credentials (OIDC)
    uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-deploy
      aws-region: us-east-1
```

### 11.7 Cost Estimation — Staging vs Production (us-east-1)

| Serviço AWS                | Staging (~USD/mês) | Production (~USD/mês) |
|----------------------------|-------------------:|---------------------:|
| EKS cluster                |               $73  |                $73   |
| EC2 nodes (Managed NG)     |              $140  |                $850  |
| RDS PostgreSQL (7 dbs)     |              $270  |              $2,100  |
| ElastiCache Valkey          |               $50  |                $430  |
| MSK (Kafka)                |              $120  |                $720  |
| OpenSearch                 |               $65  |                $540  |
| CloudFront + S3            |               $15  |                 $60  |
| Observability (AMP+AMG)    |               $25  |                $120  |
| Secrets + KMS + WAF        |               $15  |                 $60  |
| NAT Gateway                |               $33  |                 $99  |
| **Total estimado**         |          **~$806** |           **~$5,052** |

*Estimativas baseadas em us-east-1 pricing (Março 2026). ~25% mais barato que sa-east-1. Produção com Multi-AZ e instâncias maiores.*

### 11.8 AWS Conventions & Agent Rules

1. **SEMPRE** usar `us-east-1` como região primária — custo reduzido, maior catálogo de serviços. CloudFront para latência local
2. **SEMPRE** usar OIDC federation no GitHub Actions — NUNCA access keys estáticas
3. **SEMPRE** usar IRSA (IAM Roles for Service Accounts) no EKS — pods com least privilege
4. **SEMPRE** habilitar encryption at rest (KMS CMK) em RDS, ElastiCache e MSK
5. **SEMPRE** usar private subnets para workloads — ALB em public, todo o resto em private
6. **SEMPRE** habilitar `rds.logical_replication=1` para Debezium CDC no parameter group
7. **SEMPRE** usar MSK com `kraft` suffix na versão do Kafka — nunca provisionar Zookeeper
8. **SEMPRE** usar CloudFront + S3 para Angular SPA — nunca servir SPA do EKS
9. **NUNCA** hardcodar endpoints AWS — injetar via env vars no módulo microservice
10. **SEMPRE** usar Secrets Manager para senhas — nunca em `.tfvars` ou ConfigMaps
11. **SEMPRE** taggear tudo: `Project=vinheria`, `Environment`, `Service`, `ManagedBy=terraform`
12. **SEMPRE** usar `for_each` com map de serviços — nunca duplicar módulos manualmente
```

---
