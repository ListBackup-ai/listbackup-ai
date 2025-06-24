# Cross-Stack References Documentation

## Overview
This document maps all CloudFormation cross-stack references in the ListBackup.ai v2 Go backend services. These references are critical for understanding service dependencies and deployment order.

## Stack Dependency Hierarchy

```
┌─────────────────────────┐
│   Infrastructure Layer  │
├─────────────────────────┤
│ • infra/dynamodb       │
│ • infra/s3             │
│ • infra/cognito        │
│ • infra/domains        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│      Core Service       │
├─────────────────────────┤
│ • core                  │
│   - DynamoDB Tables     │
│   - S3 Buckets          │
│   - SQS Queues          │
│   - Cognito User Pool   │
│   - EventBridge         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   API Gateway Layer     │
├─────────────────────────┤
│ • api-gateway           │
│ • api-custom-domains    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Application Services  │
├─────────────────────────┤
│ • auth                  │
│ • users                 │
│ • accounts              │
│ • teams                 │
│ • sources               │
│ • platforms             │
│ • connections           │
│ • jobs                  │
│ • etc...                │
└─────────────────────────┘
```

## Core Service Exports

The `listbackup-core` service exports the following resources that are imported by other services:

### DynamoDB Tables
- `UsersTableName` → `listbackup-core-{stage}-UsersTableName`
- `AccountsTableName` → `listbackup-core-{stage}-AccountsTableName`
- `UserAccountsTableName` → `listbackup-core-{stage}-UserAccountsTableName`
- `ActivityTableName` → `listbackup-core-{stage}-ActivityTableName`
- `SourcesTableName` → `listbackup-core-{stage}-SourcesTableName`
- `JobsTableName` → `listbackup-core-{stage}-JobsTableName`
- `JobsTableStreamArn` → `listbackup-core-{stage}-JobsTableStreamArn`
- `FilesTableName` → `listbackup-core-{stage}-FilesTableName`
- `OAuthStatesTableName` → `listbackup-core-{stage}-OAuthStatesTableName`
- `ApiKeysTableName` → `listbackup-core-{stage}-ApiKeysTableName`
- `PlatformsTableName` → `listbackup-core-{stage}-PlatformsTableName`
- `PlatformSourcesTableName` → `listbackup-core-{stage}-PlatformSourcesTableName`
- `PlatformConnectionsTableName` → `listbackup-core-{stage}-PlatformConnectionsTableName`
- `SourceGroupsTableName` → `listbackup-core-{stage}-SourceGroupsTableName`

### S3 Buckets
- `DataBucketName` → `listbackup-core-{stage}-DataBucketName`

### SQS Queues
- `SyncQueueUrl` → `listbackup-core-{stage}-SyncQueueUrl`
- `SyncQueueArn` → `listbackup-core-{stage}-SyncQueueArn`
- `BackupQueueUrl` → `listbackup-core-{stage}-BackupQueueUrl`
- `BackupQueueArn` → `listbackup-core-{stage}-BackupQueueArn`
- `ExportQueueUrl` → `listbackup-core-{stage}-ExportQueueUrl`
- `ExportQueueArn` → `listbackup-core-{stage}-ExportQueueArn`
- `AnalyticsQueueUrl` → `listbackup-core-{stage}-AnalyticsQueueUrl`
- `AnalyticsQueueArn` → `listbackup-core-{stage}-AnalyticsQueueArn`
- `MaintenanceQueueUrl` → `listbackup-core-{stage}-MaintenanceQueueUrl`
- `MaintenanceQueueArn` → `listbackup-core-{stage}-MaintenanceQueueArn`
- `AlertQueueUrl` → `listbackup-core-{stage}-AlertQueueUrl`
- `AlertQueueArn` → `listbackup-core-{stage}-AlertQueueArn`

### Cognito Resources
- `CognitoUserPoolId` → `listbackup-core-{stage}-CognitoUserPoolId`
- `CognitoUserPoolArn` → `listbackup-core-{stage}-CognitoUserPoolArn`
- `CognitoUserPoolClientId` → `listbackup-core-{stage}-CognitoUserPoolClientId`

### EventBridge
- `EventBusName` → `listbackup-core-{stage}-EventBusName`

## Infrastructure Service Exports

### infra/domains
- `SSLCertificateArn` → `listbackup-infra-domains-{stage}-SSLCertificateArn`

## Service Import Patterns

### 1. CloudFormation Reference Pattern (`${cf:}`)
Most services use the CloudFormation reference pattern to import values:

