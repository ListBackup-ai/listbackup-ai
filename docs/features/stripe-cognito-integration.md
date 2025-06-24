# Stripe + Cognito User Group Integration

## Overview

This document outlines how ListBackup.ai manages user access control by connecting Stripe subscription levels to Cognito User Groups. Users are automatically assigned to appropriate groups based on their active subscription status.

## User Pool Configuration

**User Pool ID:** `us-west-2_WUG7IqTMs`  
**Region:** `us-west-2`  
**Client ID:** `5oh25tb12bkcr2karnkin2pmgv`
**Client Secret:** `1igalf7uofeos5861nmbpaptldkrm38uhhnjgdkpa5ulbnu8po9i`

### Sign-in Options
- **Email Address**: Users can sign in with their email
- **Phone Number**: Users can sign in with their phone number
- **Auto-Verification**: Email addresses are automatically verified

## User Groups & Subscription Mapping

| Group Name | Precedence | Stripe Plan | Description | Access Level |
|------------|------------|-------------|-------------|--------------|
| `listbackup-ai-admins` | 1 | N/A | Platform administrators | Full access |
| `listbackup-ai-managers` | 5 | Internal | Team oversight capabilities | Management access |
| `listbackup-ai-support` | 10 | Internal | Customer support team | Support tools |
| `listbackup-ai-enterprise` | 3 | `enterprise` | Advanced enterprise features | Premium access |
| `listbackup-ai-business` | 25 | `business` | Business subscription users | Enhanced access |
| `listbackup-ai-professional` | 30 | `professional` | Professional subscription | Standard access |
| `listbackup-ai-starter` | 40 | `starter` | Starter subscription | Basic paid access |
| `listbackup-ai-trial` | 45 | `trial` | Trial period users | Limited access |
| `listbackup-ai-free` | 50 | `free` | Free tier users | Basic access |

## Implementation Strategy

### 1. Stripe Webhook Integration

Create webhook handlers for the following Stripe events:

```javascript
// Webhook events to handle
const STRIPE_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated', 
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed'
];
```

### 2. Group Assignment Logic

```javascript
// Example group assignment based on subscription
function getGroupFromSubscription(subscription) {
  const planName = subscription.items.data[0]?.price?.nickname?.toLowerCase();
  
  const groupMapping = {
    'enterprise': 'listbackup-ai-enterprise',
    'business': 'listbackup-ai-business', 
    'professional': 'listbackup-ai-professional',
    'starter': 'listbackup-ai-starter',
    'trial': 'listbackup-ai-trial',
    'free': 'listbackup-ai-free'
  };
  
  return groupMapping[planName] || 'listbackup-ai-free';
}
```

### 3. Cognito Group Management

```javascript
// Add user to group
async function addUserToGroup(userPoolId, username, groupName) {
  await cognito.adminAddUserToGroup({
    UserPoolId: userPoolId,
    Username: username,
    GroupName: groupName
  }).promise();
}

// Remove user from group  
async function removeUserFromGroup(userPoolId, username, groupName) {
  await cognito.adminRemoveUserFromGroup({
    UserPoolId: userPoolId,
    Username: username,
    GroupName: groupName
  }).promise();
}
```

### 4. Access Control in Lambda Functions

```javascript
// JWT token will include groups in cognito:groups claim
function checkUserAccess(event, requiredGroup) {
  const token = event.requestContext.authorizer.jwt;
  const userGroups = token.claims['cognito:groups'] || [];
  
  // Check if user belongs to required group or higher precedence
  return hasRequiredAccess(userGroups, requiredGroup);
}
```

## API Integration Points

### Backend Functions to Implement

1. **Subscription Event Handler**
   - Process Stripe webhooks
   - Update user groups based on subscription changes
   - Handle grace periods and failed payments

2. **User Group Sync**
   - Periodic sync job to ensure consistency
   - Handle edge cases and manual overrides

3. **Access Control Middleware**
   - Validate group membership for protected endpoints
   - Return appropriate error messages for insufficient access

### Frontend Integration

```typescript
// Check user access level
interface UserAccess {
  subscription: string;
  groups: string[];
  features: string[];
}

// Feature flags based on groups
const FEATURE_ACCESS = {
  'listbackup-ai-enterprise': ['advanced-analytics', 'custom-integrations', 'priority-support'],
  'listbackup-ai-business': ['team-management', 'advanced-backups'],
  'listbackup-ai-professional': ['scheduled-backups', 'multiple-sources'],
  'listbackup-ai-starter': ['basic-backups'],
  'listbackup-ai-trial': ['limited-backups'],
  'listbackup-ai-free': ['manual-backups']
};
```

## Migration & Deployment

### Initial Setup
1. Deploy new user pool configuration
2. Update environment variables in all services
3. Implement webhook handlers
4. Create group management utilities

### User Migration Strategy
1. Identify existing users and their subscription status
2. Bulk assign users to appropriate groups
3. Test access control with sample users
4. Gradual rollout with feature flags

## Monitoring & Maintenance

### Metrics to Track
- Group membership distribution
- Failed group assignments
- Access control violations
- Subscription/group sync issues

### Alerts
- Failed Stripe webhook processing
- Group assignment errors
- Subscription cancellations
- Payment failures affecting access

## Security Considerations

1. **Principle of Least Privilege**: Users get minimum required access
2. **Grace Periods**: Handle payment failures gracefully
3. **Audit Trail**: Log all group changes and access decisions
4. **Manual Overrides**: Admin ability to adjust access when needed

## Testing Strategy

1. **Unit Tests**: Group assignment logic
2. **Integration Tests**: Stripe webhook processing
3. **E2E Tests**: Full subscription flow
4. **Load Tests**: High-volume webhook processing 