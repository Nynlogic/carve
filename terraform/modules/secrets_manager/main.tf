resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

# 1. Database Credentials Secret
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}/${var.environment}/database-credentials"
  description             = "Managed PostgreSQL connection credentials for Carevia Core API"
  kms_key_id              = var.kms_key_arn
  recovery_window_in_days = 0 # Instant removal on teardown

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Compliance  = "HIPAA-Secrets"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    engine       = "postgres"
    host         = var.db_host
    port         = 5432
    username     = var.db_username
    password     = random_password.db_password.result
    dbname       = var.db_name
    database_url = "postgresql://${var.db_username}:${urlencode(random_password.db_password.result)}@${var.db_endpoint}/${var.db_name}"
  })
}

# 2. Application JWT Secret Key
resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${var.project_name}/${var.environment}/jwt-secret"
  description             = "HMAC-SHA256 signing secret for Carevia JWT session tokens"
  kms_key_id              = var.kms_key_arn
  recovery_window_in_days = 0

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    secret_key = random_password.jwt_secret.result
  })
}
