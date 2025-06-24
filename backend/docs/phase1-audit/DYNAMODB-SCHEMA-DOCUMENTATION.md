# DynamoDB Schema Documentation

## Overview
This document provides detailed schema documentation for all 13 DynamoDB tables in the Core service. Each table includes its purpose, key structure, attributes, indexes, and usage patterns.

## Table Schemas

### 1. accounts

**Purpose**: Stores organizational account information with hierarchical structure support.

**Keys**:
- **Partition Key**: `accountId` (String)

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | String | Yes | Unique identifier for the account |
| parentAccountId | String | No | Parent account ID for hierarchical structures |
| accountPath | String | Yes | Path representation (e.g., "/root/subsidiary/division/") |
| accountType | String | Yes | Type: conglomerate, subsidiary, division, location |
| accountName | String | Yes | Display name of the account |
| level | Number | Yes | Hierarchy level (0 for root) |
| status | String | Yes | active, suspended, terminated |
| createdAt | Number | Yes | Unix timestamp of creation |
| updatedAt | Number | Yes | Unix timestamp of last update |
| metadata | Map | No | Additional account metadata |
| settings | Map | No | Account-specific settings |

**Global Secondary Indexes**:
- **GSI1**: parentAccountId-accountType-index
  - Partition Key: `parentAccountId`
  - Sort Key: `accountType`
  - Use: Query child accounts by parent

**Access Patterns**:
- Get account by ID
- List child accounts by parent ID
- Query accounts by type

---

### 2. users

**Purpose**: Stores user profile and authentication information.

**Keys**:
- **Partition Key**: `userId` (String)

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | Unique identifier for the user |
| email | String | Yes | User's email address |
| firstName | String | Yes | User's first name |
| lastName | String | Yes | User's last name |
| passwordHash | String | Yes | Hashed password |
| status | String | Yes | active, inactive, suspended |
| emailVerified | Boolean | Yes | Email verification status |
| twoFactorEnabled | Boolean | Yes | 2FA status |
| lastLoginAt | Number | No | Unix timestamp of last login |
| createdAt | Number | Yes | Unix timestamp of creation |
| updatedAt | Number | Yes | Unix timestamp of last update |
| preferences | Map | No | User preferences |

**Global Secondary Indexes**:
- **GSI1**: email-index
  - Partition Key: `email`
  - Use: User lookup by email for authentication

**Access Patterns**:
- Get user by ID
- Find user by email
- Update user profile

---

### 3. users_accounts

**Purpose**: Many-to-many relationship between users and accounts with role-based permissions.

**Keys**:
- **Partition Key**: `userId` (String)
- **Sort Key**: `accountId` (String)

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | Reference to users table |
| accountId | String | Yes | Reference to accounts table |
| role | String | Yes | admin, manager, member, viewer |
| permissions | Map | Yes | Detailed permission settings |
| isDefault | Boolean | Yes | Default account for user |
| joinedAt | Number | Yes | Unix timestamp when user joined account |
| invitedBy | String | No | User ID who invited this user |
| status | String | Yes | active, pending, suspended |

**Global Secondary Indexes**:
- **GSI1**: accountId-role-index
  - Partition Key: `accountId`
  - Sort Key: `role`
  - Use: List users in an account by role

**Access Patterns**:
- Get all accounts for a user
- Get all users for an account
- Check user permissions for specific account

---

### 4. sources

**Purpose**: Stores integration source configurations and metadata.

**Keys**:
- **Partition Key**: `sourceId` (String)

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| sourceId | String | Yes | Unique identifier for the source |
| accountId | String | Yes | Associated account ID |
| platformId | String | Yes | Platform identifier (keap, stripe, etc.) |
| sourceName | String | Yes | User-defined name for the source |
| status | String | Yes | active, paused, error, disconnected |
| connectionType | String | Yes | oauth, api_key, webhook |
| config | Map | Yes | Platform-specific configuration |
| lastSyncAt | Number | No | Unix timestamp of last sync |
| syncStatus | String | No | success, failed, in_progress |
| createdAt | Number | Yes | Unix timestamp of creation |
| updatedAt | Number | Yes | Unix timestamp of last update |
| createdBy | String | Yes | User ID who created the source |

