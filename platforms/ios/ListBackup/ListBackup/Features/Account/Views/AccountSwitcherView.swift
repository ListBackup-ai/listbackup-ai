//
//  AccountSwitcherView.swift
//  ListBackup
//
//  Account switcher with hierarchy navigation
//

import SwiftUI

struct AccountSwitcherView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var accountService = AccountService.shared
    @State private var searchText = ""
    @State private var expandedAccounts: Set<String> = []
    @State private var isLoading = false
    @State private var showCreateSubAccount = false
    @State private var selectedParentAccount: Account?
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search Bar
                searchBar
                
                // Account List
                if accountService.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        VStack(spacing: 12) {
                            if let hierarchy = accountService.accountHierarchy {
                                accountHierarchyView(hierarchy)
                            } else {
                                // Flat list fallback
                                ForEach(filteredAccounts) { accountWithPermissions in
                                    accountRow(
                                        account: accountWithPermissions.account,
                                        role: accountWithPermissions.userRole,
                                        isSelected: accountWithPermissions.account.id == accountService.currentAccount?.id
                                    )
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Switch Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    if accountService.hasPermission(\.canCreateSubAccounts) {
                        Button {
                            selectedParentAccount = accountService.currentAccount
                            showCreateSubAccount = true
                        } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showCreateSubAccount) {
            CreateSubAccountView(parentAccount: selectedParentAccount)
        }
        .task {
            await accountService.loadAvailableAccounts()
            await accountService.loadAccountHierarchy()
            
            // Auto-expand current account path
            if let currentAccountId = accountService.currentAccount?.accountId {
                let path = accountService.buildAccountPath(for: currentAccountId)
                path.forEach { expandedAccounts.insert($0.accountId) }
            }
        }
    }
    
    // MARK: - Views
    
    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            
            TextField("Search accounts...", text: $searchText)
                .textFieldStyle(.plain)
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(10)
        .padding()
    }
    
    @ViewBuilder
    private func accountHierarchyView(_ node: AccountHierarchyNode) -> some View {
        let isExpanded = expandedAccounts.contains(node.account.accountId)
        let hasChildren = (node.children?.count ?? 0) > 0
        let isSelected = node.account.accountId == accountService.currentAccount?.accountId
        let role = accountService.availableAccounts.first { 
            $0.account.accountId == node.account.accountId 
        }?.userRole ?? .viewer
        
        VStack(spacing: 8) {
            // Account Row
            HStack {
                // Expand/Collapse Button
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                        if isExpanded {
                            expandedAccounts.remove(node.account.accountId)
                        } else {
                            expandedAccounts.insert(node.account.accountId)
                        }
                    }
                } label: {
                    Image(systemName: isExpanded ? "chevron.down" : "chevron.right")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(width: 20)
                }
                .opacity(hasChildren ? 1 : 0)
                .disabled(!hasChildren)
                
                // Account Info
                accountRow(
                    account: node.account,
                    role: role,
                    isSelected: isSelected,
                    showActions: true,
                    onCreateSubAccount: {
                        selectedParentAccount = node.account
                        showCreateSubAccount = true
                    }
                )
            }
            
            // Children (if expanded)
            if isExpanded, let children = node.children {
                VStack(spacing: 8) {
                    ForEach(children, id: \.account.id) { childNode in
                        HStack {
                            Spacer()
                                .frame(width: 20)
                            
                            accountHierarchyView(childNode)
                        }
                    }
                }
                .padding(.leading, 20)
            }
        }
    }
    
    private func accountRow(
        account: Account,
        role: UserRole,
        isSelected: Bool,
        showActions: Bool = false,
        onCreateSubAccount: (() -> Void)? = nil
    ) -> some View {
        Button {
            Task {
                isLoading = true
                do {
                    try await accountService.switchAccount(account.accountId)
                    dismiss()
                } catch {
                    // Handle error
                }
                isLoading = false
            }
        } label: {
            HStack(spacing: 12) {
                // Account Icon
                Image(systemName: account.accountType?.icon ?? "building.2.fill")
                    .font(.title3)
                    .foregroundColor(.blue)
                    .frame(width: 40, height: 40)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(10)
                
                // Account Info
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(account.name)
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        if isSelected {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                    }
                    
                    HStack(spacing: 8) {
                        if let company = account.company {
                            Text(company)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        // Role Badge
                        Label(role.displayName, systemImage: role.icon)
                            .font(.caption2)
                            .foregroundColor(.blue)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(4)
                    }
                    
                    // Usage Info
                    HStack(spacing: 12) {
                        Label("\(account.usage.sources.used) sources", systemImage: "server.rack")
                        Label(formatBytes(Int64(account.usage.storage.used)), systemImage: "externaldrive")
                    }
                    .font(.caption2)
                    .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Actions
                if showActions && accountService.hasPermission(\.canCreateSubAccounts) {
                    Menu {
                        Button {
                            onCreateSubAccount?()
                        } label: {
                            Label("Create Sub-Account", systemImage: "building.2.crop.circle")
                        }
                        
                        Button {
                            // Navigate to account details
                        } label: {
                            Label("View Details", systemImage: "info.circle")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.blue.opacity(0.1) : Color(UIColor.secondarySystemBackground))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(.plain)
        .disabled(isLoading)
    }
    
    // MARK: - Computed Properties
    
    private var filteredAccounts: [AccountWithPermissions] {
        guard !searchText.isEmpty else {
            return accountService.availableAccounts
        }
        
        return accountService.availableAccounts.filter { accountWithPermissions in
            let account = accountWithPermissions.account
            return account.name.localizedCaseInsensitiveContains(searchText) ||
                   (account.company?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }
    
    // MARK: - Helper Methods
    
    private func formatBytes(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .binary
        formatter.zeroPadsFractionDigits = false
        return formatter.string(fromByteCount: bytes)
    }
}

// MARK: - Create Sub-Account View

struct CreateSubAccountView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var accountService = AccountService.shared
    
    let parentAccount: Account?
    @State private var accountName = ""
    @State private var companyName = ""
    @State private var selectedType: AccountType = .location
    @State private var isLoading = false
    @State private var error: String?
    
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if let parent = parentAccount {
                        HStack {
                            Text("Parent Account")
                                .foregroundColor(.secondary)
                            Spacer()
                            Text(parent.name)
                                .fontWeight(.medium)
                        }
                    }
                }
                
                Section("Account Details") {
                    TextField("Account Name", text: $accountName)
                    TextField("Company Name (Optional)", text: $companyName)
                    
                    Picker("Account Type", selection: $selectedType) {
                        ForEach(AccountType.allCases, id: \.self) { type in
                            Label(type.displayName, systemImage: type.icon)
                                .tag(type)
                        }
                    }
                }
                
                Section {
                    Text("This sub-account will inherit billing and limits from its parent account.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if let error = error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("New Sub-Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") {
                        createSubAccount()
                    }
                    .disabled(accountName.isEmpty || isLoading)
                }
            }
        }
    }
    
    private func createSubAccount() {
        isLoading = true
        error = nil
        
        Task {
            do {
                _ = try await accountService.createSubAccount(
                    name: accountName,
                    company: companyName.isEmpty ? nil : companyName,
                    accountType: selectedType
                )
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    AccountSwitcherView()
}