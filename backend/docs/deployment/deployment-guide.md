# Deployment Guide

This guide covers the complete deployment process for the ListBackup.ai backend services.

## Deployment Overview

```mermaid
graph TB
    subgraph "Deployment Pipeline"
        DEV[Development<br/>Feature Branches]
        STAGING[Staging<br/>develop Branch]
        PROD[Production<br/>main Branch]
    end
    
    subgraph "CI/CD Process"
        GH[GitHub Actions]
        TEST[Automated Tests]
        BUILD[Build & Package]
        DEPLOY[Deploy to AWS]
    end
    
    subgraph "AWS Environments"
        AWS_DEV[Dev Account<br/>Rapid Testing]
        AWS_STG[Staging Account<br/>Pre-production]
        AWS_PROD[Production Account<br/>Live System]
    end
    
    DEV --> GH
    STAGING --> GH
    PROD --> GH
    
    GH --> TEST
    TEST --> BUILD
    BUILD --> DEPLOY
    
    DEPLOY --> AWS_DEV
    DEPLOY --> AWS_STG
    DEPLOY --> AWS_PROD
    
    style PROD fill:#ffebee
    style AWS_PROD fill:#ffcdd2
```

## Prerequisites

### Required Tools

```mermaid
graph LR
    subgraph "Local Tools"
        AWS_CLI[AWS CLI v2]
        GO[Go 1.21+]
        NODE[Node.js 20+]
        SLS[Serverless v4]
        MAKE[GNU Make]
        GIT[Git]
    end
    
    subgraph "AWS Services"
        IAM[IAM User/Role]
        S3[S3 Deployment Bucket]
        SSM[Parameter Store]
        SECRETS[Secrets Manager]
    end
    
    subgraph "Accounts"
        GITHUB[GitHub Account]
        AWS_ACCOUNT[AWS Account]
        DOMAIN[Domain Name]
    end
    
    AWS_CLI --> IAM
    SLS --> S3
    SLS --> SSM
    GO --> SECRETS
```

### Installation Steps

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Install Go
brew install go

# Install Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Install Serverless Framework
npm install -g serverless

# Install Make
brew install make
```

## AWS Configuration

### Profile Setup

```bash
# Configure AWS profile
aws configure --profile listbackup.ai

# Verify configuration
aws sts get-caller-identity --profile listbackup.ai
```

### Required IAM Permissions

```mermaid
graph TD
    subgraph "Deployment Role"
        ROLE[listbackup-deployment-role]
    end
    
    subgraph "Service Permissions"
        CF[CloudFormation<br/>Full Access]
        LAMBDA[Lambda<br/>Full Access]
        APIGW[API Gateway<br/>Full Access]
        DDB[DynamoDB<br/>Full Access]
        S3_PERM[S3<br/>Full Access]
        SQS_PERM[SQS<br/>Full Access]
        IAM_PERM[IAM<br/>Limited Access]
    end
    
    subgraph "Security Permissions"
        SSM_PERM[SSM<br/>Read/Write]
        SM[Secrets Manager<br/>Read/Write]
        KMS[KMS<br/>Use Keys]
        LOGS[CloudWatch Logs<br/>Full Access]
    end
    
    ROLE --> CF
    ROLE --> LAMBDA
    ROLE --> APIGW
    ROLE --> DDB
    ROLE --> S3_PERM
    ROLE --> SQS_PERM
    ROLE --> IAM_PERM
    ROLE --> SSM_PERM
    ROLE --> SM
    ROLE --> KMS
    ROLE --> LOGS
```

## Environment Setup

### SSM Parameters

```mermaid
graph LR
    subgraph "Required Parameters"
        JWT[/listbackup/jwt-secret]
        REFRESH[/listbackup/jwt-refresh-secret]
        CORS[/listbackup/cors-origin]
        EMAIL[/listbackup/ses-from-email]
    end
    
    subgraph "Optional Parameters"
        OPENAI[/listbackup/openai-api-key]
        SLACK[/listbackup/slack-webhook]
        SENTRY[/listbackup/sentry-dsn]
    end
    
    subgraph "Auto-generated"
        COGNITO_POOL[/listbackup/cognito-user-pool-id]
        COGNITO_CLIENT[/listbackup/cognito-client-id]
        API_URL[/listbackup/api-gateway-url]
    end
