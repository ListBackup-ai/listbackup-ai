#!/bin/bash

# Script to set up GitHub repository secrets
# This script helps you configure the required secrets for the ListBackup.ai deployment

echo "🔐 Setting up GitHub repository secrets for ListBackup.ai"
echo ""
echo "This script will guide you through setting up the required secrets."
echo "You'll need the following information:"
echo ""
echo "1. AWS Credentials (Access Key ID and Secret Access Key)"
echo "2. Production API URLs"
echo "3. Production S3 bucket name"
echo "4. Production CloudFront distribution ID"
echo "5. Staging API URLs"
echo "6. Staging S3 bucket name"
echo "7. Staging CloudFront distribution ID"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Function to set a secret
set_secret() {
    local secret_name=$1
    local prompt_text=$2
    
    echo ""
    echo -n "$prompt_text: "
    read -s secret_value
    echo ""
    
    if [ -n "$secret_value" ]; then
        echo "$secret_value" | gh secret set "$secret_name"
        echo "✅ Set $secret_name"
    else
        echo "⚠️  Skipped $secret_name (no value provided)"
    fi
}

echo ""
echo "=== AWS Credentials ==="
echo "These credentials should have permissions to deploy to AWS"
set_secret "AWS_ACCESS_KEY_ID" "Enter AWS Access Key ID"
set_secret "AWS_SECRET_ACCESS_KEY" "Enter AWS Secret Access Key"

echo ""
echo "=== Production Environment ==="
echo "Example API URL: https://api.listbackup.ai"
echo "Example Auth API URL: https://auth.listbackup.ai"
set_secret "PRODUCTION_API_URL" "Enter Production API URL"
set_secret "PRODUCTION_AUTH_API_URL" "Enter Production Auth API URL"
set_secret "PRODUCTION_S3_BUCKET" "Enter Production S3 Bucket name"
set_secret "PRODUCTION_CF_DISTRIBUTION_ID" "Enter Production CloudFront Distribution ID"

echo ""
echo "=== Staging Environment ==="
echo "Example API URL: https://api-staging.listbackup.ai"
echo "Example Auth API URL: https://auth-staging.listbackup.ai"
set_secret "STAGING_API_URL" "Enter Staging API URL"
set_secret "STAGING_AUTH_API_URL" "Enter Staging Auth API URL"
set_secret "STAGING_S3_BUCKET" "Enter Staging S3 Bucket name"
set_secret "STAGING_CF_DISTRIBUTION_ID" "Enter Staging CloudFront Distribution ID"

echo ""
echo "🎉 Secret setup complete!"
echo ""
echo "To verify your secrets, run:"
echo "gh secret list"
echo ""
echo "Note: The actual secret values are encrypted and cannot be viewed after setting."