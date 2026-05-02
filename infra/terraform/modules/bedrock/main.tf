# Bedrock module - config/IAM helper only
# No resources to create (Bedrock is API-based)

variable "model_id" {
  type        = string
  description = "Bedrock model ID"
  default     = "anthropic.claude-3-5-sonnet-20240620-v1:0"
}

data "aws_iam_policy_document" "bedrock" {
  statement {
    effect = "Allow"
    actions = [
      "bedrock:InvokeModel"
    ]
    resources = [
      "arn:aws:bedrock:*:*:foundation-model/${var.model_id}"
    ]
  }
}