```

Create parameters:

```bash
# Create JWT secret
aws ssm put-parameter \
  --name "/listbackup/jwt-secret" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString" \
  --profile listbackup.ai

# Create CORS origin
aws ssm put-parameter \
  --name "/listbackup/cors-origin" \
  --value "https://app.listbackup.ai" \
  --type "String" \
  --profile listbackup.ai
```

## Deployment Process

### Step 1: Deploy Infrastructure

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant CLI as Serverless CLI
    participant AWS as AWS
    participant CF as CloudFormation
    
    Dev->>CLI: serverless deploy
    CLI->>AWS: Package artifacts
    AWS->>AWS: Upload to S3
    CLI->>CF: Create/Update Stack
    CF->>CF: Create resources
    Note over CF: DynamoDB, SQS, S3, etc.
    CF->>CF: Export outputs
    CF-->>CLI: Stack complete
    CLI-->>Dev: Deployment success
```

Deploy infrastructure services:

```bash
cd backend/golang
serverless deploy --stage dev
```

### Step 2: Service Dependencies

```mermaid
graph TD
    subgraph "Deployment Order"
        PHASE1[Phase 1: Certificates<br/>infrastructure-certificates]
        PHASE2[Phase 2: Core Infrastructure<br/>DynamoDB, S3, SQS]
        PHASE3[Phase 3: Cognito<br/>infrastructure-cognito]
        PHASE4[Phase 4: API Gateway<br/>api/gateway]
        PHASE5[Phase 5: Auth Service<br/>api/auth]
        PHASE6[Phase 6: User Services<br/>api/users, api/accounts]
        PHASE7[Phase 7: Business Services<br/>platforms, connections, etc.]
    end
    
    PHASE1 --> PHASE2
    PHASE2 --> PHASE3
    PHASE3 --> PHASE4
    PHASE4 --> PHASE5
    PHASE5 --> PHASE6
    PHASE6 --> PHASE7
    
    style PHASE1 fill:#e8f5e9
    style PHASE2 fill:#c8e6c9
    style PHASE3 fill:#a5d6a7
```

### Step 3: Deployment Commands

#### Full Deployment
```bash
# Deploy all services using Serverless Compose
cd backend/golang
serverless deploy --stage production --verbose
```

#### Individual Service Deployment
```bash
# Deploy specific service
cd backend/golang/services/api/users
serverless deploy --stage production

# Deploy with specific AWS profile
serverless deploy --stage production --aws-profile listbackup.ai
```

#### Rollback
```bash
# Rollback to previous version
serverless rollback --stage production --timestamp 1704067200
```

## CI/CD Pipeline

### GitHub Actions Workflow

```mermaid
graph LR
    subgraph "Triggers"
        PUSH[Push to Branch]
        PR[Pull Request]
        MANUAL[Manual Trigger]
    end
    
    subgraph "Jobs"
        LINT[Lint Code]
        TEST[Run Tests]
        BUILD[Build Artifacts]
        DEPLOY_DEV[Deploy Dev]
        DEPLOY_STG[Deploy Staging]
        DEPLOY_PROD[Deploy Prod]
    end
    
    subgraph "Conditions"
        BRANCH{Branch?}
        APPROVAL{Approved?}
    end
    
    PUSH --> LINT
    PR --> LINT
    MANUAL --> LINT
    
    LINT --> TEST
    TEST --> BUILD
    BUILD --> BRANCH
    
    BRANCH -->|feature| DEPLOY_DEV
    BRANCH -->|develop| DEPLOY_STG
    BRANCH -->|main| APPROVAL
    APPROVAL -->|Yes| DEPLOY_PROD
```

### Workflow Configuration

