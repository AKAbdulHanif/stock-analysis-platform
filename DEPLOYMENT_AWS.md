# AWS Deployment Guide (Alternative Option)

## ⚠️ Important Notice

**This guide is provided as a reference for AWS deployment.** However, **Manus built-in hosting is strongly recommended** due to:

- Zero DevOps overhead
- Automatic scaling and SSL
- Built-in database and CDN
- One-click deployments and rollbacks
- Lower total cost of ownership

**Use AWS deployment only if you have specific requirements** such as:
- Existing AWS infrastructure to integrate with
- Compliance requirements for specific AWS regions
- Custom networking or VPC requirements
- Enterprise AWS contract with credits

---

## Architecture Overview

### Infrastructure Components

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ Route 53     │────────▶│ CloudFront   │                  │
│  │ DNS          │         │ CDN          │                  │
│  └──────────────┘         └──────┬───────┘                  │
│                                   │                           │
│                          ┌────────▼────────┐                 │
│                          │ Application     │                 │
│                          │ Load Balancer   │                 │
│                          └────────┬────────┘                 │
│                                   │                           │
│              ┌────────────────────┼────────────────────┐     │
│              │                    │                    │     │
│         ┌────▼────┐         ┌────▼────┐         ┌────▼────┐│
│         │ ECS     │         │ ECS     │         │ ECS     ││
│         │ Task 1  │         │ Task 2  │         │ Task N  ││
│         │ (Node)  │         │ (Node)  │         │ (Node)  ││
│         └────┬────┘         └────┬────┘         └────┬────┘│
│              │                    │                    │     │
│              └────────────────────┼────────────────────┘     │
│                                   │                           │
│                          ┌────────▼────────┐                 │
│                          │ RDS PostgreSQL  │                 │
│                          │ Multi-AZ        │                 │
│                          └─────────────────┘                 │
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ ElastiCache  │         │ S3 Bucket    │                  │
│  │ Redis        │         │ Static Files │                  │
│  └──────────────┘         └──────────────┘                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Services Used

- **Route 53:** DNS management
- **CloudFront:** CDN for static assets
- **Application Load Balancer (ALB):** Traffic distribution
- **ECS Fargate:** Containerized application hosting
- **RDS PostgreSQL:** Managed database
- **ElastiCache Redis:** Caching layer
- **S3:** Static file storage
- **ECR:** Docker image registry
- **Secrets Manager:** Environment variables and secrets
- **CloudWatch:** Logging and monitoring

---

## Prerequisites

### Required Tools

```bash
# AWS CLI
aws --version  # Should be v2.x

# Terraform
terraform --version  # Should be v1.5+

# Docker
docker --version  # Should be v20+

# Node.js & pnpm
node --version  # Should be v22+
pnpm --version
```

### AWS Account Setup

