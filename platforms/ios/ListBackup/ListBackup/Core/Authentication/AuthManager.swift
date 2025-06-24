//
//  AuthManager.swift
//  ListBackup
//
//  Manages authentication state and user sessions
//

import SwiftUI
import Combine
import LocalAuthentication

@MainActor
class AuthManager: ObservableObject {
    static let shared = AuthManager()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var authError: APIError?
    
    private let apiClient = APIClient.shared
    private let keychain = KeychainService.shared
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        Task {
            await checkAuthStatus()
        }
    }
    
    // MARK: - Authentication Status
    
    func checkAuthStatus() async {
        isLoading = true
        defer { isLoading = false }
        
        // Check if we have a stored token
        guard keychain.getToken() != nil else {
            isAuthenticated = false
            return
        }
        
        // Try to fetch current user
        do {
            try await fetchUser()
            isAuthenticated = true
        } catch {
            // Token might be expired
            isAuthenticated = false
            keychain.clearAll()
        }
    }
    
    // MARK: - Login Methods
    
    func login(email: String, password: String) async throws {
        isLoading = true
        authError = nil
        defer { isLoading = false }
        
        do {
            let response: LoginResponse = try await apiClient.request(
                .login(email: email, password: password)
            )
            
            // Save tokens
            keychain.saveToken(response.token)
            if let refreshToken = response.refreshToken {
                keychain.saveRefreshToken(refreshToken)
            }
            
            // Save user info
            currentUser = response.user
            if let userId = response.user.id {
                keychain.saveUserId(userId)
            }
            if let accountId = response.user.accountId {
                keychain.saveAccountId(accountId)
            }
            
            isAuthenticated = true
            
            // Enable biometric for next time if available
            await enableBiometricAuthentication()
            
        } catch let error as APIError {
            authError = error
            throw error
        } catch {
            let apiError = APIError.unknown
            authError = apiError
            throw apiError
        }
    }
    
    func loginWithBiometric() async throws {
        let context = LAContext()
        var error: NSError?
        
        // Check if biometric authentication is available
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            throw APIError.apiError(message: "Biometric authentication not available")
        }
        
        // Check if we have a stored biometric token
        guard let biometricToken = keychain.getBiometricToken() else {
            throw APIError.apiError(message: "No biometric credentials stored")
        }
        
        do {
            // Authenticate with biometrics
            let reason = "Authenticate to access your ListBackup account"
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
            
            if success {
                // Use the stored token
                keychain.saveToken(biometricToken)
                try await fetchUser()
                isAuthenticated = true
            }
        } catch let error as LAError {
            throw APIError.apiError(message: handleBiometricError(error))
        }
    }
    
    // MARK: - Registration
    
    func register(email: String, password: String, firstName: String, lastName: String) async throws {
        isLoading = true
        authError = nil
        defer { isLoading = false }
        
        do {
            let response: LoginResponse = try await apiClient.request(
                .register(
                    email: email,
                    password: password,
                    firstName: firstName,
                    lastName: lastName
                )
            )
            
            // Save tokens
            keychain.saveToken(response.token)
            if let refreshToken = response.refreshToken {
                keychain.saveRefreshToken(refreshToken)
            }
            
            // Save user info
            currentUser = response.user
            if let userId = response.user.id {
                keychain.saveUserId(userId)
            }
            if let accountId = response.user.accountId {
                keychain.saveAccountId(accountId)
            }
            
            isAuthenticated = true
            
        } catch let error as APIError {
            authError = error
            throw error
        } catch {
            let apiError = APIError.unknown
            authError = apiError
            throw apiError
        }
    }
    
    // MARK: - Logout
    
    func logout() async {
        isLoading = true
        defer { isLoading = false }
        
        // Try to notify server
        do {
            _ = try await apiClient.request(APIEndpoint.logout()) as EmptyResponse
        } catch {
            // Continue with local logout even if server call fails
            print("Server logout failed: \(error)")
        }
        
        // Clear local state
        currentUser = nil
        isAuthenticated = false
        keychain.clearAll()
    }
    
    // MARK: - User Management
    
    func fetchUser() async throws {
        let response: AccountResponse = try await apiClient.request(.getAccount())
        currentUser = response.user
    }
    
    func updateProfile(updates: [String: Any]) async throws {
        let response: AccountResponse = try await apiClient.request(
            .updateAccount(updates: updates)
        )
        currentUser = response.user
    }
    
    // MARK: - Biometric Setup
    
    private func enableBiometricAuthentication() async {
        let context = LAContext()
        var error: NSError?
        
        // Check if biometric authentication is available
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error),
              let token = keychain.getToken() else {
            return
        }
        
        // Store the current token for biometric access
        keychain.saveBiometricToken(token)
    }
    
    func disableBiometricAuthentication() {
        keychain.deleteBiometricToken()
    }
    
    // MARK: - Error Handling
    
    private func handleBiometricError(_ error: LAError) -> String {
        switch error.code {
        case .authenticationFailed:
            return "Authentication failed. Please try again."
        case .userCancel:
            return "Authentication cancelled."
        case .userFallback:
            return "Please use your password to log in."
        case .biometryNotAvailable:
            return "Biometric authentication is not available."
        case .biometryNotEnrolled:
            return "No biometric data is enrolled."
        case .biometryLockout:
            return "Biometric authentication is locked. Please use your password."
        default:
            return "Biometric authentication failed."
        }
    }
}

// MARK: - Response Models

struct LoginResponse: Decodable {
    let token: String
    let refreshToken: String?
    let user: User
}

struct AccountResponse: Decodable {
    let user: User
}

struct User: Decodable, Identifiable {
    let id: String?
    let email: String
    let firstName: String
    let lastName: String
    let accountId: String?
    let avatar: String?
    let emailVerified: Bool
    let createdAt: Date?
    let updatedAt: Date?
    
    var fullName: String {
        "\(firstName) \(lastName)"
    }
    
    var initials: String {
        let firstInitial = firstName.first?.uppercased() ?? ""
        let lastInitial = lastName.first?.uppercased() ?? ""
        return "\(firstInitial)\(lastInitial)"
    }
}

struct EmptyResponse: Decodable {}