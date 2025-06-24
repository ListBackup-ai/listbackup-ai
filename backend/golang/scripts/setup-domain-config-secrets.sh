#!/bin/bash

# Script to set up domain configuration in AWS Secrets Manager

set -e

STAGE=${1:-main}
SECRET_NAME="listbackup/domains/config/${STAGE}"
REGION="us-east-1"
PROFILE="listbackup.ai"

echo "Setting up domain configuration in Secrets Manager for stage: ${STAGE}"

# Check if infrastructure stack exists
STACK_NAME="listbackup-domains-infrastructure-${STAGE}"
echo "Checking for existing infrastructure stack..."

STACK_EXISTS=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --profile ${PROFILE} \
  --query 'Stacks[0].StackStatus' \
  --output text 2>/dev/null || echo "NONE")

if [ "$STACK_EXISTS" == "NONE" ]; then
  echo "❌ Infrastructure stack not found. Please run setup-domain-infrastructure.sh first."
  exit 1
fi

# Get outputs from CloudFormation
echo "Getting infrastructure outputs..."
HOSTED_ZONE_ID=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`HostedZoneId`].OutputValue' \
  --output text \
  --region ${REGION} \
  --profile ${PROFILE})

CERTIFICATE_ARN=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`CertificateArn`].OutputValue' \
  --output text \
  --region ${REGION} \
  --profile ${PROFILE})

CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text \
  --region ${REGION} \
  --profile ${PROFILE})

CLOUDFRONT_DOMAIN_NAME=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
  --output text \
  --region ${REGION} \
  --profile ${PROFILE})

# Create secret JSON
SECRET_JSON=$(cat <<EOF
{
  "hostedZoneId": "${HOSTED_ZONE_ID}",
  "certificateArn": "${CERTIFICATE_ARN}",
  "cloudfrontDistributionId": "${CLOUDFRONT_DISTRIBUTION_ID}",
  "cloudfrontDomainName": "${CLOUDFRONT_DOMAIN_NAME}",
  "rootDomain": "listbackup-domains.com",
  "stage": "${STAGE}"
}
EOF
)

# Check if secret already exists
SECRET_EXISTS=$(aws secretsmanager describe-secret \
  --secret-id ${SECRET_NAME} \
  --region ${REGION} \
  --profile ${PROFILE} \
  --query 'ARN' \
  --output text 2>/dev/null || echo "NONE")

if [ "$SECRET_EXISTS" == "NONE" ]; then
  echo "Creating new secret..."
  aws secretsmanager create-secret \
    --name ${SECRET_NAME} \
    --description "Domain infrastructure configuration for ${STAGE}" \
    --secret-string "${SECRET_JSON}" \
    --region ${REGION} \
    --profile ${PROFILE} \
    --tags Key=Stage,Value=${STAGE} Key=Service,Value=domains
else
  echo "Updating existing secret..."
  aws secretsmanager update-secret \
    --secret-id ${SECRET_NAME} \
    --secret-string "${SECRET_JSON}" \
    --region ${REGION} \
    --profile ${PROFILE}
fi

echo ""
echo "✅ Domain configuration saved to Secrets Manager!"
echo ""
echo "Secret Name: ${SECRET_NAME}"
echo "Configuration:"
echo "${SECRET_JSON}" | jq .
echo ""
echo "The domain service will automatically load this configuration from Secrets Manager."