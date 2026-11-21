variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment (production/staging/dev)"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS Customer Managed Key ARN for ECR image encryption"
  type        = string
}
