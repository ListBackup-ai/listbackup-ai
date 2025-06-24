//
//  AppConfig.swift
//  ListBackup
//
//  Platform-specific configuration for iOS
//

import Foundation

struct AppConfig {
    // API Configuration
    static let apiBaseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://main.api.listbackup.ai"
    static let apiTimeout: TimeInterval = 30.0
    
    // Authentication
    static let cognitoRegion = ProcessInfo.processInfo.environment["COGNITO_REGION"] ?? "us-east-1"
    static let cognitoUserPoolId = ProcessInfo.processInfo.environment["COGNITO_USER_POOL_ID"] ?? ""
    static let cognitoClientId = ProcessInfo.processInfo.environment["COGNITO_CLIENT_ID"] ?? ""
    
    // App Info
    static let appName = "ListBackup.ai"
    static let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "2.0.0"
    static let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    
    // Feature Flags
    static let features = Features()
    
    // Storage Keys
    struct StorageKeys {
        static let authToken = "listbackup_auth_token"
        static let refreshToken = "listbackup_refresh_token"
        static let userData = "listbackup_user_data"
        static let accountId = "listbackup_account_id"
        static let biometricsEnabled = "listbackup_biometrics_enabled"
        static let pushNotificationsEnabled = "listbackup_push_enabled"
    }
    
    // Platform Info
    static var platformInfo: [String: String] {
        return [
            "X-Platform": "ios",
            "X-App-Version": appVersion,
            "X-Build-Number": buildNumber,
            "X-Device-Model": UIDevice.current.model,
            "X-OS-Version": UIDevice.current.systemVersion
        ]
    }
    
    struct Features {
        let offline = true
        let pushNotifications = true
        let biometrics = true
        let widgets = true
        let deeplinking = true
        let aiAssistant = true
        let dataExport = true
    }
    
    // Environment
    enum Environment {
        case development
        case staging
        case production
        
        static var current: Environment {
            #if DEBUG
            return .development
            #else
            return .production
            #endif
        }
    }
}