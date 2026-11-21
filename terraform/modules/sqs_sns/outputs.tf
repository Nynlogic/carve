output "queue_url" {
  value = aws_sqs_queue.appointments_queue.id
}

output "queue_name" {
  value = aws_sqs_queue.appointments_queue.name
}

output "queue_arn" {
  value = aws_sqs_queue.appointments_queue.arn
}

output "dlq_arn" {
  value = aws_sqs_queue.appointments_dlq.arn
}

output "topic_arn" {
  value = aws_sns_topic.alerts.arn
}
