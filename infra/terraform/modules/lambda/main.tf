variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "security_group_id" {
  type = string
}

variable "db_url" {
  type      = string
  sensitive = true
}

variable "appsync_url" {
  type = string
}

variable "appsync_arn" {
  type = string
}

variable "appsync_id" {
  type = string
}

variable "appsync_key" {
  type      = string
  sensitive = true
}

variable "bedrock_model_id" {
  type = string
}

variable "cognito_user_pool_id" {
  type = string
}

variable "cognito_client_id" {
  type = string
}

variable "admin_password" {
  type      = string
  sensitive = true
}

variable "lambda_zip_path" {
  type = string
}

locals {
  name = "${var.app_name}-${var.environment}"
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "lambda" {
  name = "${local.name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "lambda" {
  name = "${local.name}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect",
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = "bedrock:InvokeModel"
        Resource = "arn:aws:bedrock:*:*:foundation-model/${var.bedrock_model_id}"
      },
      {
        Effect = "Allow"
        Action = "appsync:GraphQL"
        Resource = "${var.appsync_arn}/*"
      }
    ]
  })
}

resource "aws_lambda_function" "main" {
  filename         = var.lambda_zip_path
  function_name    = "${local.name}-api"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      DB_URL                = var.db_url
      ADMIN_PASS            = var.admin_password
      APPSYNC_URL           = var.appsync_url
      APPSYNC_KEY           = var.appsync_key
      BEDROCK_MODEL_ID      = var.bedrock_model_id
      COGNITO_USER_POOL_ID  = var.cognito_user_pool_id
      COGNITO_CLIENT_ID     = var.cognito_client_id
      RUNTIME               = "lambda"
    }
  }

  vpc_config {
    subnet_ids         = data.aws_subnets.default.ids
    security_group_ids = [var.security_group_id]
  }
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_vpc" "default" {
  default = true
}

resource "aws_lambda_function_url" "main" {
  function_name      = aws_lambda_function.main.function_name
  authorization_type = "NONE"
}

# AppSync Integration
resource "aws_appsync_datasource" "lambda" {
  api_id           = var.appsync_id
  name             = replace("${local.name}_lambda_ds", "-", "_")
  type             = "AWS_LAMBDA"
  service_role_arn = aws_iam_role.appsync.arn

  lambda_config {
    function_arn = aws_lambda_function.main.arn
  }
}

resource "aws_iam_role" "appsync" {
  name = "${local.name}-appsync-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "appsync.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "appsync" {
  name = "${local.name}-appsync-policy"
  role = aws_iam_role.appsync.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "lambda:InvokeFunction"
      Resource = aws_lambda_function.main.arn
    }]
  })
}

resource "aws_appsync_resolver" "listApproved" {
  api_id      = var.appsync_id
  type        = "Query"
  field       = "listApproved"
  data_source = aws_appsync_datasource.lambda.name

  request_template = <<REQUEST
{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "operation": "listApproved"
  }
}
REQUEST

  response_template = <<RESPONSE
#set($result = $ctx.result)
#if($result.error)
  $util.error($result.error.message, $result.error.type)
#end
$util.toJson($result.data)
RESPONSE
}
