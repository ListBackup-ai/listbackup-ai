//
//  AddSourceView.swift
//  ListBackup
//
//  View for adding a new data source
//

import SwiftUI

struct AddSourceView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var viewModel = AddSourceViewModel()
    @State private var selectedIntegration: Integration?
    @State private var sourceName = ""
    @State private var credentials: [String: String] = [:]
    @State private var showError = false
    @FocusState private var focusedField: String?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                if selectedIntegration == nil {
                    // Integration Selection
                    integrationSelectionView
                } else {
                    // Configuration Form
                    configurationFormView
                }
            }
            .padding()
        }
        .navigationTitle(selectedIntegration == nil ? "Select Integration" : "Configure \(selectedIntegration?.name ?? "")")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
            }
            
            if selectedIntegration != nil {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveSource()
                    }
                    .disabled(!isFormValid)
                }
            }
        }
        .alert("Error", isPresented: $showError) {
            Button("OK") { showError = false }
        } message: {
            Text(viewModel.error?.localizedDescription ?? "Failed to create source")
        }
        .onChange(of: viewModel.error) { error in
            showError = error != nil
        }
        .task {
            await viewModel.loadIntegrations()
        }
    }
    
    // MARK: - Views
    
    private var integrationSelectionView: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Choose a platform to connect")
                .font(.headline)
            
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: 200)
            } else {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                    ForEach(viewModel.availableIntegrations) { integration in
                        IntegrationSelectionCard(integration: integration) {
                            withAnimation {
                                selectedIntegration = integration
                                // Initialize credentials dictionary
                                credentials = integration.requiredFields.reduce(into: [:]) { dict, field in
                                    dict[field.key] = ""
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    private var configurationFormView: some View {
        VStack(spacing: 20) {
            // Integration Header
            HStack(spacing: 16) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(hex: selectedIntegration?.displayColor ?? "#3B82F6"))
                    .frame(width: 60, height: 60)
                    .overlay(
                        Image(systemName: selectedIntegration?.iconSystemName ?? "puzzlepiece.extension")
                            .font(.title)
                            .foregroundColor(.white)
                    )
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(selectedIntegration?.name ?? "")
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    Text(selectedIntegration?.description ?? "")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                Spacer()
            }
            .padding()
            .background(Color(UIColor.secondarySystemBackground))
            .cornerRadius(12)
            
            // Source Name
            VStack(alignment: .leading, spacing: 8) {
                Text("Source Name")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                TextField("e.g., My \(selectedIntegration?.name ?? "") Account", text: $sourceName)
                    .textFieldStyle(.plain)
                    .padding()
                    .background(Color(UIColor.tertiarySystemBackground))
                    .cornerRadius(10)
                    .focused($focusedField, equals: "name")
            }
            
            Divider()
            
            // Credentials
            VStack(alignment: .leading, spacing: 16) {
                Text("Credentials")
                    .font(.headline)
                
                ForEach(selectedIntegration?.requiredFields ?? [], id: \.key) { field in
                    credentialFieldView(field: field)
                }
            }
            
            // Help Text
            if let integration = selectedIntegration {
                VStack(alignment: .leading, spacing: 8) {
                    Label("Need help finding your credentials?", systemImage: "questionmark.circle")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Link("View setup guide", destination: URL(string: "https://docs.listbackup.ai/integrations/\(integration.type.lowercased())")!)
                        .font(.caption)
                }
                .padding()
                .background(Color(UIColor.tertiarySystemBackground))
                .cornerRadius(10)
            }
        }
    }
    
    @ViewBuilder
    private func credentialFieldView(field: IntegrationField) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(field.label)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                if field.required {
                    Text("*")
                        .foregroundColor(.red)
                }
            }
            
            HStack {
                if field.type == .password {
                    SecureField(field.placeholder ?? field.label, text: binding(for: field.key))
                        .textFieldStyle(.plain)
                } else {
                    TextField(field.placeholder ?? field.label, text: binding(for: field.key))
                        .textFieldStyle(.plain)
                        .keyboardType(keyboardType(for: field.type))
                        .autocapitalization(field.type == .email || field.type == .url ? .none : .words)
                        .disableAutocorrection(true)
                }
            }
            .padding()
            .background(Color(UIColor.tertiarySystemBackground))
            .cornerRadius(10)
            .focused($focusedField, equals: field.key)
            
            if let helpText = field.helpText {
                Text(helpText)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    // MARK: - Methods
    
    private func binding(for key: String) -> Binding<String> {
        Binding(
            get: { credentials[key] ?? "" },
            set: { credentials[key] = $0 }
        )
    }
    
    private func keyboardType(for fieldType: IntegrationField.FieldType) -> UIKeyboardType {
        switch fieldType {
        case .email:
            return .emailAddress
        case .url:
            return .URL
        default:
            return .default
        }
    }
    
    private var isFormValid: Bool {
        guard let integration = selectedIntegration,
              !sourceName.isEmpty else { return false }
        
        // Check all required fields have values
        for field in integration.requiredFields where field.required {
            if credentials[field.key]?.isEmpty ?? true {
                return false
            }
        }
        
        return true
    }
    
    private func saveSource() {
        guard let integration = selectedIntegration else { return }
        
        Task {
            await viewModel.createSource(
                name: sourceName,
                type: integration.type,
                configuration: credentials
            )
            
            if viewModel.error == nil {
                dismiss()
            }
        }
    }
}

// MARK: - Integration Selection Card

struct IntegrationSelectionCard: View {
    let integration: Integration
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(hex: integration.displayColor).opacity(0.1))
                    .frame(height: 100)
                    .overlay(
                        Image(systemName: integration.iconSystemName)
                            .font(.largeTitle)
                            .foregroundColor(Color(hex: integration.displayColor))
                    )
                
                Text(integration.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                if integration.isPremium {
                    Label("Premium", systemImage: "star.fill")
                        .font(.caption2)
                        .foregroundColor(.orange)
                }
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
class AddSourceViewModel: ObservableObject {
    @Published var availableIntegrations: [Integration] = []
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var error: APIError?
    
    private let apiClient = APIClient.shared
    
    func loadIntegrations() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let response: IntegrationsResponse = try await apiClient.request(.getAvailableIntegrations())
            availableIntegrations = response.integrations.filter { $0.isAvailable }
        } catch {
            self.error = error as? APIError ?? .unknown
        }
    }
    
    func createSource(name: String, type: String, configuration: [String: String]) async {
        isSaving = true
        defer { isSaving = false }
        
        do {
            let sourceData: [String: Any] = [
                "name": name,
                "type": type,
                "configuration": configuration
            ]
            
            let _: Source = try await apiClient.request(.createSource(source: sourceData))
        } catch {
            self.error = error as? APIError ?? .unknown
        }
    }
}

#Preview {
    NavigationStack {
        AddSourceView()
    }
}