# ListBackup.ai Core Service Resource Inventory

**Service Name**: listbackup-core  
**Framework**: Serverless Framework v4  
**Provider**: AWS  
**Runtime**: provided.al2023 (Go)  
**Region**: us-west-2  
**Stage**: main (configurable)  

## Overview

This document provides a comprehensive inventory of all AWS resources defined in the core service serverless.yml file. The core service is responsible for creating the foundational infrastructure that all other services depend on.

## Environment Variables

The core service sets up the following environment variables for use across all services:

- `STAGE`: Current deployment stage
- `COGNITO_USER_POOL_ID`: Reference to the Cognito User Pool
- `COGNITO_CLIENT_ID`: Reference to the Cognito User Pool Client
- `COGNITO_CLIENT_SECRET`: Empty for public client
- `COGNITO_REGION`: AWS region for Cognito
- `COGNITO_JWKS_URI`: JWKS endpoint for JWT validation
- `COGNITO_ISSUER`: JWT issuer URL
- `DYNAMODB_TABLE_PREFIX`: Prefix for all DynamoDB tables
- `S3_BUCKET`: Main data storage bucket name
- Queue URLs for all 6 FIFO queues
- `EVENT_BUS_NAME`: EventBridge event bus name
- `API_VERSION`: API version (v1)
- `API_REFERENCE`: API reference name

## DynamoDB Tables (20 Total)

### 1. Users Table
- **Table Name**: `listbackup-{stage}-users`
- **Primary Key**: `userId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `EmailIndex`: Hash key on `email`
  - `CognitoUserIndex`: Hash key on `cognitoUserId`
- **Attributes**: userId, email, cognitoUserId
- **Purpose**: Store user account information

### 2. Accounts Table
- **Table Name**: `listbackup-{stage}-accounts`
- **Primary Key**: `accountId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `ParentAccountIndex`: Hash key on `parentAccountId`
  - `OwnerIndex`: Hash key on `ownerUserId`
- **Attributes**: accountId, parentAccountId, ownerUserId
- **Purpose**: Hierarchical account structure for organizations

### 3. User Accounts Table
- **Table Name**: `listbackup-{stage}-user-accounts`
- **Primary Key**: `userId` (HASH), `accountId` (RANGE)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `AccountIndex`: Hash key on `accountId`
- **Attributes**: userId, accountId
- **Purpose**: Many-to-many relationship between users and accounts

### 4. Activity Table
- **Table Name**: `listbackup-{stage}-activity`
- **Primary Key**: `eventId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `AccountIndex`: Hash key on `accountId`, Range key on `timestamp`
- **Attributes**: eventId, accountId, timestamp (Number)
- **TTL**: Enabled on `ttl` attribute
- **Purpose**: Audit log and activity tracking

### 5. Sources Table
- **Table Name**: `listbackup-{stage}-sources`
- **Primary Key**: `sourceId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `AccountIndex`: Hash key on `accountId`
  - `UserIndex`: Hash key on `userId`
  - `GroupIndex`: Hash key on `groupId`
- **Attributes**: sourceId, accountId, userId, groupId
- **Purpose**: Data source configurations and connections

### 6. Jobs Table
- **Table Name**: `listbackup-{stage}-jobs`
- **Primary Key**: `jobId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `AccountIndex`: Hash key on `accountId`
  - `UserIndex`: Hash key on `userId`
  - `SourceIndex`: Hash key on `sourceId`
  - `StatusTimeIndex`: Hash key on `status`, Range key on `createdAt`
  - `AccountTimeIndex`: Hash key on `accountId`, Range key on `createdAt`
- **Attributes**: jobId, accountId, userId, sourceId, createdAt, status
- **DynamoDB Streams**: Enabled with NEW_AND_OLD_IMAGES
- **Purpose**: Backup and sync job management

### 7. Files Table
- **Table Name**: `listbackup-{stage}-files`
- **Primary Key**: `fileId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `AccountIndex`: Hash key on `accountId`
  - `SourceIndex`: Hash key on `sourceId`
- **Attributes**: fileId, accountId, sourceId
- **Purpose**: File metadata and tracking

### 8. OAuth States Table
- **Table Name**: `listbackup-{stage}-oauth-states`
- **Primary Key**: `state` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **TTL**: Enabled on `ttl` attribute
- **Purpose**: OAuth state parameter validation

### 9. API Keys Table
- **Table Name**: `listbackup-{stage}-api-keys`
- **Primary Key**: `keyId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `AccountIndex`: Hash key on `accountId`
- **Attributes**: keyId, accountId
- **Purpose**: API key management for integrations

### 10. Platforms Table
- **Table Name**: `listbackup-{stage}-platforms`
- **Primary Key**: `platformId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `TypeIndex`: Hash key on `type`
  - `CategoryIndex`: Hash key on `category`
  - `StatusIndex`: Hash key on `status`
- **Attributes**: platformId, type, category, status
- **Purpose**: Platform definitions and configurations

