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
      Compliance  = "HIPAA-Ready"
    }
  }
}

# 1. KMS Customer Managed Encryption Key
module "kms" {
  source       = "./modules/kms"
  project_name = var.project_name
  environment  = var.environment
}

# 2. Virtual Private Cloud (VPC 3-tier)
module "vpc" {
  source             = "./modules/vpc"
  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# 3. Security Groups
module "security_groups" {
  source       = "./modules/security_groups"
  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# 4. Amazon Cognito User Pool & Groups
module "cognito" {
  source       = "./modules/cognito"
  project_name = var.project_name
  environment  = var.environment
}

# 5. S3 Encrypted Medical Records Bucket
module "s3" {
  source       = "./modules/s3"
  project_name = var.project_name
  environment  = var.environment
  kms_key_arn  = module.kms.key_arn
}

# 6. SQS Asynchronous Reminder Queues & SNS Alert Topics
module "sqs_sns" {
  source       = "./modules/sqs_sns"
  project_name = var.project_name
  environment  = var.environment
  kms_key_arn  = module.kms.key_arn
}

# 7. IAM Least-Privilege Roles
module "iam" {
  source         = "./modules/iam"
  project_name   = var.project_name
  environment    = var.environment
  s3_bucket_arn  = module.s3.bucket_arn
  kms_key_arn    = module.kms.key_arn
  sqs_queue_arn  = module.sqs_sns.queue_arn
  sns_topic_arn  = module.sqs_sns.topic_arn
}

# 8. RDS PostgreSQL Database (Multi-AZ, KMS Encrypted)
module "rds" {
  source                = "./modules/rds"
  project_name          = var.project_name
  environment           = var.environment
  private_db_subnet_ids = module.vpc.private_db_subnet_ids
  rds_security_group_id = module.security_groups.rds_security_group_id
  kms_key_arn           = module.kms.key_arn
  db_password           = var.db_password
}

# 9. Application Load Balancer
module "alb" {
  source                = "./modules/alb"
  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security_groups.alb_security_group_id
}

# 10. AWS WAFv2 Application Firewall
module "waf" {
  source       = "./modules/waf"
  project_name = var.project_name
  environment  = var.environment
  alb_arn      = module.alb.alb_arn
}

# 11. ECS Fargate Container Service
module "ecs" {
  source                 = "./modules/ecs"
  project_name           = var.project_name
  environment            = var.environment
  private_app_subnet_ids = module.vpc.private_app_subnet_ids
  ecs_security_group_id  = module.security_groups.ecs_security_group_id
  target_group_arn       = module.alb.target_group_arn
  ecs_execution_role_arn = module.iam.ecs_execution_role_arn
  ecs_task_role_arn      = module.iam.ecs_task_role_arn
  container_image        = var.container_image
  database_url           = "postgresql://${module.rds.db_name}:${var.db_password}@${module.rds.endpoint}/${module.rds.db_name}"
  s3_bucket_name         = module.s3.bucket_name
  sqs_queue_url          = module.sqs_sns.queue_url
  sns_topic_arn          = module.sqs_sns.topic_arn
  cognito_user_pool_id   = module.cognito.user_pool_id
  cognito_client_id      = module.cognito.client_id
}

# 12. CloudFront Global Distribution
module "cloudfront" {
  source       = "./modules/cloudfront"
  project_name = var.project_name
  environment  = var.environment
  alb_dns_name = module.alb.alb_dns_name
}

# 13. Lambda Asynchronous Functions
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

# 14. CloudWatch Telemetry, Alarms & Dashboard
module "cloudwatch" {
  source           = "./modules/cloudwatch"
  project_name     = var.project_name
  environment      = var.environment
  alb_arn_suffix   = module.alb.alb_arn
  ecs_cluster_name = module.ecs.cluster_name
  ecs_service_name = module.ecs.service_name
  sns_topic_arn    = module.sqs_sns.topic_arn
}

# 15. AWS CloudTrail Audit Logging
module "cloudtrail" {
  source       = "./modules/cloudtrail"
  project_name = var.project_name
  environment  = var.environment
  kms_key_arn  = module.kms.key_arn
}