**Global Secondary Indexes**:
- **GSI1**: accountId-platformId-index
  - Partition Key: `accountId`
  - Sort Key: `platformId`
  - Use: List all sources for an account by platform
- **GSI2**: accountId-status-index
  - Partition Key: `accountId`
  - Sort Key: `status`
  - Use: Filter sources by status

**Access Patterns**:
- Get source by ID
- List all sources for an account
- List sources by platform
- Filter sources by status

---

### 5. sync_schedules

**Purpose**: Stores backup/sync scheduling configuration for sources.

**Keys**:
- **Partition Key**: `sourceId` (String)
- **Sort Key**: `scheduleId` (String)

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| sourceId | String | Yes | Reference to sources table |
| scheduleId | String | Yes | Unique schedule identifier |
| scheduleType | String | Yes | hourly, daily, weekly, monthly, custom |
| cronExpression | String | No | Cron expression for custom schedules |
| dataTypes | List | Yes | List of data types to sync |
| isActive | Boolean | Yes | Schedule active status |
| nextRunAt | Number | Yes | Unix timestamp of next scheduled run |
| lastRunAt | Number | No | Unix timestamp of last run |
| retryPolicy | Map | No | Retry configuration |
| createdAt | Number | Yes | Unix timestamp of creation |
| updatedAt | Number | Yes | Unix timestamp of last update |

**Global Secondary Indexes**:
- **GSI1**: nextRunAt-index
  - Partition Key: `nextRunAt`
  - Use: Query schedules due for execution

**Access Patterns**:
- Get schedules for a source
- Find schedules ready to run
- Update schedule after execution

---

### 6. sync_history

**Purpose**: Tracks sync job execution history and results.

**Keys**:
- **Partition Key**: `sourceId` (String)
- **Sort Key**: `syncId` (String)

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| sourceId | String | Yes | Reference to sources table |
| syncId | String | Yes | Unique sync job identifier |
| scheduleId | String | No | Reference to sync_schedules if scheduled |
| status | String | Yes | pending, running, completed, failed |
| startedAt | Number | Yes | Unix timestamp when sync started |
| completedAt | Number | No | Unix timestamp when sync completed |
| duration | Number | No | Duration in seconds |
| dataTypes | List | Yes | Data types synced |
| recordsProcessed | Map | Yes | Count by data type |
| errors | List | No | List of errors encountered |
| s3Location | String | No | S3 path where data was stored |
| metadata | Map | No | Additional sync metadata |

**Global Secondary Indexes**:
- **GSI1**: status-startedAt-index
  - Partition Key: `status`
  - Sort Key: `startedAt`
  - Use: Query sync jobs by status and time

**Access Patterns**:
- Get sync history for a source
- Query recent failed syncs
- Calculate sync statistics

---

### 7. activities

**Purpose**: Audit log of all system activities and user actions.

**Keys**:
- **Partition Key**: `accountId` (String)
- **Sort Key**: `eventId` (String)

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | String | Yes | Account context for the activity |
| eventId | String | Yes | Unique event identifier |
| timestamp | Number | Yes | Unix timestamp of the event |
| userId | String | No | User who performed the action |
| eventType | String | Yes | Type of event (login, source_created, etc.) |
| resource | String | Yes | Resource type affected |
| resourceId | String | No | ID of the affected resource |
| action | String | Yes | Action performed |
| details | Map | No | Additional event details |
| ipAddress | String | No | IP address of the request |
| userAgent | String | No | User agent string |

**Global Secondary Indexes**:
- **GSI1**: userId-timestamp-index
  - Partition Key: `userId`
  - Sort Key: `timestamp`
  - Use: Query user activity history
- **GSI2**: eventType-timestamp-index
  - Partition Key: `eventType`
  - Sort Key: `timestamp`
  - Use: Filter activities by type

