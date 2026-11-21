variable "project_name" {
  type    = string
  default = "carevia"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "private_app_subnet_ids" {
  type = list(string)
}

variable "ecs_security_group_id" {
  type = string
}

variable "target_group_arn" {
  type = string
}

variable "ecs_execution_role_arn" {
  type = string
}

variable "ecs_task_role_arn" {
  type = string
}

variable "container_image" {
  description = "ECR image URI with tag"
  type        = string
}

variable "db_secret_arn" {
  description = "ARN of Secrets Manager secret containing database credentials and DATABASE_URL"
  type        = string
}

variable "jwt_secret_arn" {
  description = "ARN of Secrets Manager secret containing JWT secret key"
  type        = string
}

variable "s3_bucket_name" {
  type = string
}

variable "sqs_queue_url" {
  type = string
}

variable "sns_topic_arn" {
  type = string
}

variable "cognito_user_pool_id" {
  type = string
}

variable "cognito_client_id" {
  type = string
}
