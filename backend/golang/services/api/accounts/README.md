# Accounts Service

The Accounts Service manages the hierarchical account structure for the ListBackup.ai platform, providing multi-tenant capabilities with parent-child account relationships.

## Overview

This service handles all account-related operations including:
- Account creation and management
- Hierarchical account structures (parent/sub-accounts)
- Account switching and context management
- User-account relationships and permissions
- Account settings and usage tracking

## Architecture

### Service Configuration
- **Runtime**: AWS Lambda (provided.al2023, ARM64)
- **Region**: us-west-2
- **Memory**: 512MB
- **Timeout**: 29 seconds
- **Authentication**: AWS Cognito JWT

### Dependencies
- **DynamoDB Tables**:
  - `Accounts`: Stores account information
  - `UserAccounts`: Manages user-account relationships
  - `Users`: User information
  - `Sources`: Data sources (for deletion checks)
  - `Activity`: Audit logging

## API Endpoints

### 1. List Accounts
```
GET /accounts
Authorization: Bearer {JWT_TOKEN}
```

Lists all accounts accessible to the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "accountId": "string",
        "name": "string",
        "company": "string",
        "accountPath": "string",
        "level": 0,
        "parentAccountId": "string",
        "plan": "string",
        "status": "string",
        "settings": {},
        "usage": {}
      }
    ],
    "total": 1
  }
}
```

### 2. Create Account
```
POST /accounts
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "name": "Account Name",
  "company": "Company Name",
  "plan": "free|starter|professional|enterprise"
}
```

Creates a new top-level account.

### 3. Get Account
```
GET /accounts/{accountId}
Authorization: Bearer {JWT_TOKEN}
```

Retrieves detailed information about a specific account.

### 4. Update Account
```
PUT /accounts/{accountId}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "name": "Updated Name",
  "company": "Updated Company",
  "settings": {
    "maxSources": 10,
    "maxStorageGB": 100,
    "retentionDays": 30
  }
}
```

Updates account information and settings.

### 5. Delete Account
```
DELETE /accounts/{accountId}
Authorization: Bearer {JWT_TOKEN}
```

Soft deletes an account. The account must not have:
- Active sub-accounts
- Active data sources
- Be the user's current account

### 6. Create Sub-Account
```
POST /accounts/{parentAccountId}/sub-accounts
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "name": "Sub-Account Name",
  "company": "Sub-Company Name"
}
```

Creates a sub-account under the specified parent account.

### 7. List Account Hierarchy
```
GET /accounts/{accountId}/hierarchy
Authorization: Bearer {JWT_TOKEN}
```

Returns the complete account hierarchy starting from the specified account.

### 8. Switch Account Context
```
POST /accounts/switch
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "accountId": "target-account-id"
}
```

Switches the user's active account context and returns updated authentication context.

## Account Model

### Account Structure
```go
type Account struct {
    AccountID        string    // Unique identifier
    ParentAccountID  string    // Parent account (null for root)
    OwnerUserID      string    // Account owner
    CreatedByUserID  string    // Creator
    Name             string    // Account name
    Company          string    // Company name
    AccountPath      string    // Hierarchical path
    Level            int       // Depth in hierarchy (0 = root)
    Plan             string    // Subscription plan
    Status           string    // active|suspended|deleted
    BillingEmail     string    // Billing contact
    Settings         Settings  // Account settings
    Usage            Usage     // Usage metrics
}
```

### Account Settings
```go
type Settings struct {
    MaxSources        int       // Maximum data sources
    MaxStorageGB      int       // Storage limit
    MaxBackupJobs     int       // Concurrent backup jobs
    RetentionDays     int       // Data retention period
    EncryptionEnabled bool      // End-to-end encryption
    TwoFactorRequired bool      // Enforce 2FA
    AllowSubAccounts  bool      // Can create sub-accounts
    MaxSubAccounts    int       // Sub-account limit
    WhiteLabel        WhiteLabel // White-label settings
}
```

### User Permissions
```go
type Permissions struct {
    CanCreateSubAccounts   bool
    CanInviteUsers         bool
    CanManageIntegrations  bool
    CanViewAllData         bool
    CanManageBilling       bool
    CanDeleteAccount       bool
    CanModifySettings      bool
}
```

## Hierarchical Account Management

### Account Paths
Accounts use a path-based hierarchy system:
- Root account: `/accountId/`
- Sub-account: `/parentId/accountId/`
- Nested sub-account: `/rootId/parentId/accountId/`

### Level System
- Level 0: Root accounts
- Level 1: Direct sub-accounts
- Level 2+: Nested sub-accounts

### Permission Inheritance
- Sub-accounts inherit certain settings from parent accounts
- Users with access to parent accounts can access sub-accounts
- Account owners have full permissions on their account and all sub-accounts

## Building and Deployment

### Build
```bash
./build.sh
```

This builds all Lambda function handlers and creates deployment packages.

### Deploy to Development
```bash
serverless deploy --stage dev
```

### Deploy to Production
```bash
serverless deploy --stage prod
```

### Testing
Use the provided test script:
```bash
./test-accounts.sh
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens from Cognito
2. **Authorization**: User permissions are checked via the UserAccounts table
3. **Data Isolation**: Users can only access accounts they have relationships with
4. **Audit Trail**: All account modifications are logged to the Activity table
5. **Soft Deletes**: Accounts are marked as deleted rather than removed

## Error Handling

Common error responses:
- `400 Bad Request`: Invalid input or validation failure
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Account not found
- `409 Conflict`: Business rule violation (e.g., deleting account with sub-accounts)
- `500 Internal Server Error`: Unexpected server error

## Monitoring

### CloudWatch Logs
All Lambda functions log to CloudWatch with the pattern:
`/aws/lambda/listbackup-accounts-{stage}-{function}`

### Key Metrics
- Function invocation count
- Error rates
- Duration/latency
- Memory usage

### X-Ray Tracing
Distributed tracing is enabled for all functions to track request flow.

## Development

### Local Testing
1. Set up AWS credentials
2. Configure environment variables
3. Run individual handlers locally

### Adding New Features
1. Update the handler in `cmd/handlers/accounts/`
2. Update `serverless.yml` if adding new endpoints
3. Update `build.sh` to include new handlers
4. Deploy and test

## Support

For issues or questions:
- Check CloudWatch logs for detailed error information
- Review the test script for example usage
- Contact the platform team for assistance