import { apiClient } from './client';
import type {
  Account,
  AccountWithPermissions,
  AccountHierarchyNode,
  CreateSubAccountRequest,
  InviteUserRequest,
  InviteUserResponse,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  AccountSwitchRequest,
  AccountSwitchResponse,
  InvitationWithDetails,
} from '../types/account';

// Legacy Account interface (keep for backward compatibility)
export interface LegacyAccount {
  accountId: string
  name: string
  email: string
  company?: string
  plan: 'free' | 'starter' | 'professional' | 'enterprise'
  status: 'active' | 'suspended' | 'cancelled'
  stripeCustomerId?: string
  subscription?: {
    id: string
    status: string
    currentPeriodEnd: number
    cancelAtPeriodEnd: boolean
  }
  usage: {
    storage: {
      used: number
      limit: number
      unit: 'bytes'
    }
    bandwidth: {
      used: number
      limit: number
      unit: 'bytes'
    }
    jobs: {
      used: number
      limit: number
    }
    sources: {
      used: number
      limit: number
    }
  }
  settings: {
    timezone?: string
    notifications?: {
      email?: boolean
      webhook?: boolean
    }
    security?: {
      twoFactorEnabled?: boolean
      ipWhitelist?: string[]
    }
  }
  createdAt: number
  updatedAt: number
}

export interface AccountUsage {
  period: {
    start: number
    end: number
  }
  storage: {
    total: number
    bySource: Record<string, number>
    trend: number[]
  }
  bandwidth: {
    total: number
    byOperation: {
      upload: number
      download: number
      sync: number
    }
    trend: number[]
  }
  jobs: {
    total: number
    successful: number
    failed: number
    byType: Record<string, number>
  }
  costs: {
    estimated: number
    breakdown: {
      storage: number
      bandwidth: number
      compute: number
    }
  }
}

export interface UpdateAccountRequest {
  name?: string
  company?: string
  settings?: Partial<Account['settings']>
}

// New Account Service for hierarchical management
export class AccountService {
  /**
   * Get current account details
   */
  async getAccount(): Promise<Account> {
    const response = await apiClient.get<Account>('/account');
    return response.data;
  }

  /**
   * Update current account
   */
  async updateAccount(data: Partial<Account>): Promise<Account> {
    const response = await apiClient.put<Account>('/account', data);
    return response.data;
  }

  /**
   * Get all accounts accessible to current user
   */
  async getUserAccounts(): Promise<AccountWithPermissions[]> {
    const response = await apiClient.get<AccountWithPermissions[]>('/accounts');
    return response.data;
  }

  /**
   * Get account hierarchy starting from specified account
   */
  async getAccountHierarchy(accountId: string): Promise<AccountHierarchyNode> {
    const response = await apiClient.get<AccountHierarchyNode>(`/accounts/${accountId}/hierarchy`);
    return response.data;
  }

  /**
   * Create a new sub-account
   */
  async createSubAccount(
    parentAccountId: string,
    data: CreateSubAccountRequest
  ): Promise<Account> {
    const response = await apiClient.post<Account>(`/accounts/${parentAccountId}/sub-accounts`, data);
    return response.data;
  }

  /**
   * Switch current account context
   */
  async switchAccount(accountId: string): Promise<AccountSwitchResponse> {
    const response = await apiClient.post<AccountSwitchResponse>('/accounts/switch', { accountId });
    return response.data;
  }

  /**
   * Invite user to account
   */
  async inviteUser(
    accountId: string,
    data: InviteUserRequest
  ): Promise<InviteUserResponse> {
    const response = await apiClient.post<InviteUserResponse>(`/accounts/${accountId}/invitations`, data);
    return response.data;
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(inviteCode: string): Promise<AcceptInvitationResponse> {
    const response = await apiClient.post<AcceptInvitationResponse>('/invitations/accept', { inviteCode });
    return response.data;
  }

  /**
   * Get pending invitations for account
   */
  async getInvitations(accountId: string): Promise<InvitationWithDetails[]> {
    const response = await apiClient.get<InvitationWithDetails[]>(`/accounts/${accountId}/invitations`);
    return response.data;
  }

  /**
   * Cancel pending invitation
   */
  async cancelInvitation(accountId: string, inviteCode: string): Promise<void> {
    await apiClient.delete(`/accounts/${accountId}/invitations/${inviteCode}`);
  }
}

// Legacy API (keep for backward compatibility) plus new methods
export const accountApi = {
  get: async () => {
    const response = await apiClient.get<LegacyAccount>('/account')
    return response.data
  },

  update: async (data: UpdateAccountRequest) => {
    const response = await apiClient.put<LegacyAccount>('/account', data)
    return response.data
  },

  updateProfile: async (data: { firstName: string; lastName: string; email: string }) => {
    const response = await apiClient.put<LegacyAccount>('/account/profile', data)
    return response.data
  },

  updatePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await apiClient.put('/account/password', data)
    return response.data
  },

  getUsage: async (period?: 'day' | 'week' | 'month' | 'year') => {
    const response = await apiClient.get<AccountUsage>('/account/usage', {
      params: { period }
    })
    return response.data
  },

  getBilling: async () => {
    const response = await apiClient.get('/account/billing')
    return response.data
  },

  createBillingSession: async () => {
    const response = await apiClient.post('/account/billing/session')
    return response.data
  },

  cancelSubscription: async () => {
    const response = await apiClient.post('/account/billing/cancel')
    return response.data
  },

  // New methods for hierarchical accounts
  getHierarchy: async (accountId: string) => {
    const response = await apiClient.get(`/accounts/${accountId}/hierarchy`)
    return response.data
  },

  createSubAccount: async (data: any) => {
    const response = await apiClient.post(`/accounts/${data.parentAccountId}/sub-accounts`, data)
    return response.data
  },

  getSettings: async (accountId: string) => {
    const response = await apiClient.get(`/accounts/${accountId}/settings`)
    return response.data
  },

  updateSettings: async (accountId: string, data: any) => {
    const response = await apiClient.put(`/accounts/${accountId}/settings`, data)
    return response.data
  },

  delete: async (accountId: string) => {
    const response = await apiClient.delete(`/accounts/${accountId}`)
    return response.data
  },

  // Enable 2FA
  enable2FA: async () => {
    const response = await apiClient.post('/account/2fa/enable')
    return response.data
  },

  // Verify 2FA
  verify2FA: async (data: { code: string }) => {
    const response = await apiClient.post('/account/2fa/verify', data)
    return response.data
  },

  // Disable 2FA
  disable2FA: async (data: { password: string }) => {
    const response = await apiClient.post('/account/2fa/disable', data)
    return response.data
  },

  // Get backup codes
  getBackupCodes: async () => {
    const response = await apiClient.get('/account/2fa/backup-codes')
    return response.data
  },

  // Regenerate backup codes
  regenerateBackupCodes: async () => {
    const response = await apiClient.post('/account/2fa/backup-codes/regenerate')
    return response.data
  },

  // Get sessions
  getSessions: async () => {
    const response = await apiClient.get('/account/sessions')
    return response.data
  },

  // Revoke session
  revokeSession: async (sessionId: string) => {
    const response = await apiClient.delete(`/account/sessions/${sessionId}`)
    return response.data
  },
}

// New service instance
export const accountService = new AccountService();

// Export types
export type { Account, AccountWithPermissions } from '../types/account';