### 11. Platform Connections Table
- **Table Name**: `listbackup-{stage}-platform-connections`
- **Primary Key**: `connectionId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `AccountIndex`: Hash key on `accountId`
  - `UserIndex`: Hash key on `userId`
  - `PlatformIndex`: Hash key on `platformId`
  - `StatusIndex`: Hash key on `status`
- **Attributes**: connectionId, accountId, userId, platformId, status
- **Purpose**: User's authenticated platform connections

### 12. Source Groups Table
- **Table Name**: `listbackup-{stage}-source-groups`
- **Primary Key**: `groupId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `AccountIndex`: Hash key on `accountId`
  - `UserIndex`: Hash key on `userId`
  - `ConnectionIndex`: Hash key on `connectionId`
- **Attributes**: groupId, accountId, userId, connectionId
- **Purpose**: Logical grouping of data sources

### 13. Platform Sources Table
- **Table Name**: `listbackup-{stage}-platform-sources`
- **Primary Key**: `platformSourceId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `PlatformIndex`: Hash key on `platformId`
  - `DataTypeIndex`: Hash key on `dataType`
  - `CategoryIndex`: Hash key on `category`
  - `PopularityIndex`: Hash key on `platformId`, Range key on `popularity`
  - `StatusIndex`: Hash key on `status`
- **Attributes**: platformSourceId, platformId, dataType, category, popularity (Number), status
- **Purpose**: Backup templates and configurations for each platform

### 14. Notifications Table
- **Table Name**: `listbackup-{stage}-notifications`
- **Primary Key**: `notificationId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `UserIndex`: Hash key on `userId`, Range key on `createdAt`
  - `AccountIndex`: Hash key on `accountId`, Range key on `createdAt`
- **Attributes**: notificationId, userId, accountId, createdAt
- **TTL**: Enabled on `ttl` attribute
- **Purpose**: User notifications and alerts

### 15. Billing Table
- **Table Name**: `listbackup-{stage}-billing`
- **Primary Key**: `billingId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `AccountPeriodIndex`: Hash key on `accountId`, Range key on `period`
- **Attributes**: billingId, accountId, period
- **Purpose**: Billing records and invoices

### 16. Billing Usage Table
- **Table Name**: `listbackup-{stage}-billing-usage`
- **Primary Key**: `usageId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `AccountTimeIndex`: Hash key on `accountId`, Range key on `timestamp`
  - `SourceTimeIndex`: Hash key on `sourceId`, Range key on `timestamp`
- **Attributes**: usageId, accountId, sourceId, timestamp (Number)
- **Purpose**: Usage tracking for billing

### 17. Tags Table
- **Table Name**: `listbackup-{stage}-tags`
- **Primary Key**: `tagId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `AccountIndex`: Hash key on `accountId`
  - `AccountNameIndex`: Hash key on `accountId`, Range key on `tagName`
- **Attributes**: tagId, accountId, tagName
- **Purpose**: Resource tagging and categorization

### 18. Teams Table
- **Table Name**: `listbackup-{stage}-teams`
- **Primary Key**: `teamId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `AccountIndex`: Hash key on `accountId`
  - `OwnerIndex`: Hash key on `ownerUserId`
- **Attributes**: teamId, accountId, ownerUserId
- **Purpose**: Team management for collaboration

### 19. Team Members Table
- **Table Name**: `listbackup-{stage}-team-members`
- **Primary Key**: `teamId` (HASH), `userId` (RANGE)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `UserIndex`: Hash key on `userId`
- **Attributes**: teamId, userId
- **Purpose**: Team membership relationships

### 20. Job Logs Table
- **Table Name**: `listbackup-{stage}-job-logs`
- **Primary Key**: `logId` (String, HASH)
- **Billing Mode**: PAY_PER_REQUEST
- **Global Secondary Indexes**:
  - `JobIndex`: Hash key on `jobId`, Range key on `timestamp`
- **Attributes**: logId, jobId, timestamp (Number)
- **TTL**: Enabled on `ttl` attribute
- **Purpose**: Detailed job execution logs

## S3 Bucket (1 Total)

### Data Bucket
- **Bucket Name**: `listbackup-data-{stage}`
- **Versioning**: Enabled
- **Encryption**: AES256 server-side encryption
- **Public Access**: Completely blocked
- **Purpose**: Primary data storage for all backups and exports

## SQS FIFO Queues (6 Main + 6 DLQs = 12 Total)

### Main Queues

#### 1. Sync Queue (High Priority)
- **Queue Name**: `listbackup-sync-queue-{stage}.fifo`
- **FIFO**: True with content-based deduplication
- **Visibility Timeout**: 300 seconds (5 minutes)
- **Message Retention**: 1,209,600 seconds (14 days)
- **Long Polling**: 20 seconds
- **Max Receive Count**: 3
- **Purpose**: Real-time sync operations

