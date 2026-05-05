
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "db_password" {
  description = "RDS database password"
  type        = string
  sensitive   = true
}

variable "admin_password" {
  description = "Admin password for API access"
  type        = string
  sensitive   = true
}

variable "admin_email" {
  description = "Admin email for Cognito user creation"
  type        = string
}

variable "app_name" {
  description = "Application name prefix"
  type        = string
  default     = "seminar-qa"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "gitlab_access_token" {
  description = "GitLab Personal Access Token"
  type        = string
  sensitive   = true
}
