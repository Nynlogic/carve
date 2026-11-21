terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Platform    = "CAREvia"
      Compliance  = "HIPAA-Ready"
    }
  }
}

# 1. KMS Customer Managed Encryption Key (CMK)
module "kms" {
  source       = "./modules/kms"
  project_name = var.project_name
  environment  = var.environment
}

# 2. Amazon ECR Repository for Backend Container Images
module "ecr" {
  source       = "./modules/ecr"
  project_name = var.project_name
  environment  = var.environment
  kms_key_arn  = module.kms.key_arn
}

# 3. Virtual Private Cloud (VPC 3-tier Multi-AZ Network)
module "vpc" {
  source             = "./modules/vpc"
  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# 4. Security Groups (Least-Privilege Network Ingress/Egress)
module "security_groups" {
  source       = "./modules/security_groups"
  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# 5. Amazon Cognito User Pool & Role Groups (Patient, Doctor, Admin)
module "cognito" {
  source       = "./modules/cognito"
  project_name = var.project_name
  environment  = var.environment
}

# 6. S3 Encrypted Medical Records Vault (Client-Side Presigned Access)
module "s3" {
  source       = "./modules/s3"
  project_name = var.project_name
  environment  = var.environment
  kms_key_arn  = module.kms.key_arn
}

# 7. SQS Asynchronous Queues & SNS Alert Topics
module "sqs_sns" {
  source       = "./modules/sqs_sns"
  project_name = var.project_name
  environment  = var.environment
  kms_key_arn  = module.kms.key_arn
}

# 8. RDS PostgreSQL Database (Multi-AZ in Private DB Subnets)
module "rds" {
  source                = "./modules/rds"
  project_name          = var.project_name
  environment           = var.environment
  private_db_subnet_ids = module.vpc.private_db_subnet_ids
  rds_security_group_id = module.security_groups.rds_security_group_id
  kms_key_arn           = module.kms.key_arn
  db_password           = var.db_password
}

# 9. AWS Secrets Manager (Secure Database & JWT Secret Management)
module "secrets_manager" {
  source       = "./modules/secrets_manager"
  project_name = var.project_name
  environment  = var.environment
  kms_key_arn  = module.kms.key_arn
  db_username  = "careflow_admin"
  db_name      = module.rds.db_name
  db_endpoint  = module.rds.endpoint
  db_host      = module.rds.address
}

# 10. IAM Roles & Least-Privilege Execution/Task Policies
module "iam" {
  source            = "./modules/iam"
  project_name      = var.project_name
  environment       = var.environment
  s3_bucket_arn     = module.s3.bucket_arn
  kms_key_arn       = module.kms.key_arn
  sqs_queue_arn     = module.sqs_sns.queue_arn
  sns_topic_arn     = module.sqs_sns.topic_arn
  db_secret_arn     = module.secrets_manager.db_secret_arn
  jwt_secret_arn    = module.secrets_manager.jwt_secret_arn
  github_repository = var.github_repository
}

# 11. Application Load Balancer (Public Ingress & Health Checks)
module "alb" {
  source                = "./modules/alb"
  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security_groups.alb_security_group_id
  certificate_arn       = var.certificate_arn
}

# 12. AWS WAFv2 Application Firewall (OWASP Top 10 & Rate Limiting)
module "waf" {
  source       = "./modules/waf"
  project_name = var.project_name
  environment  = var.environment
  alb_arn      = module.alb.alb_arn
}

# 13. ECS Fargate Container Service (Private Subnets, ECR Image, Secrets from SSM)
module "ecs" {
  source                 = "./modules/ecs"
  project_name           = var.project_name
  environment            = var.environment
  aws_region             = var.aws_region
  private_app_subnet_ids = module.vpc.private_app_subnet_ids
  ecs_security_group_id  = module.security_groups.ecs_security_group_id
  target_group_arn       = module.alb.target_group_arn
  ecs_execution_role_arn = module.iam.ecs_execution_role_arn
  ecs_task_role_arn      = module.iam.ecs_task_role_arn
  container_image        = "${module.ecr.repository_url}:${var.image_tag}"
  db_secret_arn          = module.secrets_manager.db_secret_arn
  jwt_secret_arn         = module.secrets_manager.jwt_secret_arn
  s3_bucket_name         = module.s3.bucket_name
  sqs_queue_url          = module.sqs_sns.queue_url
  sns_topic_arn          = module.sqs_sns.topic_arn
  cognito_user_pool_id   = module.cognito.user_pool_id
  cognito_client_id      = module.cognito.client_id
}

# 14. CloudFront Global Distribution (Edge Acceleration)
module "cloudfront" {
  source       = "./modules/cloudfront"
  project_name = var.project_name
  environment  = var.environment
  alb_dns_name = module.alb.alb_dns_name
}

# 15. Lambda Asynchronous Functions (SQS Reminders & S3 Document Scanner)
module "lambda" {
  source          = "./modules/lambda"
  project_name    = var.project_name
  environment     = var.environment
  lambda_role_arn = module.iam.lambda_role_arn
  sqs_queue_arn   = module.sqs_sns.queue_arn
  sns_topic_arn   = module.sqs_sns.topic_arn
  s3_bucket_id    = module.s3.bucket_name
  s3_bucket_arn   = module.s3.bucket_arn
}

# 16. CloudWatch Telemetry, Alarms & Operations Dashboard
module "cloudwatch" {
  source               = "./modules/cloudwatch"
  project_name         = var.project_name
  environment          = var.environment
  alb_arn_suffix       = module.alb.alb_arn
  ecs_cluster_name     = module.ecs.cluster_name
  ecs_service_name     = module.ecs.service_name
  sns_topic_arn        = module.sqs_sns.topic_arn
  rds_instance_id      = module.rds.db_instance_id
  lambda_function_name = module.lambda.notifier_function_name
  sqs_queue_name       = module.sqs_sns.queue_name
}

# 17. AWS CloudTrail Audit Logging (Compliance & Management Events)
module "cloudtrail" {
  source       = "./modules/cloudtrail"
  project_name = var.project_name
  environment  = var.environment
  kms_key_arn  = module.kms.key_arn
}
