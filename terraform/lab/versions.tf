terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws     = { source = "hashicorp/aws", version = "~> 5.40" }
    random  = { source = "hashicorp/random", version = "~> 3.6" }
    archive = { source = "hashicorp/archive", version = "~> 2.4" }
  }
}

# Credentials come ONLY from the shell environment (AWS_ACCESS_KEY_ID / SECRET / SESSION_TOKEN).
provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project     = "carevia"
      Environment = "lab"
      Owner       = var.owner
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "me" {}
data "aws_availability_zones" "az" { state = "available" }
