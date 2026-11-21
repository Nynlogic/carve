output "trail_arn" {
  value = aws_cloudtrail.main_trail.arn
}

output "trail_bucket" {
  value = aws_s3_bucket.cloudtrail_bucket.id
}
