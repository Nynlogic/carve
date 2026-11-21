output "web_acl_arn" {
  value = aws_wafv2_web_acl.careflow_waf.arn
}

output "web_acl_id" {
  value = aws_wafv2_web_acl.careflow_waf.id
}
