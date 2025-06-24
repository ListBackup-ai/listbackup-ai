//
//  SettingsView.swift
//  ListBackup
//
//  App settings and user profile management
//

import SwiftUI
import LocalAuthentication

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var showProfileEditor = false
    @State private var showAbout = false
    @State private var showSupport = false
    @State private var biometricEnabled = false
    @State private var notificationsEnabled = false
    @State private var showLogoutAlert = false
    
    var body: some View {
        NavigationStack {
            List {
                // Profile Section
                profileSection
                
                // Preferences Section
                preferencesSection
                
                // Data & Storage Section
                dataSection
                
                // Support Section
                supportSection
                
                // About Section
                aboutSection
                
                // Logout Button
                logoutSection
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showProfileEditor) {
                NavigationStack {
                    ProfileEditorView()
                }
            }
            .sheet(isPresented: $showAbout) {
                NavigationStack {
                    AboutView()
                }
            }
            .sheet(isPresented: $showSupport) {
                NavigationStack {
                    SupportView()
                }
            }
            .alert("Log Out", isPresented: $showLogoutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Log Out", role: .destructive) {
                    Task {
                        await authManager.logout()
                    }
                }
            } message: {
                Text("Are you sure you want to log out?")
            }
            .task {
                await loadSettings()
            }
        }
    }
    
    // MARK: - Sections
    
    private var profileSection: some View {
        Section {
            Button {
                showProfileEditor = true
            } label: {
                HStack(spacing: 16) {
                    // Avatar
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
                        .frame(width: 60, height: 60)
                        .overlay(
                            Text(authManager.currentUser?.initials ?? "??")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                        )
                    
                    // User Info
                    VStack(alignment: .leading, spacing: 4) {
                        Text(authManager.currentUser?.fullName ?? "User")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text(authManager.currentUser?.email ?? "")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        if let verified = authManager.currentUser?.emailVerified, !verified {
                            Label("Email not verified", systemImage: "exclamationmark.circle.fill")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(.tertiaryLabel)
                }
                .padding(.vertical, 8)
            }
            .buttonStyle(.plain)
        }
    }
    
    private var preferencesSection: some View {
        Section("Preferences") {
            // Biometric Authentication
            if BiometricAuth.shared.canUseBiometrics() {
                Toggle(isOn: $biometricEnabled) {
                    Label(BiometricAuth.shared.biometricTypeString(), systemImage: biometricIcon())
                }
                .onChange(of: biometricEnabled) { enabled in
                    Task {
                        if enabled {
                            await enableBiometric()
                        } else {
                            authManager.disableBiometricAuthentication()
                        }
                    }
                }
            }
            
            // Notifications
            Toggle(isOn: $notificationsEnabled) {
                Label("Push Notifications", systemImage: "bell")
            }
            .onChange(of: notificationsEnabled) { enabled in
                Task {
                    await updateNotificationSettings(enabled)
                }
            }
            
            // Auto-sync
            NavigationLink {
                AutoSyncSettingsView()
            } label: {
                Label("Auto-sync Settings", systemImage: "arrow.triangle.2.circlepath")
            }
        }
    }
    
    private var dataSection: some View {
        Section("Data & Storage") {
            // Cache Management
            HStack {
                Label("Cache Size", systemImage: "internaldrive")
                Spacer()
                Text("124 MB")
                    .foregroundColor(.secondary)
            }
            
            Button {
                clearCache()
            } label: {
                Label("Clear Cache", systemImage: "trash")
                    .foregroundColor(.red)
            }
            
            // Export Settings
            NavigationLink {
                ExportSettingsView()
            } label: {
                Label("Export Settings", systemImage: "square.and.arrow.up")
            }
        }
    }
    
    private var supportSection: some View {
        Section("Support") {
            Button {
                showSupport = true
            } label: {
                Label("Help & Support", systemImage: "questionmark.circle")
                    .foregroundColor(.primary)
            }
            
            Link(destination: URL(string: "https://docs.listbackup.ai")!) {
                HStack {
                    Label("Documentation", systemImage: "book")
                    Spacer()
                    Image(systemName: "arrow.up.forward")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            NavigationLink {
                FeedbackView()
            } label: {
                Label("Send Feedback", systemImage: "envelope")
            }
        }
    }
    
    private var aboutSection: some View {
        Section("About") {
            Button {
                showAbout = true
            } label: {
                HStack {
                    Label("About ListBackup", systemImage: "info.circle")
                    Spacer()
                    Text("1.0.0")
                        .foregroundColor(.secondary)
                }
            }
            .foregroundColor(.primary)
            
            Link(destination: URL(string: "https://listbackup.ai/privacy")!) {
                HStack {
                    Label("Privacy Policy", systemImage: "hand.raised")
                    Spacer()
                    Image(systemName: "arrow.up.forward")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Link(destination: URL(string: "https://listbackup.ai/terms")!) {
                HStack {
                    Label("Terms of Service", systemImage: "doc.text")
                    Spacer()
                    Image(systemName: "arrow.up.forward")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
    
    private var logoutSection: some View {
        Section {
            Button {
                showLogoutAlert = true
            } label: {
                HStack {
                    Spacer()
                    Text("Log Out")
                        .foregroundColor(.red)
                        .fontWeight(.medium)
                    Spacer()
                }
            }
        }
    }
    
    // MARK: - Methods
    
    private func loadSettings() async {
        // Check if biometric is enabled
        biometricEnabled = KeychainService.shared.getBiometricToken() != nil
        
        // Check notification settings
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        notificationsEnabled = settings.authorizationStatus == .authorized
    }
    
    private func enableBiometric() async {
        do {
            let authenticated = try await BiometricAuth.shared.authenticate(
                reason: "Enable biometric authentication for faster login"
            )
            
            if authenticated {
                // Store current token for biometric access
                if let token = KeychainService.shared.getToken() {
                    KeychainService.shared.saveBiometricToken(token)
                }
            } else {
                biometricEnabled = false
            }
        } catch {
            biometricEnabled = false
        }
    }
    
    private func updateNotificationSettings(_ enabled: Bool) async {
        if enabled {
            let center = UNUserNotificationCenter.current()
            do {
                let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
                if granted {
                    await MainActor.run {
                        UIApplication.shared.registerForRemoteNotifications()
                    }
                } else {
                    notificationsEnabled = false
                }
            } catch {
                notificationsEnabled = false
            }
        } else {
            await MainActor.run {
                UIApplication.shared.unregisterForRemoteNotifications()
            }
        }
    }
    
    private func clearCache() {
        // Clear cache implementation
    }
    
    private func biometricIcon() -> String {
        switch BiometricAuth.shared.biometricType() {
        case .faceID:
            return "faceid"
        case .touchID:
            return "touchid"
        case .opticID:
            return "opticid"
        default:
            return "lock"
        }
    }
}

// MARK: - Supporting Views

struct ProfileEditorView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authManager: AuthManager
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var isSaving = false
    
    var body: some View {
        Form {
            Section("Personal Information") {
                TextField("First Name", text: $firstName)
                TextField("Last Name", text: $lastName)
            }
            
            Section("Account Information") {
                HStack {
                    Text("Email")
                    Spacer()
                    Text(authManager.currentUser?.email ?? "")
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Text("Account ID")
                    Spacer()
                    Text(authManager.currentUser?.accountId ?? "")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") {
                    saveProfile()
                }
                .disabled(isSaving || !hasChanges)
            }
        }
        .onAppear {
            firstName = authManager.currentUser?.firstName ?? ""
            lastName = authManager.currentUser?.lastName ?? ""
        }
    }
    
    private var hasChanges: Bool {
        firstName != authManager.currentUser?.firstName ||
        lastName != authManager.currentUser?.lastName
    }
    
    private func saveProfile() {
        isSaving = true
        
        Task {
            do {
                try await authManager.updateProfile(updates: [
                    "firstName": firstName,
                    "lastName": lastName
                ])
                dismiss()
            } catch {
                // Handle error
            }
            isSaving = false
        }
    }
}

struct AboutView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        ScrollView {
            VStack(spacing: 30) {
                // Logo
                RoundedRectangle(cornerRadius: 20)
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
                    .frame(width: 100, height: 100)
                    .overlay(
                        Text("LB")
                            .font(.system(size: 40, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                    )
                
                VStack(spacing: 8) {
                    Text("ListBackup")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("Version 1.0.0")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                VStack(spacing: 16) {
                    Text("Secure Data Backup & Integration Platform")
                        .font(.headline)
                    
                    Text("ListBackup helps you securely backup and manage data from all your business platforms in one place.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                
                Divider()
                
                VStack(spacing: 12) {
                    Link("Website", destination: URL(string: "https://listbackup.ai")!)
                    Link("Support", destination: URL(string: "https://support.listbackup.ai")!)
                    Link("Twitter", destination: URL(string: "https://twitter.com/listbackup")!)
                }
                .font(.callout)
                
                Text("© 2025 ListBackup, Inc.")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 20)
            }
            .padding()
        }
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Done") {
                    dismiss()
                }
            }
        }
    }
}

struct SupportView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        List {
            Section {
                Link(destination: URL(string: "https://docs.listbackup.ai")!) {
                    Label("Documentation", systemImage: "book")
                }
                
                Link(destination: URL(string: "https://support.listbackup.ai")!) {
                    Label("Support Center", systemImage: "lifepreserver")
                }
                
                Link(destination: URL(string: "mailto:support@listbackup.ai")!) {
                    Label("Email Support", systemImage: "envelope")
                }
            }
            
            Section("FAQs") {
                NavigationLink("How do I add a new integration?") {
                    FAQDetailView(question: "How do I add a new integration?", answer: "Navigate to the Integrations tab and tap the + button...")
                }
                
                NavigationLink("How often is my data backed up?") {
                    FAQDetailView(question: "How often is my data backed up?", answer: "By default, data is backed up every 24 hours...")
                }
                
                NavigationLink("Is my data secure?") {
                    FAQDetailView(question: "Is my data secure?", answer: "Yes, all data is encrypted at rest and in transit...")
                }
            }
        }
        .navigationTitle("Help & Support")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Done") {
                    dismiss()
                }
            }
        }
    }
}

struct FAQDetailView: View {
    let question: String
    let answer: String
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(question)
                    .font(.headline)
                
                Text(answer)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct FeedbackView: View {
    @Environment(\.dismiss) var dismiss
    @State private var feedbackType = "Feature Request"
    @State private var message = ""
    @State private var email = ""
    
    let feedbackTypes = ["Bug Report", "Feature Request", "General Feedback"]
    
    var body: some View {
        Form {
            Section {
                Picker("Type", selection: $feedbackType) {
                    ForEach(feedbackTypes, id: \.self) { type in
                        Text(type).tag(type)
                    }
                }
                
                TextField("Email (optional)", text: $email)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
            }
            
            Section("Message") {
                TextEditor(text: $message)
                    .frame(minHeight: 150)
            }
        }
        .navigationTitle("Send Feedback")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Send") {
                    sendFeedback()
                }
                .disabled(message.isEmpty)
            }
        }
    }
    
    private func sendFeedback() {
        // Send feedback implementation
        dismiss()
    }
}

