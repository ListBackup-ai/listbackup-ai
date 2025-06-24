# Frontend Components Documentation

## Overview
This document outlines the frontend components required for the hierarchical account management system, following the wireframes and user experience patterns established in the wireframes.md file.

## Component Architecture

### Account Management Components

#### 1. AccountSwitcher Component
**Location**: `components/account/account-switcher.tsx`
**Purpose**: Dropdown component for switching between accounts

```typescript
interface AccountSwitcherProps {
  currentAccount: Account;
  availableAccounts: Account[];
  onAccountSwitch: (accountId: string) => Promise<void>;
  showHierarchy?: boolean;
}
```

**Features**:
- Hierarchical account display with indentation
- Search/filter functionality for large account lists
- Quick access to frequently used accounts
- Create sub-account action
- Account status indicators

#### 2. AccountHierarchyTree Component
**Location**: `components/account/hierarchy-tree.tsx`
**Purpose**: Visual tree representation of account hierarchy

```typescript
interface AccountHierarchyTreeProps {
  account: Account;
  expandedNodes: string[];
  onNodeToggle: (accountId: string) => void;
  onAccountSelect: (accountId: string) => void;
  showActions?: boolean;
}
```

**Features**:
- Collapsible tree structure
- Usage indicators (storage, users, sources)
- Quick action buttons (settings, users, stats)
- Drag-and-drop for reorganization (future)
- Context menu for account actions

#### 3. CreateSubAccountDialog Component
**Location**: `components/account/create-sub-account-dialog.tsx`
**Purpose**: Modal dialog for creating new sub-accounts

```typescript
interface CreateSubAccountDialogProps {
  parentAccount: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountCreated: (account: Account) => void;
}
```

**Features**:
- Form validation for account details
- Inherit settings from parent account
- Preview of account hierarchy placement
- White-label settings configuration
- Permission template selection

#### 4. AccountBreadcrumb Component
**Location**: `components/account/account-breadcrumb.tsx`
**Purpose**: Navigation breadcrumb showing account hierarchy path

```typescript
interface AccountBreadcrumbProps {
  accountPath: Account[];
  onAccountSelect: (accountId: string) => void;
  showSwitcher?: boolean;
}
```

**Features**:
- Clickable hierarchy path
- Account switcher integration
- Mobile-responsive design
- Current account highlighting

### User Management Components

#### 5. InviteUserDialog Component
**Location**: `components/account/invite-user-dialog.tsx`
**Purpose**: Modal for inviting users to accounts

```typescript
interface InviteUserDialogProps {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserInvited: (invitation: Invitation) => void;
}
```

**Features**:
- Email validation and suggestions
- Role selection with permission preview
- Custom permission configuration
- Invitation message customization
- Bulk invite support (future)

#### 6. PendingInvitationsList Component
**Location**: `components/account/pending-invitations-list.tsx`
**Purpose**: List of pending invitations with management actions

```typescript
interface PendingInvitationsListProps {
  accountId: string;
  invitations: Invitation[];
  onInvitationCancelled: (inviteCode: string) => void;
  onInvitationResent: (inviteCode: string) => void;
}
```

**Features**:
- Invitation status tracking
- Resend functionality
- Cancel/revoke invitations
- Expiration date display
- Invited by information

#### 7. AcceptInvitationPage Component
**Location**: `app/auth/accept-invitation/page.tsx`
**Purpose**: Public page for accepting invitations

```typescript
interface AcceptInvitationPageProps {
  searchParams: {
    code?: string;
    email?: string;
  };
}
```

**Features**:
- Invitation code input/validation
- Account and role information display
- Permission details preview
- Accept/decline actions
- Login/registration integration

#### 8. UserRoleManager Component
**Location**: `components/account/user-role-manager.tsx`
**Purpose**: Manage user roles and permissions within accounts

```typescript
interface UserRoleManagerProps {
  accountId: string;
  users: UserAccount[];
  onRoleChanged: (userId: string, role: Role) => void;
  onPermissionsChanged: (userId: string, permissions: Permissions) => void;
  onUserRemoved: (userId: string) => void;
}
```

**Features**:
- Role assignment interface
- Permission matrix view
- User removal confirmation
- Bulk role operations
- Activity history per user

### Navigation and Context Components

#### 9. AccountContextProvider Component
**Location**: `lib/providers/account-context-provider.tsx`
**Purpose**: React context for managing account state

```typescript
interface AccountContextValue {
  currentAccount: Account | null;
  availableAccounts: Account[];
  userRole: Role | null;
  userPermissions: Permissions | null;
  switchAccount: (accountId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  canCreateSubAccounts: boolean;
  canInviteUsers: boolean;
  canManageIntegrations: boolean;
}
```

#### 10. ProtectedAccountRoute Component
**Location**: `components/auth/protected-account-route.tsx`
**Purpose**: Route protection based on account permissions

```typescript
interface ProtectedAccountRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requiredRole?: Role;
  fallback?: React.ReactNode;
}
```

### Utility Components

#### 11. AccountStatusBadge Component
**Location**: `components/account/account-status-badge.tsx`
**Purpose**: Visual indicator for account status

```typescript
interface AccountStatusBadgeProps {
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}
```

#### 12. PermissionChecker Component
**Location**: `components/account/permission-checker.tsx`
**Purpose**: Conditional rendering based on permissions

