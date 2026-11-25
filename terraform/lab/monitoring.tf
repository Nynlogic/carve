# ---------- CloudWatch: logs, alarms, dashboard; CloudTrail ----------
resource "aws_cloudwatch_log_group" "app" {
  name              = "/${var.name}/app"
  retention_in_days = 30
}

# Unhandled application errors (HTTP 500) -> metric -> alarm
resource "aws_cloudwatch_log_metric_filter" "errors" {
  name           = "${var.name}-app-errors"
  log_group_name = aws_cloudwatch_log_group.app.name
  pattern        = "\"Unhandled error\""
  metric_transformation {
    name      = "AppUnhandledErrors"
    namespace = "CAREvia"
    value     = "1"
  }
}

locals {
  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "app_errors" {
  alarm_name          = "${var.name}-app-5xx-errors"
  namespace           = "CAREvia"
  metric_name         = "AppUnhandledErrors"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 5
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
}
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.name}-rds-cpu-high"
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"
  dimensions          = { DBInstanceIdentifier = aws_db_instance.main.identifier }
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = local.alarm_actions
}
resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "${var.name}-rds-free-storage-low"
  namespace           = "AWS/RDS"
  metric_name         = "FreeStorageSpace"
  dimensions          = { DBInstanceIdentifier = aws_db_instance.main.identifier }
  statistic           = "Minimum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 2147483648
  comparison_operator = "LessThanThreshold"
  alarm_actions       = local.alarm_actions
}
resource "aws_cloudwatch_metric_alarm" "rds_conn" {
  alarm_name          = "${var.name}-rds-connections-high"
  namespace           = "AWS/RDS"
  metric_name         = "DatabaseConnections"
  dimensions          = { DBInstanceIdentifier = aws_db_instance.main.identifier }
  statistic           = "Maximum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 60
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = local.alarm_actions
}
resource "aws_cloudwatch_metric_alarm" "dlq" {
  alarm_name          = "${var.name}-dlq-not-empty"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  dimensions          = { QueueName = aws_sqs_queue.dlq.name }
  statistic           = "Maximum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
}
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.name}-lambda-errors"
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.notifier.function_name }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
}
resource "aws_cloudwatch_metric_alarm" "ec2_status" {
  count               = var.enable_instance ? 1 : 0
  alarm_name          = "${var.name}-ec2-status-check-failed"
  namespace           = "AWS/EC2"
  metric_name         = "StatusCheckFailed"
  dimensions          = { InstanceId = aws_instance.web[0].id }
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 2
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = local.alarm_actions
}
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  count               = var.enable_instance ? 1 : 0
  alarm_name          = "${var.name}-ec2-cpu-high"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  dimensions          = { InstanceId = aws_instance.web[0].id }
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = local.alarm_actions
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name}-overview"
  dashboard_body = jsonencode({ widgets = [
    { type = "metric", x = 0, y = 0, width = 12, height = 6, properties = { title = "RDS CPU %", region = var.region, stat = "Average", period = 300,
    metrics = [["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.identifier]] } },
    { type = "metric", x = 12, y = 0, width = 12, height = 6, properties = { title = "RDS connections", region = var.region, stat = "Maximum", period = 300,
    metrics = [["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.main.identifier]] } },
    { type = "metric", x = 0, y = 6, width = 12, height = 6, properties = { title = "Notification queue / DLQ depth", region = var.region, stat = "Maximum", period = 300,
      metrics = [["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.notifications.name],
    ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.dlq.name]] } },
    { type = "metric", x = 12, y = 6, width = 12, height = 6, properties = { title = "Lambda invocations / errors", region = var.region, stat = "Sum", period = 300,
      metrics = [["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.notifier.function_name],
    ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.notifier.function_name]] } },
    { type = "log", x = 0, y = 12, width = 24, height = 6, properties = { title = "Application logs (latest)", region = var.region, view = "table",
    query = "SOURCE '${aws_cloudwatch_log_group.app.name}' | fields @timestamp, @message | sort @timestamp desc | limit 20" } }
  ] })
}

resource "aws_cloudtrail" "main" {
  name                          = "${var.name}-trail"
  s3_bucket_name                = aws_s3_bucket.logs.id
  s3_key_prefix                 = "cloudtrail"
  is_multi_region_trail         = true
  include_global_service_events = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.main.arn
  depends_on                    = [aws_s3_bucket_policy.logs]
}
