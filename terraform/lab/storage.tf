locals {
  acct             = data.aws_caller_identity.me.account_id
  bucket_records   = "${var.name}-records-${local.acct}"
  bucket_logs      = "${var.name}-logs-${local.acct}"
  bucket_artifacts = "${var.name}-artifacts-${local.acct}"
}

# The Learner Lab service-control policy denies s3:GetBucketObjectLockConfiguration, which the Terraform AWS
# provider calls right after creating any aws_s3_bucket. The (empty) buckets are therefore created through
# CloudFormation; every security setting below (KMS, versioning, public-access block, policy, CORS, lifecycle,
# logging, notifications) is still applied and managed by Terraform.
resource "aws_cloudformation_stack" "buckets" {
  name = "${var.name}-buckets"
  template_body = jsonencode({
    Resources = {
      Records   = { Type = "AWS::S3::Bucket", Properties = { BucketName = local.bucket_records } }
      Logs      = { Type = "AWS::S3::Bucket", Properties = { BucketName = local.bucket_logs } }
      Artifacts = { Type = "AWS::S3::Bucket", Properties = { BucketName = local.bucket_artifacts } }
    }
  })
}

# ---------- Medical-records vault ----------
resource "aws_s3_bucket_public_access_block" "records" {
  depends_on              = [aws_cloudformation_stack.buckets]
  bucket                  = local.bucket_records
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_versioning" "records" {
  depends_on = [aws_cloudformation_stack.buckets]
  bucket     = local.bucket_records
  versioning_configuration { status = "Enabled" }
}
resource "aws_s3_bucket_server_side_encryption_configuration" "records" {
  depends_on = [aws_cloudformation_stack.buckets]
  bucket     = local.bucket_records
  rule {
    bucket_key_enabled = true
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}
resource "aws_s3_bucket_lifecycle_configuration" "records" {
  depends_on = [aws_cloudformation_stack.buckets]
  bucket     = local.bucket_records
  rule {
    id     = "archive-and-expire-old-versions"
    status = "Enabled"
    filter {}
    transition {
      days          = 180
      storage_class = "GLACIER"
    }
    noncurrent_version_expiration { noncurrent_days = 90 }
    abort_incomplete_multipart_upload { days_after_initiation = 7 }
  }
}
# Browser uploads go straight to S3 with a presigned URL -> CORS for the site origin only.
resource "aws_s3_bucket_cors_configuration" "records" {
  depends_on = [aws_cloudformation_stack.buckets]
  bucket     = local.bucket_records
  cors_rule {
    allowed_methods = ["PUT", "GET"]
    allowed_origins = ["https://${local.site_host}"]
    allowed_headers = ["*"]
    max_age_seconds = 3000
  }
}
resource "aws_s3_bucket_logging" "records" {
  depends_on    = [aws_cloudformation_stack.buckets]
  bucket        = local.bucket_records
  target_bucket = local.bucket_logs
  target_prefix = "s3-access/records/"
}
data "aws_iam_policy_document" "records" {
  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = ["arn:aws:s3:::${local.bucket_records}", "arn:aws:s3:::${local.bucket_records}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}
resource "aws_s3_bucket_policy" "records" {
  bucket     = local.bucket_records
  policy     = data.aws_iam_policy_document.records.json
  depends_on = [aws_s3_bucket_public_access_block.records, aws_cloudformation_stack.buckets]
}

# ---------- Access-log + CloudTrail bucket ----------
resource "aws_s3_bucket_public_access_block" "logs" {
  depends_on              = [aws_cloudformation_stack.buckets]
  bucket                  = local.bucket_logs
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  depends_on = [aws_cloudformation_stack.buckets]
  bucket     = local.bucket_logs
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  depends_on = [aws_cloudformation_stack.buckets]
  bucket     = local.bucket_logs
  rule {
    id     = "expire-logs"
    status = "Enabled"
    filter {}
    expiration { days = 365 }
  }
}
data "aws_iam_policy_document" "logs" {
  statement {
    sid       = "S3ServerAccessLogs"
    actions   = ["s3:PutObject"]
    resources = ["arn:aws:s3:::${local.bucket_logs}/s3-access/*"]
    principals {
      type        = "Service"
      identifiers = ["logging.s3.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [local.acct]
    }
  }
  statement {
    sid       = "CloudTrailAclCheck"
    actions   = ["s3:GetBucketAcl"]
    resources = ["arn:aws:s3:::${local.bucket_logs}"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }
  statement {
    sid       = "CloudTrailWrite"
    actions   = ["s3:PutObject"]
    resources = ["arn:aws:s3:::${local.bucket_logs}/cloudtrail/AWSLogs/${local.acct}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = ["arn:aws:s3:::${local.bucket_logs}", "arn:aws:s3:::${local.bucket_logs}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}
resource "aws_s3_bucket_policy" "logs" {
  bucket     = local.bucket_logs
  policy     = data.aws_iam_policy_document.logs.json
  depends_on = [aws_s3_bucket_public_access_block.logs, aws_cloudformation_stack.buckets]
}

# ---------- Deployment bundle bucket (non-secret: compose file, Caddyfile, scripts) ----------
resource "aws_s3_bucket_public_access_block" "artifacts" {
  depends_on              = [aws_cloudformation_stack.buckets]
  bucket                  = local.bucket_artifacts
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  depends_on = [aws_cloudformation_stack.buckets]
  bucket     = local.bucket_artifacts
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}
locals {
  deploy_files = ["docker-compose.prod.yml", "Caddyfile", "deploy.sh", "poll-release.sh"]
}
resource "aws_s3_object" "deploy" {
  depends_on = [aws_cloudformation_stack.buckets]
  for_each   = toset(local.deploy_files)
  bucket     = local.bucket_artifacts
  key        = "deploy/${each.key}"
  source     = "${path.module}/../../deploy/${each.key}"
  etag       = filemd5("${path.module}/../../deploy/${each.key}")
}

# ---------- Document scanner trigger ----------
resource "aws_lambda_permission" "s3_scanner" {
  statement_id   = "AllowS3Invoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.scanner.function_name
  principal      = "s3.amazonaws.com"
  source_arn     = "arn:aws:s3:::${local.bucket_records}"
  source_account = local.acct
}
resource "aws_s3_bucket_notification" "records" {
  bucket = local.bucket_records
  lambda_function {
    lambda_function_arn = aws_lambda_function.scanner.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "patients/"
  }
  depends_on = [aws_lambda_permission.s3_scanner, aws_cloudformation_stack.buckets]
}
