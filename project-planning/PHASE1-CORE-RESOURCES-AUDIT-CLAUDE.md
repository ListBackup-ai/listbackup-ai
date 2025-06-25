# Phase 1 Task 1.1: Core Service Resources Audit

## Overview
Complete audit of all AWS resources defined in `core/serverless.yml` for the ListBackup.ai v2 serverless architecture reorganization.

## DynamoDB Tables (17 Total)

### 1. UsersTable
- **Name**: `listbackup-${stage}-users`
- **Primary Key**: `userId` (String)
- **GSI**: 
  - EmailIndex: `email` (HASH)
  - CognitoUserIndex: `cognitoUserId` (HASH)
- **Purpose**: Core user management and authentication mapping

### 2. AccountsTable  
- **Name**: `listbackup-${stage}-accounts`
- **Primary Key**: `accountId` (String)
- **GSI**:
  - ParentAccountIndex: `parentAccountId` (HASH)
  - OwnerIndex: `ownerUserId` (HASH)
- **Purpose**: Hierarchical account structure for enterprise support

### 3. UserAccountsTable
- **Name**: `listbackup-${stage}-user-accounts`
- **Primary Key**: `userId` (HASH), `accountId` (RANGE)
- **GSI**: AccountIndex: `accountId` (HASH)
- **Purpose**: Many-to-many relationship between users and accounts

### 4. ActivityTable
- **Name**: `listbackup-${stage}-activity`
- **Primary Key**: `eventId` (String)
- **GSI**: AccountIndex: `accountId` (HASH), `timestamp` (RANGE)
- **TTL**: Enabled on `ttl` attribute
- **Purpose**: Activity logging with automatic cleanup

### 5. SourcesTable
- **Name**: `listbackup-${stage}-sources`
- **Primary Key**: `sourceId` (String)
- **GSI**: 
  - AccountIndex: `accountId` (HASH)
  - UserIndex: `userId` (HASH)
  - GroupIndex: `groupId` (HASH)
- **Purpose**: Backup sources configuration

### 6. JobsTable
- **Name**: `listbackup-${stage}-jobs`
- **Primary Key**: `jobId` (String)
- **GSI**:
  - AccountIndex: `accountId` (HASH)
  - UserIndex: `userId` (HASH)  
  - SourceIndex: `sourceId` (HASH)
  - StatusTimeIndex: `status` (HASH), `createdAt` (RANGE)
  - AccountTimeIndex: `accountId` (HASH), `createdAt` (RANGE)
- **Streams**: NEW_AND_OLD_IMAGES enabled
- **Purpose**: Backup job management and processing

### 7. FilesTable
- **Name**: `listbackup-${stage}-files`
- **Primary Key**: `fileId` (String)
- **GSI**:
  - AccountIndex: `accountId` (HASH)
  - SourceIndex: `sourceId` (HASH)
- **Purpose**: File metadata and tracking

### 8. OAuthStatesTable
- **Name**: `listbackup-${stage}-oauth-states`
- **Primary Key**: `state` (String)
- **TTL**: Enabled on `ttl` attribute
- **Purpose**: OAuth state management for security

### 9. ApiKeysTable
- **Name**: `listbackup-${stage}-api-keys`
- **Primary Key**: `keyId` (String)
- **GSI**: AccountIndex: `accountId` (HASH)
- **Purpose**: API key management for integrations

### 10. PlatformsTable
- **Name**: `listbackup-${stage}-platforms`
- **Primary Key**: `platformId` (String)
- **GSI**:
  - TypeIndex: `type` (HASH)
  - CategoryIndex: `category` (HASH)
  - StatusIndex: `status` (HASH)
- **Purpose**: Platform definitions and metadata

### 11. PlatformConnectionsTable
- **Name**: `listbackup-${stage}-platform-connections`
- **Primary Key**: `connectionId` (String)
- **GSI**:
  - AccountIndex: `accountId` (HASH)
  - UserIndex: `userId` (HASH)
  - PlatformIndex: `platformId` (HASH)
  - StatusIndex: `status` (HASH)
- **Purpose**: User platform authentication connections

### 12. SourceGroupsTable
- **Name**: `listbackup-${stage}-source-groups`
- **Primary Key**: `groupId` (String)
- **GSI**:
  - AccountIndex: `accountId` (HASH)
  - UserIndex: `userId` (HASH)
  - ConnectionIndex: `connectionId` (HASH)
- **Purpose**: Logical grouping of backup sources

