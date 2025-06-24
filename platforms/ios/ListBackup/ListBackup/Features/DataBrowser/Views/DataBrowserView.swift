//
//  DataBrowserView.swift
//  ListBackup
//
//  Browse and search backed up data files
//

import SwiftUI

struct DataBrowserView: View {
    @StateObject private var viewModel = DataBrowserViewModel()
    @State private var searchText = ""
    @State private var selectedSource: Source?
    @State private var selectedFile: FileItem?
    @State private var showFilters = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search Bar
                searchBar
                
                // Filters
                if showFilters {
                    filtersView
                        .transition(.move(edge: .top).combined(with: .opacity))
                }
                
                // Content
                if viewModel.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.files.isEmpty {
                    emptyStateView
                } else {
                    fileListView
                }
            }
            .navigationTitle("Data Browser")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            showFilters.toggle()
                        }
                    } label: {
                        Image(systemName: showFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                await viewModel.loadData()
            }
            .sheet(item: $selectedFile) { file in
                NavigationStack {
                    FileDetailView(file: file)
                }
            }
        }
    }
    
    // MARK: - Views
    
    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            
            TextField("Search files...", text: $searchText)
                .textFieldStyle(.plain)
                .submitLabel(.search)
                .onSubmit {
                    Task {
                        await viewModel.search(query: searchText)
                    }
                }
            
            if !searchText.isEmpty {
                Button {
                    searchText = ""
                    Task {
                        await viewModel.clearSearch()
                    }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
    }
    
    private var filtersView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                // Source Filter
                Menu {
                    Button("All Sources") {
                        selectedSource = nil
                        Task { await viewModel.filterBySource(nil) }
                    }
                    
                    Divider()
                    
                    ForEach(viewModel.sources) { source in
                        Button(source.name) {
                            selectedSource = source
                            Task { await viewModel.filterBySource(source.id) }
                        }
                    }
                } label: {
                    FilterChip(
                        title: selectedSource?.name ?? "All Sources",
                        isSelected: selectedSource != nil
                    )
                }
                
                // Date Filter
                Menu {
                    Button("All Time") {
                        Task { await viewModel.filterByDate(nil) }
                    }
                    Button("Today") {
                        Task { await viewModel.filterByDate(.today) }
                    }
                    Button("Last 7 Days") {
                        Task { await viewModel.filterByDate(.week) }
                    }
                    Button("Last 30 Days") {
                        Task { await viewModel.filterByDate(.month) }
                    }
                } label: {
                    FilterChip(
                        title: viewModel.dateFilterTitle,
                        isSelected: viewModel.dateFilter != nil
                    )
                }
                
                // File Type Filter
                Menu {
                    Button("All Types") {
                        Task { await viewModel.filterByType(nil) }
                    }
                    
                    Divider()
                    
                    ForEach(["json", "csv", "xml", "xlsx"], id: \.self) { type in
                        Button(type.uppercased()) {
                            Task { await viewModel.filterByType(type) }
                        }
                    }
                } label: {
                    FilterChip(
                        title: viewModel.typeFilter?.uppercased() ?? "All Types",
                        isSelected: viewModel.typeFilter != nil
                    )
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
        .background(Color(UIColor.systemBackground))
    }
    
    private var fileListView: some View {
        List {
            ForEach(viewModel.groupedFiles, id: \.date) { group in
                Section(header: Text(group.date.formatted(date: .abbreviated, time: .omitted))) {
                    ForEach(group.files) { file in
                        FileRow(file: file) {
                            selectedFile = file
                        }
                    }
                }
            }
        }
        .listStyle(InsetGroupedListStyle())
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "folder.badge.questionmark")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            VStack(spacing: 8) {
                Text(searchText.isEmpty ? "No Data Found" : "No Results")
                    .font(.title2)
                    .fontWeight(.semibold)
                
                Text(searchText.isEmpty ? "Your backed up data will appear here" : "Try adjusting your search or filters")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            if !searchText.isEmpty {
                Button {
                    searchText = ""
                    Task { await viewModel.clearSearch() }
                } label: {
                    Text("Clear Search")
                        .font(.callout)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - File Row

struct FileRow: View {
    let file: FileItem
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // File Icon
                Image(systemName: file.icon)
                    .font(.title2)
                    .foregroundColor(colorForFileType(file.fileExtension))
                    .frame(width: 40)
                
                // File Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(file.name)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                        .lineLimit(1)
                    
                    HStack(spacing: 8) {
                        Text(formatFileSize(file.size))
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        if let metadata = file.metadata, let recordCount = metadata.recordCount {
                            Text("•")
                                .foregroundColor(.secondary)
                            
                            Text("\(recordCount) records")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                Spacer()
                
                // Download Indicator
                Image(systemName: "arrow.down.circle")
                    .font(.body)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
    }
    
    private func colorForFileType(_ type: String) -> Color {
        switch type {
        case "json":
            return .blue
        case "csv":
            return .green
        case "xml":
            return .orange
        case "xlsx", "xls":
            return .green
        default:
            return .secondary
        }
    }
    
    private func formatFileSize(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    
    var body: some View {
        HStack(spacing: 4) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
            
            if isSelected {
                Image(systemName: "chevron.down")
                    .font(.caption2)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(isSelected ? Color(red: 0.2, green: 0.6, blue: 0.9) : Color(UIColor.tertiarySystemBackground))
        .foregroundColor(isSelected ? .white : .primary)
        .cornerRadius(20)
    }
}

// MARK: - View Model

@MainActor
class DataBrowserViewModel: ObservableObject {
    @Published var files: [FileItem] = []
    @Published var sources: [Source] = []
    @Published var isLoading = false
    @Published var error: APIError?
    
    // Filters
    @Published var dateFilter: DateFilter?
    @Published var typeFilter: String?
    @Published var sourceFilter: String?
    
    private let apiClient = APIClient.shared
    
    enum DateFilter {
        case today
        case week
        case month
    }
    
    var dateFilterTitle: String {
        switch dateFilter {
        case .today:
            return "Today"
        case .week:
            return "Last 7 Days"
        case .month:
            return "Last 30 Days"
        case nil:
            return "All Time"
        }
    }
    
    var groupedFiles: [(date: Date, files: [FileItem])] {
        let grouped = Dictionary(grouping: files) { file in
            Calendar.current.startOfDay(for: file.createdAt)
        }
        
        return grouped
            .map { (date: $0.key, files: $0.value) }
            .sorted { $0.date > $1.date }
    }
    
    func loadData() async {
        isLoading = true
        defer { isLoading = false }
        
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.loadFiles() }
            group.addTask { await self.loadSources() }
        }
    }
    
    func refresh() async {
        await loadData()
    }
    
    private func loadFiles() async {
        do {
            let response: ListResponse<FileItem> = try await apiClient.request(
                .listData(sourceId: sourceFilter, limit: 100, offset: 0)
            )
            files = response.items
        } catch {
            self.error = error as? APIError ?? .unknown
        }
    }
    
    private func loadSources() async {
        do {
            sources = try await apiClient.request(.getSources())
        } catch {
            // Non-critical error
        }
    }
    
    func search(query: String) async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let response: ListResponse<FileItem> = try await apiClient.request(
                .searchData(query: query, sourceId: sourceFilter)
            )
            files = response.items
        } catch {
            self.error = error as? APIError ?? .unknown
        }
    }
    
    func clearSearch() async {
        await loadFiles()
    }
    
    func filterBySource(_ sourceId: String?) async {
        sourceFilter = sourceId
        await loadFiles()
    }
    
    func filterByDate(_ filter: DateFilter?) async {
        dateFilter = filter
        await loadFiles()
    }
    
    func filterByType(_ type: String?) async {
        typeFilter = type
        await loadFiles()
    }
}

// MARK: - File Detail View

struct FileDetailView: View {
    let file: FileItem
    @Environment(\.dismiss) var dismiss
    @State private var isDownloading = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // File Header
                HStack(spacing: 16) {
                    Image(systemName: file.icon)
                        .font(.largeTitle)
                        .foregroundColor(.blue)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(file.name)
                            .font(.title3)
                            .fontWeight(.semibold)
                        
                        Text(formatFileSize(file.size))
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
                .padding()
                .background(Color(UIColor.secondarySystemBackground))
                .cornerRadius(12)
                
                // Metadata
                if let metadata = file.metadata {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Details")
                            .font(.headline)
                        
                        DetailRow(label: "Type", value: file.fileExtension.uppercased())
                        DetailRow(label: "Created", value: file.createdAt.formatted())
                        DetailRow(label: "Modified", value: file.modifiedAt.formatted())
                        
                        if let recordCount = metadata.recordCount {
                            DetailRow(label: "Records", value: "\(recordCount)")
                        }
                        
                        if let dataType = metadata.dataType {
                            DetailRow(label: "Data Type", value: dataType.capitalized)
                        }
                        
                        if metadata.compressed {
                            DetailRow(label: "Compressed", value: "Yes")
                        }
                        
                        if metadata.encrypted {
                            DetailRow(label: "Encrypted", value: "Yes")
                        }
                    }
                }
                
                // Actions
                VStack(spacing: 12) {
                    Button {
                        downloadFile()
                    } label: {
                        HStack {
                            if isDownloading {
                                ProgressView()
                                    .scaleEffect(0.8)
                            } else {
                                Image(systemName: "arrow.down.circle.fill")
                            }
                            Text("Download")
                                .fontWeight(.medium)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(red: 0.2, green: 0.6, blue: 0.9))
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isDownloading)
                    
                    Button {
                        shareFile()
                    } label: {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                            Text("Share")
                                .fontWeight(.medium)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(UIColor.secondarySystemBackground))
                        .cornerRadius(12)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("File Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Done") {
                    dismiss()
                }
            }
        }
    }
    
    private func formatFileSize(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }
    
    private func downloadFile() {
        isDownloading = true
        
        Task {
            do {
                let (data, filename) = try await APIClient.shared.download(
                    .downloadData(fileId: file.id)
                )
                
                // Save to Files app
                // This would need actual implementation
                
                isDownloading = false
            } catch {
                isDownloading = false
            }
        }
    }
    
    private func shareFile() {
        // Share functionality
    }
}

struct DetailRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationStack {
        DataBrowserView()
    }
}