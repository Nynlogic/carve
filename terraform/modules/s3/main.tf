resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "medical_records" {
  bucket = "${var.project_name}-${var.environment}-records-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.project_name}-medical-records"
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

# Strict Block Public Access on all 4 settings
resource "aws_s3_bucket_public_access_block" "records_block_public" {
  bucket = aws_s3_bucket.medical_records.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-Side Encryption with KMS Customer Managed Key
resource "aws_s3_bucket_server_side_encryption_configuration" "records_encryption" {
  bucket = aws_s3_bucket.medical_records.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Versioning for audit protection & accidental deletion recovery
resource "aws_s3_bucket_versioning" "records_versioning" {
  bucket = aws_s3_bucket.medical_records.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enforce TLS 1.2+ in transit
resource "aws_s3_bucket_policy" "enforce_tls" {
  bucket = aws_s3_bucket.medical_records.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyUnencryptedTraffic"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.medical_records.arn,
          "${aws_s3_bucket.medical_records.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# Lifecycle rule: Transition older clinical records to Glacier Flexible Retrieval after 365 days
resource "aws_s3_bucket_lifecycle_configuration" "records_retention" {
  bucket = aws_s3_bucket.medical_records.id

  rule {
    id     = "hipaa-longterm-archive"
    status = "Enabled"

    filter {}

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }
  }
}
