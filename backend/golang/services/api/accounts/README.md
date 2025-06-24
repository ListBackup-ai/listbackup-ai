# Accounts Service Documentation

## Overview
The Accounts Service manages hierarchical account structures for ListBackup.ai v2. It provides endpoints for creating, managing, and organizing accounts with support for unlimited nesting depth, making it suitable for complex organizational structures like conglomerates, franchises, and multi-location businesses.

## Architecture

### Service Dependencies
- **Infrastructure Services**: Uses centralized DynamoDB tables, Cognito User Pool, and EventBridge
- **API Gateway**: Integrates with the shared HTTP API and uses JWT authorizer
- **Auth Service**: Relies on authentication context from JWT tokens
- **Users Service**: Works with user-account relationships

### Key Features
- Hierarchical account structures with unlimited nesting
- Path-based hierarchy for efficient queries
- Role-based access control per account
- Data aggregation at any level
- Cross-subsidiary reporting capabilities
- Account switching for multi-account users

## Endpoints

All endpoints require authentication via JWT token in the Authorization header.

### GET /accounts
Lists all accounts accessible to the authenticated user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `includeHierarchy` (boolean): Include sub-accounts in response
- `status` (string): Filter by account status (active, inactive, suspended)

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "accountId": "account:uuid",
        "parentAccountId": null,
        "name": "Acme Corporation",
        "company": "Acme Corp",
        "accountPath": "/account:uuid",
        "level": 0,
        "accountType": "conglomerate",
        "status": "active",
        "plan": "enterprise",
        "userRole": "Owner",
        "userPermissions": {
          "canCreateSubAccounts": true,
          "canInviteUsers": true,
          "canManageIntegrations": true,
          "canViewAllData": true,
          "canManageBilling": true,
          "canDeleteAccount": true,
          "canModifySettings": true
        },
        "settings": {
          "maxSources": 100,
          "maxStorageGB": 1000,
          "maxBackupJobs": 10000,
          "retentionDays": 365,
          "encryptionEnabled": true
        },
        "usage": {
          "sourcesUsed": 45,
          "storageUsedGB": 234.5,
          "backupJobsUsed": 3456
        },
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 1
  }
}
```

### POST /accounts
Creates a new top-level account.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Division",
  "company": "New Division Inc",
  "accountType": "division",
  "plan": "professional",
  "settings": {
    "maxSources": 50,
    "maxStorageGB": 500,
    "maxBackupJobs": 5000,
    "retentionDays": 180,
    "encryptionEnabled": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "accountId": "account:new-uuid",
    "name": "New Division",
    "company": "New Division Inc",
    "accountPath": "/account:new-uuid",
    "level": 0,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### GET /accounts/{accountId}
Retrieves details for a specific account.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accountId": "account:uuid",
    "parentAccountId": null,
    "name": "Acme Corporation",
    "company": "Acme Corp",
    "accountPath": "/account:uuid",
    "level": 0,
    "accountType": "conglomerate",
    "status": "active",
    "plan": "enterprise",
    "settings": {
      "maxSources": 100,
      "maxStorageGB": 1000,
      "maxBackupJobs": 10000,
      "retentionDays": 365,
      "encryptionEnabled": true
    },
    "usage": {
      "sourcesUsed": 45,
      "storageUsedGB": 234.5,
      "backupJobsUsed": 3456
    },
    "aggregatedUsage": {
      "totalSourcesUsed": 125,
      "totalStorageUsedGB": 567.8,
      "totalBackupJobsUsed": 8901,
      "subAccountsCount": 15
    },
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### PUT /accounts/{accountId}
Updates an existing account's details.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Account Name",
  "company": "Updated Company Name",
  "plan": "enterprise",
  "settings": {
    "maxSources": 150,
    "retentionDays": 730
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account updated successfully",
  "data": {
    "accountId": "account:uuid",
    "name": "Updated Account Name",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### DELETE /accounts/{accountId}
Deletes an account and all associated data.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `cascade` (boolean): Delete all sub-accounts (default: false)
- `transferTo` (string): Account ID to transfer resources to

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully",
  "data": {
    "deletedAccountId": "account:uuid",
    "deletedSubAccounts": 5,
    "transferredResources": {
      "sources": 10,
      "users": 3
    }
  }
}
```

### POST /accounts/{parentAccountId}/sub-accounts (TODO)
Creates a sub-account under a parent account.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Regional Office",
  "company": "Acme Regional",
  "accountType": "location",
  "inheritSettings": true
}
```

### GET /accounts/{accountId}/hierarchy (TODO)
Retrieves the full account hierarchy under a given account.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `depth` (number): Maximum depth to traverse
- `includeUsage` (boolean): Include usage statistics

### POST /accounts/switch (TODO)
Switches the user's active account context.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "accountId": "account:uuid"
}
```

## Configuration

### Environment Variables
The service inherits environment variables from the provider configuration:
- `COGNITO_USER_POOL_ID`: Cognito User Pool ID
- `COGNITO_CLIENT_ID`: Cognito App Client ID
- `USERS_TABLE`: DynamoDB table for user records
- `ACCOUNTS_TABLE`: DynamoDB table for account records
- `USER_ACCOUNTS_TABLE`: DynamoDB table for user-account relationships
- `SOURCES_TABLE`: DynamoDB table for sources (for cascade operations)
- `ACTIVITY_TABLE`: DynamoDB table for activity tracking
- `EVENT_BUS_NAME`: EventBridge bus for account events

