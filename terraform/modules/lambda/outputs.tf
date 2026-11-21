output "notifier_function_arn" {
  value = aws_lambda_function.appointment_notifier.arn
}

output "notifier_function_name" {
  value = aws_lambda_function.appointment_notifier.function_name
}

output "scanner_function_arn" {
  value = aws_lambda_function.document_scanner.arn
}

output "scanner_function_name" {
  value = aws_lambda_function.document_scanner.function_name
}
