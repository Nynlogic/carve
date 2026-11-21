variable "project_name" {
  type    = string
  default = "careflow"
}

variable "environment" {
  type    = string
  default = "production"
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
  type    = string
  default = "public.ecr.aws/careflow/backend:latest"
}

variable "database_url" {
  type      = string
  sensitive = true
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
