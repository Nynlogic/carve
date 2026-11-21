variable "project_name" {
  type    = string
  default = "carevia"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "s3_bucket_arn" {
  type = string
}

variable "kms_key_arn" {
  type = string
}

variable "sqs_queue_arn" {
  type = string
}

variable "sns_topic_arn" {
  type = string
}

variable "db_secret_arn" {
  description = "ARN of database credentials secret"
  type        = string
  default     = "*"
}

variable "jwt_secret_arn" {
  description = "ARN of JWT credentials secret"
  type        = string
  default     = "*"
}

variable "github_repository" {
  description = "GitHub repository (owner/repo) for OIDC federation"
  type        = string
  default     = ""
}