### 13. PlatformSourcesTable
- **Name**: `listbackup-${stage}-platform-sources`
- **Primary Key**: `platformSourceId` (String)
- **GSI**:
  - PlatformIndex: `platformId` (HASH)
  - DataTypeIndex: `dataType` (HASH)
  - CategoryIndex: `category` (HASH)
  - PopularityIndex: `platformId` (HASH), `popularity` (RANGE)
  - StatusIndex: `status` (HASH)
- **Purpose**: Backup templates for each platform

## SQS Queues (12 Total - 6 FIFO + 6 DLQ)

### Primary FIFO Queues
1. **SyncQueue**: `listbackup-sync-queue-${stage}.fifo`
   - Visibility: 300s (5 min)
   - Max Receives: 3
   - Priority: High (real-time sync)

2. **BackupQueue**: `listbackup-backup-queue-${stage}.fifo`
   - Visibility: 1800s (30 min)
   - Max Receives: 2
   - Priority: High (scheduled backups)

3. **ExportQueue**: `listbackup-export-queue-${stage}.fifo`
   - Visibility: 900s (15 min)
   - Max Receives: 3
   - Priority: Medium (user exports)

4. **AnalyticsQueue**: `listbackup-analytics-queue-${stage}.fifo`
   - Visibility: 3600s (1 hour)
   - Max Receives: 2
   - Priority: Low (analytics processing)

5. **MaintenanceQueue**: `listbackup-maintenance-queue-${stage}.fifo`
   - Visibility: 1800s (30 min)
   - Max Receives: 1
   - Priority: Low (maintenance tasks)

6. **AlertQueue**: `listbackup-alert-queue-${stage}.fifo`
   - Visibility: 60s (1 min)
   - Max Receives: 5
   - Priority: High (critical alerts)

### Dead Letter Queues (DLQ)
- SyncDeadLetterQueue
- BackupDeadLetterQueue  
- ExportDeadLetterQueue
- AnalyticsDeadLetterQueue
- MaintenanceDeadLetterQueue
- AlertDeadLetterQueue

## S3 Bucket (1 Total)

### DataBucket
- **Name**: `listbackup-data-${stage}`
- **Versioning**: Enabled
- **Encryption**: AES256
- **Public Access**: Completely blocked
- **Purpose**: Primary data storage for backups

## EventBridge (1 Total)

### EventBus
- **Name**: `listbackup-events-${stage}`
- **Purpose**: Event-driven architecture for system communication

## Cognito (2 Resources)

### CognitoUserPool
- **Name**: `listbackup-users-${stage}`
- **Aliases**: Email
- **Auto-verify**: Email
- **Schema**: email (required), name (required), company (optional)
- **Password Policy**: 8+ chars, upper, lower, numbers

### CognitoUserPoolClient  
- **Name**: `listbackup-client-${stage}`
- **Secret**: None (public client)
- **Auth Flows**: ADMIN_NO_SRP_AUTH, USER_PASSWORD_AUTH

## IAM Permissions

### DynamoDB
- Full CRUD operations on all tables
- Wildcard permissions for `listbackup-${stage}-*` tables
- Stream access for real-time processing
- Account-level list operations

### S3
- Full object operations on data bucket
- Bucket listing permissions

### SQS  
- Send, receive, delete messages
- Queue attribute access
- Covers all FIFO queues and DLQs

### EventBridge
- Put events to custom event bus

### Secrets Manager
- Full secret operations for OAuth tokens
- Scoped to `listbackup/${stage}/*` and `sources/*`

## CloudFormation Outputs (26 Total)

All resources export their names and ARNs for cross-stack references:
- DynamoDB table names (13)
- S3 bucket name (1)
- SQS queue URLs and ARNs (12)
- EventBridge bus name (1)
- Cognito pool and client IDs/ARNs (3)

## Dependencies for Phase 2

This audit provides the foundation for Phase 2 infrastructure separation:

1. **infrastructure-dynamodb.yml**: Move all 17 DynamoDB tables
2. **infrastructure-sqs.yml**: Move all 12 SQS queues  
3. **infrastructure-s3.yml**: Move S3 bucket
4. **infrastructure-eventbridge.yml**: Move EventBridge
5. **infrastructure-cognito.yml**: Update existing with proper exports

## Critical Notes

- No Lambda functions in core service (infrastructure only)
- All resources use stage-based naming for multi-environment support
- Comprehensive IAM permissions allow service flexibility
- Rich export structure enables proper cross-stack referencing
- EventBridge enables event-driven architecture
- TTL enabled on activity and OAuth state tables for automatic cleanup

## Next Steps

This resource inventory enables:
- Clean separation into dedicated infrastructure services
- Proper CloudFormation export/import patterns
- Maintained functionality during transition
- Clear resource ownership and management