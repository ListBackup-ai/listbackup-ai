//
//  Account.swift
//  ListBackup
//
//  Account models with hierarchical support
//

import Foundation

// MARK: - Account Models

struct Account: Codable, Identifiable {
    let accountId: String
    let parentAccountId: String?
    let ownerUserId: String
    let name: String
    let company: String?
    let description: String?
    let accountPath: String
    let level: Int
    let isActive: Bool
    let accountType: AccountType?
    
    let settings: AccountSettings
    let limits: AccountLimits
    let usage: AccountUsage
    let billing: AccountBilling
    
    let createdAt: Date
    let updatedAt: Date
    
    var id: String { accountId }
}

enum AccountType: String, Codable, CaseIterable {
    case conglomerate = "conglomerate"
    case subsidiary = "subsidiary"
    case division = "division"
    case location = "location"
    case franchise = "franchise"
    
    var icon: String {
        switch self {
        case .conglomerate: return "building.2.fill"
        case .subsidiary: return "building.fill"
        case .division: return "briefcase.fill"
        case .location: return "storefront.fill"
        case .franchise: return "house.fill"
        }
    }
    
    var displayName: String {
        rawValue.capitalized
    }
}

struct AccountSettings: Codable {
    let allowSubAccounts: Bool
    let maxSubAccounts: Int
    let timezone: String
    let whiteLabel: WhiteLabelSettings
    let notifications: NotificationSettings
}

struct WhiteLabelSettings: Codable {
    let enabled: Bool
    let logo: String?
    let brandName: String?
    let customDomain: String?
}

struct NotificationSettings: Codable {
    let email: Bool
    let jobFailures: Bool
    let storageWarnings: Bool
    let invitations: Bool
}

struct AccountLimits: Codable {
    let storage: Int64
    let sources: Int
    let jobs: Int
    let apiCalls: Int
}

struct AccountUsage: Codable {
    let storage: UsageItem
    let sources: UsageItem
    let jobs: UsageItem
    let apiCalls: ApiUsageItem
}

struct UsageItem: Codable {
    let used: Int
    let limit: Int
    
    var percentage: Double {
        guard limit > 0 else { return 0 }
        return Double(used) / Double(limit) * 100
    }
}

struct ApiUsageItem: Codable {
    let used: Int
    let limit: Int
    let period: String
    let resetDate: Date
    
    var percentage: Double {
        guard limit > 0 else { return 0 }
        return Double(used) / Double(limit) * 100
    }
}

struct AccountBilling: Codable {
    let customerId: String?
    let subscriptionId: String?
    let status: BillingStatus
    let plan: String?
}

enum BillingStatus: String, Codable {
    case free = "free"
    case paid = "paid"
    case inherited = "inherited"
    case suspended = "suspended"
}

// MARK: - Permissions

struct Permissions: Codable {
    let canCreateSubAccounts: Bool
    let canInviteUsers: Bool
    let canManageIntegrations: Bool
    let canViewAllData: Bool
    let canManageBilling: Bool
    let canDeleteAccount: Bool
    let canChangeSettings: Bool
    let canViewUsers: Bool
    let canRemoveUsers: Bool
    let canChangeUserRoles: Bool
}

enum UserRole: String, Codable, CaseIterable {
    case owner = "owner"
    case admin = "admin"
    case member = "member"
    case viewer = "viewer"
    
    var displayName: String {
        rawValue.capitalized
    }
    
    var icon: String {
        switch self {
        case .owner: return "crown.fill"
        case .admin: return "person.badge.shield.checkmark.fill"
        case .member: return "person.fill.checkmark"
        case .viewer: return "eye.fill"
        }
    }
    
