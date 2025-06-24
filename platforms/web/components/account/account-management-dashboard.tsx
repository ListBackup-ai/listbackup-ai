'use client';

import React, { useState } from 'react';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  Cog6ToothIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAccountContext, useAccountHelpers } from '../../lib/providers/account-context-provider';
import { AccountHierarchyTree } from './account-hierarchy-tree';
import { AccountBreadcrumb } from './account-breadcrumb';
import type { Account } from '../../types/account';

interface AccountManagementDashboardProps {
  className?: string;
}

interface AccountOverviewCardProps {
  account: Account;
}

function AccountOverviewCard({ account }: AccountOverviewCardProps) {
  const { userPermissions, availableAccounts } = useAccountContext();
  const permissions = userPermissions;
  
  // Find parent account name
  const parentAccount = account.parentAccountId 
    ? availableAccounts.find(acc => acc.accountId === account.parentAccountId)
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mr-3" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{account.name}</h2>
            {account.company && (
              <p className="text-sm text-gray-500">{account.company}</p>
            )}
          </div>
        </div>
        
        {permissions?.canChangeSettings && (
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150">
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <UsersIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Storage</p>
          <p className="text-lg font-semibold text-gray-900">
            {Math.round((account.usage?.storage?.used || 0) / 1024 / 1024 / 1024)}GB
          </p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <ChartBarIcon className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Sources</p>
          <p className="text-lg font-semibold text-gray-900">
            {account.usage?.sources?.used || 0}
          </p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <ClockIcon className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Jobs</p>
          <p className="text-lg font-semibold text-gray-900">
            {account.usage?.jobs?.used || 0}
          </p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <BuildingOfficeIcon className="h-6 w-6 text-orange-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">API Calls</p>
          <p className="text-lg font-semibold text-gray-900">
            {account.usage?.apiCalls?.used || 0}
          </p>
        </div>
      </div>

      {/* Account Info */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Plan:</span>
          <span className="text-sm font-medium text-gray-900 capitalize">
            {account.billing?.plan || 'Free'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`text-sm font-medium ${account.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {account.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Created:</span>
          <span className="text-sm text-gray-900">
            {new Date(account.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        {parentAccount && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Parent Account:</span>
            <span className="text-sm text-gray-900">
              {parentAccount.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface QuickActionsProps {
  account: Account;
}

function QuickActions({ account }: QuickActionsProps) {
  const { userPermissions } = useAccountContext();
  const permissions = userPermissions;

  const actions = [
    {
      label: 'Add Data Source',
      icon: PlusIcon,
      href: '/dashboard/sources',
      available: permissions?.canManagePlatforms,
      color: 'blue'
    },
    {
      label: 'Invite User',
      icon: UsersIcon,
      href: '/dashboard/users/invite',
      available: permissions?.canInviteUsers,
      color: 'green'
    },
    {
      label: 'Create Sub-Account',
      icon: BuildingOfficeIcon,
      href: '/dashboard/accounts/create',
      available: permissions?.canCreateSubAccounts,
      color: 'purple'
    },
    {
      label: 'Account Settings',
      icon: Cog6ToothIcon,
      href: '/dashboard/accounts/settings',
      available: permissions?.canChangeSettings,
      color: 'gray'
    }
  ];

  const availableActions = actions.filter(action => action.available);

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availableActions.map((action) => {
          const colorClasses = {
            blue: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
            green: 'text-green-600 bg-green-50 hover:bg-green-100',
            purple: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
            gray: 'text-gray-600 bg-gray-50 hover:bg-gray-100'
          };

          return (
            <button
              key={action.label}
              className={`
                flex items-center p-3 rounded-lg transition-colors duration-150
                ${colorClasses[action.color as keyof typeof colorClasses]}
              `}
            >
              <action.icon className="h-5 w-5 mr-3" />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AccountManagementDashboard({ className = '' }: AccountManagementDashboardProps) {
  const { currentAccount, availableAccounts } = useAccountContext();
  const [selectedView, setSelectedView] = useState<'overview' | 'hierarchy'>('overview');

  if (!currentAccount) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <BuildingOfficeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Account Selected</h3>
        <p className="text-gray-500">Please select an account to view its management dashboard.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
          <div className="mt-1 text-sm text-muted-foreground">Account Management</div>
        </div>

        {/* View Toggle */}
        <div className="mt-4 sm:mt-0">
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => setSelectedView('overview')}
              className={`
                px-4 py-2 text-sm font-medium rounded-l-lg transition-colors duration-150
                ${selectedView === 'overview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedView('hierarchy')}
              className={`
                px-4 py-2 text-sm font-medium rounded-r-lg transition-colors duration-150
                ${selectedView === 'hierarchy' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              Hierarchy
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {selectedView === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Overview */}
          <div className="lg:col-span-2">
            <AccountOverviewCard account={currentAccount} />
          </div>

          {/* Quick Actions */}
          <div>
            <QuickActions account={currentAccount} />
          </div>

          {/* Recent Activity - Placeholder for future implementation */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Activity tracking coming soon</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Hierarchy Tree */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Hierarchy</h3>
              <AccountHierarchyTree hierarchy={[]} currentAccountId="" />
            </div>
          </div>

          {/* Account Summary */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Accounts:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {availableAccounts.length}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Root Accounts:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {availableAccounts.filter(acc => !acc.parentAccountId).length}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sub-Accounts:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {availableAccounts.filter(acc => acc.parentAccountId).length}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Depth:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.max(...availableAccounts.map(acc => acc.level || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}