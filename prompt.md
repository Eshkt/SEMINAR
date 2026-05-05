# Terraform Infrastructure: CloudFront for API Gateway

## Current State
Backend (Express) → Lambda → API Gateway → Amplify frontend

## Goal
Add CloudFront in front of API Gateway as CDN/distribution layer:
Backend → Lambda → API Gateway → CloudFront → Amplify frontend

## Changes Made

### 1. Created `modules/api_gateway_cloudfront/main.tf`
CloudFront distribution pointing at API Gateway as custom origin:
- Origin: API Gateway invoke URL (custom origin config)
- Default behavior: pass-through for all methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- `/api/*` ordered cache behavior: same pass-through config
- No caching (min_ttl=default_ttl=max_ttl=0)
- Authorization header forwarded for auth
- CloudFront default certificate (no custom domain yet)

### 2. Updated `main.tf`
Added module block:
```
module "api_gateway_cloudfront" {
  source                 = "./modules/api_gateway_cloudfront"
  app_name               = var.app_name
  environment            = var.environment
  api_gateway_invoke_url = module.api_gateway.invoke_url
  api_gateway_id         = module.api_gateway.api_id
}
```

### 3. Updated `main.tf` Amplify module
Changed `vite_api_url`:
- Before: `module.api_gateway.invoke_url`
- After: `"https://${module.api_gateway_cloudfront.distribution_domain}"`

### 4. Cleaned up `modules/api_gateway/variables.tf`
Removed unused `lambda_role_arn` variable

## Architecture Flow

```
User → CloudFront domain (d123.cloudfront.net)
    → API Gateway invoke URL (xyz.execute-api.region.amazonaws.com)
    → Lambda function
    → Backend Express app
    → Reads env vars (DB_URL, ADMIN_PASS, etc.)
    → Returns response through chain
```

## Terraform State
- Backend: S3 bucket `sem-qna-terraform-state`
- Lock: DynamoDB table `sem-qna-terraform-lock`
- Region: ap-southeast-1

## Next Steps
1. Run `terraform plan` to verify changes
2. Run `terraform apply` to provision CloudFront
3. Update CloudFront behaviors as needed (caching, custom domains, SSL)

## Notes
- CloudFront adds latency benefit and DDoS protection
- API Gateway invoke URL format: `{api-id}.execute-api.{region}.amazonaws.com`
- CloudFront domain format: `{distribution-id}.cloudfront.net`