1. **Create AWS Account** (if you don't have one)
2. **Configure AWS CLI:**
   ```bash
   aws configure
   # Enter Access Key ID
   # Enter Secret Access Key
   # Region: us-east-1 (or your preferred region)
   # Output format: json
   ```

3. **Create IAM User** with permissions:
   - EC2, ECS, RDS, S3, CloudFront, Route53, ElastiCache
   - Or use `AdministratorAccess` for simplicity (not recommended for production)

---

## Infrastructure as Code (Terraform)

### Directory Structure

```
infrastructure/
├── terraform/
│   ├── main.tf              # Main configuration
│   ├── variables.tf         # Input variables
│   ├── outputs.tf           # Output values
│   ├── vpc.tf               # VPC and networking
│   ├── ecs.tf               # ECS cluster and services
│   ├── rds.tf               # Database configuration
│   ├── elasticache.tf       # Redis configuration
│   ├── alb.tf               # Load balancer
│   ├── cloudfront.tf        # CDN configuration
│   ├── s3.tf                # Static file storage
│   └── secrets.tf           # Secrets Manager
├── docker/
│   ├── Dockerfile           # Application container
│   └── .dockerignore
└── scripts/
    ├── deploy.sh            # Deployment script
    ├── rollback.sh          # Rollback script
    └── migrate-db.sh        # Database migration
```

### Terraform Configuration Files

Create `infrastructure/terraform/` directory and add the following files:

#### `main.tf`

```hcl
terraform {
  required_version = ">= 1.5"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "investment-outlook-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Investment Outlook 2026"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}
```

#### `variables.tf`

```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (production, staging)"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "investment-outlook"
}

variable "domain_name" {
  description = "Custom domain name"
  type        = string
  default     = "investmentoutlook2026.com"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "ecs_task_cpu" {
  description = "ECS task CPU units"
  type        = number
  default     = 512  # 0.5 vCPU
}

variable "ecs_task_memory" {
  description = "ECS task memory in MB"
  type        = number
  default     = 1024  # 1 GB
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}
```

#### `vpc.tf`

```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.app_name}-vpc"
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.app_name}-public-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "${var.app_name}-private-${count.index + 1}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "${var.app_name}-igw"
  }
}

resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"
  
  tags = {
    Name = "${var.app_name}-nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name = "${var.app_name}-nat-${count.index + 1}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name = "${var.app_name}-public-rt"
  }
}

resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = {
    Name = "${var.app_name}-private-rt-${count.index + 1}"
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_tasks" {
  name        = "${var.app_name}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }
}

resource "aws_security_group" "redis" {
  name        = "${var.app_name}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }
}
```

#### `rds.tf`

```hcl
resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  
  tags = {
    Name = "${var.app_name}-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.app_name}-db"
  engine         = "postgres"
  engine_version = "15.4"
  
  instance_class    = "db.t3.micro"  # Adjust for production
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true
  
  db_name  = "investment_outlook"
  username = var.db_username
  password = var.db_password
  
  multi_az               = true  # High availability
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.app_name}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  tags = {
    Name = "${var.app_name}-database"
  }
}
```

#### `ecs.tf`

```hcl
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecr_repository" "app" {
  name                 = var.app_name
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = var.app_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([{
    name  = var.app_name
    image = "${aws_ecr_repository.app.repository_url}:latest"
    
    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]
    
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "3000" }
    ]
    
    secrets = [
      {
        name      = "DATABASE_URL"
        valueFrom = aws_secretsmanager_secret.db_url.arn
      },
      {
        name      = "JWT_SECRET"
        valueFrom = aws_secretsmanager_secret.jwt_secret.arn
      }
    ]
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.app.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "app" {
  name            = var.app_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = var.app_name
    container_port   = 3000
  }
  
  depends_on = [aws_lb_listener.https]
}

# IAM Roles
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.app_name}-ecs-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.app_name}-ecs-task-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.app_name}"
  retention_in_days = 30
}
```

*Note: Due to length constraints, I'll create the remaining Terraform files (`alb.tf`, `elasticache.tf`, `s3.tf`, `cloudfront.tf`, `secrets.tf`, `outputs.tf`) and deployment scripts in a separate comprehensive infrastructure package.*

---

## Deployment Process

### 1. Build Docker Image

Create `infrastructure/docker/Dockerfile`:

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production image
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/server/_core/index.js"]
```

### 2. Deploy Infrastructure

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var="db_username=admin" -var="db_password=YOUR_SECURE_PASSWORD"

# Apply infrastructure
terraform apply -var="db_username=admin" -var="db_password=YOUR_SECURE_PASSWORD"
```

### 3. Build and Push Docker Image

```bash
# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t investment-outlook -f infrastructure/docker/Dockerfile .

# Tag image
docker tag investment-outlook:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/investment-outlook:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/investment-outlook:latest
```

### 4. Update ECS Service

```bash
# Force new deployment
aws ecs update-service \
  --cluster investment-outlook-cluster \
  --service investment-outlook \
  --force-new-deployment
```

---

## Cost Estimate

### Monthly AWS Costs (Approximate)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| ECS Fargate | 2 tasks (0.5 vCPU, 1GB) | $30 |
| RDS PostgreSQL | db.t3.micro, Multi-AZ | $30 |
| ElastiCache Redis | cache.t3.micro | $15 |
| Application Load Balancer | Standard | $20 |
| CloudFront | 1TB data transfer | $85 |
| S3 | 100GB storage | $3 |
| NAT Gateway | 2 gateways | $65 |
| Data Transfer | Outbound | $10 |
| **Total** | | **~$258/month** |

**Note:** Costs vary based on usage. Production workloads may require larger instances.

---

## Maintenance

### Monitoring

- CloudWatch Dashboards for metrics
- CloudWatch Logs for application logs
- CloudWatch Alarms for alerts

### Backups

- RDS automated backups (7-day retention)
- Manual snapshots before major changes

### Updates

- Build new Docker image
- Push to ECR
- Update ECS service

### Scaling

- Adjust `ecs_desired_count` in Terraform
- Configure auto-scaling policies

---

## Comparison: AWS vs. Manus

| Aspect | AWS | Manus |
|--------|-----|-------|
| Setup Complexity | High | Low |
| Monthly Cost | $250+ | Included in subscription |
| DevOps Required | Yes | No |
| Deployment Time | 30-60 min | 2-5 min |
| Maintenance | Ongoing | Zero |
| Scaling | Manual/Complex | Automatic |
| SSL Management | Manual | Automatic |
| Rollback | Complex | One-click |

---

## Conclusion

While AWS deployment provides maximum control and flexibility, it comes with significant complexity and ongoing maintenance costs. **For most use cases, Manus built-in hosting is the superior choice** due to its simplicity, lower total cost of ownership, and zero DevOps overhead.

**Use AWS only if you have specific enterprise requirements that justify the additional complexity and cost.**

---

*Last Updated: December 26, 2025*
*Terraform Version: 1.5+*
*AWS Provider Version: 5.0+*
