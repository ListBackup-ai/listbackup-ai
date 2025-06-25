// Account Management Types

export interface Account {
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

export interface Permissions {
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
}

export type Role = 'Owner' | 'Manager' | 'Viewer';

export interface UserAccount {
  userId: string;
  accountId: string;
  role: Role;
  status: 'Active' | 'Inactive' | 'Invited';
  permissions: Permissions;
  linkedAt: number;
  lastAccessedAt?: number;
}

export interface AccountWithPermissions extends Account {
  userRole: Role;
  userStatus: 'Active' | 'Inactive' | 'Invited';
  userPermissions: Permissions;
}

export interface AccountHierarchyNode {
  account: Account;
  children?: AccountHierarchyNode[];
  metadata: {
    totalDescendants: number;
    maxDepth: number;
    userCount: number;
    sourceCount: number;
  };
}

export interface Invitation {
  userId: string; // "invite-{code}"
  accountId: string;
  email: string;
  role: Role;
  status: 'Invited';
  permissions: Permissions;
  inviteCode: string; // 6-digit code
  invitedBy: string; // userId of inviter
  expiresAt: number; // timestamp
  createdAt: number;
  message?: string;
}

export interface InvitationWithDetails extends Invitation {
  inviterName: string;
  inviterEmail: string;
  daysUntilExpiry: number;
}

// API Request/Response Types
export interface CreateSubAccountRequest {
  name: string;
  company?: string;
  description?: string;
  settings?: Partial<Account['settings']>;
  limits?: Partial<Account['limits']>;
}

export interface InviteUserRequest {
  email: string;
  role: Role;
  permissions?: Partial<Permissions>;
  message?: string;
}

export interface InviteUserResponse {
  message: string;
  inviteCode: string;
  email: string;
  role: string;
  expiresAt: number;
}

export interface AcceptInvitationRequest {
  inviteCode: string;
}

export interface AcceptInvitationResponse {
  message: string;
  account: Account;
  userRole: Role;
  userPermissions: Permissions;
}

export interface AccountSwitchRequest {
  accountId: string;
}

export interface AccountSwitchResponse {
  account: Account;
  userRole: Role;
  userPermissions: Permissions;
  switchedAt: string;
}

// UI State Types
export interface AccountContextState {
  currentAccount: Account | null;
  availableAccounts: AccountWithPermissions[];
  userRole: Role | null;
  userPermissions: Permissions | null;
  isLoading: boolean;
  error: string | null;
}

export interface AccountTreeNode {
  account: Account;
  children: AccountTreeNode[];
  isExpanded: boolean;
  level: number;
}

// Utility Types
export type Permission = keyof Permissions;

export interface AccountBreadcrumbItem {
  accountId: string;
  name: string;
  level: number;
}

export interface AccountUsageStats {
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  sources: {
    used: number;
    total: number;
    percentage: number;
  };
  users: {
    active: number;
    invited: number;
    total: number;
  };
}

// Error Types
export enum AccountErrorCodes {
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  INVALID_INVITE_CODE = 'INVALID_INVITE_CODE',
  INVITE_EXPIRED = 'INVITE_EXPIRED',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  MAX_SUB_ACCOUNTS_REACHED = 'MAX_SUB_ACCOUNTS_REACHED',
  CIRCULAR_HIERARCHY = 'CIRCULAR_HIERARCHY',
  BILLING_LIMITS_EXCEEDED = 'BILLING_LIMITS_EXCEEDED'
}

export interface AccountError {
  message: string;
  code: AccountErrorCodes;
  details?: Record<string, any>;
  statusCode: number;
}