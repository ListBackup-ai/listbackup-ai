#!/bin/bash

# Script to set up domain infrastructure for ListBackup.ai

set -e

STAGE=${1:-main}
STACK_NAME="listbackup-domains-infrastructure-${STAGE}"
REGION="us-east-1"
PROFILE="listbackup.ai"

echo "Setting up domain infrastructure for stage: ${STAGE}"

# Create cloudformation directory if it doesn't exist
mkdir -p ../cloudformation

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file ../cloudformation/domain-infrastructure-complete.yml \
  --stack-name ${STACK_NAME} \
  --parameter-overrides Stage=${STAGE} \
  --capabilities CAPABILITY_IAM \
  --region ${REGION} \
  --profile ${PROFILE} \
  --no-fail-on-empty-changeset

echo "Waiting for stack to complete..."
aws cloudformation wait stack-create-complete \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --profile ${PROFILE} 2>/dev/null || true

# Get outputs
echo "Getting stack outputs..."
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

NAME_SERVERS=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`NameServers`].OutputValue' \
  --output text \
  --region ${REGION} \
  --profile ${PROFILE})

# Create .env file with outputs
ENV_FILE="../.env.domains.${STAGE}"
echo "Creating environment file: ${ENV_FILE}"
cat > ${ENV_FILE} << EOF
# Domain Infrastructure Configuration
# Generated on $(date)
export HOSTED_ZONE_ID="${HOSTED_ZONE_ID}"
export CERTIFICATE_ARN="${CERTIFICATE_ARN}"
export CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID}"
export CLOUDFRONT_DOMAIN_NAME="${CLOUDFRONT_DOMAIN_NAME}"
EOF

echo ""
echo "✅ Domain infrastructure setup complete!"
echo ""
echo "Infrastructure Details:"
echo "======================"
echo "Hosted Zone ID: ${HOSTED_ZONE_ID}"
echo "Certificate ARN: ${CERTIFICATE_ARN}"
echo "CloudFront Distribution ID: ${CLOUDFRONT_DISTRIBUTION_ID}"
echo "CloudFront Domain: ${CLOUDFRONT_DOMAIN_NAME}"
echo ""
echo "Name Servers (configure at your domain registrar for listbackup-domains.com):"
echo "${NAME_SERVERS}" | tr ',' '\n'
echo ""
echo "Environment variables saved to: ${ENV_FILE}"
echo ""
echo "To deploy the domains service, run:"
echo "  source ${ENV_FILE}"
echo "  cd .."
echo "  sls deploy --config serverless-go-domains.yml --aws-profile ${PROFILE} --stage ${STAGE}"