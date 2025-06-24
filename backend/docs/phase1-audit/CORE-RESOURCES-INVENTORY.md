# Core Service Resources Inventory

**Service**: listbackup-core  
**Framework**: Serverless v4  
**Provider**: AWS  
**Region**: us-west-2  
**Stage**: ${opt:stage, 'main'}

## DynamoDB Tables (13 Total)

### 1. Users Table
- **Name**: ${prefix}-users
- **Primary Key**: userId (HASH)
- **Global Secondary Indexes**:
  - EmailIndex: email (HASH)
  - CognitoUserIndex: cognitoUserId (HASH)
- **Billing Mode**: PAY_PER_REQUEST

### 2. Accounts Table
- **Name**: ${prefix}-accounts
- **Primary Key**: accountId (HASH)
- **Global Secondary Indexes**:
  - ParentAccountIndex: parentAccountId (HASH)
  - OwnerIndex: ownerUserId (HASH)
- **Billing Mode**: PAY_PER_REQUEST

### 3. User-Accounts Table
- **Name**: ${prefix}-user-accounts
- **Primary Key**: userId (HASH), accountId (RANGE)
- **Global Secondary Indexes**:
  - AccountIndex: accountId (HASH)
- **Billing Mode**: PAY_PER_REQUEST

### 4. Activity Table
- **Name**: ${prefix}-activity
- **Primary Key**: eventId (HASH)
- **Global Secondary Indexes**:
  - AccountIndex: accountId (HASH), timestamp (RANGE)
- **TTL**: Enabled on 'ttl' attribute
- **Billing Mode**: PAY_PER_REQUEST

### 5. Sources Table
- **Name**: ${prefix}-sources
- **Primary Key**: sourceId (HASH)
- **Global Secondary Indexes**:
  - AccountIndex: accountId (HASH)
  - UserIndex: userId (HASH)
  - GroupIndex: groupId (HASH)
- **Billing Mode**: PAY_PER_REQUEST

### 6. Jobs Table
- **Name**: ${prefix}-jobs
- **Primary Key**: jobId (HASH)
- **Global Secondary Indexes**:
  - AccountIndex: accountId (HASH)
  - UserIndex: userId (HASH)
  - SourceIndex: sourceId (HASH)
  - StatusTimeIndex: status (HASH), createdAt (RANGE)
  - AccountTimeIndex: accountId (HASH), createdAt (RANGE)
- **Stream**: NEW_AND_OLD_IMAGES
- **Billing Mode**: PAY_PER_REQUEST

### 7. Files Table
- **Name**: ${prefix}-files
- **Primary Key**: fileId (HASH)
- **Global Secondary Indexes**:
  - AccountIndex: accountId (HASH)
  - SourceIndex: sourceId (HASH)
- **Billing Mode**: PAY_PER_REQUEST

### 8. OAuth States Table
- **Name**: ${prefix}-oauth-states
- **Primary Key**: state (HASH)
- **TTL**: Enabled on 'ttl' attribute
- **Billing Mode**: PAY_PER_REQUEST

### 9. API Keys Table
- **Name**: ${prefix}-api-keys
- **Primary Key**: keyId (HASH)
- **Global Secondary Indexes**:
  - AccountIndex: accountId (HASH)
- **Billing Mode**: PAY_PER_REQUEST

### 10. Platforms Table
- **Name**: ${prefix}-platforms
- **Primary Key**: platformId (HASH)
- **Global Secondary Indexes**:
  - TypeIndex: type (HASH)
  - CategoryIndex: category (HASH)
  - StatusIndex: status (HASH)
- **Billing Mode**: PAY_PER_REQUEST

### 11. Platform Connections Table
- **Name**: ${prefix}-platform-connections
- **Primary Key**: connectionId (HASH)
- **Global Secondary Indexes**:
  - AccountIndex: accountId (HASH)
  - UserIndex: userId (HASH)
  - PlatformIndex: platformId (HASH)
  - StatusIndex: status (HASH)
- **Billing Mode**: PAY_PER_REQUEST

### 12. Source Groups Table
- **Name**: ${prefix}-source-groups
- **Primary Key**: groupId (HASH)
- **Global Secondary Indexes**:
  - AccountIndex: accountId (HASH)
  - UserIndex: userId (HASH)
  - ConnectionIndex: connectionId (HASH)
- **Billing Mode**: PAY_PER_REQUEST

### 13. Platform Sources Table
- **Name**: ${prefix}-platform-sources
- **Primary Key**: platformSourceId (HASH)
- **Global Secondary Indexes**:
  - PlatformIndex: platformId (HASH)
  - DataTypeIndex: dataType (HASH)
  - CategoryIndex: category (HASH)
  - PopularityIndex: platformId (HASH), popularity (RANGE)
  - StatusIndex: status (HASH)
