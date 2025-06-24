# Phase 3: API Gateway Service Infrastructure Integration Analysis

## Executive Summary

This document provides a comprehensive analysis of the current API Gateway service configuration and identifies the necessary updates to integrate with the new infrastructure services architecture. The API Gateway service is currently partially prepared for infrastructure integration but requires specific updates to fully leverage the new modular infrastructure approach.

## Current API Gateway Configuration Analysis

### Service Overview
- **Service Name**: `listbackup-api-gateway`
- **Framework Version**: 4
- **Runtime**: `provided.al2023`
- **Region**: `us-west-2`
- **Functions**: 2 system functions (health, openapi-export)

### Current Infrastructure Dependencies

#### 1. Cognito Integration (ALREADY CONFIGURED)
The API Gateway service already imports Cognito resources from the core service:
```yaml
COGNITO_USER_POOL_ID: ${cf:listbackup-core-${self:provider.stage}.CognitoUserPoolId}
COGNITO_CLIENT_ID: ${cf:listbackup-core-${self:provider.stage}.CognitoUserPoolClientId}
```

**STATUS**: ✅ Already configured, but needs update to use infrastructure-cognito service

#### 2. DynamoDB Access (CONFIGURED BUT NEEDS REFINEMENT)
Current configuration uses wildcard permissions:
```yaml
Resource:
  - "arn:aws:dynamodb:${self:provider.region}:*:table/listbackup-${self:provider.stage}-*"
```

**STATUS**: ⚠️ Functional but needs specific table references

#### 3. Custom Domain Configuration (INFRASTRUCTURE RESOURCES PRESENT)
The service defines its own infrastructure resources:
- `ApiDomainName` (AWS::ApiGatewayV2::DomainName)
- `ApiMapping` (AWS::ApiGatewayV2::ApiMapping)  
- `ApiDomainRecord` (AWS::Route53::RecordSet)

**STATUS**: ❌ Contains infrastructure that should be moved to infrastructure services

## Infrastructure Services Available for Import

### 1. DynamoDB Infrastructure (`listbackup-infrastructure-dynamodb`)
**Available Exports** (17 total tables):
- Core tables: Users, Accounts, UserAccounts, Activity
- Platform tables: Platforms, PlatformConnections, PlatformSources
- Source tables: Sources, SourceGroups
- Job tables: Jobs, JobLogs
- Team tables: Teams, TeamMembers
- Communication: Notifications
- Billing: Billing, BillingUsage
- Organization: Tags

### 2. S3 Infrastructure (`listbackup-infrastructure-s3`)
**Available Exports**:
- `DataBucketName`, `DataBucketArn`
- `DataBucketDomainName`, `DataBucketRegionalDomainName`
- `S3AccessLogGroupName`, `S3AccessLogGroupArn`

### 3. SQS Infrastructure (`listbackup-infrastructure-sqs`)
**Available Exports** (12 queues total):
- Main queues: Sync, Backup, Export, Analytics, Maintenance, Alert
- Dead letter queues for each main queue
- Both URL and ARN exports for all queues

### 4. EventBridge Infrastructure (`listbackup-infrastructure-eventbridge`)
**Available Exports**:
- `EventBusName`, `EventBusArn`
- Event rules: DataSync, Job, User, Billing, Platform, System
- Log group resources

### 5. Cognito Infrastructure (`listbackup-infrastructure-cognito`)
**Available Exports**:
- `CognitoUserPoolId`, `CognitoUserPoolArn`
- `CognitoUserPoolClientId`
- `CognitoIdentityPoolId`
- `CognitoJwksUri`, `CognitoIssuer`
- Authentication role ARNs

## Required Updates Analysis

### Critical Updates Required

#### 1. **Remove Duplicate Infrastructure Resources**
The API Gateway service currently defines domain and DNS resources that should be managed by infrastructure services:

**Resources to Remove**:
- `ApiDomainName` (AWS::ApiGatewayV2::DomainName)
- `ApiMapping` (AWS::ApiGatewayV2::ApiMapping)
- `ApiDomainRecord` (AWS::Route53::RecordSet)

**Justification**: These are infrastructure concerns that should be managed centrally.

#### 2. **Update Cognito References**
**Current**:
```yaml
COGNITO_USER_POOL_ID: ${cf:listbackup-core-${self:provider.stage}.CognitoUserPoolId}
```

**Required**:
```yaml
COGNITO_USER_POOL_ID: ${cf:listbackup-infrastructure-cognito-${self:provider.stage}.CognitoUserPoolId}
```

#### 3. **Add Specific Infrastructure Imports**
Based on the API Gateway's role as the central routing service, it needs access to:

**DynamoDB Tables** (High Priority):
- UsersTableName (user authentication/authorization)
- AccountsTableName (account context)
- ActivityTableName (API usage logging)
- JobsTableName (job status queries)

**SQS Queues** (Medium Priority):
- AlertQueueUrl (critical system alerts)
- SyncQueueUrl (real-time operations)

**EventBridge** (Medium Priority):
- EventBusName (event publishing)

**S3 Resources** (Low Priority):
- DataBucketName (for any direct S3 operations)

#### 4. **Update IAM Permissions**
Current wildcard permissions should be replaced with specific resource references:

**Current**:
```yaml
Resource:
  - "arn:aws:dynamodb:${self:provider.region}:*:table/listbackup-${self:provider.stage}-*"
```

**Required**:
```yaml
Resource:
  - ${cf:listbackup-infrastructure-dynamodb-${self:provider.stage}.UsersTableArn}
  - ${cf:listbackup-infrastructure-dynamodb-${self:provider.stage}.AccountsTableArn}
  # ... specific table ARNs
```

