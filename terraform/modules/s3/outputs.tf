output "bucket_name" {
  value = aws_s3_bucket.medical_records.id
}

output "bucket_arn" {
  value = aws_s3_bucket.medical_records.arn
}
