output "repository_url" {
  description = "The URL of the repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "repository_arn" {
  description = "The ARN of the repository"
  value       = aws_ecr_repository.backend.arn
}

output "repository_name" {
  description = "The name of the repository"
  value       = aws_ecr_repository.backend.name
}
