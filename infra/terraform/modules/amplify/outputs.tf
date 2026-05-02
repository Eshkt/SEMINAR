output "app_id" {
  description = "Amplify App ID"
  value       = aws_amplify_app.main.id
}

output "default_domain" {
  description = "Amplify Default Domain"
  value       = aws_amplify_app.main.default_domain
}

output "branch_url" {
  description = "URL of the deployed branch"
  value       = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.main.default_domain}"
}
