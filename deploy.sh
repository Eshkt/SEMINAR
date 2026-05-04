#!/bin/bash
set -e

# AWS S3 + CloudFront deployment script
# Usage:
#   ./deploy.sh                          # Interactive
#   AWS_S3_BUCKET=bucket AWS_CLOUDFRONT_DISTRIBUTION_ID=id ./deploy.sh

# Get values from env or prompt
if [ -z "${AWS_S3_BUCKET}" ] || [ -z "${AWS_CLOUDFRONT_DISTRIBUTION_ID}" ]; then
  echo "Missing required environment variables:"
  echo "  AWS_S3_BUCKET"
  echo "  AWS_CLOUDFRONT_DISTRIBUTION_ID"
  echo ""
  echo "Run: export AWS_S3_BUCKET=your-bucket-name"
  echo "Run: export AWS_CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id"
  echo ""
  echo "Or use CloudFormation to create resources:"
  echo "  aws cloudformation deploy --template-file aws-setup.yml --stack-name qna-web-app --capabilities CAPABILITY_IAM"
  exit 1
fi

echo "Deploying to S3 bucket: ${AWS_S3_BUCKET}"
echo "CloudFront distribution: ${AWS_CLOUDFRONT_DISTRIBUTION_ID}"

# Build frontend
echo "Building frontend..."
npm run build --prefix frontend

# Sync to S3
echo "Syncing to S3..."
aws s3 sync frontend/dist "s3://${AWS_S3_BUCKET}" --delete

# Invalidate CloudFront
echo "Invalidating CloudFront..."
aws cloudfront create-invalidation \
  --distribution-id "${AWS_CLOUDFRONT_DISTRIBUTION_ID}" \
  --paths "/*"

echo "Deployment complete"
