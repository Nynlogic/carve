output "key_arn" {
  value = aws_kms_key.careflow_cmk.arn
}

output "key_id" {
  value = aws_kms_key.careflow_cmk.key_id
}
