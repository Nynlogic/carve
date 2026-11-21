variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "careflow"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "db_password" {
  type        = string
  description = "Master password for PostgreSQL RDS instance"
  sensitive   = true
}

variable "container_image" {
  type    = string
  default = "public.ecr.aws/careflow/backend:latest"
}
