variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "admin_email" {
  type = string
}

variable "callback_urls" {
  type    = list(string)
  default = ["http://localhost:5173"]
}

locals {
  name = "${var.app_name}-${var.environment}"
}

resource "aws_cognito_user_pool" "main" {
  name = "${local.name}-pool"

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${local.name}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  allowed_oauth_flows_user_pool_client = true

  callback_urls = var.callback_urls

  supported_identity_providers = ["COGNITO"]
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = replace(replace("${local.name}-${var.admin_email}", "@", "-"), ".", "-")
  user_pool_id = aws_cognito_user_pool.main.id
}
