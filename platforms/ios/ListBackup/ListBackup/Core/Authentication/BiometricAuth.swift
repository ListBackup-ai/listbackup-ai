//
//  BiometricAuth.swift
//  ListBackup
//
//  Handles biometric authentication (Face ID / Touch ID)
//

import Foundation
import LocalAuthentication

class BiometricAuth {
    static let shared = BiometricAuth()
    
    private init() {}
    
    enum BiometricType {
        case none
        case touchID
        case faceID
        case opticID
    }
    
    enum BiometricError: LocalizedError {
        case notAvailable
        case notEnrolled
        case locked
        case cancelled
        case failed
        case fallback
        
        var errorDescription: String? {
            switch self {
            case .notAvailable:
                return "Biometric authentication is not available on this device"
            case .notEnrolled:
                return "No biometric data is enrolled. Please set up Face ID or Touch ID in Settings."
            case .locked:
                return "Biometric authentication is locked. Please try again later."
            case .cancelled:
                return "Authentication was cancelled"
            case .failed:
                return "Authentication failed. Please try again."
            case .fallback:
                return "Please use your password to authenticate"
            }
        }
    }
    
    // MARK: - Public Methods
    
    /// Check if biometric authentication is available
    func canUseBiometrics() -> Bool {
        let context = LAContext()
        var error: NSError?
        return context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    }
    
    /// Get the type of biometric authentication available
    func biometricType() -> BiometricType {
        let context = LAContext()
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return .none
        }
        
        switch context.biometryType {
        case .none:
            return .none
        case .touchID:
            return .touchID
        case .faceID:
            return .faceID
        case .opticID:
            if #available(iOS 17.0, *) {
                return .opticID
            } else {
                return .none
            }
        @unknown default:
            return .none
        }
    }
    
    /// Authenticate using biometrics
    func authenticate(reason: String? = nil) async throws -> Bool {
        let context = LAContext()
        var error: NSError?
        
        // Check if biometric authentication is available
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            if let error = error {
                throw mapLAError(error as! LAError)
            }
            throw BiometricError.notAvailable
        }
        
        // Set the reason for authentication
        let authReason = reason ?? defaultReason()
        
        // Disable fallback button
        context.localizedFallbackTitle = ""
        
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: authReason
            )
            return success
        } catch let error as LAError {
            throw mapLAError(error)
        } catch {
            throw BiometricError.failed
        }
    }
    
    /// Authenticate with device passcode as fallback
    func authenticateWithPasscode(reason: String? = nil) async throws -> Bool {
        let context = LAContext()
        var error: NSError?
        
        // Check if device passcode authentication is available
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            if let error = error {
                throw mapLAError(error as! LAError)
            }
            throw BiometricError.notAvailable
        }
        
        // Set the reason for authentication
        let authReason = reason ?? "Authenticate to access your ListBackup account"
        
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthentication,
                localizedReason: authReason
            )
            return success
        } catch let error as LAError {
            throw mapLAError(error)
        } catch {
            throw BiometricError.failed
        }
    }
    
    // MARK: - Private Methods
    
    private func defaultReason() -> String {
        switch biometricType() {
        case .faceID:
            return "Use Face ID to access your ListBackup account"
        case .touchID:
            return "Use Touch ID to access your ListBackup account"
        case .opticID:
            return "Use Optic ID to access your ListBackup account"
        default:
            return "Authenticate to access your ListBackup account"
        }
    }
    
    private func mapLAError(_ error: LAError) -> BiometricError {
        switch error.code {
        case .biometryNotAvailable, .biometryNotEnrolled:
            return .notEnrolled
        case .biometryLockout:
            return .locked
        case .userCancel:
            return .cancelled
        case .userFallback:
            return .fallback
        case .authenticationFailed:
            return .failed
        default:
            return .failed
        }
    }
    
    // MARK: - Settings Helper
    
    /// Get a user-friendly string for the biometric type
    func biometricTypeString() -> String {
        switch biometricType() {
        case .faceID:
            return "Face ID"
        case .touchID:
            return "Touch ID"
        case .opticID:
            return "Optic ID"
        case .none:
            return "Biometric Authentication"
        }
    }
    
    /// Check if the app has permission to use Face ID
    func hasFaceIDPermission() -> Bool {
        if biometricType() != .faceID {
            return true // Not Face ID, no permission needed
        }
        
        // For Face ID, we need to check if we've requested permission before
        // This is handled automatically by iOS when we first try to use it
        return true
    }
}