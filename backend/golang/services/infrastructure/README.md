# Infrastructure Services

This directory contains all infrastructure services for ListBackup.ai. These services create the foundational AWS resources that all other services depend on.

## Directory Structure

```
infrastructure/
├── cognito/         # AWS Cognito User Pool and Identity Pool
├── domains/         # Route53 and SSL certificates for custom domains  
├── dynamodb/        # All DynamoDB tables for the application
├── eventbridge/     # EventBridge event bus for async communication
├── s3/              # S3 buckets for data storage
└── sqs/             # SQS queues for job processing
```

## Deployment Order

The services have dependencies and must be deployed in the correct order:

### Phase 1 - Core Infrastructure (No Dependencies)
1. `dynamodb` - DynamoDB tables
2. `sqs` - SQS queues  
3. `s3` - S3 buckets

### Phase 2 - Dependent Infrastructure
4. `eventbridge` - Depends on S3 (for logging)
5. `cognito` - Depends on S3 and EventBridge
6. `domains` - SSL certificates (can be deployed anytime)

## Service Names

The deployed CloudFormation stack names follow this pattern:
- DynamoDB: `listbackup-infrastructure-dynamodb-{stage}`
- SQS: `listbackup-infrastructure-sqs-{stage}`
- S3: `listbackup-infrastructure-s3-{stage}`
- EventBridge: `listbackup-infrastructure-eventbridge-{stage}`
- Cognito: `listbackup-infrastructure-cognito-{stage}`
- Domains: `listbackup-infrastructure-domains-{stage}`

## Usage

All infrastructure services export their resource identifiers via CloudFormation exports. Other services can import these resources using the `${cf:}` syntax:

```yaml
environment:
  USERS_TABLE: ${cf:listbackup-infrastructure-dynamodb-${self:provider.stage}.UsersTableName}
  COGNITO_USER_POOL_ID: ${cf:listbackup-infrastructure-cognito-${self:provider.stage}.CognitoUserPoolId}
```

## Deployment

Infrastructure services are deployed using the Serverless Compose feature:

```bash
cd /path/to/services
sls compose deploy
```

Or deploy individually:

```bash
cd infrastructure/dynamodb
sls deploy --aws-profile listbackup.ai --stage main
```