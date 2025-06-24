#!/bin/bash

# Setup Custom Domains for All Stages
# This script sets up both api.listbackup.ai (main) and stage.api.listbackup.ai

set -e

echo "🌐 Setting up Custom Domains for ListBackup API"
echo "================================================"

AWS_PROFILE=${1:-listbackup.ai}

# Stages to configure
STAGES=("main" "dev" "staging" "test")

echo "📋 Configuration:"
echo "  AWS Profile: $AWS_PROFILE"
echo "  Stages: ${STAGES[*]}"
echo ""

# Function to deploy domain for a specific stage
deploy_stage_domain() {
    local stage=$1
    echo "🚀 Deploying custom domain for stage: $stage"
    
    # Determine domain name
    if [[ "$stage" == "main" ]]; then
        domain="api.listbackup.ai"
    else
        domain="${stage}.api.listbackup.ai"
    fi
    
    echo "  📍 Domain: $domain"
    
    # Check if the API Gateway stack exists
    if ! aws cloudformation describe-stacks --stack-name "listbackup-api-gateway-${stage}" --profile "$AWS_PROFILE" &> /dev/null; then
        echo "  ⚠️  API Gateway stack not found for stage $stage, skipping..."
        return
    fi
    
    # Deploy the custom domain
    echo "  🔧 Deploying..."
    if sls deploy \
        --config serverless-go-custom-domains.yml \
        --stage "$stage" \
        --aws-profile "$AWS_PROFILE" \
        --verbose; then
        echo "  ✅ Successfully deployed custom domain for $stage"
    else
        echo "  ❌ Failed to deploy custom domain for $stage"
        return 1
    fi
    
    echo ""
}

# Deploy domains for each stage
for stage in "${STAGES[@]}"; do
    deploy_stage_domain "$stage"
done

echo "🎉 Custom domain deployment completed for all stages!"
echo ""
echo "📝 Summary of deployed domains:"
echo "  🌍 api.listbackup.ai (main stage)"
for stage in "${STAGES[@]}"; do
    if [[ "$stage" != "main" ]]; then
        echo "  🌍 ${stage}.api.listbackup.ai"
    fi
done

echo ""
echo "⏳ Note: Custom domains may take up to 40 minutes to become fully available"
echo ""
echo "🔗 Next steps:"
echo "  1. Wait for all domains to become AVAILABLE"
echo "  2. Update your frontend configurations:"
echo "     - Main/Prod: https://api.listbackup.ai"
echo "     - Dev: https://dev.api.listbackup.ai"
echo "     - Staging: https://staging.api.listbackup.ai"
echo "     - Test: https://test.api.listbackup.ai"
echo "  3. Test the API endpoints"
echo ""
echo "📞 Test commands:"
echo "  curl -I https://api.listbackup.ai/system/health"
echo "  curl -I https://dev.api.listbackup.ai/system/health"
echo "  curl -I https://staging.api.listbackup.ai/system/health"
echo ""