#### 2. Backup Queue (High Priority)
- **Queue Name**: `listbackup-backup-queue-{stage}.fifo`
- **FIFO**: True with content-based deduplication
- **Visibility Timeout**: 1,800 seconds (30 minutes)
- **Message Retention**: 1,209,600 seconds (14 days)
- **Long Polling**: 20 seconds
- **Max Receive Count**: 2
- **Purpose**: Scheduled backup operations

#### 3. Export Queue (Medium Priority)
- **Queue Name**: `listbackup-export-queue-{stage}.fifo`
- **FIFO**: True with content-based deduplication
- **Visibility Timeout**: 900 seconds (15 minutes)
- **Message Retention**: 1,209,600 seconds (14 days)
- **Long Polling**: 20 seconds
- **Max Receive Count**: 3
- **Purpose**: User-requested data exports

#### 4. Analytics Queue (Low Priority)
- **Queue Name**: `listbackup-analytics-queue-{stage}.fifo`
- **FIFO**: True with content-based deduplication
- **Visibility Timeout**: 3,600 seconds (1 hour)
- **Message Retention**: 1,209,600 seconds (14 days)
- **Long Polling**: 20 seconds
- **Max Receive Count**: 2
- **Purpose**: Analytics and reporting processing

#### 5. Maintenance Queue (Low Priority)
- **Queue Name**: `listbackup-maintenance-queue-{stage}.fifo`
- **FIFO**: True with content-based deduplication
- **Visibility Timeout**: 1,800 seconds (30 minutes)
- **Message Retention**: 1,209,600 seconds (14 days)
- **Long Polling**: 20 seconds
- **Max Receive Count**: 1
- **Purpose**: System maintenance tasks

#### 6. Alert Queue (High Priority)
- **Queue Name**: `listbackup-alert-queue-{stage}.fifo`
- **FIFO**: True with content-based deduplication
- **Visibility Timeout**: 60 seconds (1 minute)
- **Message Retention**: 604,800 seconds (7 days)
- **Long Polling**: 1 second
- **Max Receive Count**: 5
- **Purpose**: Critical system alerts

### Dead Letter Queues

Each main queue has a corresponding DLQ with the same FIFO configuration:
- `listbackup-sync-dlq-{stage}.fifo`
- `listbackup-backup-dlq-{stage}.fifo`
- `listbackup-export-dlq-{stage}.fifo`
- `listbackup-analytics-dlq-{stage}.fifo`
- `listbackup-maintenance-dlq-{stage}.fifo`
- `listbackup-alert-dlq-{stage}.fifo`

## EventBridge (1 Total)

### Event Bus
- **Name**: `listbackup-events-{stage}`
- **Purpose**: Central event routing for system-wide events and notifications

## Cognito (2 Resources)

### User Pool
- **Name**: `listbackup-users-{stage}`
- **Alias Attributes**: Email
- **Username Configuration**: Case insensitive
- **Auto Verified Attributes**: Email
- **Password Policy**:
  - Minimum length: 8 characters
  - Requires: Uppercase, lowercase, numbers
  - Symbols: Not required
- **Schema Attributes**:
  - `email`: Required, mutable
  - `name`: Required, mutable
  - `company`: Optional, mutable
- **Email Configuration**: Cognito default
- **Self Registration**: Enabled

### User Pool Client
- **Name**: `listbackup-client-{stage}`
- **Generate Secret**: False (public client)
- **Auth Flows**: ADMIN_NO_SRP_AUTH, USER_PASSWORD_AUTH
- **Prevent User Existence Errors**: Enabled

## IAM Permissions

The core service creates comprehensive IAM permissions for:

### DynamoDB
- Full CRUD operations on all tables with prefix `listbackup-{stage}-*`
- Index and stream access
- Backup and tagging operations
- Account-level list operations

### S3
- Full object operations on the data bucket
- Bucket listing permissions

### SQS
- Send, receive, delete message operations
- Queue attribute access for all FIFO queues and DLQs

### EventBridge
- Put events permission for the event bus

### AWS Secrets Manager
- Full secret management for OAuth tokens and credentials
- Scoped to `listbackup/{stage}/*` and `sources/*` paths

## Outputs and Exports

The service exports 50+ values for use by other services:
- All 20 DynamoDB table names
- Jobs table stream ARN
- S3 bucket name
- All SQS queue URLs and ARNs (12 total)
- EventBridge event bus name
- Cognito User Pool ID, ARN, and Client ID
- All table ARNs for IAM policies
- Global Secondary Index names

## Dependencies

This service has no dependencies and must be deployed first as all other services depend on its exported values.

## Deployment Notes

- No Lambda functions are defined in this service
- All resources use stage-specific naming for multi-environment support
- PAY_PER_REQUEST billing mode is used throughout for cost optimization
- TTL is enabled on appropriate tables for automatic cleanup
- DynamoDB streams are enabled only where needed (Jobs table)

## Security Features

- S3 bucket has complete public access blocking
- Server-side encryption enabled on S3
- Cognito password policy enforced
- IAM permissions follow least privilege principle
- Secrets Manager used for sensitive OAuth data
- FIFO queues ensure message ordering and deduplication