output "notifier_function_arn" {
  value = aws_lambda_function.appointment_notifier.arn
}

output "scanner_function_arn" {
  value = aws_lambda_function.document_scanner.arn
}