#### 5. **Add Missing Exports**
The cross-stack analysis identified that API Gateway should export its HttpApiId:

**Required Addition**:
```yaml
Outputs:
  HttpApiId:
    Description: "HTTP API Gateway ID"
    Value:
      Ref: HttpApi
    Export:
      Name: ${self:service}-${self:provider.stage}-HttpApiId
```

**Note**: This export already exists in the current configuration (lines 160-165), so this is already addressed.

### Environment Variables to Add

```yaml
environment:
  # Existing variables (keep)
  STAGE: ${self:provider.stage}
  DYNAMODB_TABLE_PREFIX: listbackup-${self:provider.stage}
  API_VERSION: v1
  API_REFERENCE: listbackup-api-gateway
  
  # New infrastructure imports
  USERS_TABLE_NAME: ${cf:listbackup-infrastructure-dynamodb-${self:provider.stage}.UsersTableName}
  ACCOUNTS_TABLE_NAME: ${cf:listbackup-infrastructure-dynamodb-${self:provider.stage}.AccountsTableName}
  ACTIVITY_TABLE_NAME: ${cf:listbackup-infrastructure-dynamodb-${self:provider.stage}.ActivityTableName}
  JOBS_TABLE_NAME: ${cf:listbackup-infrastructure-dynamodb-${self:provider.stage}.JobsTableName}
  
  DATA_BUCKET_NAME: ${cf:listbackup-infrastructure-s3-${self:provider.stage}.DataBucketName}
  
  ALERT_QUEUE_URL: ${cf:listbackup-infrastructure-sqs-${self:provider.stage}.AlertQueueUrl}
  SYNC_QUEUE_URL: ${cf:listbackup-infrastructure-sqs-${self:provider.stage}.SyncQueueUrl}
  
  EVENT_BUS_NAME: ${cf:listbackup-infrastructure-eventbridge-${self:provider.stage}.EventBusName}
  
  # Updated Cognito references
  COGNITO_USER_POOL_ID: ${cf:listbackup-infrastructure-cognito-${self:provider.stage}.CognitoUserPoolId}
  COGNITO_CLIENT_ID: ${cf:listbackup-infrastructure-cognito-${self:provider.stage}.CognitoUserPoolClientId}
  COGNITO_JWKS_URI: ${cf:listbackup-infrastructure-cognito-${self:provider.stage}.CognitoJwksUri}
  COGNITO_ISSUER: ${cf:listbackup-infrastructure-cognito-${self:provider.stage}.CognitoIssuer}
```

## Deployment Dependencies

### New Deployment Order
With infrastructure service integration, the API Gateway deployment order becomes:

1. **Infrastructure Services** (parallel):
   - listbackup-infrastructure-dynamodb
   - listbackup-infrastructure-s3
   - listbackup-infrastructure-sqs
   - listbackup-infrastructure-eventbridge
   - listbackup-infrastructure-cognito

2. **API Gateway Service**:
   - listbackup-api-gateway

3. **Application Services** (after API Gateway):
   - All other application services

### Critical Dependencies
- **Must deploy after**: All 5 infrastructure services
- **Must deploy before**: All application services that reference HttpApiId

## Impact Assessment

### High Impact Changes
1. **Cognito reference updates**: Will break if infrastructure-cognito not deployed first
2. **IAM permission changes**: Could cause permission errors if not updated properly

### Medium Impact Changes
1. **Environment variable additions**: Backward compatible but required for full functionality
2. **Domain resource removal**: Requires coordination with domain management strategy

### Low Impact Changes
1. **Additional table references**: Optional but recommended for better security

## Risk Mitigation

### Pre-Deployment Validation
1. Verify all 5 infrastructure services are deployed and healthy
2. Validate CloudFormation exports exist using AWS CLI:
   ```bash
   aws cloudformation list-exports --query 'Exports[?starts_with(Name, `listbackup-infrastructure`)]'
   ```

### Rollback Strategy
1. Keep current configuration in a separate branch
2. Deploy infrastructure services first in a separate stage for testing
3. Update API Gateway in a non-production stage first

### Testing Requirements
1. Verify JWT authorizer still functions with new Cognito references
2. Test all API endpoints for proper authentication
3. Validate domain configuration continues to work
4. Confirm all environment variables are properly resolved

## Implementation Recommendations

### Phase 1: Infrastructure Preparation
1. Deploy all 5 infrastructure services
2. Validate exports are available
3. Test infrastructure services independently

### Phase 2: API Gateway Updates  
1. Update Cognito references
2. Add new environment variables
3. Update IAM permissions to use specific ARNs
4. Remove duplicate infrastructure resources

### Phase 3: Validation and Testing
1. Deploy updated API Gateway service
2. Run comprehensive endpoint testing
3. Verify authentication flows
4. Validate domain functionality

## Conclusion

The API Gateway service is well-positioned for infrastructure integration with minimal changes required. The primary work involves:

1. **Updating references** from core service to infrastructure services
2. **Adding specific resource imports** for better security and functionality  
3. **Removing duplicate infrastructure resources** to align with new architecture
4. **Comprehensive testing** to ensure no regressions

The changes are primarily configuration-based with low risk of breaking existing functionality, provided the infrastructure services are deployed first and exports are validated.

## Next Steps

1. **Infrastructure Services**: Ensure all 5 infrastructure services are deployed and healthy
2. **Update Configuration**: Apply the changes outlined in this analysis
3. **Testing**: Execute comprehensive testing plan
4. **Documentation**: Update deployment guides with new dependency requirements

This analysis provides the foundation for Agents 2-5 to implement the specific updates identified.