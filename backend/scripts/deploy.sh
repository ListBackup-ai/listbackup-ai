#!/bin/bash

# ListBackup.ai Backend Deployment Script
# Usage: ./scripts/deploy.sh [stage] [service]
# Example: ./scripts/deploy.sh main all
# Example: ./scripts/deploy.sh prod nodejs

set -e

STAGE=${1:-main}
SERVICE=${2:-all}
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Deploying ListBackup.ai Backend"
echo "Stage: $STAGE"
echo "Service: $SERVICE"
echo "Root directory: $ROOT_DIR"

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

# Function to deploy a specific service
deploy_service() {
    local service_path=$1
    local service_name=$2
    
    if [ ! -d "$service_path" ]; then
        print_error "Service directory not found: $service_path"
        return 1
    fi
    
    print_status "Deploying $service_name..."
    cd "$service_path"
    
    # Check if serverless configurations exist
    if ! ls serverless-*.yml 1> /dev/null 2>&1 && [ ! -f "serverless.yml" ]; then
        print_error "No serverless configuration found in $service_path"
        return 1
    fi
    
    # Install dependencies if needed
    if [ -f "package.json" ]; then
        print_status "Installing Node.js dependencies for $service_name..."
        npm ci --silent
    fi
    
    if [ -f "requirements.txt" ]; then
        print_status "Python dependencies will be handled by serverless-python-requirements plugin"
    fi
    
    # Deploy services in specific order
    # 1. Core infrastructure first (DynamoDB, S3, SQS, etc.)
    if [ -f "serverless-core.yml" ]; then
        print_status "Deploying core infrastructure..."
        serverless deploy --config "serverless-core.yml" --stage "$STAGE" --aws-profile listbackup.ai --verbose
        
        if [ $? -eq 0 ]; then
            print_success "Successfully deployed core infrastructure"
        else
            print_error "Failed to deploy core infrastructure"
            return 1
        fi
    fi
    
    # 2. Main API Gateway and authorizer
    if [ -f "serverless-api.yml" ]; then
        print_status "Deploying API Gateway..."
        serverless deploy --config "serverless-api.yml" --stage "$STAGE" --aws-profile listbackup.ai --verbose
        
        if [ $? -eq 0 ]; then
            print_success "Successfully deployed API Gateway"
        else
            print_error "Failed to deploy API Gateway"
            return 1
        fi
    fi
    
    # 3. Deploy Auth service (needed by other services)
    if [ -f "serverless-auth.yml" ]; then
        print_status "Deploying auth service..."
        serverless deploy --config "serverless-auth.yml" --stage "$STAGE" --aws-profile listbackup.ai --verbose
        
        if [ $? -eq 0 ]; then
            print_success "Successfully deployed auth service"
        else
            print_error "Failed to deploy auth service"
            return 1
        fi
    fi
    
    # 4. Deploy all other services in parallel-friendly order
    local services=(
        "serverless-sources.yml"
        "serverless-integrations.yml"
        "serverless-jobs.yml"
        "serverless-data.yml"
        "serverless-account.yml"
        "serverless-activity.yml"
        "serverless-system.yml"
        "serverless-billing.yml"
        "serverless-analytics.yml"
    )
    
    for config in "${services[@]}"; do
        if [ -f "$config" ]; then
            print_status "Deploying $config..."
            serverless deploy --config "$config" --stage "$STAGE" --aws-profile listbackup.ai --verbose
            
            if [ $? -eq 0 ]; then
                print_success "Successfully deployed $config"
            else
                print_error "Failed to deploy $config"
                return 1
            fi
        fi
    done
    
    # Deploy any remaining configs not in the specific list
    for config in serverless-*.yml; do
        if [ -f "$config" ] && [[ ! " ${services[@]} " =~ " ${config} " ]] && [ "$config" != "serverless-core.yml" ] && [ "$config" != "serverless-api.yml" ] && [ "$config" != "serverless-auth.yml" ]; then
            print_status "Deploying additional config $config..."
            serverless deploy --config "$config" --stage "$STAGE" --aws-profile listbackup.ai --verbose
            
            if [ $? -eq 0 ]; then
                print_success "Successfully deployed $config"
            else
                print_error "Failed to deploy $config"
                return 1
            fi
        fi
    done
    
    print_success "$service_name deployment completed"
    cd "$ROOT_DIR"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if serverless is installed
    if ! command -v serverless &> /dev/null; then
        print_error "Serverless Framework is not installed"
        print_status "Install with: npm install -g serverless"
        exit 1
    fi
    
    # Check if AWS CLI is configured with the correct profile
    if ! aws sts get-caller-identity --profile listbackup.ai &> /dev/null; then
        print_error "AWS CLI profile 'listbackup.ai' is not configured or credentials are invalid"
        print_status "Run: aws configure --profile listbackup.ai"
        exit 1
    fi
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check Python version
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Function to setup AWS resources
setup_aws_resources() {
    print_status "Setting up AWS SSM parameters..."
    
    # Check if parameters exist, create if they don't (completely separate from v1)
    aws ssm get-parameter --name "/listbackup/jwt-secret" --region us-east-1 --profile listbackup.ai 2>/dev/null || {
        print_status "Creating JWT secret parameter for v2..."
        JWT_SECRET=$(openssl rand -base64 32)
        aws ssm put-parameter --name "/listbackup/jwt-secret" --value "$JWT_SECRET" --type "SecureString" --region us-east-1 --profile listbackup.ai
    }
    
    aws ssm get-parameter --name "/listbackup/jwt-refresh-secret" --region us-east-1 --profile listbackup.ai 2>/dev/null || {
        print_status "Creating JWT refresh secret parameter for v2..."
        JWT_REFRESH_SECRET=$(openssl rand -base64 32)
        aws ssm put-parameter --name "/listbackup/jwt-refresh-secret" --value "$JWT_REFRESH_SECRET" --type "SecureString" --region us-east-1 --profile listbackup.ai
    }
    
    aws ssm get-parameter --name "/listbackup/cors-origin" --region us-east-1 --profile listbackup.ai 2>/dev/null || {
        print_status "Creating CORS origin parameter for v2..."
        CORS_ORIGIN="http://localhost:3002"
        if [ "$STAGE" = "prod" ]; then
            CORS_ORIGIN="https://app.listbackup.ai"
        elif [ "$STAGE" = "staging" ]; then
            CORS_ORIGIN="https://staging.listbackup.ai"
        fi
        aws ssm put-parameter --name "/listbackup/cors-origin" --value "$CORS_ORIGIN" --type "String" --region us-east-1 --profile listbackup.ai
    }
    
    # Create separate SES configuration for v2 emails
    aws ssm get-parameter --name "/listbackup/ses-from-email" --region us-east-1 --profile listbackup.ai 2>/dev/null || {
        print_status "Creating SES from email parameter..."
        SES_FROM_EMAIL="noreply@listbackup.ai"
        if [ "$STAGE" = "main" ]; then
            SES_FROM_EMAIL="main-noreply@listbackup.ai"
        fi
        aws ssm put-parameter --name "/listbackup/ses-from-email" --value "$SES_FROM_EMAIL" --type "String" --region us-east-1 --profile listbackup.ai
    }
    
    print_success "AWS resources setup completed"
}

# Main deployment logic
main() {
    check_prerequisites
    setup_aws_resources
    
    case $SERVICE in
        "all")
            print_status "Deploying all services..."
            
            # Deploy core infrastructure first
            deploy_service "$ROOT_DIR/nodejs" "Node.js Core Services"
            
            # Deploy Python services
            deploy_service "$ROOT_DIR/python" "Python Processing Services"
            
            print_success "All services deployed successfully!"
            ;;
            
        "nodejs")
            deploy_service "$ROOT_DIR/nodejs" "Node.js Services"
            ;;
            
        "python")
            deploy_service "$ROOT_DIR/python" "Python Services"
            ;;
            
        "core")
            cd "$ROOT_DIR/nodejs"
            serverless deploy --config serverless-api.yml --stage "$STAGE" --aws-profile listbackup.ai --verbose
            ;;
            
        *)
            print_error "Unknown service: $SERVICE"
            print_status "Available services: all, nodejs, python, core"
            exit 1
            ;;
    esac
}

# Run the deployment
main