```yaml
environment:
  COGNITO_USER_POOL_ID: ${cf:listbackup-core-${self:provider.stage}.CognitoUserPoolId}
  COGNITO_CLIENT_ID: ${cf:listbackup-core-${self:provider.stage}.CognitoUserPoolClientId}
```

Services using this pattern:
- accounts
- api-custom-domains
- api-gateway
- auth
- billing
- clients
- connections
- domains
- domains-simple
- integrations
- jobs
- platforms
- source-groups
- sources
- system
- tags
- teams
- users

### 2. ImportValue Pattern (`!ImportValue`)
Some services use AWS CloudFormation ImportValue for importing resources:

```yaml
httpApi:
  id: !ImportValue ${self:provider.stage}-HttpApiId
```

Services using this pattern:
- dashboards (imports HttpApiId)

### 3. Common Import Sets

#### Cognito Authentication Set
These environment variables are imported by most application services:
```yaml
COGNITO_USER_POOL_ID: ${cf:listbackup-core-${self:provider.stage}.CognitoUserPoolId}
COGNITO_CLIENT_ID: ${cf:listbackup-core-${self:provider.stage}.CognitoUserPoolClientId}
COGNITO_JWKS_URI: 
  Fn::Sub: "https://cognito-idp.${AWS::Region}.amazonaws.com/${cf:listbackup-core-${self:provider.stage}.CognitoUserPoolId}/.well-known/jwks.json"
COGNITO_ISSUER: 
  Fn::Sub: "https://cognito-idp.${AWS::Region}.amazonaws.com/${cf:listbackup-core-${self:provider.stage}.CognitoUserPoolId}"
```

#### API Gateway Configuration
Services that connect to the API Gateway import:
```yaml
httpApi:
  id: ${cf:listbackup-api-gateway-${self:provider.stage}.HttpApiId}
```

## Deployment Order Requirements

Based on the cross-stack references, services must be deployed in this order:

1. **Infrastructure Layer** (can be deployed in parallel)
   - infra/dynamodb
   - infra/s3
   - infra/cognito
   - infra/domains

2. **Core Service**
   - core (depends on infrastructure layer if any)

3. **API Gateway Layer**
   - api-gateway (depends on core)
   - api-custom-domains (depends on api-gateway and infra/domains)

4. **Application Services** (can be deployed in parallel after API Gateway)
   - auth
   - users
   - accounts
   - teams
   - sources
   - platforms
   - connections
   - source-groups
   - jobs
   - billing
   - clients
   - domains
   - domains-simple
   - integrations
   - notifications
   - system
   - tags
   - dashboards

## Missing References and Issues

### 1. Dashboards Service ImportValue
The dashboards service uses `!ImportValue ${self:provider.stage}-HttpApiId` but this export is not defined in any service. This should likely be:
```yaml
httpApi:
  id: ${cf:listbackup-api-gateway-${self:provider.stage}.HttpApiId}
```

### 2. API Gateway Missing Export
The api-gateway service should export its HttpApiId for other services to use:
```yaml
Outputs:
  HttpApiId:
    Description: "HTTP API Gateway ID"
    Value:
      Ref: HttpApi
    Export:
      Name: ${self:service}-${self:provider.stage}-HttpApiId
```

### 3. Services Without Cross-Stack References
These services don't import from other stacks:
- notifications (may need Cognito references)

## Environment Variable Standardization

Most services use a consistent set of environment variables:
- `STAGE`: ${self:provider.stage}
- `DYNAMODB_TABLE_PREFIX`: listbackup-${self:provider.stage}
- `API_VERSION`: v1
- `API_REFERENCE`: listbackup-api

## Recommendations

1. **Fix Dashboards Service Import**: Update the dashboards service to use the correct CloudFormation reference pattern instead of ImportValue.

2. **Add Missing Exports**: Ensure api-gateway exports its HttpApiId for other services to reference.

3. **Standardize Import Patterns**: Use CloudFormation references (`${cf:}`) consistently across all services instead of mixing with ImportValue.

4. **Document Dependencies**: Add comments in each serverless.yml file indicating which stacks must be deployed first.

5. **Create Deployment Script**: Build an automated deployment script that respects the dependency order.

6. **Validate References**: Create a validation script that checks all cross-stack references are valid before deployment.

## Cross-Stack Reference Validation Script

To validate all cross-stack references, use this pattern:
```bash
# Check if all imported values have corresponding exports
for service in services/*/serverless.yml; do
  echo "Checking $service..."
  grep -E '\${cf:|!ImportValue' $service | while read line; do
    # Extract the stack and export name
    # Verify the export exists in the referenced stack
  done
done
```