struct AutoSyncSettingsView: View {
    @AppStorage("autoSyncEnabled") private var autoSyncEnabled = true
    @AppStorage("syncFrequency") private var syncFrequency = "daily"
    @AppStorage("syncOnWiFiOnly") private var syncOnWiFiOnly = true
    
    let frequencies = [
        ("hourly", "Every Hour"),
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly")
    ]
    
    var body: some View {
        Form {
            Section {
                Toggle("Enable Auto-sync", isOn: $autoSyncEnabled)
            }
            
            if autoSyncEnabled {
                Section("Sync Frequency") {
                    ForEach(frequencies, id: \.0) { value, label in
                        HStack {
                            Text(label)
                            Spacer()
                            if syncFrequency == value {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.blue)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            syncFrequency = value
                        }
                    }
                }
                
                Section("Network Settings") {
                    Toggle("Sync on Wi-Fi Only", isOn: $syncOnWiFiOnly)
                }
            }
        }
        .navigationTitle("Auto-sync Settings")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct ExportSettingsView: View {
    @State private var selectedFormat = "json"
    @State private var includeMetadata = true
    
    let formats = [
        ("json", "JSON"),
        ("csv", "CSV"),
        ("xml", "XML")
    ]
    
    var body: some View {
        Form {
            Section("Export Format") {
                ForEach(formats, id: \.0) { value, label in
                    HStack {
                        Text(label)
                        Spacer()
                        if selectedFormat == value {
                            Image(systemName: "checkmark")
                                .foregroundColor(.blue)
                        }
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        selectedFormat = value
                    }
                }
            }
            
            Section("Options") {
                Toggle("Include Metadata", isOn: $includeMetadata)
            }
        }
        .navigationTitle("Export Settings")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        SettingsView()
            .environmentObject(AuthManager.shared)
    }
}