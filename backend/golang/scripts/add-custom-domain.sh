#!/bin/bash

# Script to add a custom domain to the existing API Gateway

set -e

DOMAIN_NAME=${1}
CERTIFICATE_ARN=${2}
API_ID="9sj3qz07ie"  # Your API Gateway ID
STAGE="main"
REGION="us-east-1"
PROFILE="listbackup.ai"

if [ -z "$DOMAIN_NAME" ] || [ -z "$CERTIFICATE_ARN" ]; then
    echo "Usage: $0 <domain-name> <certificate-arn>"
    echo "Example: $0 api.clientcompany.com arn:aws:acm:us-east-1:123456789012:certificate/..."
    exit 1
fi

echo "Adding custom domain ${DOMAIN_NAME} to API Gateway..."

# Create custom domain
aws apigateway create-domain-name \
    --domain-name ${DOMAIN_NAME} \
    --regional-certificate-arn ${CERTIFICATE_ARN} \
    --endpoint-configuration types=REGIONAL \
    --security-policy TLS_1_2 \
    --tags "Service=listbackup" "Stage=${STAGE}" \
    --region ${REGION} \
    --profile ${PROFILE}

echo "Creating base path mapping..."

# Create base path mapping
aws apigateway create-base-path-mapping \
    --domain-name ${DOMAIN_NAME} \
    --rest-api-id ${API_ID} \
    --stage ${STAGE} \
    --region ${REGION} \
    --profile ${PROFILE}

# Get the regional domain name for DNS setup
REGIONAL_DOMAIN=$(aws apigateway get-domain-name \
    --domain-name ${DOMAIN_NAME} \
    --query 'regionalDomainName' \
    --output text \
    --region ${REGION} \
    --profile ${PROFILE})

echo ""
echo "✅ Custom domain created successfully!"
echo ""
echo "DNS Setup Instructions:"
echo "======================"
echo "Add the following CNAME record to the customer's DNS:"
echo ""
echo "Type: CNAME"
echo "Name: ${DOMAIN_NAME}"
echo "Value: ${REGIONAL_DOMAIN}"
echo "TTL: 300"
echo ""
echo "The API will be accessible at: https://${DOMAIN_NAME}"