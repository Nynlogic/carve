output "alb_dns_name" {
  value = aws_lb.api_alb.dns_name
}

output "alb_arn" {
  value = aws_lb.api_alb.arn
}

output "target_group_arn" {
  value = aws_lb_target_group.api_tg.arn
}

output "alb_zone_id" {
  value = aws_lb.api_alb.zone_id
}
