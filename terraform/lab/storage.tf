locals {
  acct = data.aws_caller_identity.me.account_id
}

# ---------- Medical-records vault ----------
resource "aws_s3_bucket" "records" {
  bucket = "${var.name}-records-${local.acct}"
}
resource "aws_s3_bucket_public_access_block" "records" {
  bucket                  = aws_s3_bucket.records.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_versioning" "records" {
  bucket = aws_s3_bucket.records.id
  versioning_configuration { status = "Enabled" }
}
resource "aws_s3_bucket_server_side_encryption_configuration" "records" {
  bucket = aws_s3_bucket.records.id
  rule {
    bucket_key_enabled = true
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}
resource "aws_s3_bucket_lifecycle_configuration" "records" {
  bucket = aws_s3_bucket.records.id
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
  bucket = aws_s3_bucket.records.id
  cors_rule {
    allowed_methods = ["PUT", "GET"]
    allowed_origins = ["https://${local.site_host}"]
    allowed_headers = ["*"]
    max_age_seconds = 3000
  }
}
resource "aws_s3_bucket_logging" "records" {
  bucket        = aws_s3_bucket.records.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-access/records/"
}
data "aws_iam_policy_document" "records" {
  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.records.arn, "${aws_s3_bucket.records.arn}/*"]
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
  bucket     = aws_s3_bucket.records.id
  policy     = data.aws_iam_policy_document.records.json
  depends_on = [aws_s3_bucket_public_access_block.records]
}

# ---------- Access-log + CloudTrail bucket ----------
resource "aws_s3_bucket" "logs" {
  bucket = "${var.name}-logs-${local.acct}"
}
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
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
    resources = ["${aws_s3_bucket.logs.arn}/s3-access/*"]
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
    resources = [aws_s3_bucket.logs.arn]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }
  statement {
    sid       = "CloudTrailWrite"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.logs.arn}/cloudtrail/AWSLogs/${local.acct}/*"]
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
    resources = [aws_s3_bucket.logs.arn, "${aws_s3_bucket.logs.arn}/*"]
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
  bucket     = aws_s3_bucket.logs.id
  policy     = data.aws_iam_policy_document.logs.json
  depends_on = [aws_s3_bucket_public_access_block.logs]
}

# ---------- Deployment bundle bucket (non-secret: compose file, Caddyfile, scripts) ----------
resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.name}-artifacts-${local.acct}"
}
resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket                  = aws_s3_bucket.artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}
locals {
  deploy_files = ["docker-compose.prod.yml", "Caddyfile", "deploy.sh", "poll-release.sh"]
}
resource "aws_s3_object" "deploy" {
  for_each = toset(local.deploy_files)
  bucket   = aws_s3_bucket.artifacts.id
  key      = "deploy/${each.key}"
  source   = "${path.module}/../../deploy/${each.key}"
  etag     = filemd5("${path.module}/../../deploy/${each.key}")
}

# ---------- Document scanner trigger ----------
resource "aws_lambda_permission" "s3_scanner" {
  statement_id   = "AllowS3Invoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.scanner.function_name
  principal      = "s3.amazonaws.com"
  source_arn     = aws_s3_bucket.records.arn
  source_account = local.acct
}
resource "aws_s3_bucket_notification" "records" {
  bucket = aws_s3_bucket.records.id
  lambda_function {
    lambda_function_arn = aws_lambda_function.scanner.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "patients/"
  }
  depends_on = [aws_lambda_permission.s3_scanner]
}
