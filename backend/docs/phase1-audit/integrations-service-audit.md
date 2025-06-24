# Integrations Service Audit

## Overview
The integrations service is a dedicated serverless service that handles OAuth authentication flows for external platform integrations. It supports 9 different platforms and manages the OAuth state, token exchange, and token storage.

## Service Structure

### Serverless Configuration
- **Service Name**: listbackup-integrations
- **Runtime**: provided.al2023 (Go Lambda runtime)
- **Architecture**: ARM64
- **Region**: us-west-2
- **Memory**: 256MB (oauth-start), 512MB (oauth-callback)
- **Timeout**: 10s (oauth-start), 30s (oauth-callback)

### Functions
1. **oauth-start**
   - Path: `/integrations/oauth/{provider}/start`
   - Method: POST
   - Authorization: Required (uses core authorizer)
   - Purpose: Initiates OAuth flow, generates authorization URL, stores state

2. **oauth-callback**
   - Path: `/integrations/oauth/callback/{provider}`
   - Method: GET
   - Authorization: None (public endpoint for OAuth provider callbacks)
   - Purpose: Handles OAuth callback, exchanges authorization code for access tokens

### Supported Platforms (9 total)
1. **Google** - Drive, Sheets, BigQuery, Cloud Platform read access
2. **HubSpot** - CRM export access
3. **GoHighLevel** - Contacts, campaigns, conversations, opportunities (read-only)
4. **Dropbox** - Files and sharing (read/write)
5. **Box** - Root read/write access
6. **QuickBooks** - Accounting data access
7. **Shopify** - Products, orders, customers, inventory (read-only)
8. **Keap** - Full access
9. **Stripe** - Read-only access for Stripe Connect

### Dependencies
- **DynamoDB Tables**:
  - Users table
  - Accounts table
  - User-accounts table
  - Activity table
  - OAuth-states table (for CSRF protection)
  - Sources table (oauth-callback only)
  - Platform-connections table (oauth-callback only)

- **AWS Services**:
  - Secrets Manager (for OAuth credentials and tokens)
  - EventBridge (for event publishing)
  - API Gateway (HTTP API integration)

## Integration Points

### With Core Service
- Uses the same authorizer from core service (authorizer ID: c0vpx0)
- Shares DynamoDB table naming convention
- Publishes events to the same event bus

### With Other Services
- Creates entries in sources table (managed by sources service)
- Creates platform connections (managed by connections service)
- Logs activity to activity table

## OAuth Flow

### Start Flow
1. User initiates OAuth from frontend
2. oauth-start handler validates provider
3. Generates state token for CSRF protection
4. Stores state in oauth-states table
5. Returns authorization URL to frontend
6. Frontend redirects user to provider

### Callback Flow
1. Provider redirects back with code and state
2. oauth-callback validates state token
3. Exchanges authorization code for access token
4. Stores tokens in AWS Secrets Manager
5. Creates/updates source in sources table
6. Creates platform connection record
7. Redirects user back to application

## Security Considerations

### Credentials Storage
- OAuth client credentials stored in Secrets Manager at `app/oauth/{provider}/client_id|client_secret`
- Access tokens stored at `sources/{accountId}/{sourceId}/oauth-tokens`
- Refresh tokens included in token storage

### CSRF Protection
- State tokens stored in DynamoDB
- State validated on callback
- State removed after use

### Authorization
- oauth-start requires authentication
- oauth-callback is public (required for OAuth flow)
- User context extracted from Lambda authorizer

## Merge Evaluation

### Should Integrations be Merged with Core?

**Recommendation: Keep Separate**

**Reasons to Keep Separate:**
1. **Separation of Concerns** - OAuth/integrations logic is distinct from core infrastructure
2. **Independent Scaling** - OAuth handlers may have different traffic patterns
3. **Security Isolation** - Limits exposure of OAuth credentials and tokens
4. **Deployment Independence** - Can update OAuth providers without touching core
5. **Function Size** - Core currently has no functions, integrations would add complexity

**Potential Benefits of Merging:**
1. Simplified deployment (one less service)
2. Shared IAM roles and policies
3. Reduced cold starts (if functions share containers)

**Conclusion**: The current separation follows microservices best practices and should be maintained.

## Current State Assessment

### Working Components
- OAuth configuration for all 9 providers
- Handler structure and code organization
- State management for CSRF protection
- Token exchange logic

### Missing/Incomplete Components
1. **OAuth Credentials** - Need to be uploaded to Secrets Manager
2. **DynamoDB Table** - oauth-states table needs to be created
3. **Build Artifacts** - No bin directory with compiled handlers
4. **Token Storage Decision** - Currently using Secrets Manager, but DynamoDB might be more cost-effective

## Integration Strategy

### Phase 1: Complete OAuth Implementation
1. Upload OAuth credentials to Secrets Manager using provided scripts
2. Create oauth-states DynamoDB table
3. Build and deploy Lambda functions
4. Test OAuth flow for each provider

### Phase 2: Token Management Optimization
1. Implement hybrid token storage:
   - DynamoDB for frequently accessed tokens (encrypted)
   - Secrets Manager for refresh tokens and rarely accessed data
2. Add token refresh logic
3. Implement token expiration monitoring

### Phase 3: Enhanced Features
1. Add webhook support for real-time updates
2. Implement OAuth scope management UI
3. Add connection health monitoring
4. Support for multiple connections per provider

### Phase 4: Integration with Jobs Service
1. Connect OAuth tokens to job execution
2. Implement token refresh before job runs
3. Add retry logic for expired tokens
4. Monitor API rate limits per connection

## Recommendations

### Immediate Actions
1. **Keep service separate** - Do not merge with core
2. **Deploy as-is** after uploading credentials
3. **Create oauth-states table** for CSRF protection
4. **Test each OAuth provider** thoroughly

### Future Improvements
1. Implement token refresh automation
2. Add connection health monitoring
3. Create OAuth connection management UI
4. Add support for OAuth 1.0a providers (Twitter, etc.)
5. Implement IP allowlisting for callbacks
6. Add OAuth connection analytics

## Testing Requirements

### Unit Tests Needed
- OAuth URL generation
- State token generation and validation
- Token exchange logic
- Error handling for each provider

### Integration Tests Needed
- Full OAuth flow for each provider
- Token storage and retrieval
- State management across requests
- Authorization context extraction

### End-to-End Tests
- Complete user journey from start to callback
- Multi-account OAuth connections
- Token refresh flows
- Error scenarios (invalid state, expired codes)