terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # S3 backend for remote state with locking (DynamoDB)
  backend "s3" {
    bucket         = "sem-qna-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "sem-qna-terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name = "${var.app_name}-${var.environment}"
}

resource "aws_security_group" "lambda" {
  name        = "${local.name}-lambda-sg"
  description = "Lambda security group"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

module "rds" {
  source                   = "./modules/rds"
  app_name                 = var.app_name
  environment              = var.environment
  db_password              = var.db_password
  lambda_security_group_id = aws_security_group.lambda.id
}

module "cognito" {
  source      = "./modules/cognito"
  app_name    = var.app_name
  environment = var.environment
  admin_email = var.admin_email
}

module "bedrock" {
  source = "./modules/bedrock"
}

module "appsync" {
  source       = "./modules/appsync"
  app_name     = var.app_name
  environment  = var.environment
  user_pool_id = module.cognito.user_pool_id
}

module "lambda" {
  source               = "./modules/lambda"
  app_name             = var.app_name
  environment          = var.environment
  security_group_id    = aws_security_group.lambda.id
  db_url               = "postgresql://qa_user:${var.db_password}@${module.rds.endpoint}/qa_db"
  admin_password       = var.admin_password
  appsync_url          = module.appsync.graphql_url
  appsync_arn          = module.appsync.api_arn
  appsync_id           = module.appsync.api_id
  appsync_key          = module.appsync.api_key
  bedrock_model_id     = module.bedrock.model_id
  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.client_id
  lambda_zip_path      = "${path.module}/../../backend/lambda.zip"
}

module "api_gateway" {
  source       = "./modules/api_gateway"
  app_name     = var.app_name
  environment  = var.environment
  lambda_arn   = module.lambda.function_arn
}

module "api_gateway_cloudfront" {
  source                 = "./modules/api_gateway_cloudfront"
  app_name               = var.app_name
  environment            = var.environment
  api_gateway_invoke_url = module.api_gateway.invoke_url
  api_gateway_id         = module.api_gateway.api_id
}

module "amplify" {
  source       = "./modules/amplify"
  app_name     = var.app_name
  environment  = var.environment
  repository   = "https://gitlab.com/franky.parcon/qna-web-app"
  access_token = var.gitlab_access_token
  branch_name  = "main"

  vite_api_url              = "https://${module.api_gateway_cloudfront.distribution_domain}"
  vite_api_stage            = module.api_gateway.stage_name
  vite_appsync_url          = module.appsync.graphql_url
  vite_appsync_key          = module.appsync.api_key
  vite_cognito_user_pool_id = module.cognito.user_pool_id
  vite_cognito_client_id    = module.cognito.client_id
  vite_admin_pass           = var.admin_password
}
