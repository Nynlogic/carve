# SQS Dead-Letter Queue
resource "aws_sqs_queue" "appointments_dlq" {
  name                      = "${var.project_name}-${var.environment}-appointments-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = var.kms_key_arn

  tags = {
    Environment = var.environment
  }
}

# Primary SQS Queue for Asynchronous Appointment Notifications
resource "aws_sqs_queue" "appointments_queue" {
  name                      = "${var.project_name}-${var.environment}-appointments-queue"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 345600 # 4 days
  visibility_timeout_seconds = 60
  kms_master_key_id         = var.kms_key_arn

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.appointments_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Environment = var.environment
  }
}

# SNS Topic for Critical Clinical Alerts and SMS/Email Delivery
resource "aws_sns_topic" "alerts" {
  name              = "${var.project_name}-${var.environment}-alerts-topic"
  kms_master_key_id = var.kms_key_arn

  tags = {
    Environment = var.environment
  }
}
