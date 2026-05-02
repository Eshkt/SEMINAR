variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "lambda_security_group_id" {
  type = string
}

locals {
  name = "${var.app_name}-${var.environment}"
}

resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db-subnet"
  subnet_ids = data.aws_subnets.default.ids
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

resource "aws_security_group" "rds" {
  name        = "${local.name}-rds-sg"
  description = "Allow PostgreSQL from Lambda"
}

resource "aws_security_group_rule" "ingress" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = var.lambda_security_group_id
  security_group_id        = aws_security_group.rds.id
}

resource "aws_db_instance" "main" {
  identifier          = "${local.name}-db"
  engine              = "postgres"
  engine_version      = "15"
  instance_class      = "db.t3.micro"
  db_name             = "qa_db"
  username            = "qa_user"
  password            = var.db_password
  skip_final_snapshot = var.environment == "dev" ? true : false
  storage_encrypted   = true
  allocated_storage   = 20
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
}
