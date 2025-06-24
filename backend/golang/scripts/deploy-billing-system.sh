#!/bin/bash

# Deploy Billing System for ListBackup.ai v2
# This script deploys the complete billing and plan management system

set -e

# Configuration
STAGE=${1:-dev}
REGION=${2:-us-east-1}
AWS_PROFILE=${3:-listbackup.ai}

echo "🚀 Deploying ListBackup.ai Billing System"
echo "Stage: $STAGE"
echo "Region: $REGION"
echo "AWS Profile: $AWS_PROFILE"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if serverless is installed
if ! command -v sls &> /dev/null; then
    echo "❌ Serverless Framework not found. Please install: npm install -g serverless"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity --profile $AWS_PROFILE &> /dev/null; then
    echo "❌ AWS CLI not configured for profile: $AWS_PROFILE"
    exit 1
fi

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go not found. Please install Go 1.19 or later"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Set environment variables
export AWS_PROFILE=$AWS_PROFILE
export STAGE=$STAGE
export REGION=$REGION

# Navigate to the Go backend directory
cd "$(dirname "$0")/.."

echo "📦 Building Go handlers..."

# Build all billing handlers
echo "Building billing handlers..."
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o bin/create-subscription cmd/handlers/billing/create-subscription/main.go
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o bin/get-subscription cmd/handlers/billing/get-subscription/main.go
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o bin/cancel-subscription cmd/handlers/billing/cancel-subscription/main.go
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o bin/list-plans cmd/handlers/billing/list-plans/main.go
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o bin/list-payment-methods cmd/handlers/billing/list-payment-methods/main.go
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o bin/list-invoices cmd/handlers/billing/list-invoices/main.go
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o bin/get-usage cmd/handlers/billing/get-usage/main.go
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o bin/stripe-webhook cmd/handlers/billing/stripe-webhook/main.go
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o bin/billing-analytics cmd/handlers/billing/analytics/main.go
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o bin/plan-comparison cmd/handlers/billing/plan-comparison/main.go
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o bin/enterprise-billing cmd/handlers/billing/enterprise/main.go

echo "✅ Go handlers built successfully"
echo ""

# Deploy the billing service
echo "🚀 Deploying billing service..."
sls deploy --config serverless-go-billing.yml --stage $STAGE --region $REGION --aws-profile $AWS_PROFILE

if [ $? -eq 0 ]; then
    echo "✅ Billing service deployed successfully"
else
    echo "❌ Failed to deploy billing service"
    exit 1
fi

echo ""

# Setup billing plans and Cognito groups
echo "📊 Setting up billing plans and Cognito groups..."

# Get the DynamoDB table name and Cognito User Pool ID from environment
export DYNAMODB_TABLE="listbackup-api-billing-$STAGE"
export COGNITO_USER_POOL_ID=$(aws ssm get-parameter --name "/listbackup/$STAGE/cognito/user-pool-id" --query 'Parameter.Value' --output text --profile $AWS_PROFILE)

if [ -z "$COGNITO_USER_POOL_ID" ]; then
    echo "❌ Could not retrieve Cognito User Pool ID from SSM"
    exit 1
fi

echo "Using DynamoDB table: $DYNAMODB_TABLE"
echo "Using Cognito User Pool: $COGNITO_USER_POOL_ID"

# Build and run the setup script
GOOS=linux GOARCH=arm64 go build -o bin/setup-billing-plans scripts/setup-billing-plans.go
DYNAMODB_TABLE=$DYNAMODB_TABLE COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID ./bin/setup-billing-plans

if [ $? -eq 0 ]; then
    echo "✅ Billing plans and Cognito groups set up successfully"
else
    echo "❌ Failed to set up billing plans"
    exit 1
fi

echo ""

# Get the Stripe webhook URL for configuration
echo "📋 Getting Stripe webhook URL..."
STRIPE_WEBHOOK_URL=$(aws cloudformation describe-stacks \
    --stack-name "listbackup-api-billing-$STAGE" \
    --query 'Stacks[0].Outputs[?OutputKey==`StripeWebhookUrl`].OutputValue' \
    --output text \
    --region $REGION \
    --profile $AWS_PROFILE)

if [ -n "$STRIPE_WEBHOOK_URL" ]; then
    echo "✅ Stripe webhook URL: $STRIPE_WEBHOOK_URL"
else
    echo "❌ Could not retrieve Stripe webhook URL"
fi

echo ""

# Display deployment summary
echo "🎉 Billing System Deployment Complete!"
echo ""
echo "📊 Deployment Summary:"
echo "├─ Stage: $STAGE"
echo "├─ Region: $REGION"
echo "├─ DynamoDB Table: $DYNAMODB_TABLE"
echo "├─ Cognito User Pool: $COGNITO_USER_POOL_ID"
echo "└─ Stripe Webhook URL: $STRIPE_WEBHOOK_URL"
echo ""

echo "🔧 Next Steps:"
echo "1. Configure Stripe webhook endpoint: $STRIPE_WEBHOOK_URL"
echo "2. Update Stripe price IDs in the plan configuration"
echo "3. Set up SSL/DNS for custom domains (if using)"
echo "4. Test the billing flows with Stripe test mode"
echo "5. Configure monitoring and alerts"
echo ""

echo "📚 Available Endpoints:"
echo "├─ POST /billing/subscriptions - Create subscription"
echo "├─ GET  /billing/subscription - Get current subscription"
echo "├─ POST /billing/subscription/cancel - Cancel subscription"
echo "├─ GET  /billing/plans - List all plans (public)"
echo "├─ GET  /billing/payment-methods - List payment methods"
echo "├─ GET  /billing/invoices - List invoices"
echo "├─ GET  /billing/usage - Get usage analytics"
echo "├─ GET  /billing/analytics - Advanced billing analytics (Enterprise)"
echo "├─ GET  /billing/plan-comparison - Plan comparison and pricing calculator"
echo "├─ POST /billing/enterprise - Enterprise billing requests"
echo "└─ POST /billing/stripe/webhook - Stripe webhook handler"
echo ""

echo "✅ Billing system is ready for use!"