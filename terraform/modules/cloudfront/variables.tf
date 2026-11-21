variable "project_name" {
  type    = string
  default = "careflow"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "alb_dns_name" {
  type = string
}