**Access Patterns**:
- Get activities for an account
- Query user activity history
- Filter by event type

---

### 8. api_keys

**Purpose**: Stores API keys for programmatic access.

**Keys**:
- **Partition Key**: `apiKeyId` (String)

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| apiKeyId | String | Yes | Unique API key identifier |
| apiKeyHash | String | Yes | Hashed API key value |
| accountId | String | Yes | Associated account |
| userId | String | Yes | User who created the key |
| name | String | Yes | User-defined key name |
| permissions | List | Yes | List of allowed operations |
| status | String | Yes | active, revoked, expired |
| lastUsedAt | Number | No | Unix timestamp of last use |
| expiresAt | Number | No | Unix timestamp of expiration |
| createdAt | Number | Yes | Unix timestamp of creation |
| metadata | Map | No | Additional key metadata |

**Global Secondary Indexes**:
- **GSI1**: accountId-status-index
  - Partition Key: `accountId`
  - Sort Key: `status`
  - Use: List API keys for an account
- **GSI2**: apiKeyHash-index
  - Partition Key: `apiKeyHash`
  - Use: API key validation lookup

**Access Patterns**:
- Validate API key
- List keys for an account
- Revoke/update key

---

### 9. webhooks

**Purpose**: Stores webhook endpoint configurations for event notifications.

**Keys**:
- **Partition Key**: `webhookId` (String)

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| webhookId | String | Yes | Unique webhook identifier |
| accountId | String | Yes | Associated account |
| url | String | Yes | Webhook endpoint URL |
| events | List | Yes | List of subscribed events |
| isActive | Boolean | Yes | Webhook active status |
| secret | String | Yes | Secret for signature validation |
| headers | Map | No | Custom headers to include |
| retryPolicy | Map | Yes | Retry configuration |
| lastResponseCode | Number | No | Last HTTP response code |
| lastCalledAt | Number | No | Unix timestamp of last call |
| failureCount | Number | Yes | Consecutive failure count |
| createdAt | Number | Yes | Unix timestamp of creation |
| updatedAt | Number | Yes | Unix timestamp of last update |

**Global Secondary Indexes**:
- **GSI1**: accountId-isActive-index
  - Partition Key: `accountId`
  - Sort Key: `isActive`
  - Use: List active webhooks for an account

**Access Patterns**:
- Get webhook configuration
- List webhooks for account
- Find webhooks for specific event

---

### 10. notifications

**Purpose**: Stores in-app notifications for users.

**Keys**:
- **Partition Key**: `userId` (String)
- **Sort Key**: `notificationId` (String)

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | Recipient user ID |
| notificationId | String | Yes | Unique notification identifier |
| type | String | Yes | info, warning, error, success |
| title | String | Yes | Notification title |
| message | String | Yes | Notification content |
| isRead | Boolean | Yes | Read status |
| readAt | Number | No | Unix timestamp when read |
| category | String | Yes | Category for filtering |
| metadata | Map | No | Additional notification data |
| actionUrl | String | No | URL for action button |
| createdAt | Number | Yes | Unix timestamp of creation |
| expiresAt | Number | No | Unix timestamp of expiration |

**Global Secondary Indexes**:
- **GSI1**: userId-isRead-createdAt-index
  - Partition Key: `userId`
  - Sort Key: `isRead#createdAt`
  - Use: Query unread notifications

**Access Patterns**:
- Get notifications for user
- Query unread notifications
- Mark notifications as read

---

### 11. usage_metrics

**Purpose**: Tracks usage metrics for billing and analytics.

**Keys**:
- **Partition Key**: `accountId` (String)
- **Sort Key**: `metricDate` (String) - Format: YYYY-MM-DD

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | String | Yes | Account being tracked |
| metricDate | String | Yes | Date of metrics (YYYY-MM-DD) |
| apiCalls | Number | Yes | Total API calls |
| dataProcessed | Number | Yes | Bytes of data processed |
| storageUsed | Number | Yes | Bytes of storage used |
| syncJobs | Number | Yes | Number of sync jobs |
| activeUsers | Number | Yes | Count of active users |
| activeSources | Number | Yes | Count of active sources |
| errorCount | Number | Yes | Number of errors |
| byPlatform | Map | Yes | Metrics broken down by platform |
| byUser | Map | No | Metrics broken down by user |
| hourlyCounts | List | No | Hourly breakdown of metrics |
| updatedAt | Number | Yes | Unix timestamp of last update |

