# Authentication API Documentation

This document covers all authentication-related endpoints, flows, and security considerations for the ListBackup.ai platform.

## Authentication Flow Overview

```mermaid
sequenceDiagram
    participant User
    participant Client as Client App
    participant API as API Gateway
    participant Auth as Auth Service
    participant Cognito as AWS Cognito
    participant DB as DynamoDB
    
    User->>Client: Enter credentials
    Client->>API: POST /auth/login
    API->>Auth: Forward request
    Auth->>Cognito: Authenticate user
    Cognito-->>Auth: Auth result
    Auth->>DB: Get user data
    DB-->>Auth: User details
    Auth->>Auth: Generate JWT
    Auth-->>API: Return tokens
    API-->>Client: 200 OK + tokens
    Client->>Client: Store tokens
    Client-->>User: Login successful
```

## Token Architecture

```mermaid
graph TD
    subgraph "Token Types"
        ACCESS[Access Token<br/>15 minutes]
        REFRESH[Refresh Token<br/>30 days]
        ID[ID Token<br/>User info]
    end
    
    subgraph "Token Storage"
        SECURE[Secure Storage<br/>HttpOnly Cookies]
        LOCAL[Local Storage<br/>Non-sensitive only]
        MEMORY[Memory<br/>Runtime only]
    end
    
    subgraph "Token Validation"
        VERIFY[Signature Verification]
        EXPIRE[Expiration Check]
        CLAIMS[Claims Validation]
        REVOKE[Revocation Check]
    end
    
    ACCESS --> MEMORY
    REFRESH --> SECURE
    ID --> LOCAL
    
    ACCESS --> VERIFY
    VERIFY --> EXPIRE
    EXPIRE --> CLAIMS
    CLAIMS --> REVOKE
    
    style ACCESS fill:#ffebee
    style REFRESH fill:#e3f2fd
    style SECURE fill:#c8e6c9
```

## API Endpoints

### 1. User Registration

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Auth
    participant Cognito
    participant DB
    participant Email
    
    Client->>API: POST /auth/register
    Note over API: Validate input
    API->>Auth: Process registration
    Auth->>Cognito: Create user
    Cognito-->>Auth: User created
    Auth->>DB: Create user record
    DB-->>Auth: Record created
    Auth->>Email: Send verification
    Auth-->>API: Registration success
    API-->>Client: 201 Created
```

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd!",
  "name": "John Doe",
  "company": "Acme Corp",
  "acceptTerms": true
}
```

**Validation Rules**:
- Email: Valid format, unique
- Password: 8+ chars, uppercase, lowercase, number, special char
- Name: 2-100 characters
- Company: Optional, 2-100 characters
- Accept Terms: Must be true

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123def456",
    "email": "user@example.com",
    "emailVerified": false,
    "createdAt": "2024-12-30T10:00:00Z"
  },
  "meta": {
    "timestamp": "2024-12-30T10:00:00Z"
  }
}
```

### 2. User Login

```mermaid
stateDiagram-v2
    [*] --> CheckCredentials: POST /auth/login
    CheckCredentials --> ValidatePassword: Valid Email
    CheckCredentials --> Error: Invalid Email
    ValidatePassword --> CheckMFA: Password Valid
    ValidatePassword --> Error: Invalid Password
    CheckMFA --> RequestMFA: MFA Enabled
    CheckMFA --> GenerateTokens: No MFA
    RequestMFA --> ValidateMFA: Enter Code
    ValidateMFA --> GenerateTokens: Valid Code
    ValidateMFA --> Error: Invalid Code
    GenerateTokens --> Success: Return Tokens
    Error --> [*]: Return Error
    Success --> [*]: Login Complete
```

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd!",
  "rememberMe": true
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "idToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "user": {
      "userId": "usr_abc123def456",
      "email": "user@example.com",
      "name": "John Doe",
      "accountId": "acc_789012",
      "role": "admin"
    }
  }
}
```

### 3. Token Refresh

```mermaid
graph LR
    subgraph "Refresh Flow"
        CLIENT[Client] --> CHECK{Token<br/>Expired?}
        CHECK -->|Yes| REFRESH[POST /auth/refresh]
        CHECK -->|No| USE[Use Access Token]
        REFRESH --> VALIDATE{Valid<br/>Refresh?}
        VALIDATE -->|Yes| NEW[New Tokens]
        VALIDATE -->|No| LOGIN[Force Login]
        NEW --> USE
    end
    
    style CHECK fill:#fff3e0
    style VALIDATE fill:#fff3e0
    style LOGIN fill:#ffebee
    style NEW fill:#c8e6c9
```

