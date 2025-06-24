# IAM Permissions Audit - ListBackup.ai v2

## Executive Summary

This audit reveals significant security concerns with overly permissive IAM policies in multiple services. The auth and users services have wildcard permissions (`Action: "*"`, `Resource: "*"`), which violates the principle of least privilege. Other services have more appropriate scoped permissions but still require refinement.

## Critical Findings

### 1. Services with Wildcard Permissions (HIGH RISK)
- **auth service**: Full AWS permissions (`Action: "*"`, `Resource: "*"`)
- **users service**: Full AWS permissions (`Action: "*"`, `Resource: "*"`)

These services can perform ANY action on ANY AWS resource, presenting a severe security risk.

### 2. Services with Appropriate Scoped Permissions
Most services follow better practices with scoped permissions:
- **accounts**: DynamoDB-specific permissions with table prefixes
- **integrations**: DynamoDB, Secrets Manager, and EventBridge permissions
- **sources**: DynamoDB and S3 permissions
- **notifications**: DynamoDB, SES, SNS permissions
- **jobs**: DynamoDB and SQS permissions
- **billing**: DynamoDB, Cognito, and SSM permissions

## Detailed Permission Analysis

### Auth Service
```yaml
iam:
  role:
    statements:
      - Effect: Allow
        Action: "*"
        Resource: "*"
```
**Risk**: CRITICAL - Can perform any AWS action
**Required Actions**:
- Cognito operations (AdminCreateUser, AdminSetUserPassword, etc.)
- DynamoDB operations on specific tables
- EventBridge for audit events

### Accounts Service
```yaml
statements:
  - Effect: Allow
    Action:
      - dynamodb:Query
      - dynamodb:Scan
      - dynamodb:GetItem
      - dynamodb:PutItem
      - dynamodb:UpdateItem
      - dynamodb:DeleteItem
      - dynamodb:BatchGetItem
      - dynamodb:BatchWriteItem
      # ... additional operations
    Resource:
      - "arn:aws:dynamodb:${region}:*:table/listbackup-${stage}-*"
      - "arn:aws:dynamodb:${region}:*:table/listbackup-${stage}-*/index/*"
```
**Assessment**: Good - Properly scoped to DynamoDB tables with stage prefix

### Integrations Service
```yaml
statements:
  # DynamoDB permissions
  - Effect: Allow
    Action: [dynamodb operations]
    Resource: [specific tables]
  # Secrets Manager permissions
  - Effect: Allow
    Action: [secrets operations]
    Resource: 
      - "arn:aws:secretsmanager:${region}:*:secret:app/oauth/*"
      - "arn:aws:secretsmanager:${region}:*:secret:sources/*"
  # EventBridge permissions
  - Effect: Allow
    Action: events:PutEvents
    Resource: [specific event bus]
```
**Assessment**: Good - Well-scoped permissions for OAuth and integration needs

### Sources Service
Includes DynamoDB permissions plus:
```yaml
- Effect: Allow
  Action:
    - s3:GetObject
    - s3:PutObject
    - s3:DeleteObject
    - s3:ListBucket
  Resource:
    - "arn:aws:s3:::${DataBucketName}"
    - "arn:aws:s3:::${DataBucketName}/*"
```
**Assessment**: Good - Appropriate for backup data storage

### Notifications Service
```yaml
statements:
  - DynamoDB permissions for notification tables
  - SES permissions for email
  - SNS permissions for SMS
  - SSM permissions for configuration
```
**Assessment**: Good - Properly scoped for notification requirements

### Jobs Service
```yaml
statements:
  - DynamoDB permissions
  - SQS permissions:
    - sqs:SendMessage
    - sqs:ReceiveMessage
    - sqs:DeleteMessage
    - sqs:GetQueueAttributes
    - sqs:ChangeMessageVisibility
  Resource:
    - "arn:aws:sqs:${region}:*:listbackup-sync-queue-${stage}.fifo"
    - "arn:aws:sqs:${region}:*:listbackup-backup-queue-${stage}.fifo"
```
**Assessment**: Good - Appropriate for job processing

## Security Boundaries

### Cross-Service Access Requirements
1. **Auth Service** needs access to:
   - Cognito User Pool (create/manage users)
   - DynamoDB (users, accounts, user-accounts tables)
   - EventBridge (audit events)

2. **Core Service** (authorizer) needs:
   - Cognito (validate tokens)
   - DynamoDB (user/account lookups)

3. **Integration Service** needs:
   - Secrets Manager (OAuth credentials)
   - DynamoDB (oauth-states, sources)
   - EventBridge (integration events)

4. **Jobs Service** needs:
   - SQS (job queues)
   - DynamoDB (job metadata)
   - Lambda invoke (trigger other functions)
   - S3 (backup data access)

## Recommended IAM Permissions

