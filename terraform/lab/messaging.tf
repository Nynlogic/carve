# ---------- SQS (+DLQ) / SNS / Lambda ----------
data "aws_iam_role" "lab" {
  name = "LabRole" # Learner Lab: custom IAM roles cannot be created, so the lab role is reused (documented gap)
}

resource "aws_sqs_queue" "dlq" {
  name                      = "${var.name}-notifications-dlq"
  sqs_managed_sse_enabled   = true
  message_retention_seconds = 1209600
}
resource "aws_sqs_queue" "notifications" {
  name                       = "${var.name}-notifications"
  sqs_managed_sse_enabled    = true
  visibility_timeout_seconds = 60
  redrive_policy             = jsonencode({ deadLetterTargetArn = aws_sqs_queue.dlq.arn, maxReceiveCount = 3 })
}

resource "aws_sns_topic" "alerts" {
  name              = "${var.name}-alerts"
  kms_master_key_id = aws_kms_key.main.arn
}
resource "aws_sns_topic_subscription" "email" {
  count     = var.alert_email == "" ? 0 : 1
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

data "archive_file" "notifier" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/appointment_notifier"
  output_path = "${path.module}/.build/notifier.zip"
}
data "archive_file" "scanner" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/document_scanner"
  output_path = "${path.module}/.build/scanner.zip"
}

resource "aws_cloudwatch_log_group" "lambda" {
  for_each          = toset(["appointment-notifier", "document-scanner"])
  name              = "/aws/lambda/${var.name}-${each.key}"
  retention_in_days = 30
}

resource "aws_lambda_function" "notifier" {
  function_name    = "${var.name}-appointment-notifier"
  role             = data.aws_iam_role.lab.arn
  runtime          = "python3.12"
  handler          = "index.lambda_handler"
  filename         = data.archive_file.notifier.output_path
  source_code_hash = data.archive_file.notifier.output_base64sha256
  timeout          = 30
  memory_size      = 128
  architectures    = ["arm64"]
  environment { variables = { SNS_TOPIC_ARN = aws_sns_topic.alerts.arn } }
  depends_on = [aws_cloudwatch_log_group.lambda]
}
resource "aws_lambda_event_source_mapping" "notifier" {
  event_source_arn        = aws_sqs_queue.notifications.arn
  function_name           = aws_lambda_function.notifier.arn
  batch_size              = 5
  function_response_types = ["ReportBatchItemFailures"]
}

resource "aws_lambda_function" "scanner" {
  function_name    = "${var.name}-document-scanner"
  role             = data.aws_iam_role.lab.arn
  runtime          = "python3.12"
  handler          = "index.lambda_handler"
  filename         = data.archive_file.scanner.output_path
  source_code_hash = data.archive_file.scanner.output_base64sha256
  timeout          = 60
  memory_size      = 256
  architectures    = ["arm64"]
  depends_on       = [aws_cloudwatch_log_group.lambda]
}
