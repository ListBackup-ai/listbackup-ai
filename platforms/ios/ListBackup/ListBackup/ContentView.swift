//
//  ContentView.swift
//  ListBackup
//
//  Root view that manages authentication state
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        Group {
            if authManager.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(UIColor.systemBackground))
            } else if authManager.isAuthenticated {
                MainTabView()
            } else {
                NavigationStack {
                    LoginView()
                }
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authManager.isAuthenticated)
    }
}

// MARK: - Main Tab View

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "chart.bar.fill")
                }
                .tag(0)
            
            IntegrationsListView()
                .tabItem {
                    Label("Integrations", systemImage: "puzzlepiece.extension.fill")
                }
                .tag(1)
            
            DataBrowserView()
                .tabItem {
                    Label("Data", systemImage: "folder.fill")
                }
                .tag(2)
            
            JobsListView()
                .tabItem {
                    Label("Jobs", systemImage: "clock.fill")
                }
                .tag(3)
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(4)
        }
        .tint(Color(red: 0.2, green: 0.6, blue: 0.9))
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager.shared)
}