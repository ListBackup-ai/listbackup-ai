//
//  AccountService.swift
//  ListBackup
//
//  Service for managing accounts and hierarchies
//

import Foundation
import Combine

@MainActor
class AccountService: ObservableObject {
    static let shared = AccountService()
    
    @Published var currentAccount: Account?
    @Published var availableAccounts: [AccountWithPermissions] = []
    @Published var userPermissions: Permissions?
    @Published var userRole: UserRole?
    @Published var accountHierarchy: AccountHierarchyNode?
    @Published var isLoading = false
    @Published var error: APIError?
    
    private let apiClient = APIClient.shared
    private let keychain = KeychainService.shared
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        setupObservers()
    }
    
    // MARK: - Setup
    
    private func setupObservers() {
        // Listen for authentication changes
        AuthManager.shared.$isAuthenticated
            .sink { [weak self] isAuthenticated in
                if isAuthenticated {
                    Task {
                        await self?.loadCurrentAccount()
                        await self?.loadAvailableAccounts()
                    }
                } else {
                    self?.clearAccountData()
                }
            }
            .store(in: &cancellables)
    }
    
    private func clearAccountData() {
        currentAccount = nil
        availableAccounts = []
        userPermissions = nil
        userRole = nil
        accountHierarchy = nil
    }
    
    // MARK: - Account Loading
    
    func loadCurrentAccount() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let response: Account = try await apiClient.request(.getAccount())
            currentAccount = response
            
            // Update stored account ID
            keychain.saveAccountId(response.accountId)
        } catch let error as APIError {
            self.error = error
        } catch {
            self.error = .unknown
        }
    }
    
    func loadAvailableAccounts() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let accounts: [AccountWithPermissions] = try await apiClient.request(.getUserAccounts())
            availableAccounts = accounts
            
            // Find current account permissions
            if let currentAccountId = currentAccount?.accountId,
               let currentAccountPermissions = accounts.first(where: { $0.account.accountId == currentAccountId }) {
                userPermissions = currentAccountPermissions.userPermissions
                userRole = currentAccountPermissions.userRole
            }
        } catch let error as APIError {
            self.error = error
        } catch {
            self.error = .unknown
        }
    }
    
    // MARK: - Account Management
    
    func switchAccount(_ accountId: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        let response: AccountSwitchResponse = try await apiClient.request(
            .switchAccount(accountId: accountId)
        )
        
        currentAccount = response.account
        userPermissions = response.userPermissions
        userRole = response.userRole
        
        // Update stored account ID
        keychain.saveAccountId(accountId)
        
        // Reload hierarchy for new account
        await loadAccountHierarchy()
    }
    
    func updateAccount(_ updates: [String: Any]) async throws {
        isLoading = true
        defer { isLoading = false }
        
        let response: Account = try await apiClient.request(
            .updateAccount(updates: updates)
        )
        
        currentAccount = response
    }
    
    // MARK: - Hierarchy Management
    
    func loadAccountHierarchy() async {
        guard let accountId = currentAccount?.accountId else { return }
        
        isLoading = true
        defer { isLoading = false }
        
        do {
            let hierarchy: AccountHierarchyNode = try await apiClient.request(
                .getAccountHierarchy(accountId: accountId)
            )
            accountHierarchy = hierarchy
        } catch let error as APIError {
            self.error = error
        } catch {
            self.error = .unknown
        }
    }
    
    func createSubAccount(name: String, company: String?, accountType: AccountType) async throws -> Account {
        guard let parentAccountId = currentAccount?.accountId else {
            throw APIError.apiError(message: "No current account")
        }
        
        isLoading = true
        defer { isLoading = false }
        
        let request = CreateSubAccountRequest(
            name: name,
            company: company,
            description: nil,
            accountType: accountType,
            settings: nil,
            limits: nil
        )
        
        let newAccount: Account = try await apiClient.request(
            .createSubAccount(parentAccountId: parentAccountId, request: request)
        )
        
        // Reload accounts and hierarchy
        await loadAvailableAccounts()
        await loadAccountHierarchy()
        
        return newAccount
    }
    
    // MARK: - User Management
    
    func getAccountUsers() async throws -> [AccountUser] {
        guard let accountId = currentAccount?.accountId else {
            throw APIError.apiError(message: "No current account")
        }
        
        return try await apiClient.request(.getAccountUsers(accountId: accountId))
    }
    
    func inviteUser(email: String, role: UserRole, message: String?) async throws -> InviteUserResponse {
        guard let accountId = currentAccount?.accountId else {
            throw APIError.apiError(message: "No current account")
        }
        
        let request = InviteUserRequest(
            email: email,
            role: role,
            permissions: role.defaultPermissions,
            message: message
        )
        
        return try await apiClient.request(
            .inviteUser(accountId: accountId, request: request)
        )
    }
    
    func getInvitations() async throws -> [InvitationWithDetails] {
        guard let accountId = currentAccount?.accountId else {
            throw APIError.apiError(message: "No current account")
        }
        
        return try await apiClient.request(.getInvitations(accountId: accountId))
    }
    
    func cancelInvitation(_ inviteCode: String) async throws {
        guard let accountId = currentAccount?.accountId else {
            throw APIError.apiError(message: "No current account")
        }
        
        let _: EmptyResponse = try await apiClient.request(
            .cancelInvitation(accountId: accountId, inviteCode: inviteCode)
        )
    }
    
    func updateUserRole(userId: String, role: UserRole) async throws {
        guard let accountId = currentAccount?.accountId else {
            throw APIError.apiError(message: "No current account")
        }
        
        let _: EmptyResponse = try await apiClient.request(
            .updateUserRole(accountId: accountId, userId: userId, role: role)
        )
    }
    
    func removeUser(userId: String) async throws {
        guard let accountId = currentAccount?.accountId else {
            throw APIError.apiError(message: "No current account")
        }
        
        let _: EmptyResponse = try await apiClient.request(
            .removeUser(accountId: accountId, userId: userId)
        )
    }
    
    // MARK: - Invitation Acceptance
    
    func acceptInvitation(inviteCode: String) async throws -> AcceptInvitationResponse {
        let request = AcceptInvitationRequest(inviteCode: inviteCode)
        let response: AcceptInvitationResponse = try await apiClient.request(
            .acceptInvitation(request: request)
        )
        
        // Reload accounts after accepting invitation
        await loadAvailableAccounts()
        
        return response
    }
    
    // MARK: - Helper Methods
    
    func hasPermission(_ permission: KeyPath<Permissions, Bool>) -> Bool {
        userPermissions?[keyPath: permission] ?? false
    }
    
    func canAccessAccount(_ accountId: String) -> Bool {
        availableAccounts.contains { $0.account.accountId == accountId }
    }
    
    func buildAccountPath(for accountId: String) -> [Account] {
        guard let hierarchy = accountHierarchy else { return [] }
        
        var path: [Account] = []
        findAccountPath(in: hierarchy, targetId: accountId, currentPath: &path)
        return path
    }
    
    private func findAccountPath(in node: AccountHierarchyNode, targetId: String, currentPath: inout [Account]) -> Bool {
        currentPath.append(node.account)
        
        if node.account.accountId == targetId {
            return true
        }
        
        if let children = node.children {
            for child in children {
                if findAccountPath(in: child, targetId: targetId, currentPath: &currentPath) {
                    return true
                }
            }
        }
        
        currentPath.removeLast()
        return false
    }
}

