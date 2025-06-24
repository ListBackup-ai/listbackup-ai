import Foundation
import SwiftUI
import LocalAuthentication
import Security
import CryptoKit

@MainActor
class AuthenticationManager: ObservableObject {
    static let shared = AuthenticationManager()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var authenticationError: AuthError?
    @Published var isLoading = false
    
    private let keychainService = "ai.listbackup.keychain"
    private let apiClient = APIClient.shared
    
    private init() {}
    
    // MARK: - Authentication Status
    func checkAuthenticationStatus() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            if let token = getStoredToken() {
                // Validate token with server
                let user = try await apiClient.validateToken(token)
                currentUser = user
                isAuthenticated = true
            }
        } catch {
            // Token invalid, clear stored credentials
            clearStoredCredentials()
            isAuthenticated = false
        }
    }
    
    // MARK: - Email/Password Authentication
    func signIn(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let response = try await apiClient.signIn(email: email, password: password)
            
            // Store token securely
            try storeToken(response.token)
            
            // Store user data
            currentUser = response.user
            isAuthenticated = true
            
            // Enable biometric authentication if available
            await enableBiometricAuthentication(token: response.token)
            
        } catch let error as APIError {
            authenticationError = AuthError.apiError(error.localizedDescription)
            throw error
        } catch {
            authenticationError = AuthError.unknown
            throw AuthError.unknown
        }
    }
    
    func signUp(firstName: String, lastName: String, email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let response = try await apiClient.signUp(
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password
            )
            
            try storeToken(response.token)
            currentUser = response.user
            isAuthenticated = true
            
        } catch let error as APIError {
            authenticationError = AuthError.apiError(error.localizedDescription)
            throw error
        } catch {
            authenticationError = AuthError.unknown
            throw AuthError.unknown
        }
    }
    
    // MARK: - Biometric Authentication
    func signInWithBiometrics() async throws {
        let context = LAContext()
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            throw AuthError.biometricNotAvailable
        }
        
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "Authenticate to access your ListBackup.ai account"
            )
            
            if success {
                if let token = getBiometricToken() {
                    let user = try await apiClient.validateToken(token)
                    currentUser = user
                    isAuthenticated = true
                } else {
                    throw AuthError.noBiometricCredentials
                }
            }
        } catch {
            throw AuthError.biometricFailed
        }
    }
    
    private func enableBiometricAuthentication(token: String) async {
        let context = LAContext()
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return
        }
        
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "Enable biometric authentication for faster sign-in"
            )
            
            if success {
                try storeBiometricToken(token)
            }
        } catch {
            print("Failed to enable biometric authentication: \(error)")
        }
    }
    
    // MARK: - Sign Out
    func signOut() async {
        do {
            try await apiClient.signOut()
        } catch {
            print("Sign out request failed: \(error)")
        }
        
        clearStoredCredentials()
        currentUser = nil
        isAuthenticated = false
    }
    
    // MARK: - Keychain Operations
    private func storeToken(_ token: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: "auth_token",
            kSecValueData as String: token.data(using: .utf8)!
        ]
        
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            throw AuthError.keychainError
        }
    }
    
    private func getStoredToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: "auth_token",
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return token
    }
    
    private func storeBiometricToken(_ token: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: "biometric_token",
            kSecValueData as String: token.data(using: .utf8)!,
            kSecAttrAccessControl as String: SecAccessControlCreateWithFlags(
                nil,
                kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                .biometryAny,
                nil
            )!
        ]
        
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            throw AuthError.keychainError
        }
    }
    
    private func getBiometricToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: "biometric_token",
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return token
    }
    
    private func clearStoredCredentials() {
        let queries: [[String: Any]] = [
            [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: keychainService,
                kSecAttrAccount as String: "auth_token"
            ],
            [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: keychainService,
                kSecAttrAccount as String: "biometric_token"
            ]
        ]
        
        queries.forEach { query in
            SecItemDelete(query as CFDictionary)
        }
    }
}

// MARK: - Supporting Types
enum AuthError: LocalizedError {
    case biometricNotAvailable
    case biometricFailed
    case noBiometricCredentials
    case keychainError
    case apiError(String)
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .biometricNotAvailable:
            return "Biometric authentication is not available on this device"
        case .biometricFailed:
            return "Biometric authentication failed"
        case .noBiometricCredentials:
            return "No biometric credentials stored"
        case .keychainError:
            return "Failed to access secure storage"
        case .apiError(let message):
            return message
        case .unknown:
            return "An unknown error occurred"
        }
    }
}