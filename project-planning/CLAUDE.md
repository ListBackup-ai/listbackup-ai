# Claude Development Continuity Document

## Project: ListBackup.ai v2
**Last Updated**: 2025-06-14
**Current Focus**: Go API OAuth implementation complete - Need to upload credentials and decide on token storage

## Project Structure
- v1 (Legacy): /project/backend/ - Currently running on api.listbackup.ai
- v2 (New): /listbackup-ai-v2/backend/ - Will run on {stage}.api.listbackup.ai

Note: only /project/backend and /project/frontend should be used for understanding of how the v1 idea worked.

## Critical Context

### Current Status - MAJOR PROGRESS ✅
- ✅ Modular serverless architecture deployed and functional
- ✅ Authorization context extraction fixed (sources now created with proper accountId)
- ✅ AWS SDK v3 migration completed for critical handlers
- ✅ User registration and login working
- ✅ Source creation and retrieval working correctly
- ✅ Go API OAuth implementation complete with all 9 platforms
- ✅ Web app migrated to /platforms/web with shared code architecture
- 🔄 OAuth credentials need to be uploaded to AWS Secrets Manager
- 🔄 Token storage decision pending (Secrets Manager vs DynamoDB)

### Key Architecture Decisions

#### 1. **Hierarchical Account Structure (LAUNCH REQUIREMENT)**
- Enterprise conglomerate support (like PepsiCo > Frito-Lay > Lay's Brand > Regional > Location)
- Unlimited nesting depth
- Path-based hierarchy for efficient queries
- Data aggregation at any level
- Cross-subsidiary reporting
- Target: Agencies, Franchises, Multi-location businesses, Conglomerates

#### 2. **Multiple Sources Per Integration**
Each entity can have multiple instances of the same integration:
- Agency with 3 Keap accounts (different clients)
- Company with multiple Stripe accounts (USD, EUR, etc.)
- Regional operations with location-specific accounts

#### 3. **Current System Status**
- ✅ Integration UI built
- ✅ Backend connectors implemented (Keap, Stripe, GoHighLevel, ActiveCampaign, MailChimp, Zendesk)
- ✅ Logo migration from v1 completed
- ✅ Authorization context fix deployed
- ❌ Sources not showing due to missing accountId (fix deployed, needs testing)

## Immediate Tasks

### OAuth Implementation (Go API)
1. ✅ Implemented OAuth handlers (oauth-start and oauth-callback)
2. ✅ Created OAuth configuration for 9 platforms
3. ✅ Built OAuth service with token exchange
4. ⏳ Upload OAuth credentials to AWS Secrets Manager using scripts
5. ⏳ Create oauth-states DynamoDB table
6. ⏳ Decide on token storage: Secrets Manager vs DynamoDB

### Token Storage Architecture Decision
**Current Implementation**: AWS Secrets Manager
- Path: `sources/{accountId}/{sourceId}/oauth-tokens`

**Alternative**: DynamoDB with KMS encryption
- Pros: Lower cost, faster access, better for high-frequency reads
- Cons: Need to implement encryption layer

**Hybrid Approach** (Recommended):
- DynamoDB: Encrypted access tokens (frequently accessed)
- Secrets Manager: Refresh tokens and client secrets (rarely accessed)

## Code Locations

### Go API OAuth Implementation
- `/listbackup-ai-v2/backend/golang/internal/config/oauth.go` - OAuth provider configurations
- `/listbackup-ai-v2/backend/golang/internal/services/oauth.go` - OAuth service implementation
- `/listbackup-ai-v2/backend/golang/internal/services/secrets.go` - AWS Secrets Manager service
- `/listbackup-ai-v2/backend/golang/cmd/handlers/integrations/oauth-start/` - OAuth initiation handler
- `/listbackup-ai-v2/backend/golang/cmd/handlers/integrations/oauth-callback/` - OAuth callback handler

### Scripts Created
- `/listbackup-ai-v2/backend/scripts/upload-oauth-secrets.sh` - Upload OAuth credentials to AWS
- `/listbackup-ai-v2/backend/scripts/create-oauth-tables.sh` - Create DynamoDB tables for OAuth

### Key Files Modified (Node.js)
- `/listbackup-ai-v2/backend/nodejs/src/handlers/sources/create.js` - Added auth context extraction
- `/listbackup-ai-v2/backend/nodejs/src/connectors/` - All connector implementations

### Critical Functions
```javascript
// Auth context extraction pattern (must be used in ALL handlers)
let userId, accountId;
if (event.requestContext.authorizer.lambda) {
    userId = event.requestContext.authorizer.lambda.userId;
    accountId = event.requestContext.authorizer.lambda.accountId;
} else {
    userId = event.requestContext.authorizer.userId;
    accountId = event.requestContext.authorizer.accountId;
}
```

## Database Schema Requirements

### For Hierarchical Accounts
```javascript
// ACCOUNTS_TABLE
{
  accountId: string,
  parentAccountId: string | null,
  accountPath: string, // "/root/subsidiary/division/"
  accountType: string, // conglomerate|subsidiary|division|location
  level: number,
  // ... aggregated data
}

// USERS_ACCOUNTS_TABLE (many-to-many)
{
  userId: string,
  accountId: string,
  role: string,
  permissions: object
}
```

## Testing Credentials & Guidelines

### Security Guidelines
- **ALWAYS use @listbackup.ai domain for testing** (e.g., nick+alias@listbackup.ai)
- This ensures security and allows team access to test accounts
- Never use personal or external email addresses for testing

### Keap Credentials
- Keap Service Account Key (SAK): `KeapAK-90f9abc64fe6148793a395b48e7c744a1db4d56e1d49dcda30`
- Legacy API Token: `KeapAK-a78cab2f54b1c23adea92531c43ebd8cdd7a5971f6c25ed799`
- Account being used: yl175

## DynamoDB Issues Found
1. Activity table expects `eventId` not `activityId` (FIXED)
2. Activity table expects timestamp as Number not String (FIXED)
3. Sources created without accountId field (FIXED - needs testing)

## Deployment Commands
```bash
cd /Users/nickkulavic/Projects/listbackup.ai/listbackup-ai-v2/backend/nodejs
sls deploy --config serverless-api.yml --aws-profile listbackup.ai --stage main
```

## Next Session Should
1. Run OAuth credential upload script to AWS Secrets Manager
2. Create oauth-states DynamoDB table
3. Deploy Go API Lambda functions with OAuth handlers
4. Test OAuth flow for each platform
5. Implement hybrid token storage (DynamoDB + Secrets Manager)
6. Continue with remaining Go API handlers
7. Test full integration flow with real platforms

## Important Notes
- The hierarchical account system is a LAUNCH REQUIREMENT, not a future feature
- Each entity can have multiple sources of the same type
- Data isolation by accountId is critical for security
- The system must support complex organizational structures from day one
- All handlers need the auth context extraction pattern applied

## Key Feature Requirements

### 1. **Data Sync/Migration (Premium Feature)**
- **Use Case**: Migrate data from Keap to GoHighLevel, or between any supported platforms
- **Implementation**: Manual trigger or scheduled sync jobs
- **Value Prop**: Platform migration without data loss
- **Pricing Tier**: Higher plans only
- **Examples**:
  - Keap → GoHighLevel migration
  - Stripe → Square migration
  - MailChimp → ActiveCampaign migration

### 2. **Two-Factor Authentication (2FA)**
- **Requirement**: Must be available at launch
- **V1 Implementation**: SMS via Twilio (review `/project/backend/src/handlers/user/userHandler.js`)
- **Options**: SMS, Authenticator App, Email
- **Security**: Required for enterprise accounts

### 3. **Data Isolation Architecture**
- **S3 Structure**: Separate buckets per account or path-based isolation
  ```
  s3://listbackup-{accountId}/
  ├── sources/
  │   ├── {sourceId}/
  │   │   ├── {date}/
  │   │   │   ├── contacts.json
  │   │   │   ├── orders.json
  ```
- **Encryption**: Per-account encryption keys
- **Access**: Strict IAM policies per account

### 4. **External Storage Destinations**
- **Primary**: S3 (immediate storage)
- **Secondary**: User's own storage (scheduled transfer)
  - Google Drive
  - Dropbox
  - Box
  - OneDrive
  - FTP/SFTP
  - Azure Blob Storage
  - Google Cloud Storage
- **Implementation**: 
  - S3 → External storage sync job
  - User provides OAuth or API credentials
  - Configurable retention policies
- **Benefits**:
  - Users own their data
  - Compliance requirements
  - Cost management (user's storage)

## Architecture Flow
```
Source API → Connector → S3 (ListBackup) → External Storage (User's)
                ↓
           DynamoDB (metadata)
```

## OAuth Credentials (From V1)

### Client IDs Found
- **Google**: `711602602927-08rm88vil0gak6cu9pnki767t1n36pkv.apps.googleusercontent.com`
- **HubSpot**: `e11e9b4f-468e-402b-92da-90e9ba4658ac`
- **GoHighLevel**: `67a18506d0c00c53779aea39-m6px2qki`
- **Dropbox**: `ruqprebg7njvlkd`
- **Box**: `yj1xr1ov7w1nmwslx7b3cac1ooo2pbnk`
- **QuickBooks**: `ABM3ihX7LbyIRPalDESlY55H6iQXqtTqZRXJrv1qp5411HsTqJ`
- **Shopify**: Needs to be created
- **Keap**: Needs to be created
- **Stripe**: Needs to be created

### OAuth Configuration
All configurations are in `/listbackup-ai-v2/backend/golang/internal/config/oauth.go` with:
- Authorization URLs
- Token URLs
- Scopes
- User info endpoints

## V1 Code to Review
- `/project/backend/src/handlers/user/userHandler.js` - SMS 2FA implementation
- Check for Twilio integration
- Review authentication flow

## Phase 1 Serverless Infrastructure Audit Documentation

### Task 1.2: Cross-Stack References (Completed 2025-06-22)
- **Documentation**: `/listbackup-ai-v2/backend/docs/phase1-audit/cross-stack-references.md`
- **Key Findings**:
  - Core service exports 14 DynamoDB tables, 1 S3 bucket, 6 SQS queues (with DLQs), Cognito resources, and EventBridge
  - 18 services import from core using CloudFormation references (`${cf:}` pattern)
  - Dashboards service uses ImportValue pattern (needs standardization)
  - API Gateway missing HttpApiId export
  - Clear deployment order established: Infrastructure → Core → API Gateway → Application Services
- **Issues Identified**:
  - Dashboards service using inconsistent import pattern
  - API Gateway needs to export HttpApiId
  - Notifications service may need Cognito references