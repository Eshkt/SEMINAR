output "model_id" {
  description = "Bedrock model ID"
  value       = var.model_id
}

output "iam_policy_document" {
  description = "IAM policy document for Bedrock access"
  value       = data.aws_iam_policy_document.bedrock.json
}