```typescript
interface PermissionCheckerProps {
  children: React.ReactNode;
  permission?: Permission;
  role?: Role;
  accountId?: string;
  fallback?: React.ReactNode;
}
```

## API Integration

### Account Context Hooks

#### useAccountContext Hook
**Location**: `lib/hooks/use-account-context.ts`

```typescript
export function useAccountContext() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccountContext must be used within AccountContextProvider');
  }
  return context;
}
```

#### useAccountHierarchy Hook
**Location**: `lib/hooks/use-account-hierarchy.ts`

```typescript
export function useAccountHierarchy(accountId: string) {
  return useQuery({
    queryKey: ['account-hierarchy', accountId],
    queryFn: () => api.getAccountHierarchy(accountId),
    enabled: !!accountId
  });
}
```

#### useInvitations Hook
**Location**: `lib/hooks/use-invitations.ts`

```typescript
export function useInvitations(accountId: string) {
  return useQuery({
    queryKey: ['invitations', accountId],
    queryFn: () => api.getInvitations(accountId),
    enabled: !!accountId
  });
}
```

### API Service Updates

#### Account Service
**Location**: `lib/api/account.ts`

```typescript
class AccountService {
  // Existing methods...
  
  async getUserAccounts(): Promise<Account[]>
  async getAccountHierarchy(accountId: string): Promise<AccountTree>
  async createSubAccount(parentId: string, data: CreateSubAccountRequest): Promise<Account>
  async switchAccount(accountId: string): Promise<AccountSwitchResponse>
  async inviteUser(accountId: string, data: InviteUserRequest): Promise<Invitation>
  async acceptInvitation(inviteCode: string): Promise<Account>
  async getInvitations(accountId: string): Promise<Invitation[]>
  async cancelInvitation(accountId: string, inviteCode: string): Promise<void>
}
```

## Component Integration Plan

### Phase 1: Core Account Context
1. **AccountContextProvider** - Global account state management
2. **AccountSwitcher** - Basic account switching functionality
3. **AccountBreadcrumb** - Navigation breadcrumb
4. **ProtectedAccountRoute** - Permission-based routing

### Phase 2: Account Management
1. **AccountHierarchyTree** - Visual hierarchy display
2. **CreateSubAccountDialog** - Sub-account creation
3. **AccountStatusBadge** - Status indicators
4. **PermissionChecker** - Conditional rendering

### Phase 3: User Invitation System
1. **InviteUserDialog** - User invitation interface
2. **PendingInvitationsList** - Invitation management
3. **AcceptInvitationPage** - Public invitation acceptance
4. **UserRoleManager** - Role and permission management

### Phase 4: Advanced Features
1. **Enhanced permissions** - Granular permission controls
2. **Activity tracking** - User action logging
3. **White-label support** - Custom branding
4. **Mobile optimization** - Responsive design improvements

## Design System Integration

### Color Scheme
- **Primary**: Blue (#2563eb) - Account actions and primary buttons
- **Success**: Green (#10b981) - Active accounts and success states
- **Warning**: Orange (#f59e0b) - Pending invitations and warnings
- **Error**: Red (#ef4444) - Inactive accounts and errors
- **Neutral**: Gray (#6b7280) - Secondary text and borders

### Typography
- **Account Names**: font-semibold text-gray-900
- **Hierarchy Levels**: Indented with visual connectors
- **Status Text**: font-medium with color coding
- **Permissions**: font-mono text-sm for technical details

### Spacing
- **Account Tree**: 16px indentation per level
- **Component Margins**: 16px vertical, 24px horizontal
- **Card Padding**: 24px for main content, 16px for compact views
- **Button Spacing**: 8px between related actions

### Mobile Responsive Design
- **Breakpoints**: 
  - Mobile: < 640px (stacked layout)
  - Tablet: 640px - 1024px (simplified hierarchy)
  - Desktop: > 1024px (full feature set)

- **Mobile Adaptations**:
  - Collapsible account switcher
  - Horizontal scrolling for hierarchy
  - Full-screen dialogs for forms
  - Touch-friendly tap targets (44px min)

## Accessibility Requirements

### ARIA Labels
- Account hierarchy tree with proper ARIA tree role
- Account switcher with ARIA listbox
- Permission indicators with ARIA descriptions
- Form fields with proper labeling

### Keyboard Navigation
- Tab order through account hierarchy
- Arrow key navigation in account tree
- Escape key to close dialogs
- Enter/Space for account selection

### Screen Reader Support
- Descriptive alt text for status icons
- Announcement of account switches
- Clear indication of permission levels
- Progress feedback for async operations

## Testing Strategy

### Unit Tests
- Component rendering with various props
- User interaction handlers
- Permission checking logic
- API integration methods

### Integration Tests
- Account switching workflow
- User invitation flow
- Permission enforcement
- Hierarchy navigation

### E2E Tests
- Complete account management workflow
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance

## Performance Considerations

### Code Splitting
- Lazy load account management components
- Dynamic imports for large dialogs
- Tree shaking for unused permissions

### Caching Strategy
- Account hierarchy caching (5 minutes)
- User permissions caching (session-based)
- Optimistic updates for UI responsiveness

### Bundle Size
- Tree-shake unused account utilities
- Optimize component re-renders
- Minimize prop drilling with context