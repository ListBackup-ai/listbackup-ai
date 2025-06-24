//
//  DashboardView.swift
//  ListBackup
//
//  Main dashboard showing overview and stats
//

import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var isLoading = true
    @State private var stats = DashboardStats()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .padding(.top, 100)
                } else {
                    VStack(spacing: 24) {
                        // Welcome Header
                        welcomeHeader
                        
                        // Stats Cards
                        statsSection
                        
                        // Recent Activity
                        recentActivitySection
                        
                        // Quick Actions
                        quickActionsSection
                    }
                    .padding()
                }
            }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await loadDashboard()
            }
            .task {
                await loadDashboard()
            }
        }
    }
    
    // MARK: - Views
    
    private var welcomeHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Welcome back,")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text(authManager.currentUser?.firstName ?? "User")
                    .font(.title2)
                    .fontWeight(.bold)
            }
            
            Spacer()
            
            // Profile Avatar
            Circle()
                .fill(
                    LinearGradient(
                        colors: [
                            Color(red: 0.2, green: 0.6, blue: 0.9),
                            Color(red: 0.1, green: 0.4, blue: 0.8)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 50, height: 50)
                .overlay(
                    Text(authManager.currentUser?.initials ?? "??")
                        .font(.headline)
                        .foregroundColor(.white)
                )
        }
    }
    
    private var statsSection: some View {
        VStack(spacing: 16) {
            HStack(spacing: 16) {
                StatCard(
                    title: "Total Backups",
                    value: "\(stats.totalBackups)",
                    icon: "square.stack.3d.up.fill",
                    color: .blue
                )
                
                StatCard(
                    title: "Active Sources",
                    value: "\(stats.activeSources)",
                    icon: "server.rack",
                    color: .green
                )
            }
            
            HStack(spacing: 16) {
                StatCard(
                    title: "Storage Used",
                    value: formatBytes(stats.storageUsed),
                    icon: "externaldrive.fill",
                    color: .orange
                )
                
                StatCard(
                    title: "Last Sync",
                    value: stats.lastSync ?? "Never",
                    icon: "arrow.triangle.2.circlepath",
                    color: .purple
                )
            }
        }
    }
    
    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Activity")
                .font(.headline)
            
            VStack(spacing: 8) {
                ForEach(0..<3) { _ in
                    HStack {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Backup completed")
                                .font(.subheadline)
                            Text("Keap - 2 minutes ago")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(10)
                }
            }
        }
    }
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
            
            HStack(spacing: 12) {
                QuickActionButton(
                    title: "Add Source",
                    icon: "plus.circle.fill",
                    color: .blue
                ) {
                    // Navigate to add source
                }
                
                QuickActionButton(
                    title: "Run Backup",
                    icon: "play.circle.fill",
                    color: .green
                ) {
                    // Run backup
                }
                
                QuickActionButton(
                    title: "View Data",
                    icon: "folder.circle.fill",
                    color: .orange
                ) {
                    // Navigate to data browser
                }
            }
        }
    }
    
    // MARK: - Methods
    
    private func loadDashboard() async {
        isLoading = true
        defer { isLoading = false }
        
        // Load dashboard data
        // This would call the API
        try? await Task.sleep(nanoseconds: 1_000_000_000) // Simulate API call
        
        stats = DashboardStats(
            totalBackups: 1234,
            activeSources: 5,
            storageUsed: 5_368_709_120,
            lastSync: "2 hours ago"
        )
    }
    
    private func formatBytes(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .binary
        return formatter.string(fromByteCount: bytes)
    }
}

// MARK: - Supporting Views

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color(UIColor.secondarySystemBackground))
            .cornerRadius(12)
        }
    }
}

// MARK: - Models

struct DashboardStats {
    var totalBackups: Int = 0
    var activeSources: Int = 0
    var storageUsed: Int64 = 0
    var lastSync: String? = nil
}

#Preview {
    NavigationStack {
        DashboardView()
            .environmentObject(AuthManager.shared)
    }
}