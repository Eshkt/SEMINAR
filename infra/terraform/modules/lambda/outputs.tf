output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.main.arn
}

output "function_url" {
  description = "Lambda function URL"
  value       = aws_lambda_function_url.main.function_url
}
