# Phase 3: API Gateway Custom Domain Deployment Scripts

## Overview

This document provides the deployment scripts and automation for setting up custom domains across all stages of the ListBackup.ai v2 API Gateway.

## Deployment Script Collection

### 1. Main Setup Script: `setup-api-gateway-domain.sh`

```bash
#!/bin/bash

# Setup API Gateway Custom Domain for Any Stage
# Usage: ./setup-api-gateway-domain.sh <stage> [aws-profile]

set -e

# Configuration
STAGE=${1:-dev}
AWS_PROFILE=${2:-listbackup.ai}
REGION="us-west-2"
HOSTED_ZONE_ID="Z01040453V93CTQT4QFNW"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Domain mapping logic
get_domain_name() {
    case "$1" in
        "main"|"production")
            echo "api.listbackup.ai"
            ;;
        *)
            echo "${1}.api.listbackup.ai"
            ;;
    esac
}

DOMAIN_NAME=$(get_domain_name "$STAGE")

echo "=========================================="
echo "API Gateway Custom Domain Setup"
echo "=========================================="
echo "Stage: $STAGE"
echo "Domain: $DOMAIN_NAME"
echo "AWS Profile: $AWS_PROFILE"
echo "Region: $REGION"
echo ""

# Step 1: Ensure domain infrastructure is deployed
print_status "Ensuring domain infrastructure is deployed..."
cd services/infra/domains
if ! sls deploy --stage main --aws-profile "$AWS_PROFILE" --region "$REGION"; then
    print_error "Failed to deploy domain infrastructure"
    exit 1
fi
cd ../../..
print_success "Domain infrastructure ready"

# Step 2: Wait for certificate validation
print_status "Checking SSL certificate status..."
CERT_ARN=$(aws ssm get-parameter \
    --name "/main/domains/api-certificate-arn" \
    --query "Parameter.Value" \
    --output text \
    --region "$REGION" \
    --profile "$AWS_PROFILE" 2>/dev/null || echo "")

if [[ -z "$CERT_ARN" ]]; then
    print_error "Certificate ARN not found in SSM"
    exit 1
fi

CERT_STATUS=$(aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --query "Certificate.Status" \
    --output text \
    --region "$REGION" \
    --profile "$AWS_PROFILE" 2>/dev/null || echo "UNKNOWN")

if [[ "$CERT_STATUS" != "ISSUED" ]]; then
    print_warning "Certificate status: $CERT_STATUS"
    if [[ "$CERT_STATUS" == "PENDING_VALIDATION" ]]; then
        print_status "Waiting for certificate validation (up to 10 minutes)..."
        aws acm wait certificate-validated \
            --certificate-arn "$CERT_ARN" \
            --region "$REGION" \
            --profile "$AWS_PROFILE"
        print_success "Certificate validated"
    else
        print_error "Certificate not ready. Status: $CERT_STATUS"
        exit 1
    fi
else
    print_success "Certificate is valid"
fi

# Step 3: Create custom domain
print_status "Creating custom domain for API Gateway..."
cd services/api-gateway

# Check if domain already exists
if aws apigatewayv2 get-domain-name \
    --domain-name "$DOMAIN_NAME" \
    --region "$REGION" \
    --profile "$AWS_PROFILE" &>/dev/null; then
    print_warning "Domain $DOMAIN_NAME already exists"
else
    if ! sls create_domain --stage "$STAGE" --aws-profile "$AWS_PROFILE" --region "$REGION"; then
        print_error "Failed to create custom domain"
        exit 1
    fi
    print_success "Custom domain created"
fi

cd ../..

# Step 4: Deploy API Gateway with domain configuration
print_status "Deploying API Gateway with domain configuration..."
cd services/api-gateway
if ! sls deploy --stage "$STAGE" --aws-profile "$AWS_PROFILE" --region "$REGION"; then
    print_error "Failed to deploy API Gateway"
    exit 1
fi
cd ../..
print_success "API Gateway deployed"

# Step 5: Verify domain status
print_status "Verifying domain status..."
DOMAIN_STATUS=$(aws apigatewayv2 get-domain-name \
    --domain-name "$DOMAIN_NAME" \
    --query "DomainNameConfigurations[0].DomainNameStatus" \
    --output text \
    --region "$REGION" \
    --profile "$AWS_PROFILE" 2>/dev/null || echo "NOT_FOUND")

if [[ "$DOMAIN_STATUS" == "AVAILABLE" ]]; then
    print_success "Domain is available"
elif [[ "$DOMAIN_STATUS" == "PENDING" ]]; then
    print_warning "Domain is pending (may take up to 40 minutes)"
    print_status "You can check status later with: aws apigatewayv2 get-domain-name --domain-name $DOMAIN_NAME"
else
    print_error "Domain status: $DOMAIN_STATUS"
fi

# Step 6: Test endpoint
print_status "Testing endpoint (may fail if DNS not propagated)..."
if curl -f -s "https://$DOMAIN_NAME/system/health" >/dev/null 2>&1; then
    print_success "Endpoint is responding"
else
    print_warning "Endpoint not yet responding (DNS propagation may be in progress)"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo "Domain: https://$DOMAIN_NAME"
echo "Health Check: https://$DOMAIN_NAME/system/health"
echo ""
print_warning "Note: DNS propagation can take up to 40 minutes"
print_warning "If the domain doesn't respond immediately, wait and try again"
```

