#!/bin/bash

# Script to deploy auth service with all its dependencies using serverless compose

echo "=== Deploying Auth Service with Dependencies ==="
echo "This will deploy:"
echo "  - Infrastructure services (DynamoDB, SQS, S3, EventBridge, Cognito)"
echo "  - API Gateway"
echo "  - Auth Service"
echo ""

# Set variables
STAGE=${1:-main}
PROFILE=${2:-listbackup.ai}

echo "Stage: $STAGE"
echo "AWS Profile: $PROFILE"
echo ""

# Deploy using serverless compose
echo "Starting deployment..."
serverless deploy --config serverless-compose.yml --stage $STAGE --aws-profile $PROFILE

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "=== Deployment Complete ==="
    echo "Auth service and all dependencies have been deployed successfully!"
    echo ""
    echo "API Endpoint: https://b554ytt8w9.execute-api.us-west-2.amazonaws.com"
    echo ""
    echo "Test the auth service with:"
    echo "  ./test-all-auth-endpoints.sh"
else
    echo ""
    echo "=== Deployment Failed ==="
    echo "Check the error messages above for details."
    exit 1
fi