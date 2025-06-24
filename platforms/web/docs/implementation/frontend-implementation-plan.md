# Frontend Implementation Plan

## Overview
This document outlines the step-by-step implementation plan for the hierarchical account management frontend components, following the wireframes and technical specifications.

## Implementation Phases

### Phase 1: Foundation (2-3 days)
**Goal**: Establish core account context and basic navigation

#### 1.1 Account Context Provider
**Files to Create**:
- `lib/providers/account-context-provider.tsx`
- `lib/hooks/use-account-context.ts`
- `types/account.ts`

**Implementation Steps**:
1. Define TypeScript interfaces for Account, UserAccount, Permissions
2. Create React context for account state management
3. Implement account switching logic
4. Add context provider to app root
5. Create custom hook for accessing account context

**Acceptance Criteria**:
- [ ] Context provides current account and user permissions
- [ ] Account switching updates context and invalidates queries
- [ ] Context persists account selection in localStorage
- [ ] Error handling for account access failures

#### 1.2 API Service Updates
**Files to Update**:
- `lib/api/account.ts`
- `lib/api/client.ts`

**Implementation Steps**:
1. Add new API methods for account hierarchy
2. Implement user invitation endpoints
3. Add proper TypeScript types for responses
4. Configure request/response interceptors for account context
5. Add error handling for permission-related errors

**Acceptance Criteria**:
- [ ] All new API endpoints integrated
- [ ] Proper error handling and user feedback
- [ ] Request headers include account context
- [ ] Response caching configured

#### 1.3 Account Breadcrumb Navigation
**Files to Create**:
- `components/account/account-breadcrumb.tsx`

**Implementation Steps**:
1. Create breadcrumb component following wireframe design
2. Implement account path parsing and display
3. Add click handlers for account navigation
4. Style with Tailwind CSS following design system
5. Add mobile responsive behavior

**Acceptance Criteria**:
- [ ] Shows full account hierarchy path
- [ ] Clickable breadcrumb items for navigation
- [ ] Mobile-responsive design
- [ ] Proper truncation for long account names

### Phase 2: Account Management (3-4 days)
**Goal**: Core account hierarchy and switching functionality

#### 2.1 Account Switcher Component
**Files to Create**:
- `components/account/account-switcher.tsx`
- `components/ui/command.tsx` (if not exists)

**Implementation Steps**:
1. Create dropdown component with search functionality
2. Implement hierarchical account display with indentation
3. Add account switching with loading states
4. Implement quick access to frequently used accounts
5. Add create sub-account action button

**Acceptance Criteria**:
- [ ] Dropdown shows all accessible accounts
- [ ] Search/filter functionality works
- [ ] Visual hierarchy with proper indentation
- [ ] Account switching updates entire app context
- [ ] Loading states during account operations

#### 2.2 Account Hierarchy Tree
**Files to Create**:
- `components/account/hierarchy-tree.tsx`
- `lib/hooks/use-account-hierarchy.ts`

**Implementation Steps**:
1. Create collapsible tree component
2. Implement expand/collapse functionality
3. Add usage indicators (storage, users, sources)
4. Include quick action buttons per account
5. Add context menu for account actions

**Acceptance Criteria**:
- [ ] Tree structure matches wireframe design
- [ ] Collapsible nodes with state persistence
- [ ] Usage indicators show real data
- [ ] Quick actions work (settings, users, stats)
- [ ] Context menu for additional operations

#### 2.3 Create Sub-Account Dialog
**Files to Create**:
- `components/account/create-sub-account-dialog.tsx`
- `lib/hooks/use-create-sub-account.ts`

**Implementation Steps**:
1. Create modal dialog component
2. Build form with validation (react-hook-form)
3. Implement settings inheritance from parent
4. Add preview of hierarchy placement
5. Configure white-label settings section

**Acceptance Criteria**:
- [ ] Form validation for required fields
- [ ] Settings inherited from parent account
- [ ] Preview shows account placement in hierarchy
- [ ] White-label configuration options
- [ ] Success/error feedback with proper messaging

### Phase 3: User Invitation System (3-4 days)
**Goal**: Complete user management and invitation workflows

#### 3.1 Invite User Dialog
**Files to Create**:
- `components/account/invite-user-dialog.tsx`
- `lib/hooks/use-invite-user.ts`

**Implementation Steps**:
1. Create invitation form with email validation
2. Implement role selection with permission preview
3. Add custom permission configuration
4. Include optional invitation message
5. Add bulk invite support (future enhancement)

**Acceptance Criteria**:
- [ ] Email validation and domain suggestions
- [ ] Role selection updates permission preview
- [ ] Custom permissions can be configured
- [ ] Invitation message preview
- [ ] Error handling for duplicate invitations

#### 3.2 Pending Invitations List
**Files to Create**:
- `components/account/pending-invitations-list.tsx`
- `lib/hooks/use-invitations.ts`

