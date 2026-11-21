output "ecr_repository_url" {
  description = "Amazon ECR Repository URL for building & pushing Docker images"
  value       = module.ecr.repository_url
}

output "cloudfront_domain" {
  description = "Global CloudFront distribution URL"
  value       = module.cloudfront.cloudfront_domain_name
}

output "alb_dns_name" {
  description = "Application Load Balancer entrypoint"
  value       = module.alb.alb_dns_name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = module.cognito.client_id
}

output "s3_medical_records_bucket" {
  description = "Encrypted S3 bucket for medical records"
  value       = module.s3.bucket_name
}

output "rds_endpoint" {
  description = "PostgreSQL database endpoint"
  value       = module.rds.endpoint
}

output "db_secret_arn" {
  description = "Secrets Manager ARN holding master database credentials"
  value       = module.secrets_manager.db_secret_arn
}

output "sqs_queue_url" {
  description = "SQS Appointment Notifications Queue URL"
  value       = module.sqs_sns.queue_url
}

output "cloudwatch_dashboard" {
  description = "CloudWatch Monitoring Dashboard"
  value       = module.cloudwatch.dashboard_name
}
