# API Integration Guide

## Overview
This document details the API integration requirements for the hierarchical account management system, including endpoints, data models, and integration patterns.

## API Endpoints Summary

### Account Management

#### GET /accounts
**Purpose**: Get all accounts accessible to the current user
**Auth**: Required (JWT)
**Response**: Array of Account objects with user permissions

```typescript
interface GetAccountsResponse {
  accounts: AccountWithPermissions[];
}

interface AccountWithPermissions extends Account {
  userRole: 'Owner' | 'Manager' | 'Viewer';
  userStatus: 'Active' | 'Inactive' | 'Invited';
  userPermissions: Permissions;
}
```

#### GET /accounts/{accountId}/hierarchy
**Purpose**: Get account hierarchy tree starting from specified account
**Auth**: Required (JWT)
**Response**: Nested account tree structure

```typescript
interface AccountHierarchyResponse {
  account: Account;
  children?: AccountHierarchyResponse[];
  metadata: {
    totalDescendants: number;
    maxDepth: number;
    userCount: number;
    sourceCount: number;
  };
}
```

#### POST /accounts/{accountId}/sub-accounts
**Purpose**: Create a new sub-account under the specified parent
**Auth**: Required (JWT, permissions: canCreateSubAccounts)
**Body**: CreateSubAccountRequest

```typescript
interface CreateSubAccountRequest {
  name: string;
  company?: string;
  description?: string;
  settings?: {
    allowSubAccounts?: boolean;
    maxSubAccounts?: number;
    whiteLabel?: {
      enabled: boolean;
      logo?: string;
      brandName?: string;
    };
  };
  limits?: {
    storage: number;
    sources: number;
    jobs: number;
    apiCalls: number;
  };
}
```

#### POST /accounts/switch
**Purpose**: Switch user's current account context
**Auth**: Required (JWT)
**Body**: AccountSwitchRequest

```typescript
interface AccountSwitchRequest {
  accountId: string;
}

interface AccountSwitchResponse {
  account: Account;
  userRole: Role;
  userPermissions: Permissions;
  switchedAt: string;
}
```

### User Invitation Management

#### POST /accounts/{accountId}/invitations
**Purpose**: Invite a user to join an account
**Auth**: Required (JWT, permissions: canInviteUsers)
**Body**: InviteUserRequest

```typescript
interface InviteUserRequest {
  email: string;
  role: 'Owner' | 'Manager' | 'Viewer';
  permissions?: Partial<Permissions>;
  message?: string;
}

interface InviteUserResponse {
  message: string;
  inviteCode: string;
  email: string;
  role: string;
  expiresAt: number;
}
```

#### GET /accounts/{accountId}/invitations
**Purpose**: Get pending invitations for an account
**Auth**: Required (JWT, role: Owner|Manager)
**Response**: Array of pending invitations

```typescript
interface GetInvitationsResponse {
  invitations: InvitationWithDetails[];
}

interface InvitationWithDetails extends Invitation {
  inviterName: string;
  inviterEmail: string;
  daysUntilExpiry: number;
}
```

#### POST /invitations/accept
**Purpose**: Accept an invitation using invite code
**Auth**: Required (JWT)
**Body**: AcceptInvitationRequest

```typescript
interface AcceptInvitationRequest {
  inviteCode: string;
}

interface AcceptInvitationResponse {
  message: string;
  account: Account;
  userRole: Role;
  userPermissions: Permissions;
}
```

#### DELETE /accounts/{accountId}/invitations/{inviteCode}
**Purpose**: Cancel a pending invitation
**Auth**: Required (JWT, role: Owner|Manager)
**Response**: Success message

## Data Models

### Core Account Model
```typescript
interface Account {
  accountId: string;
  parentAccountId?: string;
  ownerUserId: string;
  name: string;
  company?: string;
  description?: string;
  accountPath: string; // "/parent/child/grandchild"
  level: number; // 0 = root, 1 = child, etc.
  isActive: boolean;
  
  settings: {
    allowSubAccounts: boolean;
    maxSubAccounts: number;
    timezone: string;
    whiteLabel: {
      enabled: boolean;
      logo?: string;
      brandName?: string;
      customDomain?: string;
    };
    notifications: {
      email: boolean;
      jobFailures: boolean;
      storageWarnings: boolean;
      invitations: boolean;
    };
  };
  
  limits: {
    storage: number; // bytes
    sources: number;
    jobs: number;
    apiCalls: number;
  };
  
  usage: {
    storage: {
      used: number;
      limit: number;
    };
    sources: {
      used: number;
      limit: number;
    };
    jobs: {
      used: number;
      limit: number;
    };
    apiCalls: {
      used: number;
      limit: number;
      period: 'monthly' | 'daily';
      resetDate: string;
    };
  };
  
  billing: {
    customerId?: string;
    subscriptionId?: string;
    status: 'free' | 'paid' | 'inherited' | 'suspended';
    plan?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}
```