// MARK: - API Endpoint Extensions

extension APIEndpoint {
    static func getUserAccounts() -> APIEndpoint {
        APIEndpoint(
            path: "/accounts",
            method: .get,
            requiresAuth: true
        )
    }
    
    static func getAccountHierarchy(accountId: String) -> APIEndpoint {
        APIEndpoint(
            path: "/accounts/\(accountId)/hierarchy",
            method: .get,
            requiresAuth: true
        )
    }
    
    static func createSubAccount(parentAccountId: String, request: CreateSubAccountRequest) -> APIEndpoint {
        APIEndpoint(
            path: "/accounts/\(parentAccountId)/sub-accounts",
            method: .post,
            body: request,
            requiresAuth: true
        )
    }
    
    static func switchAccount(accountId: String) -> APIEndpoint {
        APIEndpoint(
            path: "/accounts/switch",
            method: .post,
            body: AccountSwitchRequest(accountId: accountId),
            requiresAuth: true
        )
    }
    
    static func getAccountUsers(accountId: String) -> APIEndpoint {
        APIEndpoint(
            path: "/accounts/\(accountId)/users",
            method: .get,
            requiresAuth: true
        )
    }
    
    static func inviteUser(accountId: String, request: InviteUserRequest) -> APIEndpoint {
        APIEndpoint(
            path: "/accounts/\(accountId)/invitations",
            method: .post,
            body: request,
            requiresAuth: true
        )
    }
    
    static func getInvitations(accountId: String) -> APIEndpoint {
        APIEndpoint(
            path: "/accounts/\(accountId)/invitations",
            method: .get,
            requiresAuth: true
        )
    }
    
    static func cancelInvitation(accountId: String, inviteCode: String) -> APIEndpoint {
        APIEndpoint(
            path: "/accounts/\(accountId)/invitations/\(inviteCode)",
            method: .delete,
            requiresAuth: true
        )
    }
    
    static func acceptInvitation(request: AcceptInvitationRequest) -> APIEndpoint {
        APIEndpoint(
            path: "/invitations/accept",
            method: .post,
            body: request,
            requiresAuth: true
        )
    }
    
    static func updateUserRole(accountId: String, userId: String, role: UserRole) -> APIEndpoint {
        APIEndpoint(
            path: "/accounts/\(accountId)/users/\(userId)/role",
            method: .put,
            body: ["role": role.rawValue],
            requiresAuth: true
        )
    }
    
    static func removeUser(accountId: String, userId: String) -> APIEndpoint {
        APIEndpoint(
            path: "/accounts/\(accountId)/users/\(userId)",
            method: .delete,
            requiresAuth: true
        )
    }
}