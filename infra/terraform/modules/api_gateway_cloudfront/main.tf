variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "api_gateway_invoke_url" {
  type = string
}

variable "api_gateway_id" {
  type = string
}

locals {
  name       = "${var.app_name}-${var.environment}"
  # Extract domain and stage from invoke_url (format: https://{id}.execute-api.{region}.amazonaws.com/{stage})
  api_host   = split("/", replace(var.api_gateway_invoke_url, "https://", ""))[0]
  api_stage  = split("/", var.api_gateway_invoke_url)[3]
}

resource "aws_cloudfront_distribution" "api" {
  origin {
    domain_name = local.api_host
    origin_id   = "APIGateway-${var.api_gateway_id}"
    origin_path = "/${local.api_stage}"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled = true

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "PATCH"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "APIGateway-${var.api_gateway_id}"

    viewer_protocol_policy = "redirect-to-https"
    
    # No caching (min_ttl=default_ttl=max_ttl=0)
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "Accept"]

      cookies {
        forward = "none"
      }
    }

    compress = true
  }

  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "PATCH"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "APIGateway-${var.api_gateway_id}"

    viewer_protocol_policy = "redirect-to-https"

    # No caching (min_ttl=default_ttl=max_ttl=0)
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "Accept"]

      cookies {
        forward = "none"
      }
    }

    compress = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

output "distribution_domain" {
  value = aws_cloudfront_distribution.api.domain_name
}

output "distribution_id" {
  value = aws_cloudfront_distribution.api.id
}
