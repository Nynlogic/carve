variable "region" {
  type    = string
  default = "us-east-1"
}
variable "owner" {
  type    = string
  default = "student-team"
}
variable "name" {
  type    = string
  default = "carevia"
}
variable "alert_email" {
  description = "E-mail that receives CloudWatch alarm notifications (SNS). Empty = topic without subscriber."
  type        = string
  default     = ""
}
variable "backend_image" {
  description = "Full image reference for the backend (ECR or GHCR)"
  type        = string
  default     = ""
}
variable "frontend_image" {
  type    = string
  default = ""
}
variable "release_registry" {
  description = "If set (e.g. ghcr.io/nynlogic) the server polls <registry>/carve-{backend,frontend}:release (pull-based CD)"
  type        = string
  default     = ""
}
variable "instance_type" {
  type    = string
  default = "t4g.small"
}
variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}
variable "deletion_protection" {
  description = "RDS deletion protection (set false before an intentional teardown)"
  type        = bool
  default     = true
}
variable "enable_instance" {
  description = "Create the EC2 host (needs images pushed to ECR first)"
  type        = bool
  default     = false
}
