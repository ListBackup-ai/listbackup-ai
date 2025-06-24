//
//  EnhancedDashboardView.swift
//  ListBackup
//
//  Enhanced dashboard with account hierarchy support
//

import SwiftUI
import Charts

struct EnhancedDashboardView: View {
    @EnvironmentObject var authManager: AuthManager
    @StateObject private var accountService = AccountService.shared
    @State private var isLoading = true
    @State private var stats = DashboardStats()
    @State private var showAccountSwitcher = false
    @State private var selectedTimeRange = TimeRange.week
    
    enum TimeRange: String, CaseIterable {
        case day = "Day"
        case week = "Week"
        case month = "Month"
        case year = "Year"
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .padding(.top, 100)
                } else {
                    VStack(spacing: 24) {
                        // Account Selector
                        accountSelector
                        
                        // Welcome Header
                        welcomeHeader
                        
                        // Account Overview
                        accountOverview
                        
                        // Stats Cards
                        statsSection
                        
                        // Usage Charts
                        usageChartsSection
                        
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
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        // Navigate to notifications
                    } label: {
                        Image(systemName: "bell")
                            .symbolVariant(.none)
                            .badge(3)
                    }
                }
            }
            .refreshable {
                await loadDashboard()
            }
            .task {
                await loadDashboard()
            }
            .sheet(isPresented: $showAccountSwitcher) {
                AccountSwitcherView()
            }
        }
    }
    
    // MARK: - Views
    
    private var accountSelector: some View {
        HStack {
            Button {
                showAccountSwitcher = true
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: accountService.currentAccount?.accountType?.icon ?? "building.2.fill")
                        .font(.title3)
                        .foregroundColor(.blue)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(accountService.currentAccount?.name ?? "Select Account")
                            .font(.headline)
                        
                        if let company = accountService.currentAccount?.company {
                            Text(company)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.down")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color(UIColor.secondarySystemBackground))
                .cornerRadius(12)
            }
            .buttonStyle(.plain)
        }
    }
    
    private var welcomeHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Welcome back,")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text(authManager.currentUser?.firstName ?? "User")
                    .font(.title2)
                    .fontWeight(.bold)
                
                if let role = accountService.userRole {
                    Label(role.displayName, systemImage: role.icon)
                        .font(.caption)
                        .foregroundColor(.blue)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(6)
                }
            }
            
            Spacer()
            
            // Profile Avatar
            NavigationLink(destination: AccountSettingsView()) {
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
    }
    
    private var accountOverview: some View {
        VStack(spacing: 16) {
            // Account Type Badge
            if let accountType = accountService.currentAccount?.accountType {
                HStack {
                    Image(systemName: accountType.icon)
                    Text(accountType.displayName)
                        .fontWeight(.medium)
                }
                .font(.caption)
                .foregroundColor(.blue)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(8)
            }
            
            // Hierarchy Path
            if let hierarchy = accountService.accountHierarchy,
               hierarchy.metadata.totalDescendants > 0 {
                VStack(spacing: 8) {
                    HStack {
                        Text("Account Hierarchy")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        NavigationLink(destination: AccountHierarchyView()) {
                            Text("View All")
                                .font(.caption)
                                .foregroundColor(.blue)
                        }
                    }
                    
                    HStack(spacing: 12) {
                        hierarchyCard(
                            title: "Sub-Accounts",
                            value: "\(hierarchy.metadata.totalDescendants)",
                            icon: "building.2"
                        )
                        
                        hierarchyCard(
                            title: "Total Users",
                            value: "\(hierarchy.metadata.userCount)",
                            icon: "person.2"
                        )
                        
                        hierarchyCard(
                            title: "Max Depth",
                            value: "\(hierarchy.metadata.maxDepth)",
                            icon: "arrow.down.to.line"
                        )
                    }
                }
            }
        }
    }
    
    private func hierarchyCard(title: String, value: String, icon: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.blue)
            
            Text(value)
                .font(.title3)
                .fontWeight(.semibold)
            
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(UIColor.tertiarySystemBackground))
        .cornerRadius(10)
    }
    
    private var statsSection: some View {
        VStack(spacing: 16) {
            HStack(spacing: 16) {
                StatCard(
                    title: "Total Backups",
                    value: "\(stats.totalBackups)",
                    icon: "square.stack.3d.up.fill",
                    color: .blue,
                    trend: .up(12.5)
                )
                
                StatCard(
                    title: "Active Sources",
                    value: "\(stats.activeSources)",
                    icon: "server.rack",
                    color: .green,
                    trend: .neutral
                )
            }
            
            HStack(spacing: 16) {
                StatCard(
                    title: "Storage Used",
                    value: formatBytes(stats.storageUsed),
                    icon: "externaldrive.fill",
                    color: .orange,
                    trend: .up(8.3),
                    subtitle: "\(Int(accountService.currentAccount?.usage.storage.percentage ?? 0))% of limit"
                )
                
                StatCard(
                    title: "Last Sync",
                    value: stats.lastSync ?? "Never",
                    icon: "arrow.triangle.2.circlepath",
                    color: .purple,
                    trend: .neutral
                )
            }
        }
    }
    
    private var usageChartsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Usage Trends")
                    .font(.headline)
                
                Spacer()
                
                Picker("Time Range", selection: $selectedTimeRange) {
                    ForEach(TimeRange.allCases, id: \.self) { range in
                        Text(range.rawValue).tag(range)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 200)
            }
            
            // Storage Usage Chart
            VStack(alignment: .leading, spacing: 8) {
                Text("Storage Usage")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Chart {
                    ForEach(generateChartData(), id: \.date) { dataPoint in
                        LineMark(
                            x: .value("Date", dataPoint.date),
                            y: .value("Storage", dataPoint.value)
                        )
                        .foregroundStyle(Color.blue)
                        .interpolationMethod(.catmullRom)
                        
                        AreaMark(
                            x: .value("Date", dataPoint.date),
                            y: .value("Storage", dataPoint.value)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.blue.opacity(0.3), Color.blue.opacity(0.0)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .interpolationMethod(.catmullRom)
                    }
                }
                .frame(height: 150)
                .padding()
                .background(Color(UIColor.secondarySystemBackground))
                .cornerRadius(12)
            }
            
            // API Usage Progress
            if let apiUsage = accountService.currentAccount?.usage.apiCalls {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("API Usage")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        Text("\(apiUsage.used) / \(apiUsage.limit)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    ProgressView(value: apiUsage.percentage, total: 100)
                        .tint(apiUsage.percentage > 80 ? .red : .blue)
                    
                    Text("Resets on \(apiUsage.resetDate.formatted(date: .abbreviated, time: .omitted))")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color(UIColor.secondarySystemBackground))
                .cornerRadius(12)
            }
        }
    }
    
    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Activity")
                    .font(.headline)
                
                Spacer()
                
                NavigationLink(destination: ActivityLogView()) {
                    Text("View All")
                        .font(.caption)
                        .foregroundColor(.blue)
                }
            }
            
            VStack(spacing: 8) {
                ForEach(mockActivities) { activity in
                    ActivityRow(activity: activity)
                }
            }
        }
    }
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
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
                
                if accountService.hasPermission(\.canInviteUsers) {
                    QuickActionButton(
                        title: "Invite User",
                        icon: "person.badge.plus",
                        color: .purple
                    ) {
                        // Show invite dialog
                    }
                }
                
                if accountService.hasPermission(\.canCreateSubAccounts) {
                    QuickActionButton(
                        title: "Sub-Account",
                        icon: "building.2.crop.circle",
                        color: .indigo
                    ) {
                        // Create sub-account
                    }
                }
                
                QuickActionButton(
                    title: "Reports",
                    icon: "chart.pie.fill",
                    color: .teal
                ) {
                    // View reports
                }
            }
        }
    }
    
    // MARK: - Methods
    
    private func loadDashboard() async {
        isLoading = true
        defer { isLoading = false }
        
        // Load dashboard data in parallel
        await withTaskGroup(of: Void.self) { group in
            group.addTask {
                await self.accountService.loadCurrentAccount()
            }
            
            group.addTask {
                await self.accountService.loadAccountHierarchy()
            }
            
            group.addTask {
                // Load dashboard stats
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                self.stats = DashboardStats(
                    totalBackups: 1234,
                    activeSources: 5,
                    storageUsed: 5_368_709_120,
                    lastSync: "2 hours ago"
                )
            }
        }
    }
    
    private func formatBytes(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .binary
        return formatter.string(fromByteCount: bytes)
    }
    
    private func generateChartData() -> [ChartDataPoint] {
        let calendar = Calendar.current
        let endDate = Date()
        var dataPoints: [ChartDataPoint] = []
        
        let numberOfPoints = selectedTimeRange == .day ? 24 : 
                           selectedTimeRange == .week ? 7 : 
                           selectedTimeRange == .month ? 30 : 12
        
        for i in 0..<numberOfPoints {
            let date: Date
            switch selectedTimeRange {
            case .day:
                date = calendar.date(byAdding: .hour, value: -i, to: endDate)!
            case .week:
                date = calendar.date(byAdding: .day, value: -i, to: endDate)!
            case .month:
                date = calendar.date(byAdding: .day, value: -i, to: endDate)!
            case .year:
                date = calendar.date(byAdding: .month, value: -i, to: endDate)!
            }
            
            let value = Double.random(in: 3.5...5.5) + Double(i) * 0.1
            dataPoints.append(ChartDataPoint(date: date, value: value))
        }
        
        return dataPoints.reversed()
    }
}

