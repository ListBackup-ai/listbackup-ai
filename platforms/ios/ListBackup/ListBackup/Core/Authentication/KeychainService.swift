//
//  KeychainService.swift
//  ListBackup
//
//  Secure storage for authentication tokens using iOS Keychain
//

import Foundation
import Security

class KeychainService {
    static let shared = KeychainService()
    
    private let service = "ai.listbackup.ios"
    private let accessGroup: String? = nil // Add if using app groups
    
    private enum KeychainKey: String {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case biometricToken = "biometric_token"
        case userId = "user_id"
        case accountId = "account_id"
    }
    
    private init() {}
    
    // MARK: - Token Management
    
    func saveToken(_ token: String) {
        save(token, for: .accessToken)
    }
    
    func getToken() -> String? {
        return get(.accessToken)
    }
    
    func deleteToken() {
        delete(.accessToken)
    }
    
    func saveRefreshToken(_ token: String) {
        save(token, for: .refreshToken)
    }
    
    func getRefreshToken() -> String? {
        return get(.refreshToken)
    }
    
    func deleteRefreshToken() {
        delete(.refreshToken)
    }
    
    // MARK: - Biometric Token
    
    func saveBiometricToken(_ token: String) {
        save(token, for: .biometricToken, accessible: .whenUnlockedThisDeviceOnly)
    }
    
    func getBiometricToken() -> String? {
        return get(.biometricToken)
    }
    
    func deleteBiometricToken() {
        delete(.biometricToken)
    }
    
    // MARK: - User Info
    
    func saveUserId(_ userId: String) {
        save(userId, for: .userId)
    }
    
    func getUserId() -> String? {
        return get(.userId)
    }
    
    func saveAccountId(_ accountId: String) {
        save(accountId, for: .accountId)
    }
    
    func getAccountId() -> String? {
        return get(.accountId)
    }
    
    // MARK: - Clear All
    
    func clearAll() {
        KeychainKey.allCases.forEach { delete($0) }
    }
    
    // MARK: - Private Methods
    
    private func save(_ value: String, for key: KeychainKey, accessible: CFString = kSecAttrAccessibleWhenUnlocked) {
        let data = value.data(using: .utf8)!
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue,
            kSecValueData as String: data,
            kSecAttrAccessible as String: accessible
        ]
        
        // Delete existing item first
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)
        
        if status != errSecSuccess {
            print("Keychain save error: \(status) for key: \(key.rawValue)")
        }
    }
    
    private func get(_ key: KeychainKey) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        
        if status == errSecSuccess,
           let data = dataTypeRef as? Data,
           let value = String(data: data, encoding: .utf8) {
            return value
        }
        
        return nil
    }
    
    private func delete(_ key: KeychainKey) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - KeychainKey Extension

extension KeychainService.KeychainKey: CaseIterable {}