- **Billing Mode**: PAY_PER_REQUEST

## SQS FIFO Queues (6 Queues + 6 DLQs)

### Primary Queues:
1. **Sync Queue** (High Priority)
   - Name: listbackup-sync-queue-${stage}.fifo
   - Visibility Timeout: 300s (5 min)
   - Message Retention: 14 days
   - Max Receive Count: 3
   - DLQ: SyncDeadLetterQueue

2. **Backup Queue** (High Priority)
   - Name: listbackup-backup-queue-${stage}.fifo
   - Visibility Timeout: 1800s (30 min)
   - Message Retention: 14 days
   - Max Receive Count: 2
   - DLQ: BackupDeadLetterQueue

3. **Export Queue** (Medium Priority)
   - Name: listbackup-export-queue-${stage}.fifo
   - Visibility Timeout: 900s (15 min)
   - Message Retention: 14 days
   - Max Receive Count: 3
   - DLQ: ExportDeadLetterQueue

4. **Analytics Queue** (Low Priority)
   - Name: listbackup-analytics-queue-${stage}.fifo
   - Visibility Timeout: 3600s (1 hour)
   - Message Retention: 14 days
   - Max Receive Count: 2
   - DLQ: AnalyticsDeadLetterQueue

5. **Maintenance Queue** (Low Priority)
   - Name: listbackup-maintenance-queue-${stage}.fifo
   - Visibility Timeout: 1800s (30 min)
   - Message Retention: 14 days
   - Max Receive Count: 1
   - DLQ: MaintenanceDeadLetterQueue

6. **Alert Queue** (High Priority)
   - Name: listbackup-alert-queue-${stage}.fifo
   - Visibility Timeout: 60s (1 min)
   - Message Retention: 7 days
   - Max Receive Count: 5
   - DLQ: AlertDeadLetterQueue

### Dead Letter Queues:
- All DLQs follow naming: listbackup-{type}-dlq-${stage}.fifo
- All have FIFO enabled with content-based deduplication
- Message retention: 14 days (except Alert DLQ: 7 days)

## S3 Bucket

**Data Bucket**:
- Name: listbackup-data-${stage}
- Versioning: Enabled
- Encryption: AES256
- Public Access: All blocked
- Purpose: Primary data storage for backups

## EventBridge

**Event Bus**:
- Name: listbackup-events-${stage}
- Purpose: Event-driven architecture communication

## Cognito

**User Pool**:
- Name: listbackup-users-${stage}
- Alias Attributes: email
- Auto-verified: email
- Password Policy:
  - Min Length: 8
  - Require: Uppercase, Lowercase, Numbers
  - No symbols required
- Schema: email (required), name (required), company (optional)

**User Pool Client**:
- Name: listbackup-client-${stage}
- No secret (public client)
- Auth Flows: ADMIN_NO_SRP_AUTH, USER_PASSWORD_AUTH

## IAM Permissions

### DynamoDB Permissions:
- Full CRUD operations on all tables
- Query, Scan, Batch operations
- Stream operations
- Table management (Create, Describe, TTL)
- Resource pattern: `listbackup-${stage}-*`

### S3 Permissions:
- GetObject, PutObject, DeleteObject, ListBucket
- Bucket: listbackup-data-${stage}

### SQS Permissions:
- SendMessage, ReceiveMessage, DeleteMessage, GetQueueAttributes
- All queues and DLQs matching pattern

### EventBridge Permissions:
- PutEvents on event bus

### Secrets Manager Permissions:
- Full secret management for OAuth tokens
- Paths: `listbackup/${stage}/*` and `sources/*`

## CloudFormation Outputs (All Exported)

### DynamoDB Exports:
- All 13 table names
- Jobs table stream ARN

### SQS Exports:
- All 6 queue URLs and ARNs

### S3 Exports:
- Data bucket name

### EventBridge Exports:
- Event bus name

### Cognito Exports:
- User Pool ID and ARN
- User Pool Client ID

## Environment Variables Set:
- STAGE
- COGNITO_USER_POOL_ID, CLIENT_ID, CLIENT_SECRET, REGION, JWKS_URI, ISSUER
- DYNAMODB_TABLE_PREFIX
- S3_BUCKET
- All queue URLs
- EVENT_BUS_NAME
- API_VERSION, API_REFERENCE

## Key Architecture Notes:
1. All resources use stage-based naming for environment isolation
2. All DynamoDB tables use on-demand billing
3. FIFO queues ensure message ordering and prevent duplicates
4. Comprehensive IAM permissions with wildcards for flexibility
5. All outputs exported for cross-stack references