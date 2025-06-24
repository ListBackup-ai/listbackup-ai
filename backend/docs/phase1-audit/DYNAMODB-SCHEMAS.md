# DynamoDB Table Schemas - ListBackup.ai v2

## Overview
This document provides detailed schema documentation for all 13 DynamoDB tables in the ListBackup.ai v2 system.

## Table of Contents
1. [Users Table](#users-table)
2. [Accounts Table](#accounts-table)
3. [Users Accounts Table](#users-accounts-table)
4. [Teams Table](#teams-table)
5. [Sources Table](#sources-table)
6. [Activities Table](#activities-table)
7. [Jobs Table](#jobs-table)
8. [Connections Table](#connections-table)
9. [OAuth States Table](#oauth-states-table)
10. [OAuth Tokens Table](#oauth-tokens-table)
11. [Refresh Tokens Table](#refresh-tokens-table)
12. [Tags Table](#tags-table)
13. [Notifications Table](#notifications-table)

---

## Users Table
**Table Name**: `${AWS::StackName}-users`

### Primary Key
- **Partition Key**: `userId` (String)
- **Sort Key**: None

### Attributes
```json
{
  "userId": "string",           // UUID v4
  "email": "string",           // User's email address
  "username": "string",        // Unique username
  "name": "string",           // Full name
  "accountId": "string",      // Primary account ID
  "status": "string",         // active | inactive | suspended
  "role": "string",          // admin | user | readonly
  "preferences": {           // User preferences object
    "timezone": "string",
    "notifications": "object"
  },
  "createdAt": "string",     // ISO 8601 timestamp
  "updatedAt": "string",     // ISO 8601 timestamp
  "lastLoginAt": "string",   // ISO 8601 timestamp
  "mfaEnabled": "boolean",   // Two-factor authentication status
  "mfaSecret": "string"      // Encrypted MFA secret
}
```

### Global Secondary Indexes
- **GSI1**: `email-index`
  - Partition Key: `email`
  - Projection: ALL
- **GSI2**: `username-index`
  - Partition Key: `username`
  - Projection: ALL

---

## Accounts Table
**Table Name**: `${AWS::StackName}-accounts`

### Primary Key
- **Partition Key**: `accountId` (String)
- **Sort Key**: None

### Attributes
```json
{
  "accountId": "string",          // UUID v4
  "accountName": "string",        // Account display name
  "parentAccountId": "string",    // Parent account ID (null for root)
  "accountPath": "string",        // Hierarchical path (e.g., "/root/subsidiary/division/")
  "accountType": "string",        // conglomerate | subsidiary | division | location
  "level": "number",              // Hierarchy level (0 for root)
  "status": "string",             // active | inactive | suspended
  "plan": "string",               // free | starter | professional | enterprise
  "billingInfo": {                // Billing information object
    "stripeCustomerId": "string",
    "subscriptionId": "string",
    "paymentMethod": "string"
  },
  "limits": {                     // Account limits object
    "sources": "number",
    "users": "number",
    "storage": "number"
  },
  "metadata": {                   // Custom metadata object
    "industry": "string",
    "size": "string",
    "customFields": "object"
  },
  "createdAt": "string",          // ISO 8601 timestamp
  "updatedAt": "string",          // ISO 8601 timestamp
  "createdBy": "string"           // User ID who created the account
}
```

### Global Secondary Indexes
- **GSI1**: `parentAccountId-index`
  - Partition Key: `parentAccountId`
  - Projection: ALL
- **GSI2**: `accountPath-index`
  - Partition Key: `accountPath`
  - Projection: ALL

---

## Users Accounts Table
**Table Name**: `${AWS::StackName}-users-accounts`

### Primary Key
- **Partition Key**: `userId` (String)
- **Sort Key**: `accountId` (String)

### Attributes
```json
{
  "userId": "string",           // User ID
  "accountId": "string",        // Account ID
  "role": "string",            // owner | admin | member | readonly
  "permissions": {             // Permissions object
    "sources": ["create", "read", "update", "delete"],
    "users": ["read"],
    "billing": ["read"]
  },
  "joinedAt": "string",        // ISO 8601 timestamp
  "invitedBy": "string",       // User ID who invited
  "status": "string"           // active | pending | suspended
}
```

### Global Secondary Indexes
- **GSI1**: `accountId-userId-index`
  - Partition Key: `accountId`
  - Sort Key: `userId`
  - Projection: ALL

---

## Teams Table
**Table Name**: `${AWS::StackName}-teams`

### Primary Key
- **Partition Key**: `accountId` (String)
- **Sort Key**: `teamId` (String)

### Attributes
```json
{
  "accountId": "string",        // Account ID
  "teamId": "string",          // UUID v4
  "teamName": "string",        // Team display name
  "description": "string",     // Team description
  "members": [                 // Array of team members
    {
      "userId": "string",
      "role": "string",        // lead | member
      "joinedAt": "string"
    }
  ],
  "permissions": {             // Team permissions object
    "sources": ["create", "read", "update", "delete"],
    "reports": ["read", "export"],
    "settings": ["read"]
  },
  "createdAt": "string",       // ISO 8601 timestamp
  "updatedAt": "string",       // ISO 8601 timestamp
  "createdBy": "string"        // User ID who created the team
}
```

### Global Secondary Indexes
- **GSI1**: `teamId-index`
  - Partition Key: `teamId`
  - Projection: ALL

---

## Sources Table
**Table Name**: `${AWS::StackName}-sources`

### Primary Key
- **Partition Key**: `accountId` (String)
- **Sort Key**: `sourceId` (String)

### Attributes
```json
{
  "accountId": "string",         // Account ID
  "sourceId": "string",          // UUID v4
  "sourceName": "string",        // Source display name
  "platform": "string",          // keap | stripe | gohighlevel | etc.
  "connectionType": "string",    // oauth | apikey | webhook
  "status": "string",            // active | paused | error | disconnected
  "credentials": {               // Encrypted credentials object
    "type": "string",
    "encryptedData": "string"
  },
  "config": {                    // Source configuration
    "syncInterval": "string",    // daily | hourly | realtime
    "dataTypes": ["contacts", "orders", "products"],
    "filters": "object",
    "webhooks": "object"
  },
  "lastSyncAt": "string",        // ISO 8601 timestamp
  "nextSyncAt": "string",        // ISO 8601 timestamp
  "syncStatus": {                // Sync status object
    "state": "string",           // idle | syncing | error
    "progress": "number",
    "message": "string"
  },
  "metadata": {                  // Source metadata
    "accountInfo": "object",
    "limits": "object",
    "customFields": "object"
  },
  "createdAt": "string",         // ISO 8601 timestamp
  "updatedAt": "string",         // ISO 8601 timestamp
  "createdBy": "string"          // User ID who created the source
}
```

### Global Secondary Indexes
- **GSI1**: `sourceId-index`
  - Partition Key: `sourceId`
  - Projection: ALL
- **GSI2**: `accountId-platform-index`
  - Partition Key: `accountId`
  - Sort Key: `platform`
  - Projection: ALL
- **GSI3**: `accountId-status-index`
  - Partition Key: `accountId`
  - Sort Key: `status`
  - Projection: ALL

---

## Activities Table
**Table Name**: `${AWS::StackName}-activities`

### Primary Key
- **Partition Key**: `accountId` (String)
- **Sort Key**: `timestamp#eventId` (String)

### Attributes
```json
{
  "accountId": "string",         // Account ID
  "timestamp#eventId": "string", // Composite key: timestamp#UUID
  "eventId": "string",           // UUID v4
  "userId": "string",            // User who performed the action
  "eventType": "string",         // source.created | user.login | sync.completed | etc.
  "resourceType": "string",      // source | user | account | job | etc.
  "resourceId": "string",        // ID of the affected resource
  "action": "string",            // create | update | delete | sync | etc.
  "details": {                   // Event details object
    "before": "object",          // State before (for updates)
    "after": "object",           // State after
    "metadata": "object"         // Additional event data
  },
  "ipAddress": "string",         // Client IP address
  "userAgent": "string",         // Client user agent
  "timestamp": "number",         // Unix timestamp (for TTL)
  "createdAt": "string"          // ISO 8601 timestamp
}
```

### Global Secondary Indexes
- **GSI1**: `userId-timestamp-index`
  - Partition Key: `userId`
  - Sort Key: `timestamp#eventId`
  - Projection: ALL
- **GSI2**: `resourceType-timestamp-index`
  - Partition Key: `resourceType`
  - Sort Key: `timestamp#eventId`
  - Projection: ALL

### TTL
- Attribute: `timestamp`
- TTL: 90 days (7776000 seconds)

---

## Jobs Table
**Table Name**: `${AWS::StackName}-jobs`

### Primary Key
- **Partition Key**: `accountId` (String)
- **Sort Key**: `jobId` (String)

### Attributes
```json
{
  "accountId": "string",         // Account ID
  "jobId": "string",             // UUID v4
  "jobType": "string",           // sync | export | import | migration | backup
  "sourceId": "string",          // Related source ID (if applicable)
  "status": "string",            // pending | running | completed | failed | cancelled
  "priority": "string",          // low | medium | high | critical
  "config": {                    // Job configuration
    "dataTypes": ["contacts", "orders"],
    "dateRange": {
      "start": "string",
      "end": "string"
    },
    "filters": "object",
    "options": "object"
  },
  "progress": {                  // Job progress tracking
    "total": "number",
    "processed": "number",
    "failed": "number",
    "percentage": "number"
  },
  "result": {                    // Job results
    "recordsProcessed": "number",
    "errors": ["array"],
    "outputLocation": "string",
    "summary": "object"
  },
  "scheduledAt": "string",       // ISO 8601 timestamp
  "startedAt": "string",         // ISO 8601 timestamp
  "completedAt": "string",       // ISO 8601 timestamp
  "createdAt": "string",         // ISO 8601 timestamp
  "createdBy": "string",         // User ID who created the job
  "retryCount": "number",        // Number of retry attempts
  "maxRetries": "number"         // Maximum retry attempts allowed
}
```

### Global Secondary Indexes
- **GSI1**: `jobId-index`
  - Partition Key: `jobId`
  - Projection: ALL
- **GSI2**: `accountId-status-index`
  - Partition Key: `accountId`
  - Sort Key: `status`
  - Projection: ALL
- **GSI3**: `sourceId-createdAt-index`
  - Partition Key: `sourceId`
  - Sort Key: `createdAt`
  - Projection: ALL

---

## Connections Table
**Table Name**: `${AWS::StackName}-connections`

### Primary Key
- **Partition Key**: `connectionId` (String)
- **Sort Key**: None

### Attributes
```json
{
  "connectionId": "string",      // UUID v4
  "accountId": "string",         // Account ID
  "userId": "string",            // User ID who created connection
  "platform": "string",          // Platform identifier
  "connectionType": "string",    // oauth | apikey | webhook
  "status": "string",            // active | expired | revoked | error
  "credentials": {               // Encrypted credentials
    "accessToken": "string",
    "refreshToken": "string",
    "expiresAt": "string",
    "scope": "string"
  },
  "metadata": {                  // Connection metadata
    "accountName": "string",
    "accountId": "string",       // Platform account ID
    "limits": "object"
  },
  "lastUsedAt": "string",        // ISO 8601 timestamp
  "createdAt": "string",         // ISO 8601 timestamp
  "updatedAt": "string",         // ISO 8601 timestamp
  "expiresAt": "string"          // ISO 8601 timestamp
}
```

### Global Secondary Indexes
- **GSI1**: `accountId-platform-index`
  - Partition Key: `accountId`
  - Sort Key: `platform`
  - Projection: ALL
- **GSI2**: `userId-platform-index`
  - Partition Key: `userId`
  - Sort Key: `platform`
  - Projection: ALL

---

## OAuth States Table
**Table Name**: `${AWS::StackName}-oauth-states`

### Primary Key
- **Partition Key**: `state` (String)
- **Sort Key**: None

### Attributes
```json
{
  "state": "string",             // Random state parameter
  "accountId": "string",         // Account ID
  "userId": "string",            // User ID
  "platform": "string",          // Platform identifier
  "redirectUri": "string",       // OAuth redirect URI
  "metadata": {                  // Additional OAuth data
    "sourceId": "string",
    "connectionId": "string",
    "returnUrl": "string"
  },
  "createdAt": "string",         // ISO 8601 timestamp
  "expiresAt": "number"          // Unix timestamp (for TTL)
}
```

### TTL
- Attribute: `expiresAt`
- TTL: 15 minutes (900 seconds)

---

## OAuth Tokens Table
**Table Name**: `${AWS::StackName}-oauth-tokens`

### Primary Key
- **Partition Key**: `sourceId` (String)
- **Sort Key**: None

### Attributes
```json
{
  "sourceId": "string",          // Source ID
  "accountId": "string",         // Account ID
  "platform": "string",          // Platform identifier
  "tokens": {                    // Encrypted token data
    "accessToken": "string",
    "refreshToken": "string",
    "tokenType": "string",
    "expiresIn": "number",
    "scope": "string",
    "expiresAt": "string"        // ISO 8601 timestamp
  },
  "metadata": {                  // Token metadata
    "userId": "string",
    "platformAccountId": "string",
    "platformAccountName": "string"
  },
  "createdAt": "string",         // ISO 8601 timestamp
  "updatedAt": "string",         // ISO 8601 timestamp
  "lastRefreshedAt": "string"    // ISO 8601 timestamp
}
```

### Global Secondary Indexes
- **GSI1**: `accountId-platform-index`
  - Partition Key: `accountId`
  - Sort Key: `platform`
  - Projection: ALL

### Encryption
- All token fields are encrypted at rest using AWS KMS
- Customer-managed KMS key per account

---

## Refresh Tokens Table
**Table Name**: `${AWS::StackName}-refresh-tokens`

### Primary Key
- **Partition Key**: `refreshToken` (String)
- **Sort Key**: None

### Attributes
```json
{
  "refreshToken": "string",      // Hashed refresh token
  "userId": "string",            // User ID
  "accountId": "string",         // Account ID
  "tokenFamily": "string",       // Token family ID for rotation
  "issuedAt": "string",          // ISO 8601 timestamp
  "expiresAt": "string",         // ISO 8601 timestamp
  "lastUsedAt": "string",        // ISO 8601 timestamp
  "userAgent": "string",         // Client user agent
  "ipAddress": "string",         // Client IP address
  "revoked": "boolean",          // Revocation status
  "revokedAt": "string",         // ISO 8601 timestamp
  "revokedBy": "string",         // User ID who revoked
  "revokedReason": "string"      // Reason for revocation
}
```

### Global Secondary Indexes
- **GSI1**: `userId-issuedAt-index`
  - Partition Key: `userId`
  - Sort Key: `issuedAt`
  - Projection: ALL
- **GSI2**: `tokenFamily-index`
  - Partition Key: `tokenFamily`
  - Projection: ALL

### TTL
- Attribute: `expiresAt`
- TTL: Auto-delete after expiration

---

## Tags Table
**Table Name**: `${AWS::StackName}-tags`

### Primary Key
- **Partition Key**: `accountId#resourceType` (String)
- **Sort Key**: `tagKey#tagValue` (String)

### Attributes
```json
{
  "accountId#resourceType": "string",  // Composite: accountId#source
  "tagKey#tagValue": "string",        // Composite: category#production
  "tagId": "string",                  // UUID v4
  "tagKey": "string",                 // Tag key/category
  "tagValue": "string",               // Tag value
  "resourceType": "string",           // source | job | user | etc.
  "resources": [                      // Array of resource IDs
    {
      "resourceId": "string",
      "attachedAt": "string",
      "attachedBy": "string"
    }
  ],
  "color": "string",                  // Hex color code
  "description": "string",            // Tag description
  "createdAt": "string",              // ISO 8601 timestamp
  "updatedAt": "string",              // ISO 8601 timestamp
  "createdBy": "string"               // User ID who created the tag
}
```

### Global Secondary Indexes
- **GSI1**: `tagId-index`
  - Partition Key: `tagId`
  - Projection: ALL
- **GSI2**: `accountId-tagKey-index`
  - Partition Key: `accountId#resourceType`
  - Sort Key: `tagKey`
  - Projection: ALL

---

## Notifications Table
**Table Name**: `${AWS::StackName}-notifications`

### Primary Key
- **Partition Key**: `userId` (String)
- **Sort Key**: `timestamp#notificationId` (String)

### Attributes
```json
{
  "userId": "string",                  // User ID
  "timestamp#notificationId": "string", // Composite: timestamp#UUID
  "notificationId": "string",          // UUID v4
  "accountId": "string",               // Account ID
  "type": "string",                    // email | sms | push | in-app
  "category": "string",                // system | source | job | billing | security
  "priority": "string",                // low | medium | high | critical
  "subject": "string",                 // Notification subject
  "message": "string",                 // Notification message
  "data": {                           // Additional data
    "resourceType": "string",
    "resourceId": "string",
    "actionUrl": "string",
    "metadata": "object"
  },
  "status": "string",                  // pending | sent | delivered | failed | read
  "readAt": "string",                  // ISO 8601 timestamp
  "sentAt": "string",                  // ISO 8601 timestamp
  "deliveredAt": "string",             // ISO 8601 timestamp
  "failureReason": "string",           // Failure details
  "createdAt": "string",               // ISO 8601 timestamp
  "expiresAt": "number"                // Unix timestamp (for TTL)
}
```

### Global Secondary Indexes
- **GSI1**: `accountId-timestamp-index`
  - Partition Key: `accountId`
  - Sort Key: `timestamp#notificationId`
  - Projection: ALL
- **GSI2**: `userId-status-index`
  - Partition Key: `userId`
  - Sort Key: `status`
  - Projection: ALL

### TTL
- Attribute: `expiresAt`
- TTL: 30 days (2592000 seconds)

---

## Access Patterns

### Common Query Patterns

1. **User Queries**
   - Get user by ID: Query on `userId`
   - Get user by email: Query GSI1 with `email`
   - Get user by username: Query GSI2 with `username`

2. **Account Hierarchy**
   - Get child accounts: Query GSI1 with `parentAccountId`
   - Get accounts in path: Query GSI2 with `accountPath` prefix

3. **Source Management**
   - Get sources by account: Query with `accountId`
   - Get sources by platform: Query GSI2 with `accountId#platform`
   - Get sources by status: Query GSI3 with `accountId#status`

4. **Activity Tracking**
   - Get account activities: Query with `accountId` and time range
   - Get user activities: Query GSI1 with `userId` and time range
   - Get resource activities: Query GSI2 with `resourceType` and time range

5. **Job Processing**
   - Get account jobs: Query with `accountId`
   - Get jobs by status: Query GSI2 with `accountId#status`
   - Get source jobs: Query GSI3 with `sourceId`

## Capacity Planning

### On-Demand Tables
All tables use on-demand billing mode for:
- Automatic scaling
- No capacity planning required
- Pay-per-request pricing

### Hot Partition Considerations
- Activities table partitioned by `accountId` to distribute load
- Jobs table uses status as sort key to avoid hot partitions
- OAuth states table uses TTL for automatic cleanup

## Security Considerations

1. **Encryption at Rest**
   - All tables encrypted using AWS-managed KMS keys
   - Sensitive fields (tokens, credentials) use additional application-level encryption

2. **Access Control**
   - IAM policies restrict access by service
   - Lambda functions have minimal required permissions
   - Cross-account access prevented by accountId validation

3. **Data Retention**
   - Activities: 90-day TTL
   - OAuth states: 15-minute TTL
   - Notifications: 30-day TTL
   - Refresh tokens: Auto-delete on expiration

## Migration Considerations

### From V1 to V2
1. User data requires email normalization
2. Account hierarchy needs to be established
3. Source credentials need re-encryption
4. Activity history can be migrated selectively

### Schema Evolution
1. Use sparse indexes for new attributes
2. Maintain backward compatibility
3. Version attribute schemas when breaking changes required
4. Use migration Lambda functions for data transformation