//
//  LoginView.swift
//  ListBackup
//
//  Login screen for the app
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var showRegistration = false
    @State private var showForgotPassword = false
    @State private var showError = false
    @FocusState private var focusedField: Field?
    
    enum Field {
        case email, password
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 30) {
                // Logo and Title
                VStack(spacing: 16) {
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
                        .frame(width: 80, height: 80)
                        .overlay(
                            Text("LB")
                                .font(.system(size: 32, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                        )
                    
                    VStack(spacing: 8) {
                        Text("Welcome Back")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text("Sign in to continue")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.top, 40)
                
                // Form Fields
                VStack(spacing: 20) {
                    // Email Field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Email")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.secondary)
                        
                        HStack {
                            Image(systemName: "envelope")
                                .foregroundColor(.secondary)
                                .frame(width: 20)
                            
                            TextField("Enter your email", text: $email)
                                .textFieldStyle(.plain)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                                .focused($focusedField, equals: .email)
                                .submitLabel(.next)
                                .onSubmit {
                                    focusedField = .password
                                }
                        }
                        .padding()
                        .background(Color(UIColor.secondarySystemBackground))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(focusedField == .email ? Color(red: 0.2, green: 0.6, blue: 0.9) : Color.clear, lineWidth: 2)
                        )
                    }
                    
                    // Password Field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Password")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.secondary)
                        
                        HStack {
                            Image(systemName: "lock")
                                .foregroundColor(.secondary)
                                .frame(width: 20)
                            
                            if showPassword {
                                TextField("Enter your password", text: $password)
                                    .textFieldStyle(.plain)
                                    .focused($focusedField, equals: .password)
                                    .submitLabel(.go)
                                    .onSubmit {
                                        signIn()
                                    }
                            } else {
                                SecureField("Enter your password", text: $password)
                                    .textFieldStyle(.plain)
                                    .focused($focusedField, equals: .password)
                                    .submitLabel(.go)
                                    .onSubmit {
                                        signIn()
                                    }
                            }
                            
                            Button {
                                showPassword.toggle()
                            } label: {
                                Image(systemName: showPassword ? "eye.slash" : "eye")
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding()
                        .background(Color(UIColor.secondarySystemBackground))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(focusedField == .password ? Color(red: 0.2, green: 0.6, blue: 0.9) : Color.clear, lineWidth: 2)
                        )
                    }
                    
                    // Forgot Password
                    HStack {
                        Spacer()
                        Button {
                            showForgotPassword = true
                        } label: {
                            Text("Forgot Password?")
                                .font(.caption)
                                .foregroundColor(Color(red: 0.2, green: 0.6, blue: 0.9))
                        }
                    }
                }
                .padding(.horizontal)
                
                // Sign In Button
                Button {
                    signIn()
                } label: {
                    HStack {
                        if authManager.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Text("Sign In")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [
                                Color(red: 0.2, green: 0.6, blue: 0.9),
                                Color(red: 0.1, green: 0.4, blue: 0.8)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(authManager.isLoading || email.isEmpty || password.isEmpty)
                .padding(.horizontal)
                
                // Biometric Login
                if BiometricAuth.shared.canUseBiometrics() {
                    Button {
                        signInWithBiometric()
                    } label: {
                        HStack {
                            Image(systemName: biometricIcon())
                            Text("Sign in with \(BiometricAuth.shared.biometricTypeString())")
                        }
                        .font(.callout)
                        .foregroundColor(Color(red: 0.2, green: 0.6, blue: 0.9))
                    }
                }
                
                // Sign Up Link
                HStack {
                    Text("Don't have an account?")
                        .font(.callout)
                        .foregroundColor(.secondary)
                    
                    Button {
                        showRegistration = true
                    } label: {
                        Text("Sign Up")
                            .font(.callout)
                            .fontWeight(.semibold)
                            .foregroundColor(Color(red: 0.2, green: 0.6, blue: 0.9))
                    }
                }
                .padding(.bottom, 40)
            }
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showRegistration) {
            RegisterView()
        }
        .sheet(isPresented: $showForgotPassword) {
            ForgotPasswordView()
        }
        .alert("Login Failed", isPresented: $showError) {
            Button("OK") {
                showError = false
            }
        } message: {
            Text(authManager.authError?.localizedDescription ?? "An error occurred")
        }
        .onChange(of: authManager.authError) { error in
            showError = error != nil
        }
        .onTapGesture {
            focusedField = nil
        }
    }
    
    private func signIn() {
        focusedField = nil
        
        Task {
            do {
                try await authManager.login(email: email, password: password)
            } catch {
                // Error handling is done through authManager.authError
            }
        }
    }
    
    private func signInWithBiometric() {
        Task {
            do {
                try await authManager.loginWithBiometric()
            } catch {
                // Error handling is done through authManager.authError
            }
        }
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

// MARK: - Register View

struct RegisterView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authManager: AuthManager
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var showPassword = false
    @State private var showError = false
    @FocusState private var focusedField: Field?
    
    enum Field {
        case firstName, lastName, email, password, confirmPassword
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 25) {
                    // Header
                    VStack(spacing: 8) {
                        Text("Create Account")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text("Sign up to get started")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 20)
                    
                    // Form Fields
                    VStack(spacing: 20) {
                        // Name Fields
                        HStack(spacing: 12) {
                            fieldView(
                                title: "First Name",
                                icon: "person",
                                text: $firstName,
                                field: .firstName,
                                keyboardType: .default,
                                submitLabel: .next
                            ) {
                                focusedField = .lastName
                            }
                            
                            fieldView(
                                title: "Last Name",
                                icon: "person",
                                text: $lastName,
                                field: .lastName,
                                keyboardType: .default,
                                submitLabel: .next
                            ) {
                                focusedField = .email
                            }
                        }
                        
                        // Email Field
                        fieldView(
                            title: "Email",
                            icon: "envelope",
                            text: $email,
                            field: .email,
                            keyboardType: .emailAddress,
                            submitLabel: .next
                        ) {
                            focusedField = .password
                        }
                        
                        // Password Field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Password")
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(.secondary)
                            
                            HStack {
                                Image(systemName: "lock")
                                    .foregroundColor(.secondary)
                                    .frame(width: 20)
                                
                                if showPassword {
                                    TextField("Create a password", text: $password)
                                        .textFieldStyle(.plain)
                                        .focused($focusedField, equals: .password)
                                        .submitLabel(.next)
                                        .onSubmit {
                                            focusedField = .confirmPassword
                                        }
                                } else {
                                    SecureField("Create a password", text: $password)
                                        .textFieldStyle(.plain)
                                        .focused($focusedField, equals: .password)
                                        .submitLabel(.next)
                                        .onSubmit {
                                            focusedField = .confirmPassword
                                        }
                                }
                                
                                Button {
                                    showPassword.toggle()
                                } label: {
                                    Image(systemName: showPassword ? "eye.slash" : "eye")
                                        .foregroundColor(.secondary)
                                }
                            }
                            .padding()
                            .background(Color(UIColor.secondarySystemBackground))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(focusedField == .password ? Color(red: 0.2, green: 0.6, blue: 0.9) : Color.clear, lineWidth: 2)
                            )
                        }
                        
                        // Confirm Password Field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Confirm Password")
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(.secondary)
                            
                            HStack {
                                Image(systemName: "lock")
                                    .foregroundColor(.secondary)
                                    .frame(width: 20)
                                
                                if showPassword {
                                    TextField("Confirm your password", text: $confirmPassword)
                                        .textFieldStyle(.plain)
                                        .focused($focusedField, equals: .confirmPassword)
                                        .submitLabel(.go)
                                        .onSubmit {
                                            signUp()
                                        }
                                } else {
                                    SecureField("Confirm your password", text: $confirmPassword)
                                        .textFieldStyle(.plain)
                                        .focused($focusedField, equals: .confirmPassword)
                                        .submitLabel(.go)
                                        .onSubmit {
                                            signUp()
                                        }
                                }
                            }
                            .padding()
                            .background(Color(UIColor.secondarySystemBackground))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(focusedField == .confirmPassword ? Color(red: 0.2, green: 0.6, blue: 0.9) : Color.clear, lineWidth: 2)
                            )
                        }
                    }
                    .padding(.horizontal)
                    
                    // Sign Up Button
                    Button {
                        signUp()
                    } label: {
                        HStack {
                            if authManager.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            } else {
                                Text("Create Account")
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.2, green: 0.6, blue: 0.9),
                                    Color(red: 0.1, green: 0.4, blue: 0.8)
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(!isFormValid)
                    .padding(.horizontal)
                    
                    // Terms Text
                    Text("By creating an account, you agree to our Terms of Service and Privacy Policy")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .alert("Registration Failed", isPresented: $showError) {
            Button("OK") {
                showError = false
            }
        } message: {
            Text(authManager.authError?.localizedDescription ?? "An error occurred")
        }
        .onChange(of: authManager.authError) { error in
            showError = error != nil
        }
    }
    
    private var isFormValid: Bool {
        !firstName.isEmpty &&
        !lastName.isEmpty &&
        !email.isEmpty &&
        !password.isEmpty &&
        password == confirmPassword &&
        password.count >= 6 &&
        !authManager.isLoading
    }
    
    private func signUp() {
        focusedField = nil
        
        guard isFormValid else { return }
        
        Task {
            do {
                try await authManager.register(
                    email: email,
                    password: password,
                    firstName: firstName,
                    lastName: lastName
                )
                dismiss()
            } catch {
                // Error handling is done through authManager.authError
            }
        }
    }
    
    @ViewBuilder
    private func fieldView(
        title: String,
        icon: String,
        text: Binding<String>,
        field: Field,
        keyboardType: UIKeyboardType = .default,
        submitLabel: SubmitLabel = .next,
        onSubmit: @escaping () -> Void
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
            
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.secondary)
                    .frame(width: 20)
                
                TextField(title, text: text)
                    .textFieldStyle(.plain)
                    .keyboardType(keyboardType)
                    .autocapitalization(keyboardType == .emailAddress ? .none : .words)
                    .disableAutocorrection(true)
                    .focused($focusedField, equals: field)
                    .submitLabel(submitLabel)
                    .onSubmit(onSubmit)
            }
            .padding()
            .background(Color(UIColor.secondarySystemBackground))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(focusedField == field ? Color(red: 0.2, green: 0.6, blue: 0.9) : Color.clear, lineWidth: 2)
            )
        }
    }
}

