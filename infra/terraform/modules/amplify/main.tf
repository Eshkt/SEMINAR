variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "repository" {
  type = string
}

variable "access_token" {
  type      = string
  sensitive = true
}

variable "branch_name" {
  type    = string
  default = "feature/deployment"
}

variable "vite_api_url" {
  type = string
}

variable "vite_appsync_url" {
  type = string
}

variable "vite_cognito_user_pool_id" {
  type = string
}

variable "vite_cognito_client_id" {
  type = string
}

variable "vite_admin_pass" {
  type      = string
  sensitive = true
}

variable "vite_api_stage" {
  type    = string
  default = "prod"
}

resource "aws_amplify_app" "main" {
  name         = var.app_name
  repository   = var.repository
  access_token = var.access_token

  # Build settings for Vite app in 'frontend' subdirectory
  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - cd frontend
            - npm ci
        build:
          commands:
            - cd frontend
            - npm run build
      artifacts:
        baseDirectory: frontend/dist
        files:
          - '**/*'
      cache:
        paths:
          - frontend/node_modules/**/*
  EOT

  environment_variables = {
    VITE_API_URL              = var.vite_api_url
    VITE_APPSYNC_URL          = var.vite_appsync_url
    VITE_COGNITO_USER_POOL_ID = var.vite_cognito_user_pool_id
    VITE_COGNITO_CLIENT_ID    = var.vite_cognito_client_id
    VITE_ADMIN_PASS           = var.vite_admin_pass
  }

  # For Single Page App (SPA) routing
  custom_rule {
    source = "/<*>"
    status = "200"
    target = "/index.html"
  }
}

resource "aws_amplify_branch" "main" {
  app_id            = aws_amplify_app.main.id
  branch_name       = var.branch_name
  enable_auto_build = true
}
