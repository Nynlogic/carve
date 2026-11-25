# ---------- Application host: one Graviton EC2 (Docker: Caddy + frontend + backend) ----------
resource "aws_eip" "web" {
  domain = "vpc"
  tags   = { Name = "${var.name}-web-eip" }
}

locals {
  # nip.io resolves <a-b-c-d>.nip.io to a.b.c.d -> lets Caddy obtain a real Let's Encrypt certificate without owning a domain
  site_host = "${replace(aws_eip.web.public_ip, ".", "-")}.nip.io"
}

data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64"
}

resource "aws_instance" "web" {
  count                       = var.enable_instance ? 1 : 0
  ami                         = data.aws_ssm_parameter.al2023.value
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.web.id]
  iam_instance_profile        = "LabInstanceProfile"
  associate_public_ip_address = true
  monitoring                  = false
  metadata_options {
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 2          # allow containers to reach the instance role
  }
  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
    kms_key_id  = aws_kms_key.main.arn
  }
  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    region           = var.region
    artifacts_bucket = aws_s3_bucket.artifacts.id
    site_host        = local.site_host
    backend_image    = var.backend_image
    frontend_image   = var.frontend_image
    db_secret        = aws_secretsmanager_secret.db.name
    jwt_secret       = aws_secretsmanager_secret.jwt.name
    seed_secret      = aws_secretsmanager_secret.seed.name
    records_bucket   = aws_s3_bucket.records.id
    sqs_url          = aws_sqs_queue.notifications.url
    sns_arn          = aws_sns_topic.alerts.arn
    log_group        = aws_cloudwatch_log_group.app.name
    release_registry = var.release_registry
  })
  user_data_replace_on_change = false
  tags                        = { Name = "${var.name}-web" }
  depends_on = [
    aws_s3_object.deploy, aws_secretsmanager_secret_version.db, aws_secretsmanager_secret_version.jwt,
    aws_secretsmanager_secret_version.seed, aws_ecr_repository.repo
  ]
  lifecycle { ignore_changes = [ami, user_data] }
}

resource "aws_eip_association" "web" {
  count         = var.enable_instance ? 1 : 0
  instance_id   = aws_instance.web[0].id
  allocation_id = aws_eip.web.id
}
