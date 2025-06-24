#!/bin/bash

# Deploy ListBackup API with Custom Domains
# Usage: ./scripts/deploy-with-custom-domains.sh [stage] [aws-profile]

set -e  # Exit on any error

# Default values
STAGE=${1:-main}
AWS_PROFILE=${2:-default}
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists serverless; then
        print_error "Serverless Framework is not installed. Please install it with: npm install -g serverless"
        exit 1
    fi
    
    if ! command_exists aws; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity --profile "$AWS_PROFILE" >/dev/null 2>&1; then
        print_error "AWS credentials not configured for profile: $AWS_PROFILE"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to deploy main API Gateway with custom domains
deploy_api_gateway() {
    print_status "Deploying main API Gateway with custom domains..."
    
    if sls deploy --config serverless-go-api-gateway.yml --stage "$STAGE" --aws-profile "$AWS_PROFILE" --region "$REGION"; then
        print_success "Main API Gateway deployed successfully"
    else
        print_error "Failed to deploy main API Gateway"
        exit 1
    fi
}

# Function to deploy additional main domain (for main stage only)
deploy_main_domain() {
    if [[ "$STAGE" == "main" || "$STAGE" == "prod" || "$STAGE" == "production" ]]; then
        print_status "Deploying additional main.api.listbackup.ai domain..."
        
        if sls deploy --config serverless-go-main-domain.yml --stage "$STAGE" --aws-profile "$AWS_PROFILE" --region "$REGION"; then
            print_success "Additional main domain deployed successfully"
        else
            print_error "Failed to deploy additional main domain"
            exit 1
        fi
    else
        print_status "Skipping additional main domain for stage: $STAGE"
    fi
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Get the domain name based on stage
    if [[ "$STAGE" == "main" || "$STAGE" == "prod" || "$STAGE" == "production" ]]; then
        DOMAIN="api.listbackup.ai"
        ADDITIONAL_DOMAIN="main.api.listbackup.ai"
    else
        DOMAIN="${STAGE}.api.listbackup.ai"
        ADDITIONAL_DOMAIN=""
    fi
    
    print_status "Checking domain: $DOMAIN"
    
    # Check if domain is accessible (basic check)
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/placeholder" 2>/dev/null | grep -q "200\|404"; then
        print_success "Domain $DOMAIN is responding"
    else
        print_warning "Domain $DOMAIN may not be fully propagated yet"
    fi
    
    # Check additional domain for main stage
    if [[ -n "$ADDITIONAL_DOMAIN" ]]; then
        print_status "Checking additional domain: $ADDITIONAL_DOMAIN"
        if curl -s -o /dev/null -w "%{http_code}" "https://$ADDITIONAL_DOMAIN/placeholder" 2>/dev/null | grep -q "200\|404"; then
            print_success "Additional domain $ADDITIONAL_DOMAIN is responding"
        else
            print_warning "Additional domain $ADDITIONAL_DOMAIN may not be fully propagated yet"
        fi
    fi
}

# Function to show deployment summary
show_summary() {
    print_status "Deployment Summary:"
    echo "  Stage: $STAGE"
    echo "  Region: $REGION"
    echo "  AWS Profile: $AWS_PROFILE"
    
    if [[ "$STAGE" == "main" || "$STAGE" == "prod" || "$STAGE" == "production" ]]; then
        echo "  Primary Domain: https://api.listbackup.ai"
        echo "  Additional Domain: https://main.api.listbackup.ai"
    else
        echo "  Domain: https://${STAGE}.api.listbackup.ai"
    fi
    
    echo ""
    print_warning "Note: DNS propagation may take up to 40 minutes"
    print_warning "SSL certificate validation may take 5-10 minutes"
}

# Main deployment flow
main() {
    echo "=========================================="
    echo "ListBackup API Custom Domain Deployment"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    deploy_api_gateway
    deploy_main_domain
    verify_deployment
    show_summary
    
    print_success "Deployment completed successfully!"
}

# Run main function
main "$@" 