**Global Secondary Indexes**:
- **GSI1**: metricDate-accountId-index
  - Partition Key: `metricDate`
  - Sort Key: `accountId`
  - Use: Daily rollup queries

**Access Patterns**:
- Get daily metrics for account
- Calculate monthly usage
- Generate billing reports

---

### 12. billing_plans

**Purpose**: Stores subscription and billing plan information.

**Keys**:
- **Partition Key**: `planId` (String)

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| planId | String | Yes | Unique plan identifier |
| planName | String | Yes | Display name of the plan |
| planType | String | Yes | free, starter, professional, enterprise |
| price | Number | Yes | Monthly price in cents |
| currency | String | Yes | Currency code (USD, EUR, etc.) |
| limits | Map | Yes | Usage limits configuration |
| features | List | Yes | List of included features |
| isActive | Boolean | Yes | Plan availability status |
| isDefault | Boolean | Yes | Default plan for new accounts |
| customizable | Boolean | Yes | Whether plan can be customized |
| metadata | Map | No | Additional plan metadata |
| createdAt | Number | Yes | Unix timestamp of creation |
| updatedAt | Number | Yes | Unix timestamp of last update |

**Limits Map Structure**:
```json
{
  "apiCallsPerMonth": 100000,
  "storageGB": 100,
  "users": 10,
  "sources": 50,
  "syncFrequency": "hourly",
  "dataRetentionDays": 90,
  "webhooks": 5,
  "customDomains": 1
}
```

**Access Patterns**:
- Get plan details
- List available plans
- Compare plan features

---

### 13. oauth_states

**Purpose**: Stores OAuth flow state for security validation.

**Keys**:
- **Partition Key**: `state` (String)

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| state | String | Yes | OAuth state parameter |
| userId | String | Yes | User initiating OAuth |
| accountId | String | Yes | Account context |
| platformId | String | Yes | Platform being connected |
| redirectUri | String | Yes | Callback redirect URI |
| createdAt | Number | Yes | Unix timestamp of creation |
| expiresAt | Number | Yes | Unix timestamp of expiration |
| metadata | Map | No | Additional OAuth parameters |

**TTL Configuration**:
- TTL Attribute: `expiresAt`
- Auto-delete expired states

**Access Patterns**:
- Validate OAuth callback state
- Clean up expired states

---

## Capacity Planning

### On-Demand Tables (Variable Load)
- accounts
- users
- sources
- activities
- notifications
- oauth_states

### Provisioned Tables (Predictable Load)
- sync_schedules (5 RCU, 5 WCU)
- usage_metrics (10 RCU, 20 WCU)
- billing_plans (5 RCU, 1 WCU)

### High-Throughput Tables
- sync_history (On-Demand)
- activities (On-Demand)

## Best Practices

1. **Consistent Timestamps**: All timestamps use Unix epoch (seconds)
2. **Status Enums**: Predefined status values for consistency
3. **Soft Deletes**: Use status fields instead of hard deletes
4. **TTL Usage**: oauth_states and notifications use TTL
5. **Composite Keys**: Use for time-series and hierarchical data
6. **GSI Design**: Minimize GSI projections to reduce storage costs
7. **Batch Operations**: Use batch writes for bulk operations

## Migration Considerations

1. **Data Types**: Ensure consistent data types across all services
2. **Index Creation**: GSIs must be created with the table
3. **Capacity Mode**: Start with on-demand, switch to provisioned for predictable workloads
4. **Encryption**: Enable encryption at rest for all tables
5. **Point-in-Time Recovery**: Enable for critical tables (users, accounts, sources)
6. **Global Tables**: Consider for multi-region deployment