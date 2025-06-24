# Auth Service Documentation

## Overview
The Auth Service manages user authentication and authorization for ListBackup.ai v2. It integrates with AWS Cognito for user management and provides JWT-based authentication for API access.

## Architecture

### Authentication Flow
1. **Registration**: Users register with email/password, creating records in Cognito and DynamoDB
2. **Login**: Users authenticate via Cognito, receiving JWT tokens (access, ID, refresh)
3. **Authorization**: API Gateway validates JWT tokens using the core authorizer Lambda
4. **Token Refresh**: Expired access tokens can be refreshed using refresh tokens

### Key Features
- Email-based authentication (no separate username)
- JWT token authentication with configurable validity periods
- Company field stored in DynamoDB (not Cognito custom attributes)
- Automatic account creation on registration
- Support for hierarchical account structures

## Endpoints

### Public Endpoints (No Authentication Required)

#### POST /auth/register
Registers a new user and creates their initial account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "company": "Acme Corp" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "uuid",
    "accountId": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Acme Corp",
    "userStatus": "CONFIRMED"
  }
}
```

#### POST /auth/login
Authenticates a user and returns JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJ...",
    "idToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 86400,
    "tokenType": "Bearer"
  }
}
```

#### POST /auth/refresh
Refreshes an expired access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJ...",
    "idToken": "eyJ...",
    "expiresIn": 86400,
    "tokenType": "Bearer"
  }
}
```

### Protected Endpoints (Authentication Required)

#### GET /auth/status
Returns the authentication status of the current user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "userId": "uuid",
    "email": "user@example.com"
  }
}
```

#### GET /auth/profile
Returns the user's profile information.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "status": "active",
    "currentAccountId": "uuid",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /auth/accounts
Returns all accounts the user has access to.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "accountId": "uuid",
        "name": "Acme Corp",
        "role": "Owner",
        "status": "Active"
      }
    ]
  }
}
```

#### POST /auth/logout
Logs out the user (implementation depends on token invalidation strategy).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "accessToken": "eyJ..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Configuration

### Environment Variables
- `COGNITO_USER_POOL_ID`: Cognito User Pool ID
- `COGNITO_CLIENT_ID`: Cognito App Client ID
- `COGNITO_REGION`: AWS region for Cognito (default: us-west-2)
- `USERS_TABLE`: DynamoDB table for user records
- `ACCOUNTS_TABLE`: DynamoDB table for account records
- `USER_ACCOUNTS_TABLE`: DynamoDB table for user-account relationships

### Token Validity Configuration
Configured in `infrastructure/cognito/serverless.yml`:
- **Access Token**: 24 hours
- **ID Token**: 24 hours
- **Refresh Token**: 30 days

### Cognito Configuration
- **User Pool**: `listbackup-user-pool-{stage}`
- **App Client**: `listbackup-app-client-{stage}`
- **Auth Flows**: USER_PASSWORD_AUTH, REFRESH_TOKEN_AUTH, USER_SRP_AUTH
- **Username Attribute**: email
- **Auto-verified Attributes**: email
- **Password Policy**: 
  - Minimum 8 characters
  - Requires lowercase, uppercase, numbers, and symbols
- **MFA**: Optional (SMS and Software Token)

## Database Schema

### Users Table
```typescript
{
  userId: string,           // "user:{cognitoUUID}"
  cognitoUserId: string,    // Cognito UUID
  email: string,
  name: string,
  status: string,           // "active"
  currentAccountId: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Accounts Table
```typescript
{
  accountId: string,        // "account:{uuid}"
  parentAccountId?: string,
  ownerUserId: string,
  createdByUserId: string,
  name: string,
  company: string,
  accountPath: string,      // "/{accountId}"
  level: number,            // 0 for root accounts
  plan: string,             // "free"
  status: string,           // "active"
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### User-Accounts Table
```typescript
{
  userId: string,
  accountId: string,
  role: string,             // "Owner"
  status: string,           // "Active"
  linkedAt: timestamp,
  updatedAt: timestamp
}
```

## Error Handling

### Common Error Responses
- **400 Bad Request**: Invalid input, missing required fields
- **401 Unauthorized**: Invalid credentials, expired token
- **403 Forbidden**: User lacks permission
- **409 Conflict**: User already exists
- **500 Internal Server Error**: System errors

### Cognito-Specific Errors
- `UsernameExistsException`: Email already registered
- `NotAuthorizedException`: Invalid email or password
- `UserNotFoundException`: User not found
- `InvalidPasswordException`: Password doesn't meet requirements
- `UserNotConfirmedException`: Email not verified

## Security Considerations

1. **Password Requirements**: Enforced by Cognito policy
2. **Email Verification**: Auto-verified on registration (for testing)
3. **Token Security**: JWT tokens should be transmitted over HTTPS only
4. **CORS**: Currently allows all origins (*) - should be restricted in production
5. **Rate Limiting**: Should be implemented at API Gateway level

## Deployment

### Using Serverless Compose (Recommended)
The auth service is configured in `/services/serverless-compose.yml` and deploys with all its dependencies:

```bash
cd /Users/nickkulavic/Projects/listbackup.ai/listbackup-ai-v2/backend/golang/services
serverless deploy --config serverless-compose.yml --stage main --aws-profile listbackup.ai
```

Or use the deployment script:
```bash
./deploy-auth-with-compose.sh main listbackup.ai
```

This will deploy:
- Infrastructure services (DynamoDB, SQS, S3, EventBridge, Cognito)
- API Gateway
- Auth Service

### Individual Deployment
To deploy only the auth service (requires infrastructure to be already deployed):
```bash
cd /Users/nickkulavic/Projects/listbackup.ai/listbackup-ai-v2/backend/golang/services
sls deploy --config api/auth/serverless.yml --stage main --aws-profile listbackup.ai
```

## Testing

A comprehensive test script is available at `/services/test-all-auth-endpoints.sh` which tests:
- User registration
- User login
- Token validation
- Profile retrieval
- Account listing
- Token refresh
- Logout
- Error scenarios

Run the test script after deployment:
```bash
./test-all-auth-endpoints.sh
```

## Implementation Notes

1. **Email as Username**: The system uses email addresses as Cognito usernames (no separate username field)
2. **Company Field**: Stored in DynamoDB Accounts table, not as a Cognito custom attribute
3. **User Creation**: Uses AdminCreateUser with immediate password setting to avoid email verification
4. **Password Challenges**: Automatically handles NEW_PASSWORD_REQUIRED challenges during login
5. **Account Creation**: Every user gets a root account on registration
6. **ID Prefixes**: User IDs prefixed with "user:", Account IDs with "account:"

## Future Enhancements

1. **Social Login**: Add OAuth providers (Google, Facebook, etc.)
2. **Two-Factor Authentication**: Implement SMS/TOTP 2FA
3. **Password Reset**: Add forgot password flow
4. **Email Verification**: Implement proper email verification flow
5. **Session Management**: Add device tracking and session invalidation
6. **Rate Limiting**: Implement per-user rate limits
7. **Token Blacklisting**: For immediate logout/revocation