#!/bin/bash

# Deploy Infrastructure with Custom Domains for ListBackup API
# This script deploys the infrastructure and sets up custom domains

set -e

echo "🏗️  Deploying ListBackup Infrastructure with Custom Domains"
echo "=========================================================="

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

# Step 1: Deploy the core infrastructure (includes custom domain setup)
echo "🚀 Step 1: Deploying core infrastructure..."
sls deploy \
    --config serverless-go-infrastructure.yml \
    --stage "$STAGE" \
    --aws-profile "$AWS_PROFILE" \
    --verbose

echo "✅ Infrastructure deployed successfully!"
echo ""

# Step 2: Check certificate status
echo "🔒 Step 2: Checking SSL certificate status..."
CERT_ARN=$(aws cloudformation describe-stacks \
    --stack-name "listbackup-infrastructure-${STAGE}" \
    --query "Stacks[0].Outputs[?OutputKey=='SSLCertificateArn'].OutputValue" \
    --output text \
    --profile "$AWS_PROFILE" 2>/dev/null || echo "")

if [[ -n "$CERT_ARN" && "$CERT_ARN" != "None" ]]; then
    echo "✅ SSL Certificate ARN: $CERT_ARN"
    
    # Check certificate status
    CERT_STATUS=$(aws acm describe-certificate \
        --certificate-arn "$CERT_ARN" \
        --query "Certificate.Status" \
        --output text \
        --profile "$AWS_PROFILE" 2>/dev/null || echo "UNKNOWN")
    
    echo "   Status: $CERT_STATUS"
    
    if [[ "$CERT_STATUS" == "PENDING_VALIDATION" ]]; then
        echo "⏳ Certificate is pending validation. This may take a few minutes..."
        echo "   The certificate will be automatically validated via DNS."
    fi
else
    echo "❌ Could not retrieve SSL certificate ARN"
    exit 1
fi

# Step 3: Check custom domain status
echo ""
echo "🌐 Step 3: Checking custom domain status..."
DOMAIN_STATUS=$(aws apigatewayv2 get-domain-name \
    --domain-name "$DOMAIN_NAME" \
    --query "DomainNameStatus" \
    --output text \
    --profile "$AWS_PROFILE" 2>/dev/null || echo "NOT_FOUND")

if [[ "$DOMAIN_STATUS" == "AVAILABLE" ]]; then
    echo "✅ Custom domain $DOMAIN_NAME is AVAILABLE"
elif [[ "$DOMAIN_STATUS" == "PENDING" ]]; then
    echo "⏳ Custom domain $DOMAIN_NAME is PENDING (may take up to 40 minutes)"
else
    echo "❌ Custom domain $DOMAIN_NAME status: $DOMAIN_STATUS"
fi

# Step 4: Deploy API Gateway (this will create the API mapping)
echo ""
echo "🚀 Step 4: Deploying API Gateway..."

# Check if API Gateway stack exists first
if aws cloudformation describe-stacks --stack-name "listbackup-api-gateway-${STAGE}" --profile "$AWS_PROFILE" &> /dev/null; then
    echo "   API Gateway stack exists, updating..."
else
    echo "   Creating new API Gateway stack..."
fi

sls deploy \
    --config serverless-go-api-gateway.yml \
    --stage "$STAGE" \
    --aws-profile "$AWS_PROFILE" \
    --verbose

echo "✅ API Gateway deployed successfully!"

# Step 5: Create API mapping
echo ""
echo "🔗 Step 5: Creating API mapping..."

# Get the API ID from the deployed stack
API_ID=$(aws cloudformation describe-stacks \
    --stack-name "listbackup-api-gateway-${STAGE}" \
    --query "Stacks[0].Outputs[?OutputKey=='HttpApiId'].OutputValue" \
    --output text \
    --profile "$AWS_PROFILE" 2>/dev/null || echo "")

if [[ -n "$API_ID" && "$API_ID" != "None" ]]; then
    echo "✅ API Gateway ID: $API_ID"
    
    # Check if mapping already exists
    EXISTING_MAPPING=$(aws apigatewayv2 get-api-mappings \
        --domain-name "$DOMAIN_NAME" \
        --query "Items[?ApiId=='$API_ID'].ApiMappingId" \
        --output text \
        --profile "$AWS_PROFILE" 2>/dev/null || echo "")
    
    if [[ -n "$EXISTING_MAPPING" ]]; then
        echo "✅ API mapping already exists: $EXISTING_MAPPING"
    else
        echo "   Creating API mapping..."
        
        # Create the API mapping
        MAPPING_ID=$(aws apigatewayv2 create-api-mapping \
            --domain-name "$DOMAIN_NAME" \
            --api-id "$API_ID" \
            --stage '$default' \
            --query "ApiMappingId" \
            --output text \
            --profile "$AWS_PROFILE" 2>/dev/null || echo "")
        
        if [[ -n "$MAPPING_ID" ]]; then
            echo "✅ API mapping created: $MAPPING_ID"
        else
            echo "❌ Failed to create API mapping"
        fi
    fi
else
    echo "❌ Could not retrieve API Gateway ID"
    exit 1
fi

# Step 6: Verification
echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Summary:"
echo "  🌍 Domain: https://$DOMAIN_NAME"
echo "  🔒 SSL Certificate: $CERT_STATUS"
echo "  🌐 Domain Status: $DOMAIN_STATUS"
echo "  🔗 API Gateway: $API_ID"
echo ""
echo "🔗 Next steps:"
echo "  1. Wait for SSL certificate validation (if pending)"
echo "  2. Wait for custom domain to become AVAILABLE (if pending)"
echo "  3. Update your frontend API_URL to: https://$DOMAIN_NAME"
echo "  4. Test the API endpoints"
echo ""
echo "📞 Test commands:"
echo "  curl -I https://$DOMAIN_NAME/system/health"
echo "  curl -X GET https://$DOMAIN_NAME/system/openapi"
echo ""
echo "⏰ Note: Domain propagation may take up to 40 minutes for full availability."