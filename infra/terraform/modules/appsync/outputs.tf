output "graphql_url" {
  description = "AppSync GraphQL API URL"
  value       = aws_appsync_graphql_api.main.uris["GRAPHQL"]
}

output "api_id" {
  description = "AppSync API ID"
  value       = aws_appsync_graphql_api.main.id
}

output "api_arn" {
  description = "AppSync API ARN"
  value       = aws_appsync_graphql_api.main.arn
}

output "api_key" {
  description = "AppSync API key"
  value       = aws_appsync_api_key.main.key
  sensitive   = true
}
