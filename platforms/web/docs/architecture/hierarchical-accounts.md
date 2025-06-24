# Hierarchical Account Structure

## Overview
ListBackup.ai v2 implements a hierarchical account structure to support agency clients who manage multiple business accounts under a single user login.

## Architecture Design

### Account Hierarchy
```
PepsiCo (Parent Account)
├── Pepsi (Subsidiary)
│   ├── North America (Region)
│   └── Europe (Region)
├── Gatorade (Subsidiary)
│   ├── Sports Division (Region)
│   └── Wellness Division (Region)
└── Lay's (Subsidiary)
    ├── Traditional Snacks (Region)
    └── Healthy Options (Region)
```

### Database Schema

#### ACCOUNTS_TABLE
```json
{
  "accountId": "uuid",
  "parentAccountId": "uuid|null",
  "ownerUserId": "uuid",
  "name": "string",
  "company": "string",
  "accountPath": "string", // "/parent/child/grandchild"
  "level": "number", // 0 = root, 1 = child, etc.
  "isActive": "boolean",
  "settings": {
    "allowSubAccounts": "boolean",
    "maxSubAccounts": "number",
    "whiteLabel": {
      "enabled": "boolean",
      "logo": "string",
      "brandName": "string"
    }
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### USERS_ACCOUNTS_TABLE (Many-to-Many)
```json
{
  "userId": "uuid",
  "accountId": "uuid",
  "role": "Owner|Manager|Viewer",
  "status": "Active|Inactive|Invited",
  "permissions": {
    "canCreateSubAccounts": "boolean",
    "canInviteUsers": "boolean",
    "canManageIntegrations": "boolean",
    "canViewAllData": "boolean"
  },
  "linkedAt": "timestamp"
}
```

## Implementation Details

### Account Path System
- **Purpose**: Efficient hierarchy queries and validation
- **Format**: `/parentId/childId/grandchildId`
- **Benefits**: 
  - Quick ancestor/descendant queries
  - Circular dependency prevention
  - Depth level enforcement

### Role-Based Permissions

#### Owner
- Full access to account and all sub-accounts
- Can create/delete sub-accounts
- Can manage all users and permissions
- Can access billing and settings

#### Manager
- Can manage integrations and data sources
- Can invite users (limited roles)
- Can view and export data
- Cannot delete accounts or change billing

#### Viewer
- Read-only access to data and reports
- Cannot modify settings or invite users
- Cannot access billing information

### Account Creation Flow

1. **Validate Permissions**: Check if user can create sub-accounts
2. **Generate Account Path**: Append new accountId to parent path
3. **Set Hierarchy Level**: parentLevel + 1
4. **Create DynamoDB Records**: Account + User association
5. **Initialize Resources**: S3 buckets, Glue database

### Account Switching

#### Frontend Implementation
```typescript
interface AccountContext {
  currentAccount: Account;
  availableAccounts: Account[];
  switchAccount: (accountId: string) => Promise<void>;
  accountHierarchy: AccountTree;
}
```

#### Backend Context
- All API calls include `X-Account-Context` header
- Authorization middleware validates account access
- Data isolation enforced at query level

## Migration from v1

### Current v1 Structure
- Single account per user
- Basic owner/user roles
- No hierarchy support

### Migration Steps
1. **Preserve Existing Accounts**: Convert to root-level accounts
2. **Maintain User Associations**: Keep current permissions
3. **Add Hierarchy Fields**: Set parentAccountId=null, level=0
4. **Update API Endpoints**: Add account context support

## API Changes

### New Endpoints
```
POST /accounts/{accountId}/sub-accounts
GET /accounts/{accountId}/hierarchy
GET /accounts/{accountId}/descendants
POST /accounts/{accountId}/switch-context
```

### Modified Endpoints
- All data endpoints now require account context
- User permissions checked against account hierarchy
- Responses filtered by account access rights

## Security Considerations

### Data Isolation
- All queries filtered by accountId or account path
- Cross-account data access prevented
- User permissions validated per account

### Invitation Security
- 6-digit codes with 24-hour expiration
- Email verification required
- Role restrictions enforced

### Audit Trail
- All account changes logged
- User access tracked per account
- Permission changes recorded

## Future Enhancements

### White-Label Support
- Custom branding per account hierarchy level
- Subdomain routing (client1.listbackup.ai)
- Custom email templates

### Advanced Permissions
- Resource-level permissions
- Time-based access controls
- IP restrictions per account

### Billing Integration
- Hierarchical billing (parent pays for children)
- Usage aggregation across hierarchy
- Per-account usage limits