// MARK: - Forgot Password View

struct ForgotPasswordView: View {
    @Environment(\.dismiss) var dismiss
    @State private var email = ""
    @State private var isLoading = false
    @State private var showSuccess = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 30) {
                VStack(spacing: 16) {
                    Image(systemName: "key.fill")
                        .font(.system(size: 60))
                        .foregroundColor(Color(red: 0.2, green: 0.6, blue: 0.9))
                    
                    VStack(spacing: 8) {
                        Text("Forgot Password?")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text("Enter your email and we'll send you instructions to reset your password")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.top, 40)
                
                // Email Field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Email")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    HStack {
                        Image(systemName: "envelope")
                            .foregroundColor(.secondary)
                        
                        TextField("Enter your email", text: $email)
                            .textFieldStyle(.plain)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)
                }
                .padding(.horizontal)
                
                // Send Button
                Button {
                    sendResetEmail()
                } label: {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Text("Send Reset Email")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [
                                Color(red: 0.2, green: 0.6, blue: 0.9),
                                Color(red: 0.1, green: 0.4, blue: 0.8)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(isLoading || email.isEmpty)
                .padding(.horizontal)
                
                Spacer()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .alert("Email Sent", isPresented: $showSuccess) {
            Button("OK") {
                dismiss()
            }
        } message: {
            Text("Check your email for password reset instructions")
        }
    }
    
    private func sendResetEmail() {
        isLoading = true
        
        Task {
            do {
                let _: EmptyResponse = try await APIClient.shared.request(
                    .resetPassword(email: email)
                )
                showSuccess = true
            } catch {
                // Handle error
            }
            isLoading = false
        }
    }
}

#Preview {
    NavigationStack {
        LoginView()
            .environmentObject(AuthManager.shared)
    }
}