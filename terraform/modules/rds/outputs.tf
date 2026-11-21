output "endpoint" {
  value = aws_db_instance.postgresql.endpoint
}

output "address" {
  value = aws_db_instance.postgresql.address
}

output "port" {
  value = aws_db_instance.postgresql.port
}

output "db_name" {
  value = aws_db_instance.postgresql.db_name
}
