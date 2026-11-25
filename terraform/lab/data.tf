# ---------- RDS PostgreSQL (private, encrypted, TLS enforced) ----------
resource "random_password" "db" {
  length  = 32
  special = false
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.name}-db-subnets"
  subnet_ids = aws_subnet.db[*].id
}

resource "aws_db_parameter_group" "pg" {
  name   = "${var.name}-pg16"
  family = "postgres16"
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
  parameter {
    name         = "log_min_duration_statement"
    value        = "1000"
    apply_method = "immediate"
  }
}

resource "aws_db_instance" "main" {
  identifier                      = "${var.name}-db"
  engine                          = "postgres"
  engine_version                  = "16"
  instance_class                  = var.db_instance_class
  allocated_storage               = 20
  max_allocated_storage           = 50
  storage_type                    = "gp3"
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.main.arn
  db_name                         = "careflow"
  username                        = "careflow_admin"
  password                        = random_password.db.result
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.db.id]
  parameter_group_name            = aws_db_parameter_group.pg.name
  publicly_accessible             = false
  multi_az                        = false # Multi-AZ is "designed only" (doubles RDS cost)
  backup_retention_period         = 7
  backup_window                   = "21:00-22:00"
  maintenance_window              = "sun:22:30-sun:23:30"
  copy_tags_to_snapshot           = true
  deletion_protection             = var.deletion_protection
  skip_final_snapshot             = false
  final_snapshot_identifier       = "${var.name}-db-final"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  auto_minor_version_upgrade      = true
  apply_immediately               = true
}

# ---------- Secrets Manager (KMS-encrypted). The app reads these at start-up; nothing is in Git/env files ----------
resource "random_password" "jwt" {
  length  = 64
  special = false
}
resource "random_password" "seed_admin" {
  length  = 20
  special = false
}
resource "random_password" "seed_doctor" {
  length  = 20
  special = false
}
resource "random_password" "seed_patient" {
  length  = 20
  special = false
}

resource "aws_secretsmanager_secret" "db" {
  name       = "${var.name}/db"
  kms_key_id = aws_kms_key.main.arn
}
resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = aws_db_instance.main.username
    password = random_password.db.result
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
}
resource "aws_secretsmanager_secret" "jwt" {
  name       = "${var.name}/jwt"
  kms_key_id = aws_kms_key.main.arn
}
resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id     = aws_secretsmanager_secret.jwt.id
  secret_string = jsonencode({ secret_key = random_password.jwt.result })
}
resource "aws_secretsmanager_secret" "seed" {
  name       = "${var.name}/demo-users"
  kms_key_id = aws_kms_key.main.arn
}
resource "aws_secretsmanager_secret_version" "seed" {
  secret_id = aws_secretsmanager_secret.seed.id
  secret_string = jsonencode({
    SEED_ADMIN_PASSWORD   = random_password.seed_admin.result
    SEED_DOCTOR_PASSWORD  = random_password.seed_doctor.result
    SEED_PATIENT_PASSWORD = random_password.seed_patient.result
  })
}
# Non-secret configuration in Parameter Store
resource "aws_ssm_parameter" "site_url" {
  name  = "/${var.name}/site_url"
  type  = "String"
  value = "https://${local.site_host}"
}

# ---------- ECR (private registry, scan on push, immutable tags, KMS) ----------
resource "aws_ecr_repository" "repo" {
  for_each             = toset(["backend", "frontend"])
  name                 = "${var.name}-${each.key}"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.main.arn
  }
}
resource "aws_ecr_lifecycle_policy" "repo" {
  for_each   = aws_ecr_repository.repo
  repository = each.value.name
  policy = jsonencode({ rules = [{
    rulePriority = 1, description = "keep last 10 images",
    selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 },
    action       = { type = "expire" }
  }] })
}

# ---------- Cognito (identity provider, groups, optional TOTP MFA) ----------
resource "aws_cognito_user_pool" "main" {
  name                     = "${var.name}-users"
  mfa_configuration        = "OPTIONAL"
  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]
  password_policy {
    minimum_length    = 10
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }
  software_token_mfa_configuration { enabled = true }
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}
resource "aws_cognito_user_pool_client" "web" {
  name                = "${var.name}-web"
  user_pool_id        = aws_cognito_user_pool.main.id
  generate_secret     = false
  explicit_auth_flows = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
}
resource "aws_cognito_user_group" "groups" {
  for_each     = toset(["patients", "doctors", "admins"])
  name         = each.key
  user_pool_id = aws_cognito_user_pool.main.id
}
