#!/bin/bash

# Deploy Custom Domains for ListBackup API
# This script sets up custom domain mappings for different stages

set -e

echo "🚀 Deploying Custom Domains for ListBackup API"

# Check if stage is provided
STAGE=${1:-main}
AWS_PROFILE=${2:-listbackup.ai}

echo "📋 Configuration:"
echo "  Stage: $STAGE"
echo "  AWS Profile: $AWS_PROFILE"

# Determine domain name based on stage
if [[ "$STAGE" == "main" || "$STAGE" == "prod" || "$STAGE" == "production" ]]; then
    DOMAIN_NAME="api.listbackup.ai"
else
    DOMAIN_NAME="${STAGE}.api.listbackup.ai"
fi

echo "  Domain: $DOMAIN_NAME"
echo ""

# Check if serverless is installed
if ! command -v sls &> /dev/null; then
    echo "❌ Serverless Framework not found. Installing..."
    npm install -g serverless
fi

# Check if the core infrastructure exists
echo "🔍 Checking prerequisites..."
if ! aws cloudformation describe-stacks --stack-name "listbackup-core-${STAGE}" --profile "$AWS_PROFILE" &> /dev/null; then
    echo "❌ Core infrastructure stack not found: listbackup-core-${STAGE}"
    echo "   Please deploy the core infrastructure first"
    exit 1
fi

if ! aws cloudformation describe-stacks --stack-name "listbackup-api-gateway-${STAGE}" --profile "$AWS_PROFILE" &> /dev/null; then
    echo "❌ API Gateway stack not found: listbackup-api-gateway-${STAGE}"
    echo "   Please deploy the API Gateway first"
    exit 1
fi

# Check if SSL certificate exists
echo "🔒 Checking SSL certificate..."
CERT_ARN=$(aws cloudformation describe-stacks \
  --stack-name "listbackup-core-${STAGE}" \
  --query "Stacks[0].Outputs[?OutputKey=='SSLCertificateArn'].OutputValue" \
  --output text \
  --profile "$AWS_PROFILE" 2>/dev/null || echo "")

if [[ -z "$CERT_ARN" || "$CERT_ARN" == "None" ]]; then
    echo "❌ SSL certificate not found in core stack"
    echo "   Make sure the core infrastructure includes SSL certificate creation"
    exit 1
fi

echo "✅ SSL Certificate found: $CERT_ARN"

# Check if hosted zone exists
echo "🌐 Checking Route53 hosted zone..."
HOSTED_ZONE_ID=$(aws cloudformation describe-stacks \
  --stack-name "listbackup-core-${STAGE}" \
  --query "Stacks[0].Outputs[?OutputKey=='HostedZoneId'].OutputValue" \
  --output text \
  --profile "$AWS_PROFILE" 2>/dev/null || echo "")

if [[ -z "$HOSTED_ZONE_ID" || "$HOSTED_ZONE_ID" == "None" ]]; then
    echo "❌ Route53 hosted zone not found in core stack"
    echo "   Make sure the core infrastructure includes Route53 setup"
    exit 1
fi

echo "✅ Hosted Zone found: $HOSTED_ZONE_ID"

# Deploy custom domains
echo ""
echo "🔧 Deploying custom domain configuration..."
sls deploy \
  --config serverless-go-custom-domains.yml \
  --stage "$STAGE" \
  --aws-profile "$AWS_PROFILE" \
  --verbose

# Verify deployment
echo ""
echo "✅ Custom domain deployment completed!"
echo ""
echo "📊 Verification:"

# Check if domain was created
DOMAIN_STATUS=$(aws apigatewayv2 get-domain-name \
  --domain-name "$DOMAIN_NAME" \
  --query "DomainNameStatus" \
  --output text \
  --profile "$AWS_PROFILE" 2>/dev/null || echo "NOT_FOUND")

if [[ "$DOMAIN_STATUS" == "AVAILABLE" ]]; then
    echo "✅ Domain $DOMAIN_NAME is AVAILABLE"
    
    # Get the regional domain name for verification
    REGIONAL_DOMAIN=$(aws apigatewayv2 get-domain-name \
      --domain-name "$DOMAIN_NAME" \
      --query "DomainNameConfigurations[0].TargetDomainName" \
      --output text \
      --profile "$AWS_PROFILE" 2>/dev/null || echo "")
    
    if [[ -n "$REGIONAL_DOMAIN" ]]; then
        echo "🌐 Regional domain: $REGIONAL_DOMAIN"
    fi
    
elif [[ "$DOMAIN_STATUS" == "PENDING" ]]; then
    echo "⏳ Domain $DOMAIN_NAME is PENDING (this may take up to 40 minutes)"
else
    echo "❌ Domain $DOMAIN_NAME status: $DOMAIN_STATUS"
fi

# Check Route53 record
echo ""
echo "🔍 Checking Route53 DNS record..."
DNS_RESULT=$(aws route53 list-resource-record-sets \
  --hosted-zone-id "$HOSTED_ZONE_ID" \
  --query "ResourceRecordSets[?Name=='${DOMAIN_NAME}.'].Type" \
  --output text \
  --profile "$AWS_PROFILE" 2>/dev/null || echo "")

if [[ "$DNS_RESULT" == "A" ]]; then
    echo "✅ Route53 A record exists for $DOMAIN_NAME"
else
    echo "⚠️  Route53 A record not found for $DOMAIN_NAME"
fi

echo ""
echo "🎉 Custom domain setup completed!"
echo ""
echo "📝 Summary:"
echo "  Domain: https://$DOMAIN_NAME"
echo "  Stage: $STAGE"
echo "  Status: $DOMAIN_STATUS"
echo ""
echo "🔗 Next steps:"
echo "  1. Wait for domain to become AVAILABLE (if PENDING)"
echo "  2. Update your frontend API_URL to: https://$DOMAIN_NAME"
echo "  3. Test the API endpoints"
echo ""
echo "📞 Test health endpoint:"
echo "  curl -I https://$DOMAIN_NAME/system/health"
echo ""