```yaml
name: Deploy Backend

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.21'
      - run: go test ./...

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to AWS
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          npm install -g serverless
          cd backend/golang
          serverless deploy --stage ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
```

## Monitoring Deployment

### CloudFormation Events

```mermaid
graph TD
    subgraph "Stack Events"
        CREATE[CREATE_IN_PROGRESS]
        CREATE_COMPLETE[CREATE_COMPLETE]
        UPDATE[UPDATE_IN_PROGRESS]
        UPDATE_COMPLETE[UPDATE_COMPLETE]
        ROLLBACK[UPDATE_ROLLBACK_IN_PROGRESS]
    end
    
    subgraph "Resource Events"
        RES_CREATE[Resource Creating]
        RES_CONFIG[Resource Configuring]
        RES_COMPLETE[Resource Complete]
        RES_FAILED[Resource Failed]
    end
    
    subgraph "Monitoring"
        CONSOLE[AWS Console]
        CLI_MON[CLI Monitoring]
        CW_EVENTS[CloudWatch Events]
    end
    
    CREATE --> RES_CREATE
    RES_CREATE --> RES_CONFIG
    RES_CONFIG --> RES_COMPLETE
    RES_CONFIG --> RES_FAILED
    RES_COMPLETE --> CREATE_COMPLETE
    RES_FAILED --> ROLLBACK
    
    CREATE_COMPLETE --> CONSOLE
    UPDATE_COMPLETE --> CLI_MON
    ROLLBACK --> CW_EVENTS
```

Monitor deployment:

```bash
# Watch stack events
aws cloudformation describe-stack-events \
  --stack-name listbackup-api-production \
  --profile listbackup.ai

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name listbackup-api-production \
  --query "Stacks[0].Outputs" \
  --profile listbackup.ai
```

## Post-Deployment Verification

### Health Checks

```mermaid
graph LR
    subgraph "API Health"
        ENDPOINT[/health Endpoint]
        AUTH_CHECK[Auth Service]
        DB_CHECK[Database Connection]
        QUEUE_CHECK[Queue Access]
    end
    
    subgraph "Integration Tests"
        LOGIN_TEST[Login Flow]
        API_TEST[API Operations]
        E2E_TEST[End-to-End]
    end
    
    subgraph "Monitoring"
        METRICS[CloudWatch Metrics]
        LOGS[CloudWatch Logs]
        TRACES[X-Ray Traces]
    end
    
    ENDPOINT --> AUTH_CHECK
    ENDPOINT --> DB_CHECK
    ENDPOINT --> QUEUE_CHECK
    
    AUTH_CHECK --> LOGIN_TEST
    DB_CHECK --> API_TEST
    QUEUE_CHECK --> E2E_TEST
    
    LOGIN_TEST --> METRICS
    API_TEST --> LOGS
    E2E_TEST --> TRACES
```

Verification commands:

```bash
# Test health endpoint
curl https://api.listbackup.ai/health

# Run integration tests
cd backend/golang
go test -tags=integration ./...

# Check CloudWatch logs
aws logs tail /aws/lambda/listbackup-api-production --follow
```

## Troubleshooting

### Common Issues

```mermaid
graph TD
    subgraph "Deployment Failures"
        TIMEOUT[Stack Timeout]
        CONFLICT[Resource Conflict]
        PERMISSION[Permission Denied]
        LIMIT[Service Limit]
    end
    
    subgraph "Solutions"
        EXTEND[Extend Timeout]
        DELETE[Delete Conflicting Resource]
        UPDATE_ROLE[Update IAM Role]
        REQUEST[Request Limit Increase]
    end
    
    subgraph "Prevention"
        VALIDATE[Validate Template]
        DRY_RUN[Dry Run Deploy]
        STAGE_TEST[Test in Staging]
        MONITOR[Monitor Limits]
    end
    
    TIMEOUT --> EXTEND
    CONFLICT --> DELETE
    PERMISSION --> UPDATE_ROLE
    LIMIT --> REQUEST
    
    EXTEND --> VALIDATE
    DELETE --> DRY_RUN
    UPDATE_ROLE --> STAGE_TEST
    REQUEST --> MONITOR
```