### IAM Permissions
The service has specific permissions for:
- DynamoDB operations on accounts, users, user-accounts, sources, and activity tables
- EventBridge for publishing account events
- CloudWatch Logs for monitoring
- X-Ray for distributed tracing

## Database Schema

### Accounts Table
```typescript
{
  accountId: string,           // "account:{uuid}"
  parentAccountId?: string,    // Parent account ID for hierarchy
  ownerUserId: string,        // User who owns the account
  createdByUserId: string,
  name: string,
  company: string,
  accountPath: string,        // Path for hierarchy queries (e.g., "/root/subsidiary/division/")
  accountType: string,        // "conglomerate" | "subsidiary" | "division" | "location"
  level: number,              // Depth in hierarchy (0 for root)
  plan: string,               // "free" | "starter" | "professional" | "enterprise"
  status: string,             // "active" | "inactive" | "suspended"
  settings: {
    maxSources: number,
    maxStorageGB: number,
    maxBackupJobs: number,
    retentionDays: number,
    encryptionEnabled: boolean,
    allowSubAccounts: boolean,
    dataIsolation: boolean
  },
  usage: {
    sourcesUsed: number,
    storageUsedGB: number,
    backupJobsUsed: number
  },
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt?: timestamp
}
```

### Account Hierarchy Index
- **GSI**: parentAccountId-level-index
- **Partition Key**: parentAccountId
- **Sort Key**: level
- **Purpose**: Efficiently query sub-accounts

### Account Path Index
- **GSI**: accountPath-index
- **Partition Key**: accountPath (begins_with queries)
- **Purpose**: Query entire hierarchies

## Error Handling

### Common Error Responses
- **400 Bad Request**: Invalid input or business rule violation
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: User lacks permission for the operation
- **404 Not Found**: Account not found
- **409 Conflict**: Account name already exists
- **500 Internal Server Error**: System errors

### Business Rule Errors
- `ACCOUNT_LIMIT_EXCEEDED`: Maximum accounts reached for plan
- `HIERARCHY_TOO_DEEP`: Maximum nesting depth exceeded
- `CIRCULAR_REFERENCE`: Would create circular hierarchy
- `RESOURCES_EXIST`: Cannot delete account with active resources

## Events Published

The service publishes events to EventBridge for account lifecycle:

### Account Created
```json
{
  "Source": "listbackup.accounts",
  "DetailType": "AccountCreated",
  "Detail": {
    "accountId": "account:uuid",
    "parentAccountId": null,
    "name": "New Account",
    "accountType": "division",
    "createdByUserId": "user:uuid",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

### Account Updated
```json
{
  "Source": "listbackup.accounts",
  "DetailType": "AccountUpdated",
  "Detail": {
    "accountId": "account:uuid",
    "changes": {
      "name": "New Name",
      "plan": "enterprise"
    },
    "updatedByUserId": "user:uuid",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

### Account Deleted
```json
{
  "Source": "listbackup.accounts",
  "DetailType": "AccountDeleted",
  "Detail": {
    "accountId": "account:uuid",
    "cascade": true,
    "deletedSubAccounts": 5,
    "deletedByUserId": "user:uuid",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

## Deployment

### Using Serverless Compose
The accounts service is included in the serverless-compose.yml:

```bash
cd /Users/nickkulavic/Projects/listbackup.ai/listbackup-ai-v2/backend/golang/services
serverless deploy --config serverless-compose.yml --stage main --aws-profile listbackup.ai
```

### Individual Deployment
To deploy only the accounts service:
```bash
cd /Users/nickkulavic/Projects/listbackup.ai/listbackup-ai-v2/backend/golang/services
# Build binaries first (when handlers are implemented)
./api/accounts/build.sh
# Deploy the service
serverless deploy --config api/accounts/serverless.yml --stage main --aws-profile listbackup.ai
```

## Testing

A test script is available at `/services/test-accounts-endpoints.sh` which tests:
- Account listing
- Account creation
- Account retrieval
- Account updates
- CORS configuration

Run the test script after deployment:
```bash
./test-accounts-endpoints.sh
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Users can only access accounts they have permissions for
3. **Data Isolation**: Strict account-based data isolation
4. **Hierarchical Permissions**: Permissions can be inherited or overridden
5. **Audit Trail**: All account changes are logged to activity table

## Implementation Notes

1. **Account IDs**: Prefixed with "account:" for consistency
2. **Path Structure**: Uses forward slashes for hierarchy paths
3. **Cascade Operations**: Careful handling of sub-account deletion
4. **Performance**: Path-based queries for efficient hierarchy traversal
5. **Limits**: Plan-based limits enforced at creation/update

## Current Status

**IMPORTANT**: The account handlers are currently placeholder implementations. The actual business logic needs to be implemented for:
- Proper hierarchical account management
- Permission checking
- Usage tracking and limits
- Data aggregation
- Cascade operations

## Future Enhancements

1. **Account Templates**: Pre-configured account settings
2. **Bulk Operations**: Create/update multiple accounts
3. **Account Archiving**: Soft delete with data retention
4. **Usage Alerts**: Notifications for limit approaching
5. **Account Cloning**: Duplicate account structures
6. **Cross-Account Reporting**: Aggregated analytics
7. **Account Migration**: Move accounts between hierarchies