**Endpoint**: `POST /auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "idToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

### 4. Password Reset Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant API
    participant Auth
    participant Cognito
    participant Email
    
    User->>Client: Click "Forgot Password"
    Client->>API: POST /auth/forgot-password
    API->>Auth: Process request
    Auth->>Cognito: Initiate reset
    Cognito->>Email: Send reset code
    Email-->>User: Reset email
    User->>Client: Enter code + new password
    Client->>API: POST /auth/reset-password
    API->>Auth: Validate and reset
    Auth->>Cognito: Confirm reset
    Cognito-->>Auth: Password updated
    Auth-->>API: Success
    API-->>Client: 200 OK
```

**Forgot Password Endpoint**: `POST /auth/forgot-password`

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Reset Password Endpoint**: `POST /auth/reset-password`

**Request**:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewSecureP@ssw0rd!"
}
```

### 5. Multi-Factor Authentication (MFA)

```mermaid
graph TD
    subgraph "MFA Setup"
        ENABLE[Enable MFA] --> GENERATE[Generate Secret]
        GENERATE --> QR[Show QR Code]
        QR --> SCAN[User Scans with App]
        SCAN --> VERIFY[Verify Code]
        VERIFY --> BACKUP[Generate Backup Codes]
    end
    
    subgraph "MFA Login"
        LOGIN[Standard Login] --> CHECK{MFA Enabled?}
        CHECK -->|Yes| PROMPT[Prompt for Code]
        CHECK -->|No| SUCCESS[Login Success]
        PROMPT --> VALIDATE[Validate Code]
        VALIDATE -->|Valid| SUCCESS
        VALIDATE -->|Invalid| RETRY[Retry/Use Backup]
    end
    
    style ENABLE fill:#e3f2fd
    style SUCCESS fill:#c8e6c9
```

**Enable MFA**: `POST /auth/mfa/enable`

**Response**:
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "backupCodes": [
      "abc123def456",
      "ghi789jkl012",
      "mno345pqr678"
    ]
  }
}
```

**Verify MFA**: `POST /auth/mfa/verify`

**Request**:
```json
{
  "code": "123456",
  "sessionToken": "temp_session_token"
}
```

### 6. Email Verification

```mermaid
stateDiagram-v2
    [*] --> Registered: User Registers
    Registered --> EmailSent: Send Verification
    EmailSent --> Pending: Awaiting Click
    Pending --> Verify: Click Link
    Verify --> CheckCode: Validate Code
    CheckCode --> Verified: Valid
    CheckCode --> Error: Invalid/Expired
    Error --> Resend: Request New
    Resend --> EmailSent
    Verified --> [*]: Email Verified
```

**Verify Email**: `POST /auth/verify-email`

**Request**:
```json
{
  "email": "user@example.com",
  "code": "verification_code_from_email"
}
```

**Resend Verification**: `POST /auth/resend-verification`

**Request**:
```json
{
  "email": "user@example.com"
}
```

## JWT Token Structure

```mermaid
graph LR
    subgraph "JWT Components"
        HEADER[Header<br/>Algorithm & Type]
        PAYLOAD[Payload<br/>Claims & Data]
        SIGNATURE[Signature<br/>Verification]
    end
    
    subgraph "Access Token Claims"
        USER_ID[userId]
        ACCOUNT_ID[accountId]
        EMAIL[email]
        ROLE[role]
        PERMISSIONS[permissions]
        EXP[exp - Expiration]
        IAT[iat - Issued At]
    end
    
    HEADER --> PAYLOAD
    PAYLOAD --> SIGNATURE
    
    PAYLOAD --> USER_ID
    PAYLOAD --> ACCOUNT_ID
    PAYLOAD --> EMAIL
    PAYLOAD --> ROLE
    PAYLOAD --> PERMISSIONS
    PAYLOAD --> EXP
    PAYLOAD --> IAT
```

### Sample Decoded Token

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "usr_abc123def456",
    "accountId": "acc_789012",
    "email": "user@example.com",
    "role": "admin",
    "permissions": [
      "sources:read",
      "sources:write",
      "jobs:create",
      "account:manage"
    ],
    "exp": 1704067200,
    "iat": 1704063600,
    "iss": "https://api.listbackup.ai"
  }
}
```

## Security Considerations

### Password Policy

```mermaid
graph TD
    subgraph "Password Requirements"
        LENGTH[Minimum 8 characters]
        UPPER[At least 1 uppercase]
        LOWER[At least 1 lowercase]
        NUMBER[At least 1 number]
        SPECIAL[At least 1 special char]
        HISTORY[Cannot reuse last 5]
    end
    
    subgraph "Additional Security"
        COMPLEXITY[Complexity Score]
        COMMON[Common Password Check]
        BREACH[Breach Database Check]
        ENTROPY[Entropy Calculation]
    end
    
    LENGTH --> COMPLEXITY
    UPPER --> COMPLEXITY
    LOWER --> COMPLEXITY
    NUMBER --> COMPLEXITY
    SPECIAL --> COMPLEXITY
    
    COMPLEXITY --> COMMON
    COMMON --> BREACH
    BREACH --> ENTROPY
