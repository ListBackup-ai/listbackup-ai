#!/bin/bash

# Check ListBackup API Custom Domain Status
# Usage: ./scripts/check-domain-status.sh [aws-profile]

set -e  # Exit on any error

# Default values
AWS_PROFILE=${1:-default}
REGION="us-west-2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check SSL certificate status
check_ssl_certificate() {
    print_status "Checking SSL certificate status..."
    
    # Get certificate ARN from CloudFormation exports
    CERT_ARN=$(aws cloudformation list-exports --region "$REGION" --profile "$AWS_PROFILE" \
        --query "Exports[?Name=='listbackup-ssl-certificate-arn'].Value" --output text 2>/dev/null || echo "")
    
    if [[ -n "$CERT_ARN" ]]; then
        print_success "SSL certificate found: $CERT_ARN"
        
        # Get certificate details
        CERT_STATUS=$(aws acm describe-certificate --certificate-arn "$CERT_ARN" --region "$REGION" --profile "$AWS_PROFILE" \
            --query "Certificate.Status" --output text 2>/dev/null || echo "UNKNOWN")
        
        if [[ "$CERT_STATUS" == "ISSUED" ]]; then
            print_success "SSL certificate is issued and valid"
        elif [[ "$CERT_STATUS" == "PENDING_VALIDATION" ]]; then
            print_warning "SSL certificate is pending validation"
        else
            print_error "SSL certificate status: $CERT_STATUS"
        fi
    else
        print_error "SSL certificate not found in CloudFormation exports"
    fi
}

# Function to check domain status
check_domain_status() {
    local domain=$1
    local stage=$2
    
    print_status "Checking domain: $domain"
    
    # Check if domain exists in API Gateway
    DOMAIN_STATUS=$(aws apigatewayv2 get-domain-name --domain-name "$domain" --region "$REGION" --profile "$AWS_PROFILE" \
        --query "DomainNameConfigurations[0].DomainNameStatus" --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [[ "$DOMAIN_STATUS" == "AVAILABLE" ]]; then
        print_success "Domain $domain is available"
    elif [[ "$DOMAIN_STATUS" == "UPDATING" ]]; then
        print_warning "Domain $domain is updating"
    elif [[ "$DOMAIN_STATUS" == "PENDING" ]]; then
        print_warning "Domain $domain is pending (may take up to 40 minutes)"
    elif [[ "$DOMAIN_STATUS" == "NOT_FOUND" ]]; then
        print_error "Domain $domain not found in API Gateway"
    else
        print_error "Domain $domain status: $DOMAIN_STATUS"
    fi
    
    # Check DNS resolution
    if nslookup "$domain" >/dev/null 2>&1; then
        print_success "DNS resolution working for $domain"
    else
        print_warning "DNS resolution may not be working for $domain"
    fi
    
    # Check HTTPS response
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain/placeholder" 2>/dev/null || echo "000")
    if [[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "404" ]]; then
        print_success "HTTPS response from $domain (status: $HTTP_STATUS)"
    else
        print_warning "HTTPS not responding from $domain (status: $HTTP_STATUS)"
    fi
}

# Function to check all domains for a stage
check_stage_domains() {
    local stage=$1
    
    print_status "Checking domains for stage: $stage"
    
    if [[ "$stage" == "main" || "$stage" == "prod" || "$stage" == "production" ]]; then
        check_domain_status "api.listbackup.ai" "$stage"
        check_domain_status "main.api.listbackup.ai" "$stage"
    else
        check_domain_status "${stage}.api.listbackup.ai" "$stage"
    fi
}

# Function to check API Gateway status
check_api_gateway() {
    print_status "Checking API Gateway status..."
    
    # Get API ID from CloudFormation exports
    API_ID=$(aws cloudformation list-exports --region "$REGION" --profile "$AWS_PROFILE" \
        --query "Exports[?contains(Name, 'listbackup-api-gateway') && contains(Name, 'HttpApiId')].Value" --output text 2>/dev/null || echo "")
    
    if [[ -n "$API_ID" ]]; then
        print_success "API Gateway found: $API_ID"
        
        # Check API status
        API_STATUS=$(aws apigatewayv2 get-api --api-id "$API_ID" --region "$REGION" --profile "$AWS_PROFILE" \
            --query "ApiState" --output text 2>/dev/null || echo "UNKNOWN")
        
        if [[ "$API_STATUS" == "ACTIVE" ]]; then
            print_success "API Gateway is active"
        else
            print_error "API Gateway status: $API_STATUS"
        fi
    else
        print_error "API Gateway not found in CloudFormation exports"
    fi
}

# Function to show summary
show_summary() {
    print_status "Domain Status Summary:"
    echo ""
    echo "Available domains:"
    echo "  - api.listbackup.ai (main/prod/production stages)"
    echo "  - main.api.listbackup.ai (main stage only)"
    echo "  - dev.api.listbackup.ai (dev stage)"
    echo "  - staging.api.listbackup.ai (staging stage)"
    echo "  - test.api.listbackup.ai (test stage)"
echo ""
    print_warning "Note: DNS propagation can take up to 40 minutes"
    print_warning "SSL certificate validation can take 5-10 minutes"
}

# Main function
main() {
    echo "=========================================="
    echo "ListBackup API Custom Domain Status Check"
    echo "=========================================="
    echo ""
    
    check_ssl_certificate
    echo ""
    check_api_gateway
echo ""
    check_stage_domains "main"
    echo ""
    show_summary
}

# Run main function
main "$@"