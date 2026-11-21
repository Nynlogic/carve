resource "aws_cognito_user_pool" "pool" {
  name = "${var.project_name}-${var.environment}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  schema {
    name                = "role"
    attribute_data_type = "String"
    mutable             = true
    required            = false

    string_attribute_constraints {
      min_length = "1"
      max_length = "20"
    }
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "${var.project_name}-web-client"
  user_pool_id = aws_cognito_user_pool.pool.id

  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  prevent_user_existence_errors = "ENABLED"
}

# Role-Based Authorization Groups
resource "aws_cognito_user_group" "patients" {
  name         = "Patients"
  user_pool_id = aws_cognito_user_pool.pool.id
  description  = "Standard patient group with self-service access"
  precedence   = 30
}

resource "aws_cognito_user_group" "doctors" {
  name         = "Doctors"
  user_pool_id = aws_cognito_user_pool.pool.id
  description  = "Verified clinician and provider group"
  precedence   = 20
}

resource "aws_cognito_user_group" "admins" {
  name         = "Admins"
  user_pool_id = aws_cognito_user_pool.pool.id
  description  = "Clinic administrative staff with full audit oversight"
  precedence   = 10
}
