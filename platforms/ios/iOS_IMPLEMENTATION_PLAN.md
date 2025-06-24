# iOS Native App Implementation Plan

## 🎯 Overview
Native iOS app for ListBackup.ai using Swift, SwiftUI, and modern iOS frameworks.

## 📱 Technical Stack
- **UI Framework**: SwiftUI
- **Minimum iOS Version**: iOS 16.0
- **Language**: Swift 5.9+
- **Architecture**: MVVM with Combine
- **Networking**: URLSession with async/await
- **Storage**: Core Data + Keychain
- **Authentication**: Biometric (Face ID/Touch ID)

## 🏗️ Project Structure
```
ListBackup/
├── App/
│   ├── ListBackupApp.swift         # App entry point
│   ├── AppDelegate.swift           # Push notifications
│   └── Info.plist                  # App configuration
├── Core/
│   ├── API/
│   │   ├── APIClient.swift         # Shared API bridge
│   │   ├── APIModels.swift         # Response models
│   │   └── APIError.swift          # Error handling
│   ├── Authentication/
│   │   ├── AuthManager.swift       # Auth state management
│   │   ├── KeychainService.swift   # Secure token storage
│   │   └── BiometricAuth.swift    # Face/Touch ID
│   ├── Storage/
│   │   ├── CoreDataStack.swift     # Core Data setup
│   │   ├── Models/                 # Core Data models
│   │   └── Persistence.swift       # Offline sync
│   └── Services/
│       ├── NotificationService.swift
│       ├── BackgroundService.swift
│       └── AnalyticsService.swift
├── Features/
│   ├── Authentication/
│   │   ├── Views/
│   │   │   ├── LoginView.swift
│   │   │   ├── RegisterView.swift
│   │   │   └── BiometricPrompt.swift
│   │   └── ViewModels/
│   │       └── AuthViewModel.swift
│   ├── Dashboard/
│   │   ├── Views/
│   │   │   ├── DashboardView.swift
│   │   │   ├── StatsCard.swift
│   │   │   └── ActivityFeed.swift
│   │   └── ViewModels/
│   │       └── DashboardViewModel.swift
│   ├── Integrations/
│   │   ├── Views/
│   │   │   ├── IntegrationsListView.swift
│   │   │   ├── IntegrationDetailView.swift
│   │   │   └── AddIntegrationView.swift
│   │   └── ViewModels/
│   │       └── IntegrationsViewModel.swift
│   ├── Data/
│   │   ├── Views/
│   │   │   ├── DataBrowserView.swift
│   │   │   ├── DataDetailView.swift
│   │   │   └── ExportView.swift
│   │   └── ViewModels/
│   │       └── DataViewModel.swift
│   └── Settings/
│       ├── Views/
│       │   ├── SettingsView.swift
│       │   ├── ProfileView.swift
│       │   └── NotificationSettings.swift
│       └── ViewModels/
│           └── SettingsViewModel.swift
├── Shared/
│   ├── Components/
│   │   ├── LoadingView.swift
│   │   ├── ErrorView.swift
│   │   ├── EmptyStateView.swift
│   │   └── PullToRefresh.swift
│   ├── Extensions/
│   │   ├── View+Extensions.swift
│   │   ├── Color+Theme.swift
│   │   └── Date+Formatting.swift
│   └── Utilities/
│       ├── Constants.swift
│       ├── Logger.swift
│       └── Haptics.swift
├── Resources/
│   ├── Assets.xcassets/
│   ├── Localizable.strings
│   └── LaunchScreen.storyboard
└── Tests/
    ├── Unit/
    └── UI/
```

## 🔧 Core Implementation

### 1. API Client Bridge
```swift
// APIClient.swift
import Foundation
import Combine

class APIClient {
    static let shared = APIClient()
    private let baseURL: String
    private let session: URLSession
    
    init() {
        self.baseURL = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String 
            ?? "https://api.listbackup.ai"
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
    }
    
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        var request = URLRequest(url: endpoint.url)
        request.httpMethod = endpoint.method.rawValue
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth token
        if let token = KeychainService.shared.getToken() {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = endpoint.body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 401 {
            // Handle token refresh
            try await refreshToken()
            return try await self.request(endpoint)
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(T.self, from: data)
    }
}
```

