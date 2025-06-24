# Users Service Documentation

## Overview
The Users Service manages user profiles, settings, and account relationships for ListBackup.ai v2. It provides endpoints for retrieving and updating user information, managing user preferences, and listing user accounts with proper authorization.

## Architecture

### Service Dependencies
- **Infrastructure Services**: Uses centralized DynamoDB tables, Cognito User Pool, and EventBridge
- **API Gateway**: Integrates with the shared HTTP API and uses JWT authorizer
- **Auth Service**: Relies on authentication context from JWT tokens

### Key Features
- User profile management (view and update)
- User settings and preferences management
- Account listing with permissions and roles
- Hierarchical account support
- Real-time event publishing for user actions

## Endpoints

All endpoints require authentication via JWT token in the Authorization header.

### GET /users/me
Retrieves the current user's profile information including their current account details.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user:uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "status": "active",
    "currentAccount": {
      "accountId": "account:uuid",
      "accountName": "Company Name",
      "company": "Company Inc",
      "role": "Owner",
      "permissions": {
        "canCreateSubAccounts": true,
        "canInviteUsers": true,
        "canManageIntegrations": true,
        "canViewAllData": true,
        "canManageBilling": true,
        "canDeleteAccount": true,
        "canModifySettings": true
      },
      "isCurrent": true
    },
    "preferences": {
      "timezone": "America/New_York",
      "theme": "light",
      "notifications": {
        "email": true,
        "slack": false,
        "backupComplete": true,
        "backupFailed": true,
        "weeklyReport": true
      }
    }
  }
}
```

### PUT /users/me
Updates the current user's profile information.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "currentAccountId": "account:uuid"  // Optional: switch current account
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": "user:uuid",
    "name": "Updated Name",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### GET /users/me/settings
Retrieves the user's settings and preferences.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "timezone": "America/New_York",
      "theme": "light",
      "notifications": {
        "email": true,
        "slack": false,
        "backupComplete": true,
        "backupFailed": true,
        "weeklyReport": true
      }
    },
    "integrations": {
      "slack": {
        "enabled": false,
        "webhookUrl": ""
      }
    }
  }
}
```