### Auth Service (Replace Wildcard)
```yaml
iam:
  role:
    statements:
      # Cognito permissions
      - Effect: Allow
        Action:
          - cognito-idp:AdminCreateUser
          - cognito-idp:AdminSetUserPassword
          - cognito-idp:AdminInitiateAuth
          - cognito-idp:AdminRespondToAuthChallenge
          - cognito-idp:AdminUserGlobalSignOut
          - cognito-idp:AdminGetUser
          - cognito-idp:AdminUpdateUserAttributes
        Resource: 
          - !Sub "arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${CognitoUserPoolId}"
      
      # DynamoDB permissions
      - Effect: Allow
        Action:
          - dynamodb:GetItem
          - dynamodb:PutItem
          - dynamodb:UpdateItem
          - dynamodb:Query
        Resource:
          - !Sub "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${Stage}-users"
          - !Sub "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${Stage}-accounts"
          - !Sub "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${Stage}-user-accounts"
          - !Sub "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${Stage}-activity"
      
      # EventBridge permissions
      - Effect: Allow
        Action:
          - events:PutEvents
        Resource:
          - !Sub "arn:aws:events:${AWS::Region}:${AWS::AccountId}:event-bus/listbackup-events-${Stage}"
      
      # X-Ray permissions
      - Effect: Allow
        Action:
          - xray:PutTraceSegments
          - xray:PutTelemetryRecords
        Resource: "*"
```

### Users Service (Replace Wildcard)
```yaml
iam:
  role:
    statements:
      # DynamoDB permissions
      - Effect: Allow
        Action:
          - dynamodb:GetItem
          - dynamodb:PutItem
          - dynamodb:UpdateItem
          - dynamodb:DeleteItem
          - dynamodb:Query
          - dynamodb:Scan
        Resource:
          - !Sub "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${Stage}-users"
          - !Sub "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${Stage}-users/index/*"
          - !Sub "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${Stage}-user-accounts"
          - !Sub "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${Stage}-user-accounts/index/*"
      
      # Cognito permissions for user management
      - Effect: Allow
        Action:
          - cognito-idp:AdminGetUser
          - cognito-idp:AdminUpdateUserAttributes
          - cognito-idp:AdminDeleteUser
          - cognito-idp:AdminEnableUser
          - cognito-idp:AdminDisableUser
        Resource: 
          - !Sub "arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${CognitoUserPoolId}"
      
      # EventBridge permissions
      - Effect: Allow
        Action:
          - events:PutEvents
        Resource:
          - !Sub "arn:aws:events:${AWS::Region}:${AWS::AccountId}:event-bus/listbackup-events-${Stage}"
      
      # X-Ray permissions
      - Effect: Allow
        Action:
          - xray:PutTraceSegments
          - xray:PutTelemetryRecords
        Resource: "*"
```

## Additional Security Recommendations

### 1. Resource Tagging Strategy
Implement consistent tagging for all resources:
```yaml
Tags:
  - Key: Service
    Value: listbackup-${service-name}
  - Key: Stage
    Value: ${stage}
  - Key: ManagedBy
    Value: serverless
```

### 2. Cross-Account Boundaries
For multi-tenant isolation:
- Consider separate AWS accounts per major customer
- Use AWS Organizations for account management
- Implement Service Control Policies (SCPs)

### 3. Secrets Management
- Move from inline permissions to IAM roles
- Use AWS Secrets Manager for all credentials
- Implement rotation policies

### 4. Monitoring and Alerting
- Enable CloudTrail for all services
- Set up CloudWatch alarms for unauthorized access attempts
- Implement AWS Config rules for compliance

## Migration Priority

1. **IMMEDIATE**: Fix auth and users service wildcard permissions
2. **HIGH**: Review and tighten DynamoDB permissions (remove unnecessary operations)
3. **MEDIUM**: Implement resource tagging for better access control
4. **LOW**: Optimize permissions for unused operations

## Compliance Considerations

### SOC 2 Requirements
- Principle of least privilege ❌ (wildcard permissions violate this)
- Access logging and monitoring ✅ (X-Ray enabled)
- Encryption in transit and at rest ⏳ (needs verification)

### GDPR/Privacy Requirements
- Data isolation per account ✅ (table prefixes)
- Right to deletion ⏳ (needs DeleteItem permissions)
- Audit trail ✅ (EventBridge integration)

## Next Steps

1. Create Jira tickets for each service requiring permission updates
2. Test permission changes in development environment
3. Implement gradual rollout with monitoring
4. Document any service disruptions during migration
5. Update service documentation with required permissions

## Appendix: Service Permission Matrix

| Service | DynamoDB | S3 | Cognito | SQS | Secrets | EventBridge | Risk Level |
|---------|----------|-----|---------|-----|---------|-------------|------------|
| auth | ⚠️ * | ⚠️ * | ⚠️ * | ⚠️ * | ⚠️ * | ⚠️ * | CRITICAL |
| users | ⚠️ * | ⚠️ * | ⚠️ * | ⚠️ * | ⚠️ * | ⚠️ * | CRITICAL |
| accounts | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | LOW |
| integrations | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | LOW |
| sources | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | LOW |
| notifications | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (SES/SNS) | LOW |
| jobs | ✅ | ⏳ | ❌ | ✅ | ❌ | ❌ | LOW |
| billing | ✅ | ❌ | ✅ | ❌ | ✅ (SSM) | ❌ | LOW |

Legend:
- ✅ Has appropriate permissions
- ❌ No permissions (as expected)
- ⏳ May need permissions
- ⚠️ Overly permissive

---

*Generated: 2025-01-22*
*Auditor: Claude Code*