**Implementation Steps**:
1. Create list component with invitation cards
2. Implement resend invitation functionality
3. Add cancel/revoke invitation actions
4. Display expiration dates and invited by info
5. Add invitation status tracking

**Acceptance Criteria**:
- [ ] List shows all pending invitations
- [ ] Resend functionality works with rate limiting
- [ ] Cancel invitations with confirmation
- [ ] Expiration date countdown display
- [ ] Real-time status updates

#### 3.3 Accept Invitation Page
**Files to Create**:
- `app/auth/accept-invitation/page.tsx`
- `components/auth/invitation-acceptance.tsx`

**Implementation Steps**:
1. Create public page for invitation acceptance
2. Implement invite code validation
3. Display account and role information
4. Add permission details preview
5. Integrate with authentication flow

**Acceptance Criteria**:
- [ ] Invite code input and validation
- [ ] Account information display
- [ ] Permission preview before acceptance
- [ ] Seamless login/registration integration
- [ ] Redirect to appropriate dashboard

#### 3.4 User Role Manager
**Files to Create**:
- `components/account/user-role-manager.tsx`
- `lib/hooks/use-user-roles.ts`

**Implementation Steps**:
1. Create user management interface
2. Implement role change functionality
3. Add permission matrix view
4. Include user removal with confirmation
5. Add activity history per user

**Acceptance Criteria**:
- [ ] List all account users with roles
- [ ] Role changes work with proper validation
- [ ] Permission matrix is clear and functional
- [ ] User removal requires confirmation
- [ ] Activity history shows recent actions

### Phase 4: Advanced Features (2-3 days)
**Goal**: Polish, optimization, and advanced functionality

#### 4.1 Permission System
**Files to Create**:
- `components/account/permission-checker.tsx`
- `components/auth/protected-account-route.tsx`
- `lib/utils/permissions.ts`

**Implementation Steps**:
1. Create permission checking utilities
2. Implement protected route components
3. Add conditional rendering based on permissions
4. Create permission enforcement middleware
5. Add permission inheritance logic

**Acceptance Criteria**:
- [ ] Permission checks work across all components
- [ ] Protected routes enforce access control
- [ ] Conditional rendering based on user permissions
- [ ] Permission inheritance from parent accounts
- [ ] Clear error messages for insufficient permissions

#### 4.2 Status and Visual Indicators
**Files to Create**:
- `components/account/account-status-badge.tsx`
- `components/ui/status-indicator.tsx`

**Implementation Steps**:
1. Create status badge components
2. Implement visual indicators for account states
3. Add usage progress indicators
4. Create loading states for async operations
5. Add success/error feedback systems

**Acceptance Criteria**:
- [ ] Status badges reflect real account states
- [ ] Visual indicators are consistent with design system
- [ ] Progress indicators show real usage data
- [ ] Loading states provide good UX
- [ ] Feedback systems are clear and helpful

#### 4.3 Mobile Optimization
**Files to Update**:
- All account management components
- `components/ui/responsive-wrapper.tsx`

**Implementation Steps**:
1. Optimize all components for mobile devices
2. Implement responsive navigation patterns
3. Add touch-friendly interactions
4. Optimize hierarchy display for small screens
5. Add mobile-specific user interactions

**Acceptance Criteria**:
- [ ] All components work well on mobile devices
- [ ] Navigation is touch-friendly
- [ ] Hierarchy display is readable on small screens
- [ ] Mobile-specific interactions are intuitive
- [ ] Performance is optimized for mobile

### Phase 5: Testing and Polish (2-3 days)
**Goal**: Comprehensive testing and final optimizations

#### 5.1 Unit Testing
**Files to Create**:
- `__tests__/components/account/*.test.tsx`
- `__tests__/hooks/*.test.ts`
- `__tests__/utils/*.test.ts`

**Implementation Steps**:
1. Write unit tests for all components
2. Test custom hooks with React Testing Library
3. Test utility functions and permission logic
4. Add integration tests for workflows
5. Configure test coverage reporting

**Acceptance Criteria**:
- [ ] >80% test coverage for account components
- [ ] All custom hooks have comprehensive tests
- [ ] Critical user workflows are integration tested
- [ ] Performance tests for large hierarchies
- [ ] Accessibility tests pass

#### 5.2 Error Handling and Edge Cases
**Files to Update**:
- All account management components
- `lib/api/error-handler.ts`

**Implementation Steps**:
1. Add comprehensive error handling
2. Test edge cases (large hierarchies, network failures)
3. Implement graceful degradation
4. Add proper loading and error states
5. Test permission edge cases

**Acceptance Criteria**:
- [ ] All error scenarios have proper handling
- [ ] Edge cases don't break the application
- [ ] Graceful degradation for network issues
- [ ] Clear error messages for users
- [ ] Permission edge cases handled correctly

#### 5.3 Performance Optimization
**Files to Update**:
- All account management components
- `lib/hooks/use-account-*.ts`

