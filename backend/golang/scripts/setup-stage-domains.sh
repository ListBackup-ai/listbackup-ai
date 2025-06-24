#!/bin/bash

# Setup Stage-specific Custom Domains
# This script sets up custom domains for different stages using existing infrastructure

set -e

echo "🌐 Setting up Stage-specific Custom Domains"
echo "==========================================="

STAGE=${1:-dev}
AWS_PROFILE=${2:-listbackup.ai}

if [[ "$STAGE" == "main" ]]; then
    echo "❌ Main stage domain is already configured. Use other stages like dev, staging, test."
    exit 1
fi

# Domain mapping
DOMAIN_NAME="${STAGE}.api.listbackup.ai"
HOSTED_ZONE_ID="Z01040453V93CTQT4QFNW"
SSL_CERT_ARN="arn:aws:acm:us-west-2:851725647922:certificate/b0f9c66a-64ce-4c6d-8ae9-b144a0956449"

echo "📋 Configuration:"
echo "  Stage: $STAGE"
echo "  Domain: $DOMAIN_NAME"
echo "  AWS Profile: $AWS_PROFILE"
echo ""

# Check if API Gateway stack exists for this stage
API_STACK_NAME="listbackup-api-gateway-${STAGE}"
if ! aws cloudformation describe-stacks --stack-name "$API_STACK_NAME" --profile "$AWS_PROFILE" --region us-west-2 &> /dev/null; then
    echo "❌ API Gateway stack not found: $API_STACK_NAME"
    echo "   Please deploy the API Gateway for stage $STAGE first"
    exit 1
fi

# Get API Gateway ID
API_ID=$(aws cloudformation describe-stacks \
    --stack-name "$API_STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='HttpApiId'].OutputValue" \
    --output text \
    --profile "$AWS_PROFILE" \
    --region us-west-2 2>/dev/null || echo "")

if [[ -z "$API_ID" || "$API_ID" == "None" ]]; then
    echo "❌ Could not retrieve API Gateway ID from stack $API_STACK_NAME"
    exit 1
fi

echo "✅ Found API Gateway ID: $API_ID"

# Check if custom domain already exists
if aws apigatewayv2 get-domain-name --domain-name "$DOMAIN_NAME" --profile "$AWS_PROFILE" --region us-west-2 &> /dev/null; then
    echo "✅ Custom domain $DOMAIN_NAME already exists"
    
    # Check if mapping exists
    EXISTING_MAPPING=$(aws apigatewayv2 get-api-mappings \
        --domain-name "$DOMAIN_NAME" \
        --query "Items[?ApiId=='$API_ID'].ApiMappingId" \
        --output text \
        --profile "$AWS_PROFILE" \
        --region us-west-2 2>/dev/null || echo "")
    
    if [[ -n "$EXISTING_MAPPING" ]]; then
        echo "✅ API mapping already exists for $DOMAIN_NAME"
    else
        echo "🔗 Creating API mapping..."
        aws apigatewayv2 create-api-mapping \
            --domain-name "$DOMAIN_NAME" \
            --api-id "$API_ID" \
            --stage '$default' \
            --profile "$AWS_PROFILE" \
            --region us-west-2
        echo "✅ API mapping created"
    fi
else
    echo "🔧 Creating custom domain $DOMAIN_NAME..."
    
    # Create custom domain
    aws apigatewayv2 create-domain-name \
        --domain-name "$DOMAIN_NAME" \
        --domain-name-configurations CertificateArn="$SSL_CERT_ARN",EndpointType=REGIONAL,SecurityPolicy=TLS_1_2 \
        --profile "$AWS_PROFILE" \
        --region us-west-2
    
    echo "✅ Custom domain created"
    
    # Wait for domain to be ready
    echo "⏳ Waiting for domain to become available..."
    aws apigatewayv2 wait domain-name-available --domain-name "$DOMAIN_NAME" --profile "$AWS_PROFILE" --region us-west-2
    
    # Create API mapping
    echo "🔗 Creating API mapping..."
    aws apigatewayv2 create-api-mapping \
        --domain-name "$DOMAIN_NAME" \
        --api-id "$API_ID" \
        --stage '$default' \
        --profile "$AWS_PROFILE" \
        --region us-west-2
    
    echo "✅ API mapping created"
fi

# Get the regional domain name for DNS
REGIONAL_DOMAIN=$(aws apigatewayv2 get-domain-name \
    --domain-name "$DOMAIN_NAME" \
    --query "DomainNameConfigurations[0].ApiGatewayDomainName" \
    --output text \
    --profile "$AWS_PROFILE" \
    --region us-west-2 2>/dev/null || echo "")

REGIONAL_ZONE_ID=$(aws apigatewayv2 get-domain-name \
    --domain-name "$DOMAIN_NAME" \
    --query "DomainNameConfigurations[0].HostedZoneId" \
    --output text \
    --profile "$AWS_PROFILE" \
    --region us-west-2 2>/dev/null || echo "")

if [[ -n "$REGIONAL_DOMAIN" && -n "$REGIONAL_ZONE_ID" ]]; then
    echo "🌐 Regional domain: $REGIONAL_DOMAIN"
    echo "🌐 Regional zone ID: $REGIONAL_ZONE_ID"
    
    # Create/update Route53 record
    echo "📝 Creating/updating Route53 DNS record..."
    aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch "{
            \"Changes\": [
                {
                    \"Action\": \"UPSERT\",
                    \"ResourceRecordSet\": {
                        \"Name\": \"$DOMAIN_NAME\",
                        \"Type\": \"A\",
                        \"AliasTarget\": {
                            \"HostedZoneId\": \"$REGIONAL_ZONE_ID\",
                            \"DNSName\": \"$REGIONAL_DOMAIN\",
                            \"EvaluateTargetHealth\": false
                        }
                    }
                }
            ]
        }" \
        --profile "$AWS_PROFILE"
    
    echo "✅ Route53 record created/updated"
else
    echo "❌ Could not retrieve regional domain information"
    exit 1
fi

echo ""
echo "🎉 Domain setup completed!"
echo ""
echo "📊 Summary:"
echo "  🌍 Domain: https://$DOMAIN_NAME"
echo "  🔗 API Gateway: $API_ID"
echo "  🌐 Regional: $REGIONAL_DOMAIN"
echo ""
echo "⏰ DNS propagation may take a few minutes"
echo ""
echo "📞 Test command:"
echo "  curl -I https://$DOMAIN_NAME/system/health"
echo ""