### User Account Association Model
```typescript
interface UserAccount {
  userId: string;
  accountId: string;
  role: 'Owner' | 'Manager' | 'Viewer';
  status: 'Active' | 'Inactive' | 'Invited';
  
  permissions: {
    canCreateSubAccounts: boolean;
    canInviteUsers: boolean;
    canManageIntegrations: boolean;
    canViewAllData: boolean;
    canManageBilling: boolean;
    canDeleteAccount: boolean;
    canChangeSettings: boolean;
    canViewUsers: boolean;
    canRemoveUsers: boolean;
    canChangeUserRoles: boolean;
  };
  
  linkedAt: number;
  lastAccessedAt?: number;
}
```

### Invitation Model
```typescript
interface Invitation {
  userId: string; // "invite-{code}"
  accountId: string;
  email: string;
  role: 'Owner' | 'Manager' | 'Viewer';
  status: 'Invited';
  permissions: Permissions;
  inviteCode: string; // 6-digit code
  invitedBy: string; // userId of inviter
  expiresAt: number; // timestamp
  createdAt: number;
  message?: string;
}
```

## Frontend API Service Implementation

### Account Service Class
```typescript
// lib/api/account.ts
import { api } from './client';

export class AccountService {
  /**
   * Get all accounts accessible to current user
   */
  async getUserAccounts(): Promise<AccountWithPermissions[]> {
    const response = await api.get('/accounts');
    return response.data;
  }

  /**
   * Get account hierarchy starting from specified account
   */
  async getAccountHierarchy(accountId: string): Promise<AccountHierarchyResponse> {
    const response = await api.get(`/accounts/${accountId}/hierarchy`);
    return response.data;
  }

  /**
   * Create a new sub-account
   */
  async createSubAccount(
    parentAccountId: string,
    data: CreateSubAccountRequest
  ): Promise<Account> {
    const response = await api.post(`/accounts/${parentAccountId}/sub-accounts`, data);
    return response.data;
  }

  /**
   * Switch current account context
   */
  async switchAccount(accountId: string): Promise<AccountSwitchResponse> {
    const response = await api.post('/accounts/switch', { accountId });
    return response.data;
  }

  /**
   * Invite user to account
   */
  async inviteUser(
    accountId: string,
    data: InviteUserRequest
  ): Promise<InviteUserResponse> {
    const response = await api.post(`/accounts/${accountId}/invitations`, data);
    return response.data;
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(inviteCode: string): Promise<AcceptInvitationResponse> {
    const response = await api.post('/invitations/accept', { inviteCode });
    return response.data;
  }

  /**
   * Get pending invitations for account
   */
  async getInvitations(accountId: string): Promise<InvitationWithDetails[]> {
    const response = await api.get(`/accounts/${accountId}/invitations`);
    return response.data;
  }

  /**
   * Cancel pending invitation
   */
  async cancelInvitation(accountId: string, inviteCode: string): Promise<void> {
    await api.delete(`/accounts/${accountId}/invitations/${inviteCode}`);
  }

  /**
   * Update account settings
   */
  async updateAccount(accountId: string, data: Partial<Account>): Promise<Account> {
    const response = await api.put(`/account`, data);
    return response.data;
  }
}

export const accountService = new AccountService();
```

### React Query Hooks

```typescript
// lib/hooks/use-accounts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../api/account';

export function useUserAccounts() {
  return useQuery({
    queryKey: ['accounts', 'user'],
    queryFn: () => accountService.getUserAccounts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAccountHierarchy(accountId: string) {
  return useQuery({
    queryKey: ['accounts', accountId, 'hierarchy'],
    queryFn: () => accountService.getAccountHierarchy(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSubAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ parentAccountId, data }: {
      parentAccountId: string;
      data: CreateSubAccountRequest;
    }) => accountService.createSubAccount(parentAccountId, data),
    onSuccess: (newAccount, { parentAccountId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['accounts', parentAccountId, 'hierarchy']);
    },
  });
}

export function useSwitchAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (accountId: string) => accountService.switchAccount(accountId),
    onSuccess: () => {
      // Invalidate all data queries when switching accounts
      queryClient.invalidateQueries();
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ accountId, data }: {
      accountId: string;
      data: InviteUserRequest;
    }) => accountService.inviteUser(accountId, data),
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries(['invitations', accountId]);
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (inviteCode: string) => accountService.acceptInvitation(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts']);
    },
  });
}

export function useInvitations(accountId: string) {
  return useQuery({
    queryKey: ['invitations', accountId],
    queryFn: () => accountService.getInvitations(accountId),
    enabled: !!accountId,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ accountId, inviteCode }: {
      accountId: string;
      inviteCode: string;
    }) => accountService.cancelInvitation(accountId, inviteCode),
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries(['invitations', accountId]);
    },
  });
}
```

## Error Handling