**Implementation Steps**:
1. Optimize component re-renders
2. Implement virtual scrolling for large lists
3. Add request deduplication
4. Optimize bundle size
5. Add performance monitoring

**Acceptance Criteria**:
- [ ] Components re-render only when necessary
- [ ] Large account lists perform well
- [ ] API requests are efficiently managed
- [ ] Bundle size is optimized
- [ ] Performance metrics are within targets

## Development Guidelines

### Code Standards
1. **TypeScript**: Strict mode enabled, no `any` types
2. **Components**: Functional components with hooks
3. **Styling**: Tailwind CSS with design system tokens
4. **State Management**: React Query for server state, Zustand for client state
5. **Testing**: React Testing Library for components, Vitest for units

### File Organization
```
components/
├── account/
│   ├── account-switcher.tsx
│   ├── hierarchy-tree.tsx
│   ├── create-sub-account-dialog.tsx
│   ├── invite-user-dialog.tsx
│   ├── pending-invitations-list.tsx
│   ├── user-role-manager.tsx
│   ├── permission-checker.tsx
│   └── account-status-badge.tsx
├── auth/
│   ├── protected-account-route.tsx
│   └── invitation-acceptance.tsx
└── ui/
    ├── command.tsx
    ├── status-indicator.tsx
    └── responsive-wrapper.tsx

lib/
├── api/
│   ├── account.ts
│   └── error-handler.ts
├── hooks/
│   ├── use-account-context.ts
│   ├── use-account-hierarchy.ts
│   ├── use-invitations.ts
│   └── use-permissions.ts
├── providers/
│   └── account-context-provider.tsx
└── utils/
    ├── permissions.ts
    └── account-helpers.ts

types/
├── account.ts
├── invitation.ts
└── permissions.ts
```

### Component Patterns
1. **Composition over Inheritance**: Build complex UIs from simple components
2. **Props Interface**: Always define explicit TypeScript interfaces
3. **Error Boundaries**: Wrap complex components in error boundaries
4. **Loading States**: Include loading states for all async operations
5. **Accessibility**: Follow ARIA guidelines and keyboard navigation

### State Management Rules
1. **Server State**: Use React Query for all API data
2. **Client State**: Use Zustand or Context for local UI state
3. **Form State**: Use react-hook-form for complex forms
4. **URL State**: Sync important state with URL parameters
5. **Persistence**: Store user preferences in localStorage

### Performance Rules
1. **Memoization**: Use React.memo for expensive components
2. **Code Splitting**: Lazy load non-critical components
3. **Bundle Analysis**: Regular bundle size monitoring
4. **Query Optimization**: Efficient React Query configuration
5. **Image Optimization**: Optimize all images and assets

## Success Criteria

### Functional Requirements
- [ ] Users can switch between accounts seamlessly
- [ ] Account hierarchy is clearly visualized
- [ ] Sub-accounts can be created with proper permissions
- [ ] User invitations work end-to-end
- [ ] Role-based permissions are enforced
- [ ] Mobile experience is fully functional

### Non-Functional Requirements
- [ ] Initial page load < 2 seconds
- [ ] Account switching < 500ms
- [ ] Component bundle size < 200KB
- [ ] Accessibility score > 95%
- [ ] Test coverage > 80%
- [ ] Zero console errors in production

### User Experience Requirements
- [ ] Intuitive navigation between accounts
- [ ] Clear visual feedback for all actions
- [ ] Consistent design system implementation
- [ ] Responsive design across all devices
- [ ] Proper error handling with helpful messages
- [ ] Smooth animations and transitions

## Risk Mitigation

### Technical Risks
1. **Large Hierarchies**: Implement virtual scrolling and pagination
2. **Network Failures**: Add offline support and retry logic
3. **Permission Complexity**: Create comprehensive test suite
4. **Performance Issues**: Monitor and optimize continuously
5. **Browser Compatibility**: Test across all target browsers

### User Experience Risks
1. **Complex Navigation**: Provide clear breadcrumbs and context
2. **Permission Confusion**: Add helpful tooltips and documentation
3. **Mobile Usability**: Prioritize mobile-first design
4. **Loading States**: Implement skeleton screens and progress indicators
5. **Error Recovery**: Provide clear recovery paths for errors

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | 2-3 days | Account context, API integration, breadcrumbs |
| Phase 2 | 3-4 days | Account switcher, hierarchy tree, sub-account creation |
| Phase 3 | 3-4 days | User invitations, role management, acceptance flow |
| Phase 4 | 2-3 days | Permissions, mobile optimization, visual polish |
| Phase 5 | 2-3 days | Testing, error handling, performance optimization |

**Total Estimated Duration**: 12-17 days (2.5-3.5 weeks)

## Post-Implementation Tasks

1. **Documentation**: Update user guides and API documentation
2. **Training**: Create internal training materials
3. **Monitoring**: Set up performance and error monitoring
4. **Feedback**: Collect user feedback and iterate
5. **Optimization**: Continuous performance improvements