```

### Rate Limiting

```mermaid
graph LR
    subgraph "Rate Limit Rules"
        LOGIN[Login<br/>5 attempts/15min]
        REGISTER[Register<br/>3 attempts/hour]
        RESET[Password Reset<br/>3 attempts/hour]
        VERIFY[Email Verify<br/>5 attempts/day]
    end
    
    subgraph "Response"
        LIMIT[429 Too Many Requests]
        RETRY[Retry-After Header]
        BLOCK[Temporary Block]
    end
    
    LOGIN --> LIMIT
    REGISTER --> LIMIT
    RESET --> LIMIT
    VERIFY --> LIMIT
    
    LIMIT --> RETRY
    RETRY --> BLOCK
```

### Session Management

```mermaid
stateDiagram-v2
    [*] --> Active: Login Success
    Active --> Active: Activity < 15min
    Active --> Warning: 13min Inactive
    Warning --> Active: Any Activity
    Warning --> Expired: 15min Reached
    Active --> Refresh: Token Refresh
    Refresh --> Active: New Token
    Expired --> Login: Re-authenticate
    Active --> Logout: User Logout
    Logout --> [*]: Session Cleared
```

## Error Handling

### Common Error Responses

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| AUTH_INVALID_CREDENTIALS | 401 | Invalid email or password |
| AUTH_USER_NOT_FOUND | 404 | User does not exist |
| AUTH_EMAIL_NOT_VERIFIED | 403 | Email verification required |
| AUTH_ACCOUNT_SUSPENDED | 403 | Account has been suspended |
| AUTH_MFA_REQUIRED | 428 | MFA code required |
| AUTH_MFA_INVALID | 401 | Invalid MFA code |
| AUTH_TOKEN_EXPIRED | 401 | Access token has expired |
| AUTH_TOKEN_INVALID | 401 | Invalid or malformed token |
| AUTH_REFRESH_INVALID | 401 | Invalid refresh token |
| AUTH_RATE_LIMITED | 429 | Too many attempts |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {
      "attempts": 3,
      "maxAttempts": 5,
      "lockoutTime": null
    }
  },
  "meta": {
    "timestamp": "2024-12-30T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { AuthClient } from '@listbackup/sdk';

const auth = new AuthClient({
  baseURL: 'https://api.listbackup.ai'
});

// Login
try {
  const { accessToken, refreshToken, user } = await auth.login({
    email: 'user@example.com',
    password: 'SecureP@ssw0rd!'
  });
  
  // Store tokens securely
  await tokenStorage.save({ accessToken, refreshToken });
  
} catch (error) {
  if (error.code === 'AUTH_MFA_REQUIRED') {
    // Handle MFA flow
    const code = await promptMFACode();
    const result = await auth.verifyMFA({
      code,
      sessionToken: error.sessionToken
    });
  }
}

// Auto-refresh tokens
auth.onTokenExpired(async () => {
  const { refreshToken } = await tokenStorage.get();
  const newTokens = await auth.refresh(refreshToken);
  await tokenStorage.save(newTokens);
  return newTokens.accessToken;
});
```

### Go

```go
package main

import (
    "github.com/listbackup/sdk-go/auth"
)

func main() {
    client := auth.NewClient(auth.Config{
        BaseURL: "https://api.listbackup.ai",
    })
    
    // Login
    result, err := client.Login(auth.LoginRequest{
        Email:    "user@example.com",
        Password: "SecureP@ssw0rd!",
    })
    
    if err != nil {
        if authErr, ok := err.(*auth.Error); ok {
            switch authErr.Code {
            case "AUTH_MFA_REQUIRED":
                // Handle MFA
                code := promptMFACode()
                result, err = client.VerifyMFA(auth.MFARequest{
                    Code:         code,
                    SessionToken: authErr.SessionToken,
                })
            }
        }
    }
    
    // Use tokens
    tokenStore.Save(result.AccessToken, result.RefreshToken)
}
```

## Best Practices

### 1. Token Storage
- Never store tokens in localStorage for sensitive data
- Use httpOnly, secure cookies for refresh tokens
- Implement token rotation
- Clear tokens on logout

### 2. Security Headers
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### 3. CORS Configuration
- Whitelist specific origins
- Don't use wildcard (*) in production
- Validate preflight requests
- Limit exposed headers

### 4. Monitoring
- Track failed login attempts
- Monitor unusual patterns
- Alert on security events
- Regular security audits