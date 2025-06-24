'use client';

import React, { useState } from 'react';
import { 
  UserPlusIcon, 
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAccountContext } from '../../lib/providers/account-context-provider';
import type { Role } from '../../types/account';

interface UserInvitationFormProps {
  onInvitationSent?: (invitation: PendingInvitation) => void;
  onCancel?: () => void;
  className?: string;
}

interface InvitationFormData {
  email: string;
  role: Role;
  customMessage?: string;
}

interface PendingInvitation {
  inviteId: string;
  email: string;
  role: Role;
  inviteCode: string;
  expiresAt: string;
  sentAt: string;
}

const roleDescriptions = {
  Owner: 'Full access to account settings, billing, and all data. Can manage all users and sub-accounts.',
  Manager: 'Can manage data sources, users, and view all data. Cannot modify billing or delete account.',
  Viewer: 'Read-only access to data and reports. Cannot modify settings or manage other users.'
};

export function UserInvitationForm({ 
  onInvitationSent, 
  onCancel,
  className = ''
}: UserInvitationFormProps) {
  const { currentAccount, userPermissions } = useAccountContext();
  const [formData, setFormData] = useState<InvitationFormData>({
    email: '',
    role: 'Viewer',
    customMessage: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canInviteUsers = userPermissions?.canInviteUsers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAccount) {
      setError('No account selected');
      return;
    }

    if (!canInviteUsers) {
      setError('You do not have permission to invite users');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call invitation API
      const response = await fetch('/api/accounts/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: currentAccount.accountId,
          email: formData.email,
          role: formData.role,
          customMessage: formData.customMessage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invitation');
      }

      const invitation = await response.json();
      
      setSuccess(`Invitation sent successfully to ${formData.email}`);
      
      // Reset form
      setFormData({
        email: '',
        role: 'Viewer',
        customMessage: ''
      });

      // Notify parent component
      onInvitationSent?.(invitation);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, email: e.target.value }));
    setError(null);
    setSuccess(null);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, role: e.target.value as Role }));
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, customMessage: e.target.value }));
  };

  if (!currentAccount) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <UserPlusIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">Please select an account to invite users</p>
      </div>
    );
  }

  if (!canInviteUsers) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ExclamationTriangleIcon className="h-8 w-8 text-orange-400 mx-auto mb-2" />
        <p className="text-gray-500">You do not have permission to invite users to this account</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center mb-6">
        <UserPlusIcon className="h-6 w-6 text-blue-600 mr-3" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Invite User</h3>
          <p className="text-sm text-gray-500">
            Invite a user to join {currentAccount.name}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleEmailChange}
              required
              placeholder="user@company.com"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            The user will receive an invitation email with a unique invite code
          </p>
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={handleRoleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Viewer">Viewer</option>
            <option value="Manager">Manager</option>
            <option value="Owner">Owner</option>
          </select>
          
          {/* Role Description */}
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{formData.role}:</span> {roleDescriptions[formData.role]}
            </p>
          </div>
        </div>

        {/* Custom Message */}
        <div>
          <label htmlFor="customMessage" className="block text-sm font-medium text-gray-700 mb-1">
            Custom Message (Optional)
          </label>
          <textarea
            id="customMessage"
            value={formData.customMessage}
            onChange={handleMessageChange}
            rows={3}
            placeholder="Add a personal note to the invitation email..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            This message will be included in the invitation email
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !formData.email.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Compact invitation form for modals
export function CompactInvitationForm({ 
  onInvitationSent, 
  onCancel,
  className = ''
}: UserInvitationFormProps) {
  return (
    <div className={className}>
      <UserInvitationForm 
        onInvitationSent={onInvitationSent}
        onCancel={onCancel}
        className="border-0 p-0"
      />
    </div>
  );
}