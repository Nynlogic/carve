data "aws_caller_identity" "current" {}

resource "random_id" "trail_suffix" {
  byte_length = 4
}

# Dedicated S3 Bucket for CloudTrail Audit Trails
resource "aws_s3_bucket" "cloudtrail_bucket" {
  bucket        = "${var.project_name}-${var.environment}-cloudtrail-${random_id.trail_suffix.hex}"
  force_destroy = false

  tags = {
    Name        = "${var.project_name}-cloudtrail-logs"
    Environment = var.environment
    Compliance  = "HIPAA-Audit"
  }
}

resource "aws_s3_bucket_public_access_block" "trail_block_public" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_bucket.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_bucket.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_cloudtrail" "main_trail" {
  name                          = "${var.project_name}-${var.environment}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_bucket.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = var.kms_key_arn

  depends_on = [aws_s3_bucket_policy.cloudtrail_bucket_policy]

  tags = {
    Environment = var.environment
  }
}
