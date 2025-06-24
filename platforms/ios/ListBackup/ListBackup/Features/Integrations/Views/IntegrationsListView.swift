//
//  IntegrationsListView.swift
//  ListBackup
//
//  Shows list of available integrations and user's sources
//

import SwiftUI

struct IntegrationsListView: View {
    @StateObject private var viewModel = IntegrationsViewModel()
    @State private var selectedTab = 0
    @State private var showAddSource = false
    @State private var selectedIntegration: Integration?
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Segmented Control
                Picker("View", selection: $selectedTab) {
                    Text("My Sources").tag(0)
                    Text("Available").tag(1)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()
                
                // Content
                if selectedTab == 0 {
                    sourcesView
                } else {
                    availableIntegrationsView
                }
            }
            .navigationTitle("Integrations")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                if selectedTab == 0 {
                    ToolbarItem(placement: .primaryAction) {
                        Button {
                            showAddSource = true
                        } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                await viewModel.loadData()
            }
            .sheet(isPresented: $showAddSource) {
                NavigationStack {
                    AddSourceView()
                }
            }
            .sheet(item: $selectedIntegration) { integration in
                NavigationStack {
                    IntegrationDetailView(integration: integration)
                }
            }
        }
    }
    
    // MARK: - Views
    
    private var sourcesView: some View {
        Group {
            if viewModel.isLoadingSources {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.sources.isEmpty {
                emptySourcesView
            } else {
                List {
                    ForEach(viewModel.sources) { source in
                        SourceRow(source: source) {
                            await viewModel.syncSource(source)
                        }
                    }
                    .onDelete { indexSet in
                        Task {
                            for index in indexSet {
                                await viewModel.deleteSource(viewModel.sources[index])
                            }
                        }
                    }
                }
                .listStyle(InsetGroupedListStyle())
            }
        }
    }
    
    private var availableIntegrationsView: some View {
        Group {
            if viewModel.isLoadingIntegrations {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        ForEach(viewModel.availableIntegrations) { integration in
                            IntegrationCard(integration: integration) {
                                selectedIntegration = integration
                            }
                        }
                    }
                    .padding()
                }
            }
        }
    }
    
    private var emptySourcesView: some View {
        VStack(spacing: 20) {
            Image(systemName: "link.badge.plus")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            VStack(spacing: 8) {
                Text("No Sources Connected")
                    .font(.title2)
                    .fontWeight(.semibold)
                
                Text("Connect your first data source to start backing up your data")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            Button {
                showAddSource = true
            } label: {
                Label("Add Your First Source", systemImage: "plus.circle.fill")
                    .font(.callout)
                    .fontWeight(.medium)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .tint(Color(red: 0.2, green: 0.6, blue: 0.9))
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Source Row

struct SourceRow: View {
    let source: Source
    let onSync: () async -> Void
    @State private var isSyncing = false
    
    var body: some View {
        HStack(spacing: 12) {
            // Icon
            RoundedRectangle(cornerRadius: 10)
                .fill(Color(source.status.displayColor).opacity(0.1))
                .frame(width: 50, height: 50)
                .overlay(
                    Image(systemName: iconForType(source.type))
                        .font(.title2)
                        .foregroundColor(Color(source.status.displayColor))
                )
            
            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(source.name)
                    .font(.headline)
                
                HStack {
                    Label(source.type.capitalized, systemImage: "puzzlepiece.extension")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if let lastSync = source.lastSyncDate {
                        Text("• Last sync: \(lastSync.relativeFormat)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
            
            // Status & Action
            VStack {
                StatusBadge(status: source.status)
                
                if source.status != .syncing {
                    Button {
                        Task {
                            isSyncing = true
                            await onSync()
                            isSyncing = false
                        }
                    } label: {
                        if isSyncing {
                            ProgressView()
                                .scaleEffect(0.7)
                        } else {
                            Image(systemName: "arrow.triangle.2.circlepath")
                                .font(.caption)
                        }
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    .disabled(isSyncing)
                }
            }
        }
        .padding(.vertical, 8)
    }
    
    private func iconForType(_ type: String) -> String {
        switch type.lowercased() {
        case "keap":
            return "person.2.circle"
        case "stripe":
            return "creditcard.circle"
        case "gohighlevel":
            return "chart.line.uptrend.xyaxis.circle"
        case "mailchimp":
            return "envelope.circle"
        case "activecampaign":
            return "bell.circle"
        default:
            return "puzzlepiece.extension"
        }
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let status: Source.SourceStatus
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(Color(status.displayColor))
                .frame(width: 6, height: 6)
            
            Text(status.rawValue.capitalized)
                .font(.caption2)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color(status.displayColor).opacity(0.1))
        .cornerRadius(8)
    }
}

// MARK: - Integration Card

struct IntegrationCard: View {
    let integration: Integration
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 12) {
                // Icon
                RoundedRectangle(cornerRadius: 16)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(hex: integration.displayColor).opacity(0.8),
                                Color(hex: integration.displayColor)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 60, height: 60)
                    .overlay(
                        Image(systemName: integration.iconSystemName)
                            .font(.title)
                            .foregroundColor(.white)
                    )
                
                // Name
                Text(integration.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                    .lineLimit(1)
                
                // Type
                Text(integration.type.uppercased())
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color(UIColor.secondarySystemBackground))
            .cornerRadius(16)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - View Model

@MainActor
class IntegrationsViewModel: ObservableObject {
    @Published var sources: [Source] = []
    @Published var availableIntegrations: [Integration] = []
    @Published var isLoadingSources = false
    @Published var isLoadingIntegrations = false
    @Published var error: APIError?
    
    private let apiClient = APIClient.shared
    
    func loadData() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.loadSources() }
            group.addTask { await self.loadIntegrations() }
        }
    }
    
    func refresh() async {
        await loadData()
    }
    
    private func loadSources() async {
        isLoadingSources = true
        defer { isLoadingSources = false }
        
        do {
            sources = try await apiClient.request(.getSources())
        } catch {
            self.error = error as? APIError ?? .unknown
        }
    }
    
    private func loadIntegrations() async {
        isLoadingIntegrations = true
        defer { isLoadingIntegrations = false }
        
        do {
            let response: IntegrationsResponse = try await apiClient.request(.getAvailableIntegrations())
            availableIntegrations = response.integrations
        } catch {
            self.error = error as? APIError ?? .unknown
        }
    }
    
    func syncSource(_ source: Source) async {
        do {
            let _: EmptyResponse = try await apiClient.request(.syncSource(id: source.id))
            // Refresh sources after sync
            await loadSources()
        } catch {
            self.error = error as? APIError ?? .unknown
        }
    }
    
    func deleteSource(_ source: Source) async {
        do {
            let _: EmptyResponse = try await apiClient.request(.deleteSource(id: source.id))
            // Remove from local array
            sources.removeAll { $0.id == source.id }
        } catch {
            self.error = error as? APIError ?? .unknown
        }
    }
}

// MARK: - Response Models

struct IntegrationsResponse: Decodable {
    let integrations: [Integration]
    let total: Int
}

// MARK: - Extensions

extension Date {
    var relativeFormat: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: self, relativeTo: Date())
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview {
    NavigationStack {
        IntegrationsListView()
    }
}