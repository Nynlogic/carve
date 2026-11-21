variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS Key ARN for secret envelope encryption"
  type        = string
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
}

variable "db_endpoint" {
  description = "RDS DB Endpoint (host:port)"
  type        = string
}

variable "db_host" {
  description = "RDS DB Host Address"
  type        = string
}