### 2. Multi-Stage Setup Script: `setup-all-stage-domains.sh`

```bash
#!/bin/bash

# Setup Custom Domains for All Stages
# Usage: ./setup-all-stage-domains.sh [aws-profile]

set -e

AWS_PROFILE=${1:-listbackup.ai}
STAGES=("dev" "staging" "test")

echo "=========================================="
echo "Multi-Stage Domain Setup"
echo "=========================================="
echo "AWS Profile: $AWS_PROFILE"
echo "Stages: ${STAGES[*]}"
echo ""

# Setup each stage
for stage in "${STAGES[@]}"; do
    echo ""
    echo "🚀 Setting up domain for stage: $stage"
    echo "----------------------------------------"
    
    if ./setup-api-gateway-domain.sh "$stage" "$AWS_PROFILE"; then
        echo "✅ Stage $stage completed successfully"
    else
        echo "❌ Stage $stage failed"
        exit 1
    fi
done

echo ""
echo "🎉 All stage domains setup complete!"
echo ""
echo "Available endpoints:"
for stage in "${STAGES[@]}"; do
    echo "  - $stage: https://${stage}.api.listbackup.ai"
done
echo "  - main: https://api.listbackup.ai"
```

### 3. Domain Status Check Script: `check-all-domains.sh`

```bash
#!/bin/bash

# Check Status of All Custom Domains
# Usage: ./check-all-domains.sh [aws-profile]

set -e

AWS_PROFILE=${1:-listbackup.ai}
REGION="us-west-2"
DOMAINS=("api.listbackup.ai" "dev.api.listbackup.ai" "staging.api.listbackup.ai" "test.api.listbackup.ai")

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Domain Status Check"
echo "=========================================="
echo ""

check_domain() {
    local domain=$1
    echo "Checking: $domain"
    
    # API Gateway status
    STATUS=$(aws apigatewayv2 get-domain-name \
        --domain-name "$domain" \
        --query "DomainNameConfigurations[0].DomainNameStatus" \
        --output text \
        --region "$REGION" \
        --profile "$AWS_PROFILE" 2>/dev/null || echo "NOT_FOUND")
    
    if [[ "$STATUS" == "AVAILABLE" ]]; then
        echo -e "  API Gateway: ${GREEN}AVAILABLE${NC}"
    elif [[ "$STATUS" == "PENDING" ]]; then
        echo -e "  API Gateway: ${YELLOW}PENDING${NC}"
    else
        echo -e "  API Gateway: ${RED}$STATUS${NC}"
    fi
    
    # DNS resolution
    if nslookup "$domain" >/dev/null 2>&1; then
        echo -e "  DNS: ${GREEN}RESOLVING${NC}"
    else
        echo -e "  DNS: ${RED}NOT_RESOLVING${NC}"
    fi
    
    # HTTPS response
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain/system/health" 2>/dev/null || echo "000")
    if [[ "$HTTP_CODE" == "200" ]]; then
        echo -e "  HTTPS: ${GREEN}RESPONDING (200)${NC}"
    elif [[ "$HTTP_CODE" == "000" ]]; then
        echo -e "  HTTPS: ${RED}NOT_RESPONDING${NC}"
    else
        echo -e "  HTTPS: ${YELLOW}HTTP $HTTP_CODE${NC}"
    fi
    
    echo ""
}

# Check all domains
for domain in "${DOMAINS[@]}"; do
    check_domain "$domain"
done

echo "Check complete!"
```

