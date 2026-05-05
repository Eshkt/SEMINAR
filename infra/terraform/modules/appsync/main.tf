variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "user_pool_id" {
  type = string
}

locals {
  name = "${var.app_name}-${var.environment}"
}

resource "aws_appsync_graphql_api" "main" {
  name                = "${local.name}-api"
  authentication_type = "AMAZON_COGNITO_USER_POOLS"

  user_pool_config {
    user_pool_id   = var.user_pool_id
    aws_region     = "ap-southeast-1"
    default_action = "ALLOW"
  }

  additional_authentication_provider {
    authentication_type = "API_KEY"
  }

  schema = <<SCHEMA
type Question @aws_api_key @aws_cognito_user_pools {
  id: ID!
  txt: String!
  stat: String!
  gid: ID
  ts: AWSDateTime
}

type Subscription {
  onQuestionUpdate: Question
    @aws_subscribe(mutations: ["publishQuestion"])
    @aws_api_key @aws_cognito_user_pools
}

type Mutation {
  publishQuestion(id: ID!, txt: String!, stat: String!, gid: ID, ts: AWSDateTime): Question
    @aws_api_key @aws_cognito_user_pools
}

type Query {
  listApproved: [Question]
    @aws_api_key @aws_cognito_user_pools
}
SCHEMA
}

resource "aws_appsync_api_key" "main" {
  api_id = aws_appsync_graphql_api.main.id
}
