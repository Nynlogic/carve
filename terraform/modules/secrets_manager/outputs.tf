output "db_secret_arn" {
  description = "ARN of the Secrets Manager DB credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "jwt_secret_arn" {
  description = "ARN of the Secrets Manager JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

output "db_password" {
  description = "Generated database password"
  value       = random_password.db_password.result
  sensitive   = true
}