    var defaultPermissions: Permissions {
        switch self {
        case .owner:
            return Permissions(
                canCreateSubAccounts: true,
                canInviteUsers: true,
                canManageIntegrations: true,
                canViewAllData: true,
                canManageBilling: true,
                canDeleteAccount: true,
                canChangeSettings: true,
                canViewUsers: true,
                canRemoveUsers: true,
                canChangeUserRoles: true
            )
        case .admin:
            return Permissions(
                canCreateSubAccounts: false,
                canInviteUsers: true,
                canManageIntegrations: true,
                canViewAllData: true,
                canManageBilling: false,
                canDeleteAccount: false,
                canChangeSettings: true,
                canViewUsers: true,
                canRemoveUsers: true,
                canChangeUserRoles: true
            )
        case .member:
            return Permissions(
                canCreateSubAccounts: false,
                canInviteUsers: false,
                canManageIntegrations: true,
                canViewAllData: false,
                canManageBilling: false,
                canDeleteAccount: false,
                canChangeSettings: false,
                canViewUsers: true,
                canRemoveUsers: false,
                canChangeUserRoles: false
            )
        case .viewer:
            return Permissions(
                canCreateSubAccounts: false,
                canInviteUsers: false,
                canManageIntegrations: false,
                canViewAllData: false,
                canManageBilling: false,
                canDeleteAccount: false,
                canChangeSettings: false,
                canViewUsers: true,
                canRemoveUsers: false,
                canChangeUserRoles: false
            )
        }
    }
}

// MARK: - User Account Association

struct UserAccount: Codable {
    let userId: String
    let accountId: String
    let role: UserRole
    let status: UserAccountStatus
    let permissions: Permissions
    let linkedAt: Date
    let lastAccessedAt: Date?
}

enum UserAccountStatus: String, Codable {
    case active = "active"
    case inactive = "inactive"
    case invited = "invited"
    case suspended = "suspended"
}

// MARK: - Account with User Context

struct AccountWithPermissions: Codable {
    let account: Account
    let userRole: UserRole
    let userStatus: UserAccountStatus
    let userPermissions: Permissions
}

// MARK: - Hierarchy Models

struct AccountHierarchyNode: Codable {
    let account: Account
    let children: [AccountHierarchyNode]?
    let metadata: HierarchyMetadata
}

struct HierarchyMetadata: Codable {
    let totalDescendants: Int
    let maxDepth: Int
    let userCount: Int
    let sourceCount: Int
}

// MARK: - Invitation Models

struct Invitation: Codable, Identifiable {
    let userId: String
    let accountId: String
    let email: String
    let role: UserRole
    let status: UserAccountStatus
    let permissions: Permissions
    let inviteCode: String
    let invitedBy: String
    let expiresAt: Date
    let createdAt: Date
    let message: String?
    
    var id: String { userId }
    
    var isExpired: Bool {
        Date() > expiresAt
    }
    
    var daysUntilExpiry: Int {
        Calendar.current.dateComponents([.day], from: Date(), to: expiresAt).day ?? 0
    }
}

struct InvitationWithDetails: Codable {
    let invitation: Invitation
    let inviterName: String
    let inviterEmail: String
    let accountName: String
}

// MARK: - API Request/Response Types

struct CreateSubAccountRequest: Codable {
    let name: String
    let company: String?
    let description: String?
    let accountType: AccountType
    let settings: AccountSettings?
    let limits: AccountLimits?
}

struct InviteUserRequest: Codable {
    let email: String
    let role: UserRole
    let permissions: Permissions?
    let message: String?
}

struct InviteUserResponse: Codable {
    let message: String
    let inviteCode: String
    let email: String
    let role: String
    let expiresAt: Date
}

struct AcceptInvitationRequest: Codable {
    let inviteCode: String
}

struct AcceptInvitationResponse: Codable {
    let message: String
    let account: Account
    let userRole: UserRole
    let userPermissions: Permissions
}

struct AccountSwitchRequest: Codable {
    let accountId: String
}

struct AccountSwitchResponse: Codable {
    let account: Account
    let userRole: UserRole
    let userPermissions: Permissions
    let switchedAt: Date
}

// MARK: - Account User

struct AccountUser: Codable, Identifiable {
    let userId: String
    let email: String
    let name: String
    let role: UserRole
    let status: UserAccountStatus
    let permissions: Permissions
    let lastActive: Date?
    let joinedAt: Date
    
    var id: String { userId }
    
    var initials: String {
        let components = name.split(separator: " ")
        let firstInitial = components.first?.first?.uppercased() ?? ""
        let lastInitial = components.count > 1 ? components.last?.first?.uppercased() ?? "" : ""
        return "\(firstInitial)\(lastInitial)"
    }
}