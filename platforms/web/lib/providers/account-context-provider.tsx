'use client';

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { accountService } from '../api/account';
import type {
  Account,
  AccountWithPermissions,
  Role,
  Permissions,
  AccountContextState,
} from '../../types/account';

interface AccountContextValue extends AccountContextState {
  switchAccount: (accountId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  canCreateSubAccounts: boolean;
  canInviteUsers: boolean;
  canManagePlatforms: boolean;
  canManageBilling: boolean;
  canViewUsers: boolean;
  canRemoveUsers: boolean;
  canChangeUserRoles: boolean;
}

type AccountAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACCOUNTS'; payload: AccountWithPermissions[] }
  | { type: 'SET_CURRENT_ACCOUNT'; payload: { account: Account; role: Role; permissions: Permissions } }
  | { type: 'CLEAR_ACCOUNT' };

const initialState: AccountContextState = {
  currentAccount: null,
  availableAccounts: [],
  userRole: null,
  userPermissions: null,
  isLoading: false,
  error: null,
};

function accountReducer(state: AccountContextState, action: AccountAction): AccountContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_ACCOUNTS':
      return { ...state, availableAccounts: action.payload, isLoading: false };
    case 'SET_CURRENT_ACCOUNT':
      return {
        ...state,
        currentAccount: action.payload.account,
        userRole: action.payload.role,
        userPermissions: action.payload.permissions,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ACCOUNT':
      return {
        ...state,
        currentAccount: null,
        userRole: null,
        userPermissions: null,
      };
    default:
      return state;
  }
}

const AccountContext = createContext<AccountContextValue | null>(null);

interface AccountContextProviderProps {
  children: React.ReactNode;
}

export function AccountContextProvider({ children }: AccountContextProviderProps) {
  const [state, dispatch] = useReducer(accountReducer, initialState);
  const queryClient = useQueryClient();

  // Load account context from localStorage on mount
  useEffect(() => {
    const savedAccountId = localStorage.getItem('currentAccountId');
    if (savedAccountId) {
      // Try to restore account context
      loadAccounts().then(() => {
        const account = state.availableAccounts.find(acc => acc.accountId === savedAccountId);
        if (account) {
          dispatch({
            type: 'SET_CURRENT_ACCOUNT',
            payload: {
              account,
              role: account.userRole,
              permissions: account.userPermissions,
            },
          });
        }
      });
    } else {
      loadAccounts();
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const accounts = await accountService.getUserAccounts();
      dispatch({ type: 'SET_ACCOUNTS', payload: accounts });

      // If no current account is set and there are accounts available, set the first one
      if (!state.currentAccount && accounts.length > 0) {
        const firstAccount = accounts[0];
        dispatch({
          type: 'SET_CURRENT_ACCOUNT',
          payload: {
            account: firstAccount,
            role: firstAccount.userRole,
            permissions: firstAccount.userPermissions,
          },
        });
        localStorage.setItem('currentAccountId', firstAccount.accountId);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load accounts' });
    }
  }, [state.currentAccount]);

  const switchAccount = useCallback(async (accountId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Call the switch account API
      const switchResponse = await accountService.switchAccount(accountId);
      
      // Update the current account in context
      dispatch({
        type: 'SET_CURRENT_ACCOUNT',
        payload: {
          account: switchResponse.account,
          role: switchResponse.userRole,
          permissions: switchResponse.userPermissions,
        },
      });

      // Save to localStorage
      localStorage.setItem('currentAccountId', accountId);

      // Invalidate all queries to refetch with new account context
      await queryClient.invalidateQueries();
      
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to switch account:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to switch account' });
    }
  }, [queryClient]);

  const refreshAccounts = useCallback(async () => {
    await loadAccounts();
  }, [loadAccounts]);

  // Permission helper functions
  const canCreateSubAccounts = state.userPermissions?.canCreateSubAccounts ?? false;
  const canInviteUsers = state.userPermissions?.canInviteUsers ?? false;
  const canManagePlatforms = state.userPermissions?.canManagePlatforms ?? false;
  const canManageBilling = state.userPermissions?.canManageBilling ?? false;
  const canViewUsers = state.userPermissions?.canViewUsers ?? false;
  const canRemoveUsers = state.userPermissions?.canRemoveUsers ?? false;
  const canChangeUserRoles = state.userPermissions?.canChangeUserRoles ?? false;

  const contextValue: AccountContextValue = {
    ...state,
    switchAccount,
    refreshAccounts,
    canCreateSubAccounts,
    canInviteUsers,
    canManagePlatforms,
    canManageBilling,
    canViewUsers,
    canRemoveUsers,
    canChangeUserRoles,
  };

  return (
    <AccountContext.Provider value={contextValue}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccountContext(): AccountContextValue {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccountContext must be used within an AccountContextProvider');
  }
  return context;
}

// Helper hook for checking specific permissions
export function usePermissions() {
  const { userPermissions, userRole } = useAccountContext();
  
  return {
    permissions: userPermissions,
    role: userRole,
    hasPermission: (permission: keyof Permissions) => userPermissions?.[permission] ?? false,
    isOwner: userRole === 'Owner',
    isManager: userRole === 'Manager',
    isViewer: userRole === 'Viewer',
    canManage: userRole === 'Owner' || userRole === 'Manager',
  };
}

// Helper hook for account hierarchy utilities
export function useAccountHelpers() {
  const { currentAccount, availableAccounts } = useAccountContext();
  
  const getAccountPath = useCallback((account: Account = currentAccount!) => {
    if (!account) return [];
    
    const pathSegments = account.accountPath.split('/').filter(Boolean);
    return pathSegments.map(accountId => {
      const foundAccount = availableAccounts.find(acc => acc.accountId === accountId);
      return {
        accountId,
        name: foundAccount?.name || 'Unknown Account',
        level: pathSegments.indexOf(accountId),
      };
    });
  }, [currentAccount, availableAccounts]);

  const isChildAccount = useCallback((childAccountId: string, parentAccountId: string) => {
    const childAccount = availableAccounts.find(acc => acc.accountId === childAccountId);
    return childAccount?.accountPath.includes(parentAccountId) ?? false;
  }, [availableAccounts]);

  const getChildAccounts = useCallback((parentAccountId: string) => {
    return availableAccounts.filter(acc => acc.parentAccountId === parentAccountId);
  }, [availableAccounts]);

  return {
    getAccountPath,
    isChildAccount,
    getChildAccounts,
  };
}