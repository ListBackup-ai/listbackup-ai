//
//  ListBackupApp.swift
//  ListBackup
//
//  Main entry point for the ListBackup iOS app
//

import SwiftUI
import UserNotifications
import BackgroundTasks

@main
struct ListBackupApp: App {
    @StateObject private var authManager = AuthManager.shared
    @State private var showSplash = true
    
    init() {
        setupAppearance()
        setupBackgroundTasks()
    }
    
    var body: some Scene {
        WindowGroup {
            Group {
                if showSplash {
                    SplashView()
                        .onAppear {
                            // Show splash for at least 1.5 seconds
                            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                                withAnimation(.easeInOut(duration: 0.3)) {
                                    showSplash = false
                                }
                            }
                        }
                } else {
                    ContentView()
                        .environmentObject(authManager)
                        .onAppear {
                            requestNotificationPermission()
                            scheduleBackgroundRefresh()
                        }
                }
            }
            .preferredColorScheme(.light) // Force light mode for now
        }
    }
    
    private func setupAppearance() {
        // Navigation bar appearance
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = UIColor.systemBackground
        navAppearance.titleTextAttributes = [
            .font: UIFont.systemFont(ofSize: 18, weight: .semibold)
        ]
        navAppearance.largeTitleTextAttributes = [
            .font: UIFont.systemFont(ofSize: 34, weight: .bold)
        ]
        
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
        UINavigationBar.appearance().compactAppearance = navAppearance
        
        // Tab bar appearance
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = UIColor.systemBackground
        
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
        
        // Table view appearance
        UITableView.appearance().backgroundColor = UIColor.systemGroupedBackground
    }
    
    private func setupBackgroundTasks() {
        // Register background task
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "ai.listbackup.refresh",
            using: nil
        ) { task in
            handleBackgroundRefresh(task: task as! BGAppRefreshTask)
        }
    }
    
    private func scheduleBackgroundRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: "ai.listbackup.refresh")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Failed to schedule background refresh: \(error)")
        }
    }
    
    private func handleBackgroundRefresh(task: BGAppRefreshTask) {
        // Schedule the next background refresh
        scheduleBackgroundRefresh()
        
        // Create operation for background sync
        let operation = BackgroundSyncOperation()
        operation.completionBlock = {
            task.setTaskCompleted(success: !operation.isCancelled)
        }
        
        task.expirationHandler = {
            operation.cancel()
        }
        
        OperationQueue.main.addOperation(operation)
    }
    
    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            if granted {
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }
    }
}

// MARK: - Splash View

struct SplashView: View {
    @State private var logoScale: CGFloat = 0.8
    @State private var logoOpacity: Double = 0
    
    var body: some View {
        ZStack {
            // Gradient background
            LinearGradient(
                colors: [
                    Color(red: 0.2, green: 0.6, blue: 0.9),
                    Color(red: 0.1, green: 0.4, blue: 0.8)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 20) {
                // Logo placeholder
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.white)
                    .frame(width: 120, height: 120)
                    .overlay(
                        Text("LB")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundColor(Color(red: 0.2, green: 0.6, blue: 0.9))
                    )
                    .scaleEffect(logoScale)
                    .opacity(logoOpacity)
                
                Text("ListBackup")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .opacity(logoOpacity)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                logoScale = 1.0
                logoOpacity = 1.0
            }
        }
    }
}

// MARK: - Background Operations

class BackgroundSyncOperation: Operation {
    override func main() {
        guard !isCancelled else { return }
        
        // Perform background sync operations
        Task {
            do {
                // Check for pending sync jobs
                let sources: [Source] = try await APIClient.shared.request(.getSources())
                
                for source in sources where source.needsSync {
                    guard !isCancelled else { break }
                    
                    // Sync source data
                    do {
                        let _: EmptyResponse = try await APIClient.shared.request(
                            .syncSource(id: source.id)
                        )
                    } catch {
                        print("Failed to sync source \(source.id): \(error)")
                    }
                }
            } catch {
                print("Background sync failed: \(error)")
            }
        }
    }
}

// MARK: - Source Model for Background Sync

extension BackgroundSyncOperation {
    struct Source: Decodable {
        let id: String
        let name: String
        let lastSyncDate: Date?
        
        var needsSync: Bool {
            guard let lastSync = lastSyncDate else { return true }
            return Date().timeIntervalSince(lastSync) > 3600 // 1 hour
        }
    }
}