# GitHub Repository Secrets Configuration

This document describes the secrets required for the ListBackup.ai GitHub Actions workflows.

## Required Secrets

### AWS Credentials
These secrets are used to authenticate with AWS for deployments:

- **AWS_ACCESS_KEY_ID**: AWS IAM user access key ID
- **AWS_SECRET_ACCESS_KEY**: AWS IAM user secret access key

The AWS IAM user should have permissions to:
- Deploy Lambda functions via Serverless Framework
- Upload files to S3 buckets
- Create CloudFront invalidations
- Manage DynamoDB tables
- Manage API Gateway

### Production Environment
These secrets are used for production deployments:

- **PRODUCTION_API_URL**: The production API endpoint URL (e.g., `https://api.listbackup.ai`)
- **PRODUCTION_AUTH_API_URL**: The production auth API endpoint URL (e.g., `https://auth.listbackup.ai`)
- **PRODUCTION_S3_BUCKET**: The S3 bucket name for production frontend hosting
- **PRODUCTION_CF_DISTRIBUTION_ID**: The CloudFront distribution ID for production

### Staging Environment
These secrets are used for staging deployments:

- **STAGING_API_URL**: The staging API endpoint URL (e.g., `https://api-staging.listbackup.ai`)
- **STAGING_AUTH_API_URL**: The staging auth API endpoint URL (e.g., `https://auth-staging.listbackup.ai`)
- **STAGING_S3_BUCKET**: The S3 bucket name for staging frontend hosting
- **STAGING_CF_DISTRIBUTION_ID**: The CloudFront distribution ID for staging

## Setting Up Secrets

### Method 1: Using the Setup Script
Run the provided setup script:

```bash
.github/scripts/setup-secrets.sh
```

The script will prompt you for each secret value and set them in the repository.

### Method 2: Using GitHub CLI Manually
Set each secret individually:

```bash
# AWS Credentials
echo "your-access-key-id" | gh secret set AWS_ACCESS_KEY_ID
echo "your-secret-access-key" | gh secret set AWS_SECRET_ACCESS_KEY

# Production secrets
echo "https://api.listbackup.ai" | gh secret set PRODUCTION_API_URL
echo "https://auth.listbackup.ai" | gh secret set PRODUCTION_AUTH_API_URL
echo "listbackup-ai-production" | gh secret set PRODUCTION_S3_BUCKET
echo "E1234567890ABC" | gh secret set PRODUCTION_CF_DISTRIBUTION_ID

# Staging secrets
echo "https://api-staging.listbackup.ai" | gh secret set STAGING_API_URL
echo "https://auth-staging.listbackup.ai" | gh secret set STAGING_AUTH_API_URL
echo "listbackup-ai-staging" | gh secret set STAGING_S3_BUCKET
echo "E0987654321XYZ" | gh secret set STAGING_CF_DISTRIBUTION_ID
```

### Method 3: Using GitHub Web Interface
1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its name and value

## Verifying Secrets

To list all configured secrets (names only):

```bash
gh secret list
```

## Security Notes

- Never commit secret values to the repository
- Use IAM users with minimal required permissions
- Rotate AWS credentials regularly
- Use environment-specific AWS accounts when possible
- Enable MFA on AWS accounts
- Monitor AWS CloudTrail for unauthorized access

## Troubleshooting

### Deployment fails with authentication error
- Verify AWS credentials are correct
- Check IAM user has required permissions
- Ensure secrets are named exactly as expected (case-sensitive)

### Frontend build fails
- Verify API URLs are correct and include protocol (https://)
- Check that API endpoints are accessible

### S3 sync fails
- Verify S3 bucket name is correct
- Check IAM user has s3:PutObject and s3:DeleteObject permissions
- Ensure bucket exists in the correct region

### CloudFront invalidation fails
- Verify distribution ID is correct
- Check IAM user has cloudfront:CreateInvalidation permission