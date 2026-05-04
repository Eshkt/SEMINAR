#!/bin/bash
set -e

# AWS S3 + CloudFront deployment script

# Build frontend
npm run build --prefix frontend

# Sync to S3
aws s3 sync frontend/dist "s3://${AWS_S3_BUCKET}" --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id "${AWS_CLOUDFRONT_DISTRIBUTION_ID}" \
  --paths "/*"

echo "Deployment complete"
