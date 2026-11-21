variable "project_name" {
  type    = string
  default = "carevia"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "alb_arn_suffix" {
  type = string
}

variable "ecs_cluster_name" {
  type = string
}

variable "ecs_service_name" {
  type = string
}

variable "sns_topic_arn" {
  type = string
}

variable "rds_instance_id" {
  description = "RDS DB Instance Identifier for CPU/Storage alarms"
  type        = string
  default     = ""
}

variable "lambda_function_name" {
  description = "Lambda Function Name for error rate alarms"
  type        = string
  default     = ""
}

variable "sqs_queue_name" {
  description = "SQS Queue Name for message backlog monitoring"
  type        = string
  default     = ""
}