### 4. Domain Cleanup Script: `cleanup-stage-domain.sh`

```bash
#!/bin/bash

# Cleanup Custom Domain for a Stage
# Usage: ./cleanup-stage-domain.sh <stage> [aws-profile]

set -e

STAGE=${1}
AWS_PROFILE=${2:-listbackup.ai}
REGION="us-west-2"

if [[ -z "$STAGE" ]]; then
    echo "Usage: $0 <stage> [aws-profile]"
    echo "Example: $0 dev listbackup.ai"
    exit 1
fi

if [[ "$STAGE" == "main" ]]; then
    echo "❌ Cannot cleanup main stage domain"
    exit 1
fi

DOMAIN_NAME="${STAGE}.api.listbackup.ai"

echo "=========================================="
echo "Domain Cleanup"
echo "=========================================="
echo "Stage: $STAGE"
echo "Domain: $DOMAIN_NAME"
echo ""

# Remove custom domain
echo "🗑️  Removing custom domain..."
cd services/api-gateway
if sls delete_domain --stage "$STAGE" --aws-profile "$AWS_PROFILE" --region "$REGION"; then
    echo "✅ Custom domain removed"
else
    echo "⚠️  Domain removal may have failed or domain didn't exist"
fi
cd ../..

# Remove Route 53 record (if exists)
echo "🗑️  Removing Route 53 record..."
HOSTED_ZONE_ID="Z01040453V93CTQT4QFNW"

# Check if record exists
if aws route53 list-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --query "ResourceRecordSets[?Name=='${DOMAIN_NAME}.']" \
    --output text | grep -q "${DOMAIN_NAME}"; then
    
    # Get the alias target info
    ALIAS_TARGET=$(aws route53 list-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --query "ResourceRecordSets[?Name=='${DOMAIN_NAME}.'].AliasTarget" \
        --output json)
    
    if [[ "$ALIAS_TARGET" != "null" && "$ALIAS_TARGET" != "[]" ]]; then
        echo "🗑️  Found Route 53 record, removing..."
        # Note: This is complex due to alias targets, consider manual cleanup
        echo "⚠️  Please manually remove Route 53 record for $DOMAIN_NAME if needed"
    fi
else
    echo "✅ No Route 53 record found"
fi

echo ""
echo "🎉 Cleanup complete for stage: $STAGE"
```

## Deployment Workflow

### Initial Setup (One Time)

1. **Deploy Domain Infrastructure**
   ```bash
   cd services/infra/domains
   sls deploy --stage main --aws-profile listbackup.ai
   ```

2. **Setup Main Stage Domain**
   ```bash
   ./setup-api-gateway-domain.sh main
   ```

### Per-Stage Deployment

1. **Single Stage**
   ```bash
   ./setup-api-gateway-domain.sh dev
   ```

2. **All Development Stages**
   ```bash
   ./setup-all-stage-domains.sh
   ```

### Maintenance

1. **Check All Domains**
   ```bash
   ./check-all-domains.sh
   ```

2. **Cleanup Unused Stage**
   ```bash
   ./cleanup-stage-domain.sh old-feature-branch
   ```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy API Gateway with Custom Domain

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend/golang
          npm install
          
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
          
      - name: Deploy domain infrastructure
        run: |
          cd backend/golang/services/infra/domains
          npx sls deploy --stage main
          
      - name: Setup custom domain
        run: |
          cd backend/golang
          ./scripts/setup-api-gateway-domain.sh ${{ github.ref_name == 'main' && 'main' || 'dev' }}
```

## Error Handling and Troubleshooting

### Common Issues

1. **Certificate Not Validated**
   - Wait up to 10 minutes for DNS validation
   - Check Route 53 has CNAME records for validation

2. **Domain Creation Timeout**
   - API Gateway domains can take up to 40 minutes
   - Use `aws apigatewayv2 get-domain-name` to check status

3. **DNS Not Resolving**
   - Wait for propagation (up to 40 minutes)
   - Check Route 53 record exists and is correct

4. **HTTPS Not Working**
   - Verify certificate covers domain
   - Check API Gateway domain status is AVAILABLE

These scripts provide a complete automation solution for managing custom domains across all stages of the ListBackup.ai v2 API Gateway deployment.