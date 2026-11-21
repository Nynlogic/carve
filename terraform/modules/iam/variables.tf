variable "project_name" {
  type    = string
  default = "careflow"
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
