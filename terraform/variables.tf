variable "aws_region" {
  type        = string
  description = "AWS deployment region"
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "Project name identifier"
  default     = "carevia"
}

variable "environment" {
  type        = string
  description = "Deployment environment (production/staging/dev)"
  default     = "production"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the 3-tier VPC"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "Target Availability Zones for Multi-AZ resilience"
  default     = ["us-east-1a", "us-east-1b"]
}

variable "db_password" {
  type        = string
  description = "Optional master password for RDS PostgreSQL. If empty, a secure 32-character password is generated automatically into Secrets Manager."
  default     = ""
  sensitive   = true
}

variable "image_tag" {
  type        = string
  description = "ECR image tag deployed by CI/CD"
  default     = "latest"
}

variable "certificate_arn" {
  type        = string
  description = "Optional ACM SSL Certificate ARN for ALB HTTPS (port 443) listener"
  default     = ""
}

variable "github_repository" {
  type        = string
  description = "Optional GitHub repository (owner/repo) for automated OIDC deployment role"
  default     = ""
}
