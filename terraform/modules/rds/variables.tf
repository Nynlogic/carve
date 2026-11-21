variable "project_name" {
  type    = string
  default = "careflow"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "private_db_subnet_ids" {
  type = list(string)
}

variable "rds_security_group_id" {
  type = string
}

variable "kms_key_arn" {
  type = string
}

variable "db_name" {
  type    = string
  default = "careflow"
}

variable "db_username" {
  type    = string
  default = "careflow_admin"
}

variable "db_password" {
  type      = string
  sensitive = true
}