### 2. Authentication Manager
```swift
// AuthManager.swift
import SwiftUI
import Combine
import LocalAuthentication

@MainActor
class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    
    private let apiClient = APIClient.shared
    private let keychain = KeychainService.shared
    
    init() {
        checkAuthStatus()
    }
    
    func login(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        let response: LoginResponse = try await apiClient.request(
            .login(email: email, password: password)
        )
        
        keychain.saveToken(response.accessToken)
        keychain.saveRefreshToken(response.refreshToken)
        
        currentUser = response.user
        isAuthenticated = true
        
        // Enable biometric for next time
        try await enableBiometric()
    }
    
    func loginWithBiometric() async throws {
        let context = LAContext()
        let reason = "Authenticate to access your ListBackup account"
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil) else {
            throw AuthError.biometricNotAvailable
        }
        
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
            
            if success, let token = keychain.getBiometricToken() {
                keychain.saveToken(token)
                try await fetchUser()
                isAuthenticated = true
            }
        } catch {
            throw AuthError.biometricFailed
        }
    }
}
```

### 3. Core Data Models
```swift
// Source+CoreData.swift
import CoreData

@objc(Source)
public class Source: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var name: String
    @NSManaged public var type: String
    @NSManaged public var status: String
    @NSManaged public var lastSyncDate: Date?
    @NSManaged public var configuration: Data? // JSON data
    @NSManaged public var metrics: Data? // JSON data
}

// Job+CoreData.swift
@objc(Job)
public class Job: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var sourceId: String
    @NSManaged public var status: String
    @NSManaged public var createdAt: Date
    @NSManaged public var completedAt: Date?
    @NSManaged public var recordsProcessed: Int64
}
```

## 🎨 UI Implementation

### Key Views

#### 1. Dashboard
```swift
struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Stats Cards
                    StatsSection(stats: viewModel.stats)
                    
                    // Recent Activity
                    ActivitySection(activities: viewModel.recentActivity)
                    
                    // Quick Actions
                    QuickActionsSection()
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .refreshable {
                await viewModel.refresh()
            }
        }
    }
}
```

#### 2. Integrations List
```swift
struct IntegrationsListView: View {
    @StateObject private var viewModel = IntegrationsViewModel()
    
    var body: some View {
        List {
            ForEach(viewModel.integrations) { integration in
                IntegrationRow(integration: integration)
                    .swipeActions {
                        Button("Sync") {
                            Task {
                                await viewModel.sync(integration)
                            }
                        }
                        .tint(.blue)
                        
                        Button("Delete", role: .destructive) {
                            Task {
                                await viewModel.delete(integration)
                            }
                        }
                    }
            }
        }
        .searchable(text: $viewModel.searchText)
        .navigationTitle("Integrations")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    viewModel.showAddIntegration = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
    }
}
```

## 🔔 Push Notifications

### Setup
1. Enable Push Notifications capability
2. Register for remote notifications
3. Handle notification types:
   - Backup completed
   - Backup failed
   - System alerts
   - New features

### Implementation
```swift
// AppDelegate.swift
func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    Task {
        try await APIClient.shared.registerPushToken(token)
    }
}
```

## 📱 iOS-Specific Features

### 1. Widgets
- Backup status widget
- Storage usage widget
- Recent activity widget

### 2. Shortcuts
- "Start backup" shortcut
- "Check backup status" shortcut
- "Export data" shortcut

### 3. Background Tasks
- Periodic sync check
- Push notification handling
- Background app refresh

## 🧪 Testing Strategy

### Unit Tests
- API client tests
- View model tests
- Core Data tests
- Keychain tests

### UI Tests
- Authentication flow
- Dashboard navigation
- Integration management
- Data export flow

### TestFlight Beta
- Internal testing (1 week)
- External beta (2 weeks)
- Feedback incorporation
- Performance monitoring

## 📦 App Store Preparation

### Requirements
- App Store Connect setup
- Privacy policy URL
- Terms of service URL
- Support URL

### Assets
- App icon (1024x1024)
- Screenshots (6.7", 6.1", 5.5")
- App preview video (optional)
- Description and keywords

### Review Guidelines
- Data handling explanation
- Authentication requirements
- Background activity justification
- Export compliance

## 🚀 Launch Checklist

- [ ] Core functionality complete
- [ ] Offline mode working
- [ ] Push notifications tested
- [ ] Biometric auth implemented
- [ ] Performance optimized
- [ ] Crash-free rate > 99.5%
- [ ] App Store assets ready
- [ ] Beta testing complete
- [ ] Analytics integrated
- [ ] Deep linking setup