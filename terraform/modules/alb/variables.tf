variable "project_name" {
  type    = string
  default = "carevia"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "alb_security_group_id" {
  type = string
}

variable "certificate_arn" {
  description = "Optional ACM certificate ARN for port 443 HTTPS termination"
  type        = string
  default     = ""
}
