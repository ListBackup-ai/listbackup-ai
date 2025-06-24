'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  XMarkIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarIcon,
  TrashIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { useAccountContext } from '../../lib/providers/account-context-provider';
import type { Role } from '../../types/account';

interface PendingInvitationsProps {
  onInvitationCanceled?: (inviteId: string) => void;
  className?: string;
}

interface PendingInvitation {
  inviteId: string;
  email: string;
  role: Role;
  inviteCode: string;
  status: 'pending' | 'expired' | 'accepted' | 'canceled';
  expiresAt: string;
  sentAt: string;
  lastReminderAt?: string;
  invitedBy: {
    userId: string;
    name: string;
  };
}

const roleColors = {
  Owner: 'bg-red-100 text-red-800',
  Manager: 'bg-blue-100 text-blue-800',
  Viewer: 'bg-gray-100 text-gray-800'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800',
  accepted: 'bg-green-100 text-green-800',
  canceled: 'bg-gray-100 text-gray-800'
};

function InvitationCard({ 
  invitation, 
  onCancel, 
  onResend, 
  onCopyLink 
}: { 
  invitation: PendingInvitation;
  onCancel: (inviteId: string) => void;
  onResend: (inviteId: string) => void;
  onCopyLink: (inviteCode: string) => void;
}) {
  const expiresAt = new Date(invitation.expiresAt);
  const sentAt = new Date(invitation.sentAt);
  const isExpired = expiresAt < new Date();
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-150">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center">
              <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-900 truncate">
                {invitation.email}
              </span>
            </div>
            
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[invitation.role]}`}>
              {invitation.role}
            </span>
            
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[invitation.status]}`}>
              {invitation.status}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex items-center">
              <UserIcon className="h-3 w-3 mr-1" />
              <span>Invited by {invitation.invitedBy.name}</span>
            </div>
            
            <div className="flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>Sent {sentAt.toLocaleDateString()}</span>
              {invitation.lastReminderAt && (
                <span className="ml-2">
                  • Reminded {new Date(invitation.lastReminderAt).toLocaleDateString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center">
              <ClockIcon className="h-3 w-3 mr-1" />
              {isExpired ? (
                <span className="text-red-600">Expired {expiresAt.toLocaleDateString()}</span>
              ) : (
                <span>
                  Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} ({expiresAt.toLocaleDateString()})
                </span>
              )}
            </div>

            {/* Invite Code */}
            <div className="flex items-center mt-2 p-2 bg-gray-50 rounded">
              <span className="text-xs font-mono text-gray-600 mr-2">
                Code: {invitation.inviteCode}
              </span>
              <button
                onClick={() => onCopyLink(invitation.inviteCode)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy invite link"
              >
                <DocumentDuplicateIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {invitation.status === 'pending' && !isExpired && (
            <button
              onClick={() => onResend(invitation.inviteId)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Resend invitation"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          )}
          
          {(invitation.status === 'pending' || invitation.status === 'expired') && (
            <button
              onClick={() => onCancel(invitation.inviteId)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Cancel invitation"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PendingInvitations({ 
  onInvitationCanceled,
  className = ''
}: PendingInvitationsProps) {
  const { currentAccount, userPermissions } = useAccountContext();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'expired'>('all');

  const canViewInvitations = userPermissions?.canInviteUsers || userPermissions?.canViewUsers;

  useEffect(() => {
    if (currentAccount && canViewInvitations) {
      loadInvitations();
    }
  }, [currentAccount, canViewInvitations]);

  const loadInvitations = async () => {
    if (!currentAccount) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounts/${currentAccount.accountId}/invitations`);
      
      if (!response.ok) {
        throw new Error('Failed to load invitations');
      }

      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvitation = async (inviteId: string) => {
    if (!currentAccount) return;

    try {
      const response = await fetch(`/api/accounts/${currentAccount.accountId}/invitations/${inviteId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to cancel invitation');
      }

      // Remove from local state
      setInvitations(prev => prev.filter(inv => inv.inviteId !== inviteId));
      onInvitationCanceled?.(inviteId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (inviteId: string) => {
    if (!currentAccount) return;

    try {
      const response = await fetch(`/api/accounts/${currentAccount.accountId}/invitations/${inviteId}/resend`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to resend invitation');
      }

      // Reload invitations to get updated data
      await loadInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend invitation');
    }
  };

  const handleCopyInviteLink = async (inviteCode: string) => {
    const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      // You could show a toast notification here
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const filteredInvitations = invitations.filter(invitation => {
    if (filter === 'all') return true;
    if (filter === 'pending') return invitation.status === 'pending' && new Date(invitation.expiresAt) > new Date();
    if (filter === 'expired') return invitation.status === 'expired' || new Date(invitation.expiresAt) <= new Date();
    return true;
  });

  if (!currentAccount) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ClockIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">Please select an account to view invitations</p>
      </div>
    );
  }

  if (!canViewInvitations) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ClockIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">You do not have permission to view invitations</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pending Invitations</h3>
              <p className="text-sm text-gray-500">
                Manage invitation status for {currentAccount.name}
              </p>
            </div>
          </div>
          
          <button
            onClick={loadInvitations}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh invitations"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 flex space-x-1">
          {(['all', 'pending', 'expired'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === filterOption
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {filterOption === 'all' ? 'All' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              {filterOption !== 'all' && (
                <span className="ml-1 text-xs">
                  ({invitations.filter(inv => {
                    if (filterOption === 'pending') return inv.status === 'pending' && new Date(inv.expiresAt) > new Date();
                    if (filterOption === 'expired') return inv.status === 'expired' || new Date(inv.expiresAt) <= new Date();
                    return true;
                  }).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <ArrowPathIcon className="h-8 w-8 text-gray-300 mx-auto mb-2 animate-spin" />
            <p className="text-gray-500">Loading invitations...</p>
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'No invitations found' 
                : `No ${filter} invitations found`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvitations.map((invitation) => (
              <InvitationCard
                key={invitation.inviteId}
                invitation={invitation}
                onCancel={handleCancelInvitation}
                onResend={handleResendInvitation}
                onCopyLink={handleCopyInviteLink}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}