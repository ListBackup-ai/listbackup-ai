#!/bin/bash

# Script to remove all serverless deployments in reverse dependency order
# This ensures clean removal without dependency conflicts

set -e  # Exit on error

echo "🔴 WARNING: This will remove ALL serverless deployments from AWS!"
echo "This includes:"
echo "  - All Lambda functions"
echo "  - All API Gateway endpoints"
echo "  - All DynamoDB tables"
echo "  - All S3 buckets (if empty)"
echo "  - All SQS queues"
echo "  - All EventBridge rules"
echo "  - All Cognito resources"
echo "  - All CloudFormation stacks"
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Default stage and profile
STAGE=${1:-main}
AWS_PROFILE=${AWS_PROFILE:-listbackup.ai}
AWS_REGION=${AWS_REGION:-us-west-2}
export AWS_PROFILE
export AWS_REGION

echo "Using AWS Profile: $AWS_PROFILE"
echo "Using AWS Region: $AWS_REGION"
echo "Removing services for stage: $STAGE"
echo ""

# Function to remove a service
remove_service() {
    local service_name=$1
    local service_path=$2
    
    echo "===================="
    echo "Removing $service_name..."
    echo "===================="
    
    if [ -d "$service_path" ]; then
        cd "$service_path"
        if [ -f "serverless.yml" ]; then
            serverless remove --stage $STAGE || echo "⚠️  Failed to remove $service_name (might not be deployed)"
        else
            echo "⚠️  No serverless.yml found in $service_path"
        fi
        cd - > /dev/null
    else
        echo "⚠️  Directory not found: $service_path"
    fi
    
    echo ""
}

# Remove in reverse order of dependencies

echo "Phase 4: Removing API Services..."
remove_service "System Service" "./api/system"
remove_service "Tags Service" "./api/tags"
remove_service "Source Groups Service" "./api/source-groups"
remove_service "Connections Service" "./api/connections"
remove_service "Clients Service" "./api/clients"
remove_service "Domains Service" "./api/domains"
remove_service "Dashboards Service" "./api/dashboards"
remove_service "Notifications Service" "./api/notifications"
remove_service "Billing Service" "./api/billing"
remove_service "Integrations Service" "./api/integrations"
remove_service "Platforms Service" "./api/platforms"
remove_service "Jobs Service" "./api/jobs"
remove_service "Sources Service" "./api/sources"
remove_service "Teams Service" "./api/teams"
remove_service "Accounts Service" "./api/accounts"
remove_service "Users Service" "./api/users"
remove_service "Auth Service" "./api/auth"

echo "Phase 3: Removing API Gateway..."
remove_service "API Gateway" "./api/gateway"

echo "Phase 2: Removing Dependent Infrastructure..."
remove_service "Domains Infrastructure" "./infrastructure/domains"
remove_service "Cognito Infrastructure" "./infrastructure/cognito"
remove_service "EventBridge Infrastructure" "./infrastructure/eventbridge"

echo "Phase 1: Removing Core Infrastructure..."
remove_service "S3 Infrastructure" "./infrastructure/s3"
remove_service "SQS Infrastructure" "./infrastructure/sqs"
remove_service "DynamoDB Infrastructure" "./infrastructure/dynamodb"

echo ""
echo "✅ All services removal completed!"
echo ""
echo "Note: Some resources might fail to delete if they contain data:"
echo "  - S3 buckets with objects"
echo "  - DynamoDB tables with deletion protection"
echo "  - CloudFormation stacks with termination protection"
echo ""
echo "You may need to manually clean these up in the AWS Console."
echo ""
echo "To redeploy everything, use:"
echo "  cd /Users/nickkulavic/Projects/listbackup-ai/backend/golang/services"
echo "  serverless deploy --stage $STAGE"