data "aws_iam_policy_document" "kms" {
  statement {
    sid       = "AccountRoot"
    actions   = ["kms:*"]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.me.account_id}:root"]
    }
  }
  statement {
    sid       = "CloudWatchAndCloudTrailUse"
    actions   = ["kms:Decrypt", "kms:GenerateDataKey*"]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com", "cloudtrail.amazonaws.com", "sns.amazonaws.com"]
    }
  }
}

resource "aws_kms_key" "main" {
  description             = "${var.name} CMK: RDS, S3 records vault, Secrets Manager, EBS, SNS"
  enable_key_rotation     = true
  deletion_window_in_days = 7
  policy                  = data.aws_iam_policy_document.kms.json
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.name}"
  target_key_id = aws_kms_key.main.key_id
}