### Debug Commands

```bash
# Validate CloudFormation template
aws cloudformation validate-template \
  --template-body file://template.yml \
  --profile listbackup.ai

# Check service limits
aws service-quotas list-service-quotas \
  --service-code lambda \
  --profile listbackup.ai

# Get detailed error
aws cloudformation describe-stack-events \
  --stack-name listbackup-api-production \
  --query "StackEvents[?ResourceStatus=='CREATE_FAILED']" \
  --profile listbackup.ai
```

## Rollback Procedures

### Automatic Rollback

CloudFormation automatically rolls back on failure:

```mermaid
stateDiagram-v2
    [*] --> Deploying: Start Deployment
    Deploying --> Testing: Resources Created
    Testing --> Success: All Tests Pass
    Testing --> Failed: Tests Fail
    Failed --> RollingBack: Automatic Rollback
    RollingBack --> RolledBack: Previous State
    Success --> [*]: Deployment Complete
    RolledBack --> [*]: Rollback Complete
```

### Manual Rollback

```bash
# List previous versions
serverless rollback --list --stage production

# Rollback to specific version
serverless rollback --timestamp 1704067200 --stage production

# Emergency rollback via CloudFormation
aws cloudformation cancel-update-stack \
  --stack-name listbackup-api-production \
  --profile listbackup.ai
```

## Best Practices

### 1. Pre-deployment Checklist
- [ ] All tests passing
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] API documentation updated
- [ ] Monitoring alerts configured

### 2. Deployment Strategy
- Use blue-green deployments for zero downtime
- Deploy to staging first
- Run smoke tests post-deployment
- Monitor error rates during rollout

### 3. Security
- Rotate secrets regularly
- Use least-privilege IAM roles
- Enable CloudTrail logging
- Review security groups

### 4. Cost Optimization
- Set up billing alerts
- Use appropriate Lambda memory
- Enable auto-scaling for DynamoDB
- Clean up old deployments

## Disaster Recovery

### Backup Strategy

```mermaid
graph TD
    subgraph "Backup Sources"
        CODE[Code Repository]
        CONFIG[Configuration]
        DATA[Database]
        SECRETS_BACKUP[Secrets]
    end
    
    subgraph "Backup Destinations"
        S3_BACKUP[S3 Backups]
        CROSS_REGION[Cross-Region]
        EXTERNAL[External Storage]
    end
    
    subgraph "Recovery"
        RESTORE_CODE[Restore Code]
        RESTORE_CONFIG[Restore Config]
        RESTORE_DATA[Restore Data]
        REBUILD[Rebuild Infrastructure]
    end
    
    CODE --> S3_BACKUP
    CONFIG --> S3_BACKUP
    DATA --> CROSS_REGION
    SECRETS_BACKUP --> EXTERNAL
    
    S3_BACKUP --> RESTORE_CODE
    S3_BACKUP --> RESTORE_CONFIG
    CROSS_REGION --> RESTORE_DATA
    EXTERNAL --> REBUILD
```

### Recovery Procedures

1. **Infrastructure Recovery**
   ```bash
   # Redeploy infrastructure
   cd backend/golang
   serverless deploy --stage disaster-recovery
   ```

2. **Data Recovery**
   ```bash
   # Restore DynamoDB from backup
   aws dynamodb restore-table-from-backup \
     --target-table-name listbackup-dr-users \
     --backup-arn arn:aws:dynamodb:... \
     --profile listbackup.ai
   ```

3. **DNS Failover**
   - Update Route 53 to point to DR region
   - Verify SSL certificates
   - Test all endpoints

## Next Steps

- Review [Environment Configuration](./environment-config.md)
- Set up [CI/CD Pipeline](./cicd-pipeline.md)
- Configure [Monitoring and Alerts](../monitoring/setup.md)
- Plan [Disaster Recovery](../dr/procedures.md)