// MARK: - Supporting Views

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    let trend: Trend
    var subtitle: String? = nil
    
    enum Trend {
        case up(Double)
        case down(Double)
        case neutral
        
        var icon: String {
            switch self {
            case .up: return "arrow.up.right"
            case .down: return "arrow.down.right"
            case .neutral: return "minus"
            }
        }
        
        var color: Color {
            switch self {
            case .up: return .green
            case .down: return .red
            case .neutral: return .gray
            }
        }
        
        var text: String {
            switch self {
            case .up(let value): return "+\(Int(value))%"
            case .down(let value): return "-\(Int(value))%"
            case .neutral: return "—"
            }
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                
                Spacer()
                
                HStack(spacing: 4) {
                    Image(systemName: trend.icon)
                        .font(.caption)
                    Text(trend.text)
                        .font(.caption)
                        .fontWeight(.medium)
                }
                .foregroundColor(trend.color)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct ActivityRow: View {
    let activity: Activity
    
    var body: some View {
        HStack {
            Circle()
                .fill(activity.statusColor)
                .frame(width: 8, height: 8)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(activity.title)
                    .font(.subheadline)
                Text("\(activity.source) • \(activity.timeAgo)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if activity.hasDetails {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(10)
    }
}

// MARK: - Models

struct ChartDataPoint {
    let date: Date
    let value: Double
}

struct Activity: Identifiable {
    let id = UUID()
    let title: String
    let source: String
    let timeAgo: String
    let status: Status
    let hasDetails: Bool
    
    enum Status {
        case success, warning, error, info
    }
    
    var statusColor: Color {
        switch status {
        case .success: return .green
        case .warning: return .orange
        case .error: return .red
        case .info: return .blue
        }
    }
}

// Mock data
let mockActivities = [
    Activity(title: "Backup completed", source: "Keap", timeAgo: "2 minutes ago", status: .success, hasDetails: true),
    Activity(title: "New source added", source: "Stripe", timeAgo: "1 hour ago", status: .info, hasDetails: false),
    Activity(title: "Sync failed", source: "MailChimp", timeAgo: "3 hours ago", status: .error, hasDetails: true),
    Activity(title: "Storage warning", source: "System", timeAgo: "1 day ago", status: .warning, hasDetails: true)
]

// MARK: - Placeholder Views

struct AccountSwitcherView: View {
    var body: some View {
        Text("Account Switcher")
    }
}

struct AccountSettingsView: View {
    var body: some View {
        Text("Account Settings")
    }
}

struct AccountHierarchyView: View {
    var body: some View {
        Text("Account Hierarchy")
    }
}

struct ActivityLogView: View {
    var body: some View {
        Text("Activity Log")
    }
}

#Preview {
    NavigationStack {
        EnhancedDashboardView()
            .environmentObject(AuthManager.shared)
    }
}