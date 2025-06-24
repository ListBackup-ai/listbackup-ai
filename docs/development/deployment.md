# Deployment Guide

## Overview
ListBackup.ai v2 uses a modular serverless architecture with 12 separate services deployed in a specific order to ensure proper dependencies.

## Prerequisites

### AWS Setup
1. **AWS CLI Configuration**
   ```bash
   aws configure --profile listbackup.ai
   # Enter AWS Access Key ID, Secret Key, Region (us-east-1)
   ```

2. **Serverless Framework**
   ```bash
   npm install -g serverless
   ```

3. **Node.js Dependencies**
   ```bash
   cd backend/nodejs
   npm install
   ```

### Environment Variables
The deployment script automatically creates SSM parameters:
- `/listbackup/jwt-secret`
- `/listbackup/jwt-refresh-secret`
- `/listbackup/cors-origin`
- `/listbackup/ses-from-email`

## Deployment Architecture

### Service Dependencies
```
1. Core Infrastructure (serverless-core.yml)
   ↓
2. API Gateway (serverless-api.yml)
   ↓
3. Authentication (serverless-auth.yml)
   ↓
4. Business Services (sources, jobs, data, etc.)
```

### 12 Serverless Services
1. **serverless-core.yml** - Infrastructure (DynamoDB, S3, SQS)
2. **serverless-api.yml** - API Gateway + JWT Authorizer
3. **serverless-auth.yml** - Authentication endpoints
4. **serverless-sources.yml** - Data source management
5. **serverless-jobs.yml** - Backup job management
6. **serverless-data.yml** - Data browsing and export
7. **serverless-account.yml** - Account hierarchy management
8. **serverless-activity.yml** - Activity monitoring
9. **serverless-system.yml** - System health checks
10. **serverless-billing.yml** - Stripe billing integration
11. **serverless-analytics.yml** - Data analytics
12. **serverless-integrations.yml** - Available integrations

## Deployment Commands

### Full Deployment
```bash
# Deploy all services in correct order
cd backend/nodejs
./scripts/deploy.sh main all
```

### Individual Service Deployment
```bash
# Deploy specific service
./scripts/deploy.sh main nodejs

# Deploy core infrastructure only
./scripts/deploy.sh main core
```

### Manual Service Deployment
```bash
# Core infrastructure first
serverless deploy --config serverless-core.yml --stage main --aws-profile listbackup.ai

# API Gateway second
serverless deploy --config serverless-api.yml --stage main --aws-profile listbackup.ai

# Authentication third
serverless deploy --config serverless-auth.yml --stage main --aws-profile listbackup.ai

# Individual services
serverless deploy --config serverless-sources.yml --stage main --aws-profile listbackup.ai
```

## Deployment Script Details

### Script Location
`/backend/scripts/deploy.sh`

### Usage
```bash
./scripts/deploy.sh [stage] [service]

# Examples:
./scripts/deploy.sh main all       # Deploy all services to main stage
./scripts/deploy.sh main nodejs    # Deploy only Node.js services
./scripts/deploy.sh dev core       # Deploy core to dev stage
```

### Deployment Order
1. **Prerequisites Check**
   - Serverless CLI installed
   - AWS profile configured
   - Node.js and Python available

2. **AWS Resources Setup**
   - Create SSM parameters if they don't exist
   - Set stage-appropriate values

3. **Service Deployment**
   - Core infrastructure
   - API Gateway
   - Authentication
   - Business services (parallel-safe)

## API Gateway Configuration

### Custom Domain
- **Domain**: `api.listbackup.ai`
- **SSL Certificate**: Global wildcard (*.listbackup.ai)
- **API Gateway ID**: `ln1x8lz9xc` (shared across services)

### Service Registration
All services reference the shared API Gateway:
```yaml
httpApi:
  id: ln1x8lz9xc  # Reference main gateway
```

## Environment Configuration

### Stage Variables
- **main**: Production-like environment
- **dev**: Development environment (legacy)

### Environment Variables
```yaml
STAGE: ${self:provider.stage}
DYNAMODB_TABLE_PREFIX: listbackup-${self:provider.stage}
S3_BUCKET: listbackup-data-${self:provider.stage}
API_VERSION: v2
CORS_ORIGIN: ${ssm:/listbackup/cors-origin}
```

## Database Schema

### DynamoDB Tables
All tables are created in `serverless-core.yml`:
- `listbackup-main-users`
- `listbackup-main-accounts` 
- `listbackup-main-users-accounts`
- `listbackup-main-sources`
- `listbackup-main-jobs`
- `listbackup-main-runs`
- `listbackup-main-files`
- `listbackup-main-activity`

### Additional Tables
API-specific tables in `serverless-api.yml`:
- `listbackup-main-oauth-states`
- `listbackup-main-api-keys`

## Storage Configuration

### S3 Bucket
- **Name**: `listbackup-data-main`
- **Features**: Versioning, encryption, lifecycle policies
- **Triggers**: File indexer Lambda function

### SQS Queues
- **Job Queue**: `listbackup-job-queue-main`
- **Data Queue**: `listbackup-data-queue-main`
- **Dead Letter Queues**: Automatic retry handling

## Monitoring and Logs

### CloudWatch Logs
Each service creates its own log group:
- `/aws/lambda/listbackup-core-main-fileIndexer`
- `/aws/lambda/listbackup-api-main-authorizer`
- `/aws/lambda/listbackup-sources-main-getSources`
- etc.

### Metrics
Built-in AWS Lambda metrics for:
- Invocation count
- Duration
- Error rate
- Throttles

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```bash
   # Check AWS profile
   aws sts get-caller-identity --profile listbackup.ai
   ```

2. **SSM Parameter Missing**
   ```bash
   # Check parameters
   aws ssm get-parameters --names "/listbackup/jwt-secret" --profile listbackup.ai
   ```

3. **API Gateway Reference Error**
   ```bash
   # Verify API Gateway exists
   aws apigatewayv2 get-apis --profile listbackup.ai
   ```

4. **DynamoDB Table Already Exists**
   ```bash
   # Check existing tables
   aws dynamodb list-tables --profile listbackup.ai
   ```

### Rollback Procedures

1. **Individual Service Rollback**
   ```bash
   serverless remove --config serverless-sources.yml --stage main --aws-profile listbackup.ai
   ```

2. **Full Environment Cleanup**
   ```bash
   # Remove all services in reverse order
   for service in integrations analytics billing system activity account data jobs sources auth api core; do
     serverless remove --config serverless-${service}.yml --stage main --aws-profile listbackup.ai
   done
   ```

## Performance Optimization

### Cold Start Reduction
- Minimal dependencies in Lambda functions
- ESBuild bundling with tree shaking
- Shared layers for common utilities

### Cost Optimization
- Pay-per-request DynamoDB billing
- S3 lifecycle policies for data archival
- Lambda provisioned concurrency for critical functions

## Security Considerations

### IAM Permissions
- Minimal permissions per service
- No cross-service access except through API Gateway
- Secrets stored in SSM Parameter Store

### Network Security
- API Gateway with custom domain and SSL
- CORS configured for allowed origins
- No direct database access from frontend

## CI/CD Integration

### GitHub Actions (Future)
```yaml
# .github/workflows/deploy.yml
- name: Deploy Backend
  run: |
    cd backend/nodejs
    ./scripts/deploy.sh main all
```

### Environment Promotion
```bash
# Deploy to staging first
./scripts/deploy.sh staging all

# Promote to production
./scripts/deploy.sh main all
```