### PUT /users/me/settings
Updates the user's settings and preferences.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "timezone": "America/Los_Angeles",
  "theme": "dark",
  "notifications": {
    "email": true,
    "slack": true,
    "backupComplete": true,
    "backupFailed": true,
    "weeklyReport": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

### GET /users/me/accounts
Lists all accounts the user has access to, including their role and permissions for each account.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "accountId": "3f8482a9-319c-4201-a3d1-5534290c085d",
        "name": "Test Company",
        "company": "Test Company",
        "accountPath": "/3f8482a9-319c-4201-a3d1-5534290c085d",
        "level": 0,
        "parentAccountId": null,
        "isRootAccount": true,
        "isCurrent": true,
        "userRole": "Owner",
        "userStatus": "Active",
        "linkedAt": "2025-01-01T00:00:00Z",
        "userPermissions": {
          "canCreateSubAccounts": true,
          "canInviteUsers": true,
          "canManageIntegrations": true,
          "canViewAllData": true,
          "canManageBilling": true,
          "canDeleteAccount": true,
          "canModifySettings": true
        },
        "status": "active",
        "plan": "free",
        "usage": {
          "sourcesUsed": 0,
          "storageUsedGB": 0,
          "backupJobsUsed": 0
        },
        "settings": {
          "maxSources": 5,
          "maxStorageGB": 10,
          "maxBackupJobs": 100,
          "retentionDays": 30,
          "encryptionEnabled": true
        }
      }
    ],
    "total": 1
  }
}
```

## Configuration

### Environment Variables
The service inherits environment variables from the provider configuration:
- `COGNITO_USER_POOL_ID`: Cognito User Pool ID
- `COGNITO_CLIENT_ID`: Cognito App Client ID
- `COGNITO_REGION`: AWS region for Cognito
- `USERS_TABLE`: DynamoDB table for user records
- `ACCOUNTS_TABLE`: DynamoDB table for account records
- `USER_ACCOUNTS_TABLE`: DynamoDB table for user-account relationships
- `ACTIVITY_TABLE`: DynamoDB table for activity tracking
- `EVENT_BUS_NAME`: EventBridge bus for user events

### IAM Permissions
The service has specific permissions for:
- DynamoDB operations on users, accounts, user-accounts, and activity tables
- Cognito operations for user attribute management
- EventBridge for publishing user events
- CloudWatch Logs for monitoring
- X-Ray for distributed tracing

## Database Schema

### Users Table
```typescript
{
  userId: string,           // "user:{cognitoUUID}"
  cognitoUserId: string,    // Raw Cognito UUID
  email: string,
  name: string,
  status: string,           // "active" | "inactive" | "suspended"
  currentAccountId: string,
  preferences: {
    timezone: string,
    theme: string,          // "light" | "dark"
    notifications: {
      email: boolean,
      slack: boolean,
      backupComplete: boolean,
      backupFailed: boolean,
      weeklyReport: boolean
    }
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### User-Accounts Table
```typescript
{
  userId: string,
  accountId: string,
  role: string,             // "Owner" | "Admin" | "Member" | "Viewer"
  status: string,           // "Active" | "Inactive" | "Pending"
  permissions: {
    canCreateSubAccounts: boolean,
    canInviteUsers: boolean,
    canManageIntegrations: boolean,
    canViewAllData: boolean,
    canManageBilling: boolean,
    canDeleteAccount: boolean,
    canModifySettings: boolean
  },
  linkedAt: timestamp,
  updatedAt: timestamp
}
```

## Error Handling

### Common Error Responses
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: User lacks permission for the operation
- **404 Not Found**: User or resource not found
- **500 Internal Server Error**: System errors

### Error Response Format
```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "message": ""
}
```

## Events Published

The service publishes events to EventBridge for various user actions:

### User Profile Updated
```json
{
  "Source": "listbackup.users",
  "DetailType": "UserProfileUpdated",
  "Detail": {
    "userId": "user:uuid",
    "accountId": "account:uuid",
    "changes": {
      "name": "New Name"
    },
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

### User Settings Updated
```json
{
  "Source": "listbackup.users",
  "DetailType": "UserSettingsUpdated",
  "Detail": {
    "userId": "user:uuid",
    "accountId": "account:uuid",
    "settings": {
      "timezone": "America/Los_Angeles",
      "theme": "dark"
    },
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

## Deployment

### Using Serverless Compose
The users service is included in the serverless-compose.yml and deploys with its dependencies:

```bash
cd /Users/nickkulavic/Projects/listbackup.ai/listbackup-ai-v2/backend/golang/services
serverless deploy --config serverless-compose.yml --stage main --aws-profile listbackup.ai
```

### Individual Deployment
To deploy only the users service:
```bash
cd /Users/nickkulavic/Projects/listbackup.ai/listbackup-ai-v2/backend/golang/services
# Build the binaries first
./api/users/build.sh
# Deploy the service
serverless deploy --config api/users/serverless.yml --stage main --aws-profile listbackup.ai
```

## Testing

A comprehensive test script is available at `/services/test-users-endpoints.sh` which tests:
- User profile retrieval
- Profile updates
- Settings retrieval and updates
- Account listing
- CORS configuration

Run the test script after deployment:
```bash
./test-users-endpoints.sh
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens from Cognito
2. **Authorization**: Users can only access and modify their own data
3. **Account Access**: User-account relationships control access to account data
4. **Permissions**: Fine-grained permissions control what users can do within accounts
5. **Data Isolation**: Queries are scoped to the authenticated user's data

## Implementation Notes

1. **User IDs**: Prefixed with "user:" followed by Cognito UUID
2. **Account IDs**: Prefixed with "account:" for consistency
3. **Default Values**: New users get default preferences and settings
4. **Event Publishing**: All state changes are published to EventBridge
5. **Hierarchical Accounts**: Supports nested account structures with path-based queries

## Future Enhancements

1. **Bulk Operations**: Support for updating multiple user settings at once
2. **User Search**: Admin endpoints for searching and managing users
3. **Audit Trail**: Detailed activity logging for compliance
4. **Profile Pictures**: Avatar upload and management
5. **Multi-factor Authentication**: Additional security options
6. **API Keys**: Personal access tokens for programmatic access