### API Error Types
```typescript
interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
  statusCode: number;
}

// Common error codes
enum AccountErrorCodes {
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  INVALID_INVITE_CODE = 'INVALID_INVITE_CODE',
  INVITE_EXPIRED = 'INVITE_EXPIRED',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  MAX_SUB_ACCOUNTS_REACHED = 'MAX_SUB_ACCOUNTS_REACHED',
  CIRCULAR_HIERARCHY = 'CIRCULAR_HIERARCHY',
  BILLING_LIMITS_EXCEEDED = 'BILLING_LIMITS_EXCEEDED'
}
```

### Error Handling Strategies
```typescript
// lib/api/error-handler.ts
export function handleAccountError(error: ApiError) {
  switch (error.code) {
    case AccountErrorCodes.INSUFFICIENT_PERMISSIONS:
      return 'You do not have permission to perform this action.';
    case AccountErrorCodes.ACCOUNT_NOT_FOUND:
      return 'The requested account could not be found.';
    case AccountErrorCodes.INVALID_INVITE_CODE:
      return 'The invitation code is invalid or has already been used.';
    case AccountErrorCodes.INVITE_EXPIRED:
      return 'This invitation has expired. Please request a new one.';
    case AccountErrorCodes.USER_ALREADY_EXISTS:
      return 'This user is already associated with the account.';
    case AccountErrorCodes.MAX_SUB_ACCOUNTS_REACHED:
      return 'Maximum number of sub-accounts reached for this plan.';
    case AccountErrorCodes.CIRCULAR_HIERARCHY:
      return 'Cannot create account hierarchy that would result in a circular reference.';
    case AccountErrorCodes.BILLING_LIMITS_EXCEEDED:
      return 'This action would exceed your plan limits. Please upgrade.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}
```

## Caching Strategy

### Query Key Structure
```typescript
// Consistent query key patterns
const queryKeys = {
  accounts: {
    all: ['accounts'] as const,
    user: () => [...queryKeys.accounts.all, 'user'] as const,
    hierarchy: (accountId: string) => [...queryKeys.accounts.all, accountId, 'hierarchy'] as const,
    details: (accountId: string) => [...queryKeys.accounts.all, accountId] as const,
  },
  invitations: {
    all: ['invitations'] as const,
    byAccount: (accountId: string) => [...queryKeys.invitations.all, accountId] as const,
  },
  permissions: {
    all: ['permissions'] as const,
    byAccount: (accountId: string) => [...queryKeys.permissions.all, accountId] as const,
  },
} as const;
```

### Cache Invalidation Rules
```typescript
// lib/hooks/cache-utils.ts
export function invalidateAccountQueries(queryClient: QueryClient, accountId?: string) {
  if (accountId) {
    queryClient.invalidateQueries(['accounts', accountId]);
  } else {
    queryClient.invalidateQueries(['accounts']);
  }
}

export function invalidateInvitationQueries(queryClient: QueryClient, accountId: string) {
  queryClient.invalidateQueries(['invitations', accountId]);
}

export function invalidateAllUserData(queryClient: QueryClient) {
  // Called when switching accounts or logging out
  queryClient.clear();
}
```

## Security Considerations

### Request Headers
All API requests must include:
- `Authorization: Bearer {jwt_token}`
- `X-Account-Context: {current_account_id}` (where applicable)
- `Content-Type: application/json`

### Permission Validation
Frontend should validate permissions before making API calls:
```typescript
function canCreateSubAccount(userPermissions: Permissions): boolean {
  return userPermissions.canCreateSubAccounts;
}

function canInviteUsers(userRole: Role, userPermissions: Permissions): boolean {
  return ['Owner', 'Manager'].includes(userRole) && userPermissions.canInviteUsers;
}
```

### Data Sanitization
Always sanitize user inputs before API calls:
```typescript
function sanitizeAccountName(name: string): string {
  return name.trim().replace(/[<>]/g, '');
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

## Performance Optimization

### Request Batching
Group related API calls when possible:
```typescript
// Instead of multiple individual requests
const accounts = await Promise.all([
  getAccount(id1),
  getAccount(id2),
  getAccount(id3)
]);

// Use batch endpoint when available
const accounts = await getBatchAccounts([id1, id2, id3]);
```

### Optimistic Updates
Update UI immediately for better UX:
```typescript
export function useOptimisticAccountUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateAccount,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['accounts', variables.accountId]);
      
      // Snapshot previous value
      const previousAccount = queryClient.getQueryData(['accounts', variables.accountId]);
      
      // Optimistically update
      queryClient.setQueryData(['accounts', variables.accountId], {
        ...previousAccount,
        ...variables.updates
      });
      
      return { previousAccount };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['accounts', variables.accountId], context?.previousAccount);
    },
    onSettled: (data, error, variables) => {
      // Refetch after mutation
      queryClient.invalidateQueries(['accounts', variables.accountId]);
    },
  });
}
```

### Lazy Loading
Load components only when needed:
```typescript
// Dynamic imports for large components
const AccountHierarchyTree = lazy(() => import('./components/account/hierarchy-tree'));
const InviteUserDialog = lazy(() => import('./components/account/invite-user-dialog'));
```