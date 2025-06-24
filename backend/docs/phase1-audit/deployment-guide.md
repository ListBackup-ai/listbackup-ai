# ListBackup.ai v2 Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the ListBackup.ai v2 serverless infrastructure, respecting all cross-stack dependencies.

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Serverless Framework v4 installed
3. AWS profile named `listbackup.ai` configured
4. Go 1.21+ installed (for building Lambda functions)
5. Node.js 18+ installed (for Serverless Framework)

## Pre-Deployment Checklist

- [ ] Verify AWS credentials: `aws sts get-caller-identity --profile listbackup.ai`
- [ ] Check Serverless Framework version: `serverless --version`
- [ ] Ensure you're in the correct directory: `/backend/golang/services`
- [ ] Build all Go binaries (if not already built)
- [ ] Review environment-specific configurations

## Deployment Order

### Stage 1: Infrastructure Services

#### 1.1 Deploy Domain Infrastructure (Optional)
Only needed if SSL certificates don't exist:

```bash
cd infra/domains
serverless deploy --stage main --aws-profile listbackup.ai
cd ../..
```

**Exports Created:**
- `listbackup-infra-domains-main-SSLCertificateArn`

**Time:** 5-10 minutes (DNS validation can take time)

### Stage 2: Core Infrastructure

#### 2.1 Deploy Core Service
This creates all shared infrastructure:

```bash
cd core
serverless deploy --stage main --aws-profile listbackup.ai
cd ..
```

**Resources Created:**
- 14 DynamoDB tables
- 1 S3 bucket
- 6 SQS FIFO queues with DLQs
- 1 Cognito User Pool
- 1 EventBridge Event Bus

**Exports Created:** 34 total exports (see cross-stack-references.md)

**Time:** 10-15 minutes

### Stage 3: API Gateway

#### 3.1 Deploy API Gateway Service

```bash
cd api-gateway
serverless deploy --stage main --aws-profile listbackup.ai
cd ..
```

**Resources Created:**
- HTTP API Gateway
- Custom domain configuration
- JWT Authorizer

**Exports Created:**
- `listbackup-api-gateway-main-HttpApiId`
- `listbackup-api-gateway-main-HttpApiEndpoint`
- `listbackup-api-gateway-main-CustomDomainEndpoint`
- `listbackup-api-gateway-main-CognitoAuthorizerId`

**Time:** 5 minutes

### Stage 4: Application Services

All services in this stage can be deployed in parallel. You can use the provided batch deployment script or deploy individually.

#### 4.1 Batch Deployment (Recommended)

Create a deployment script `deploy-app-services.sh`:

```bash
#!/bin/bash
set -e

STAGE=${1:-main}
PROFILE=${2:-listbackup.ai}

# Array of services to deploy
services=(
    "auth"
    "users"
    "accounts"
    "teams"
    "sources"
    "platforms"
    "integrations"
    "jobs"
    "billing"
    "connections"
    "source-groups"
    "notifications"
    "system"
    "tags"
    "dashboards"
    "clients"
)

# Deploy each service
for service in "${services[@]}"; do
    echo "Deploying $service..."
    cd "$service"
    serverless deploy --stage "$STAGE" --aws-profile "$PROFILE" &
    cd ..
done

# Wait for all background jobs to complete
wait

echo "All services deployed successfully!"
```

Run the script:
```bash
chmod +x deploy-app-services.sh
./deploy-app-services.sh main listbackup.ai
```

#### 4.2 Individual Service Deployment

If you prefer to deploy services individually:

```bash
# Auth Service
cd auth && serverless deploy --stage main --aws-profile listbackup.ai && cd ..

# Users Service
cd users && serverless deploy --stage main --aws-profile listbackup.ai && cd ..

# Continue for each service...
```

**Time:** 5-10 minutes per service (faster in parallel)

## Post-Deployment Verification

### 1. Verify API Gateway

```bash
# Check API endpoint
curl https://api.listbackup.ai/system/health

# Expected response:
# {"status":"healthy","timestamp":"..."}
```

### 2. Verify Core Infrastructure

```bash
# List DynamoDB tables
aws dynamodb list-tables --profile listbackup.ai | grep listbackup-main

# Check S3 bucket
aws s3 ls s3://listbackup-data-main --profile listbackup.ai

# Check SQS queues
aws sqs list-queues --profile listbackup.ai | grep listbackup
```

### 3. Test Authentication

```bash
# Register a test user
curl -X POST https://api.listbackup.ai/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User"
  }'

# Login
curl -X POST https://api.listbackup.ai/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

## Troubleshooting

### Common Issues

#### 1. "Export not found" Error
**Cause:** Trying to deploy a service before its dependencies
**Solution:** Ensure deployment order is followed

#### 2. "Certificate validation in progress"
**Cause:** SSL certificate DNS validation pending
**Solution:** Check Route53 for validation records, wait for validation

#### 3. "Authorizer not found"
**Cause:** Hardcoded authorizer ID mismatch
**Solution:** Verify authorizer ID matches the exported value

#### 4. "Table already exists"
**Cause:** Previous partial deployment
**Solution:** Either delete the stack or use `serverless remove`

### Rollback Procedure

To rollback a failed deployment:

```bash
# Remove services in reverse order
cd [service-name]
serverless remove --stage main --aws-profile listbackup.ai
cd ..
```

## Environment-Specific Deployments

### Development Environment

```bash
# Deploy with stage=dev
serverless deploy --stage dev --aws-profile listbackup.ai
```

### Production Environment

```bash
# Deploy with stage=prod
serverless deploy --stage prod --aws-profile listbackup.ai

# Consider using --verbose for detailed output
serverless deploy --stage prod --aws-profile listbackup.ai --verbose
```

## Updating Individual Services

To update a single service after initial deployment:

```bash
cd [service-name]

# Deploy only function changes (faster)
serverless deploy function -f [function-name] --stage main

# Deploy full service update
serverless deploy --stage main --aws-profile listbackup.ai
```

## Monitoring Deployment

### CloudFormation Console

Monitor deployment progress in real-time:
1. AWS Console → CloudFormation
2. Select your region (us-west-2)
3. Watch stack events for each service

### CLI Monitoring

```bash
# Watch stack events
aws cloudformation describe-stack-events \
  --stack-name listbackup-[service]-main \
  --profile listbackup.ai \
  --query 'StackEvents[0:10]'

# Check stack status
aws cloudformation describe-stacks \
  --stack-name listbackup-[service]-main \
  --profile listbackup.ai \
  --query 'Stacks[0].StackStatus'
```

## Deployment Automation

### GitHub Actions Example

```yaml
name: Deploy ListBackup.ai v2

on:
  push:
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
          
      - name: Install Serverless
        run: npm install -g serverless@4
        
      - name: Deploy Core
        run: |
          cd backend/golang/services/core
          serverless deploy --stage ${{ env.STAGE }}
          
      - name: Deploy API Gateway
        run: |
          cd backend/golang/services/api-gateway
          serverless deploy --stage ${{ env.STAGE }}
          
      - name: Deploy App Services
        run: |
          cd backend/golang/services
          ./deploy-app-services.sh ${{ env.STAGE }}
```

## Maintenance Windows

Recommended maintenance windows for updates:
- **Development**: Anytime
- **Staging**: Weekdays 10 PM - 2 AM
- **Production**: Weekends 2 AM - 6 AM (lowest traffic)

## Conclusion

Following this deployment guide ensures all services are deployed in the correct order with proper dependency resolution. Always verify each stage before proceeding to the next, and maintain backups of your infrastructure state.