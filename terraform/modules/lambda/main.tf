# Zip deployment packages
data "archive_file" "notifier_zip" {
  type        = "zip"
  source_file = "${path.module}/../../../lambda/appointment_notifier/index.py"
  output_path = "${path.module}/notifier_payload.zip"
}

data "archive_file" "scanner_zip" {
  type        = "zip"
  source_file = "${path.module}/../../../lambda/document_scanner/index.py"
  output_path = "${path.module}/scanner_payload.zip"
}

# 1. Appointment Notifier Lambda
resource "aws_lambda_function" "appointment_notifier" {
  function_name    = "${var.project_name}-${var.environment}-appointment-notifier"
  filename         = data.archive_file.notifier_zip.output_path
  source_code_hash = data.archive_file.notifier_zip.output_base64sha256
  role             = var.lambda_role_arn
  handler          = "index.lambda_handler"
  runtime          = "python3.11"
  timeout          = 30

  environment {
    variables = {
      SNS_TOPIC_ARN = var.sns_topic_arn
      ENVIRONMENT   = var.environment
    }
  }

  tags = {
    Environment = var.environment
  }
}

# SQS Event Source Mapping
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = var.sqs_queue_arn
  function_name    = aws_lambda_function.appointment_notifier.arn
  batch_size       = 10
  enabled          = true
}

# 2. Document Scanner Lambda
resource "aws_lambda_function" "document_scanner" {
  function_name    = "${var.project_name}-${var.environment}-document-scanner"
  filename         = data.archive_file.scanner_zip.output_path
  source_code_hash = data.archive_file.scanner_zip.output_base64sha256
  role             = var.lambda_role_arn
  handler          = "index.lambda_handler"
  runtime          = "python3.11"
  timeout          = 60
  memory_size      = 256

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.document_scanner.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = var.s3_bucket_arn
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = var.s3_bucket_id

  lambda_function {
    lambda_function_arn = aws_lambda_function.document_scanner.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_s3]
}
