# DynamoDB Tables Documentation

This document provides comprehensive documentation for all DynamoDB tables in the ListBackup.ai infrastructure.

## Table of Contents
1. [Overview](#overview)
2. [Table Schemas](#table-schemas)
3. [Access Patterns](#access-patterns)
4. [Best Practices](#best-practices)

## Overview

The ListBackup.ai platform uses 17 DynamoDB tables to store various types of data. All tables follow a consistent naming convention: `listbackup-{stage}-{tablename}`.

### Table Categories

- **User Management**: users, user-accounts
- **Account Hierarchy**: accounts
- **Platform Integration**: platforms, platform-connections, platform-sources
- **Data Management**: sources, source-groups, jobs, job-logs
- **Team Collaboration**: teams, team-members
- **System**: activity, notifications, billing, billing-usage, tags

## Table Schemas

### 1. UsersTable
**Table Name**: `listbackup-${stage}-users`

| Attribute | Type | Description |
|-----------|------|-------------|
| userId (PK) | String | Unique user identifier |
| email | String | User email address |
| cognitoUserId | String | AWS Cognito user ID |
| name | String | User full name |
| createdAt | String | ISO timestamp |
| updatedAt | String | ISO timestamp |

**Global Secondary Indexes**:
- **EmailIndex**: email (HASH) - Find user by email
- **CognitoUserIndex**: cognitoUserId (HASH) - Find user by Cognito ID

### 2. AccountsTable
**Table Name**: `listbackup-${stage}-accounts`

| Attribute | Type | Description |
|-----------|------|-------------|
| accountId (PK) | String | Unique account identifier |
| parentAccountId | String | Parent account for hierarchy |
| ownerUserId | String | Account owner user ID |
| accountName | String | Account display name |
| accountType | String | Type: personal/team/enterprise |
| accountPath | String | Hierarchical path |
| settings | Map | Account settings |
| createdAt | String | ISO timestamp |

**Global Secondary Indexes**:
- **ParentAccountIndex**: parentAccountId (HASH) - Find child accounts
- **OwnerIndex**: ownerUserId (HASH) - Find accounts by owner

### 3. UserAccountsTable
**Table Name**: `listbackup-${stage}-user-accounts`

| Attribute | Type | Description |
|-----------|------|-------------|
| userId (PK) | String | User ID |
| accountId (SK) | String | Account ID |
| role | String | User role in account |
| permissions | List | Permission array |
| joinedAt | String | ISO timestamp |

**Global Secondary Indexes**:
- **AccountIndex**: accountId (HASH) - Find users in account

### 4. ActivityTable
**Table Name**: `listbackup-${stage}-activity`

| Attribute | Type | Description |
|-----------|------|-------------|
| eventId (PK) | String | Unique event identifier |
| accountId | String | Account context |
| userId | String | User who triggered event |
| eventType | String | Type of activity |
| timestamp | Number | Unix timestamp |
| details | Map | Event details |
| ttl | Number | TTL for auto-deletion |

**Global Secondary Indexes**:
- **AccountIndex**: accountId (HASH), timestamp (RANGE) - Account activity timeline

**Features**:
- TTL enabled on `ttl` attribute for automatic cleanup

### 5. PlatformsTable
**Table Name**: `listbackup-${stage}-platforms`

| Attribute | Type | Description |
|-----------|------|-------------|
| platformId (PK) | String | Platform identifier |
| platformType | String | Type of platform |
| platformName | String | Display name |
| category | String | Platform category |
| status | String | active/inactive |
| capabilities | Map | Platform features |
| oauthConfig | Map | OAuth configuration |

**Global Secondary Indexes**:
- **TypeIndex**: platformType (HASH)
- **CategoryIndex**: category (HASH)
- **StatusIndex**: status (HASH)

### 6. PlatformConnectionsTable
**Table Name**: `listbackup-${stage}-platform-connections`

| Attribute | Type | Description |
|-----------|------|-------------|
| connectionId (PK) | String | Connection identifier |
| accountId | String | Account ID |
| userId | String | User who created |
| platformId | String | Platform ID |
| status | String | Connection status |
| credentials | Map | Encrypted credentials |
| metadata | Map | Connection metadata |

**Global Secondary Indexes**:
- **AccountIndex**: accountId (HASH)
- **UserIndex**: userId (HASH)
- **PlatformIndex**: platformId (HASH)
- **StatusIndex**: status (HASH)

### 7. SourcesTable
**Table Name**: `listbackup-${stage}-sources`

| Attribute | Type | Description |
|-----------|------|-------------|
| sourceId (PK) | String | Source identifier |
| accountId | String | Account ID |
| userId | String | Created by user |
| groupId | String | Source group ID |
| connectionId | String | Platform connection |
| sourceType | String | Type of source |
| config | Map | Source configuration |
| lastSyncAt | String | Last sync timestamp |

**Global Secondary Indexes**:
- **AccountIndex**: accountId (HASH)
- **UserIndex**: userId (HASH)
- **GroupIndex**: groupId (HASH)

### 8. SourceGroupsTable
**Table Name**: `listbackup-${stage}-source-groups`

| Attribute | Type | Description |
|-----------|------|-------------|
| groupId (PK) | String | Group identifier |
| accountId | String | Account ID |
| userId | String | Created by user |
| groupName | String | Group name |
| description | String | Group description |

**Global Secondary Indexes**:
- **AccountIndex**: accountId (HASH)
- **UserIndex**: userId (HASH)

### 9. JobsTable
**Table Name**: `listbackup-${stage}-jobs`

| Attribute | Type | Description |
|-----------|------|-------------|
| jobId (PK) | String | Job identifier |
| accountId | String | Account ID |
| userId | String | Created by user |
| sourceId | String | Source ID |
| jobType | String | Type of job |
| status | String | Job status |
| schedule | Map | Schedule config |
| createdAt | String | Creation timestamp |
| lastRunAt | String | Last execution |

**Global Secondary Indexes**:
- **AccountIndex**: accountId (HASH)
- **UserIndex**: userId (HASH)
- **SourceIndex**: sourceId (HASH)
- **StatusTimeIndex**: status (HASH), createdAt (RANGE)
- **AccountTimeIndex**: accountId (HASH), createdAt (RANGE)

**Features**:
- DynamoDB Streams enabled for real-time processing

### 10. JobLogsTable
**Table Name**: `listbackup-${stage}-job-logs`

| Attribute | Type | Description |
|-----------|------|-------------|
| logId (PK) | String | Log entry ID |
| jobId | String | Parent job ID |
| timestamp | Number | Unix timestamp |
| level | String | Log level |
| message | String | Log message |
| details | Map | Additional details |
| ttl | Number | TTL for cleanup |

**Global Secondary Indexes**:
- **JobIndex**: jobId (HASH), timestamp (RANGE)

**Features**:
- TTL enabled for automatic log cleanup

### 11. TeamsTable
**Table Name**: `listbackup-${stage}-teams`

| Attribute | Type | Description |
|-----------|------|-------------|
| teamId (PK) | String | Team identifier |
| accountId | String | Account ID |
| ownerUserId | String | Team owner |
| teamName | String | Team name |
| description | String | Team description |

**Global Secondary Indexes**:
- **AccountIndex**: accountId (HASH)
- **OwnerIndex**: ownerUserId (HASH)

### 12. TeamMembersTable
**Table Name**: `listbackup-${stage}-team-members`

| Attribute | Type | Description |
|-----------|------|-------------|
| teamId (PK) | String | Team ID |
| userId (SK) | String | Member user ID |
| role | String | Member role |
| joinedAt | String | Join timestamp |

**Global Secondary Indexes**:
- **UserIndex**: userId (HASH)

### 13. NotificationsTable
**Table Name**: `listbackup-${stage}-notifications`

| Attribute | Type | Description |
|-----------|------|-------------|
| notificationId (PK) | String | Notification ID |
| userId | String | Target user |
| accountId | String | Account context |
| type | String | Notification type |
| status | String | read/unread |
| createdAt | String | Creation time |
| ttl | Number | TTL for cleanup |

**Global Secondary Indexes**:
- **UserIndex**: userId (HASH), createdAt (RANGE)
- **AccountIndex**: accountId (HASH), createdAt (RANGE)

**Features**:
- TTL enabled for automatic cleanup

### 14. BillingTable
**Table Name**: `listbackup-${stage}-billing`

| Attribute | Type | Description |
|-----------|------|-------------|
| billingId (PK) | String | Billing record ID |
| accountId | String | Account ID |
| period | String | Billing period |
| status | String | Billing status |
| amount | Number | Total amount |
| details | Map | Billing details |

**Global Secondary Indexes**:
- **AccountPeriodIndex**: accountId (HASH), period (RANGE)

### 15. BillingUsageTable
**Table Name**: `listbackup-${stage}-billing-usage`

| Attribute | Type | Description |
|-----------|------|-------------|
| usageId (PK) | String | Usage record ID |
| accountId | String | Account ID |
| sourceId | String | Source ID |
| timestamp | Number | Usage timestamp |
| usageType | String | Type of usage |
| quantity | Number | Usage quantity |

**Global Secondary Indexes**:
- **AccountTimeIndex**: accountId (HASH), timestamp (RANGE)
- **SourceTimeIndex**: sourceId (HASH), timestamp (RANGE)

### 16. TagsTable
**Table Name**: `listbackup-${stage}-tags`

| Attribute | Type | Description |
|-----------|------|-------------|
| tagId (PK) | String | Tag identifier |
| accountId | String | Account ID |
| tagName | String | Tag name |
| color | String | Tag color |
| usageCount | Number | Usage count |

**Global Secondary Indexes**:
- **AccountIndex**: accountId (HASH)
- **AccountNameIndex**: accountId (HASH), tagName (RANGE)

### 17. PlatformSourcesTable
**Table Name**: `listbackup-${stage}-platform-sources`

| Attribute | Type | Description |
|-----------|------|-------------|
| platformSourceId (PK) | String | Template ID |
| platformId | String | Platform ID |
| dataType | String | Data type |
| category | String | Source category |
| popularity | Number | Usage popularity |
| status | String | Template status |
| config | Map | Default config |

**Global Secondary Indexes**:
- **PlatformIndex**: platformId (HASH)
- **DataTypeIndex**: dataType (HASH)
- **CategoryIndex**: category (HASH)
- **PopularityIndex**: platformId (HASH), popularity (RANGE)
- **StatusIndex**: status (HASH)

## Access Patterns

### Common Query Patterns

1. **User Lookup**
   - Get user by ID: Query UsersTable with userId
   - Find user by email: Query EmailIndex
   - Get user's accounts: Query UserAccountsTable with userId

2. **Account Hierarchy**
   - Get account details: Query AccountsTable with accountId
   - Find child accounts: Query ParentAccountIndex
   - Get account members: Query AccountIndex on UserAccountsTable

3. **Platform Integration**
   - List available platforms: Query PlatformsTable
   - Get user's connections: Query UserIndex on PlatformConnectionsTable
   - Find sources by connection: Query SourcesTable with connectionId

4. **Job Management**
   - Get account's jobs: Query AccountIndex on JobsTable
   - Find active jobs: Query StatusTimeIndex with status='active'
   - Get job history: Query JobIndex on JobLogsTable

## Best Practices

### 1. Partition Key Design
- Use UUIDs for primary keys to ensure even distribution
- Avoid hot partitions by distributing writes
- Consider composite keys for hierarchical data

### 2. Index Usage
- Only create indexes for access patterns you need
- Monitor index usage and remove unused indexes
- Consider projection attributes carefully

### 3. Cost Optimization
- Use on-demand billing for unpredictable workloads
- Enable auto-scaling for predictable patterns
- Set appropriate TTL values for temporary data

### 4. Performance
- Batch operations when possible
- Use parallel scans sparingly
- Implement caching for frequently accessed data

### 5. Security
- Encrypt sensitive attributes at application level
- Use IAM policies for fine-grained access control
- Audit data access through CloudTrail

## Additional Implementation Details

### Capacity Modes

#### On-Demand Tables (Variable Load)
- accounts
- users
- user-accounts
- sources
- source-groups
- activities
- notifications
- oauth-states (legacy, see platform-connections)
- platform-connections
- platform-sources
- jobs
- job-logs
- teams
- team-members
- tags
- billing
- billing-usage

#### High-Throughput Considerations
- Activities table partitioned by accountId to distribute load
- Jobs table uses status as sort key to avoid hot partitions
- Platform connections table replaces oauth-states for better performance

### Security Implementation

1. **Encryption at Rest**
   - All tables encrypted using AWS-managed KMS keys
   - Sensitive fields (tokens, credentials) use additional application-level encryption
   - Customer-managed KMS key per account for token encryption

2. **Access Control**
   - IAM policies restrict access by service
   - Lambda functions have minimal required permissions
   - Cross-account access prevented by accountId validation

3. **Data Retention**
   - Activities: 90-day TTL (7776000 seconds)
   - Notifications: 30-day TTL (2592000 seconds)
   - Job logs: Configurable TTL based on retention policy
   - OAuth states (legacy): 15-minute TTL (900 seconds)

### Schema Evolution Guidelines

1. **Adding New Attributes**
   - Use sparse indexes for optional attributes
   - Maintain backward compatibility
   - Version attribute schemas when breaking changes required

2. **Index Management**
   - Only create indexes for proven access patterns
   - Monitor index usage and remove unused indexes
   - Consider projection attributes carefully for cost optimization

3. **Migration Strategies**
   - Use migration Lambda functions for data transformation
   - Implement dual-write patterns for zero-downtime migrations
   - Maintain audit trail of schema changes

## Migration Notes

These tables were migrated from a monolithic `core` service to dedicated infrastructure services during Phase 2 of the infrastructure reorganization. The migration maintained backward compatibility while improving:

- Separation of concerns
- Independent scaling
- Clearer resource ownership
- Better cost allocation

### Legacy Table Mapping

Some tables have been renamed or consolidated during migration:

1. **oauth_states** → Functionality moved to **platform-connections** table
2. **oauth_tokens** → Consolidated into **platform-connections** credentials
3. **refresh_tokens** → Managed within **platform-connections** table
4. **sync_schedules** → Replaced by **jobs** table with schedule configuration
5. **sync_history** → Replaced by **job-logs** table
6. **api_keys** → Functionality will be implemented in future authentication service
7. **webhooks** → Will be implemented as part of notifications service expansion
8. **usage_metrics** → Split into **billing** and **billing-usage** tables
9. **billing_plans** → Will be managed by billing service configuration

For historical context and migration details, see [Phase 1 Audit Documentation](../phases/phase1-audit/).