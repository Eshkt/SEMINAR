output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.endpoint
}

output "lambda_url" {
  description = "Lambda function URL"
  value       = module.lambda.function_url
}

output "appsync_url" {
  description = "AppSync GraphQL API URL"
  value       = module.appsync.graphql_url
}

output "appsync_api_key" {
  description = "AppSync API key"
  value       = module.appsync.api_key
  sensitive   = true
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.cognito.client_id
}
