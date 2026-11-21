resource "random_password" "auto_db_password" {
  count            = var.db_password == "" || var.db_password == null ? 1 : 0
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

locals {
  effective_db_password = var.db_password != "" && var.db_password != null ? var.db_password : random_password.auto_db_password[0].result
}

resource "aws_db_subnet_group" "careflow_db_subnet_group" {
  name        = "${var.project_name}-${var.environment}-db-subnet-group"
  description = "Private database subnets for PostgreSQL"
  subnet_ids  = var.private_db_subnet_ids

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-group"
  }
}

resource "aws_db_instance" "postgresql" {
  identifier            = "${var.project_name}-${var.environment}-postgres"
  engine                = "postgres"
  engine_version        = "16.1"
  instance_class        = "db.t4g.medium"
  allocated_storage     = 50
  max_allocated_storage = 200
  storage_type          = "gp3"

  db_name  = var.db_name
  username = var.db_username
  password = local.effective_db_password

  db_subnet_group_name   = aws_db_subnet_group.careflow_db_subnet_group.name
  vpc_security_group_ids = [var.rds_security_group_id]

  multi_az            = true
  publicly_accessible = false
  storage_encrypted   = true
  kms_key_id          = var.kms_key_arn

  backup_retention_period    = 30
  backup_window              = "03:00-04:00"
  maintenance_window         = "Sun:04:30-Sun:05:30"
  copy_tags_to_snapshot      = true
  deletion_protection        = false # Set true for enterprise live
  skip_final_snapshot        = true
  auto_minor_version_upgrade = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-postgres"
    Environment = var.environment
  }
}
