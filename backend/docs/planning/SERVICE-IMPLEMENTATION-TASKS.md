# Service Implementation Task Breakdown

## Overview
This document provides detailed task breakdowns for implementing all remaining services in the ListBackup.ai Go backend.

## Phase 8: Connections Service (Including OAuth)
**Description**: Manages connections to external platforms using OAuth flows or API credentials. This service handles the entire connection lifecycle including OAuth authorization.

### Tasks:
1. **Task 8.1: Analyze Connections Service** (60 min)
   - Review connections/serverless.yml and integrations/serverless.yml
   - Understand OAuth vs API key connections
   - Document credential storage approach

2. **Task 8.2: Design OAuth Architecture** (120 min)
   - Plan OAuth state management
   - Design token storage strategy (Secrets Manager vs DynamoDB)
   - Document security considerations

3. **Task 8.3: Create OAuth State Table** (60 min)
   - Design DynamoDB table for OAuth states
   - Add to infrastructure service
   - Deploy table

4. **Task 8.4: Implement Connection and OAuth Models** (180 min)
   - Create Connection struct
   - Create OAuth state and token models
   - Handle OAuth tokens vs API keys
   - Implement encryption for credentials

5. **Task 8.5: Implement OAuth Service** (180 min)
   - Create OAuth service in Go
   - Handle state generation/validation
   - Implement PKCE support
   - Build platform-specific OAuth configs

6. **Task 8.6: Build OAuth Start Handler** (120 min)
   - GET /connections/oauth/start or /integrations/oauth-start
   - Generate state and store
   - Build authorization URLs
   - Support all 9 platforms

7. **Task 8.7: Build OAuth Callback Handler** (180 min)
   - GET /connections/oauth/callback or /integrations/oauth-callback
   - Validate state
   - Exchange code for tokens
   - Create connection record
   - Store tokens securely

8. **Task 8.8: Build Connections List Handler** (90 min)
   - GET /connections
   - List user's platform connections
   - Hide sensitive credentials

9. **Task 8.9: Build Connections Create Handler (API Key)** (120 min)
   - POST /connections
   - Support API key creation (non-OAuth)
   - Store credentials in Secrets Manager
   - Validate platform exists

10. **Task 8.10: Build Connections Get Handler** (60 min)
    - GET /connections/{connectionId}
    - Return connection details
    - Include connection status

11. **Task 8.11: Build Connections Update Handler** (90 min)
    - PUT /connections/{connectionId}
    - Update connection name/settings
    - Handle credential updates

12. **Task 8.12: Build Connections Delete Handler** (90 min)
    - DELETE /connections/{connectionId}
    - Remove from DynamoDB
    - Delete from Secrets Manager
    - Check for dependent sources

13. **Task 8.13: Build Connections Test Handler** (120 min)
    - POST /connections/{connectionId}/test
    - Test platform authentication
    - Verify API access
    - Return connection health

14. **Task 8.14: Implement Token Refresh Logic** (120 min)
    - Build token refresh service
    - Handle expired tokens automatically
    - Update stored credentials

15. **Task 8.15: Upload OAuth Credentials** (30 min)
    - Run upload script
    - Verify in Secrets Manager
    - Test retrieval

16. **Task 8.16: Deploy and Test Complete Service** (180 min)
    - Deploy all handlers
    - Test OAuth flows for each platform
    - Test API key connections
    - Verify credential storage and refresh

**Total: 1,860 minutes (31 hours)**

## Phase 9: Sources & Source Groups Services
**Description**: Manages data sources created from platform connections and their logical groupings. Sources represent specific data sets to be backed up, while source groups enable bulk operations.

### Sources Tasks:
1. **Task 9.1: Analyze Sources & Groups Requirements** (90 min)
   - Review sources/serverless.yml and source-groups/serverless.yml
   - Understand relationships and shared functionality
   - Document data models needed

2. **Task 9.2: Implement Sources Data Models** (120 min)
   - Create Source struct with proper DynamoDB tags
   - Create SourceGroup struct
   - Handle source configuration (sync frequency, data types)
   - Implement source status tracking and group membership

3. **Task 9.3: Build Sources List Handler** (90 min)
   - GET /sources - List all sources for authenticated user
   - Filter by accountId, status, platform, group
   - Include pagination support

4. **Task 9.4: Build Sources Get Handler** (60 min)
   - GET /sources/{sourceId}
   - Return detailed source information
   - Include sync status and last sync time

5. **Task 9.5: Build Sources Create Handler** (120 min)
   - POST /sources
   - Create source from platform connection
   - Validate connection exists and is active
   - Set default sync configuration

6. **Task 9.6: Build Sources Update Handler** (90 min)
   - PUT /sources/{sourceId}
   - Update sync frequency, enabled data types
   - Handle status changes

7. **Task 9.7: Build Sources Delete Handler** (90 min)
   - DELETE /sources/{sourceId}
   - Soft delete with status update
   - Cancel any active sync jobs
   - Remove from any groups

8. **Task 9.8: Build Sources Sync Handler** (120 min)
   - POST /sources/{sourceId}/sync
   - Trigger manual sync
   - Create job entry
   - Send to SQS queue

9. **Task 9.9: Build Sources Test Handler** (90 min)
   - POST /sources/{sourceId}/test
   - Verify source can connect
   - Test data retrieval
   - Return test results

### Source Groups Tasks:
10. **Task 9.10: Build Groups List Handler** (60 min)
    - GET /source-groups
    - List user's groups
    - Include member count

11. **Task 9.11: Build Groups Create Handler** (90 min)
    - POST /source-groups
    - Create new group
    - Set default properties

12. **Task 9.12: Build Groups Get Handler** (60 min)
    - GET /source-groups/{groupId}
    - Return group details
    - Include member list

13. **Task 9.13: Build Groups Update Handler** (60 min)
    - PUT /source-groups/{groupId}
    - Update name/description
    - Handle settings changes

14. **Task 9.14: Build Groups Delete Handler** (60 min)
    - DELETE /source-groups/{groupId}
    - Remove group
    - Handle member cleanup

15. **Task 9.15: Build Add Source Handler** (90 min)
    - POST /source-groups/{groupId}/sources
    - Add source to group
    - Validate source exists

16. **Task 9.16: Build Remove Source Handler** (60 min)
    - DELETE /source-groups/{groupId}/sources/{sourceId}
    - Remove from group
    - Update counts

17. **Task 9.17: Build List Group Sources Handler** (60 min)
    - GET /source-groups/{groupId}/sources
    - List all sources in group
    - Include source details

18. **Task 9.18: Build Bulk Sync Handler** (120 min)
    - POST /source-groups/{groupId}/sync
    - Trigger sync for all sources in group
    - Create batch job entries

19. **Task 9.19: Deploy and Test Both Services** (180 min)
    - Deploy all handlers
    - Test source operations
    - Test group operations
    - Verify bulk capabilities

**Total: 1,740 minutes (29 hours)**

## Phase 10: Jobs Service
**Description**: Manages backup jobs and sync operations.

### Tasks:
1. **Task 10.1: Analyze Jobs Service** (60 min)
   - Review jobs workflow
   - Understand SQS integration
   - Plan job states

2. **Task 10.2: Implement Job Models** (120 min)
   - Create Job struct
   - Handle job states
   - Design for job history

3. **Task 10.3: Build Jobs List Handler** (90 min)
   - GET /jobs
   - Filter by status, source
   - Include pagination

4. **Task 10.4: Build Jobs Get Handler** (60 min)
   - GET /jobs/{jobId}
   - Return job details
   - Include progress info

5. **Task 10.5: Build Jobs Create Handler** (120 min)
   - POST /jobs
   - Create manual job
   - Send to SQS queue

6. **Task 10.6: Build Jobs Cancel Handler** (90 min)
   - POST /jobs/{jobId}/cancel
   - Update job status
   - Handle cleanup

7. **Task 10.7: Build Jobs Retry Handler** (90 min)
   - POST /jobs/{jobId}/retry
   - Create new job from failed
   - Reset status

8. **Task 10.8: Implement Job Processor** (240 min)
   - SQS message handler
   - Process backup jobs
   - Update job status

9. **Task 10.9: Deploy and Test** (120 min)
   - Deploy handlers
   - Test job lifecycle
   - Verify SQS integration

**Total: 990 minutes (16.5 hours)**

## Phase 11: Utility Services

### Dashboards Service (480 min / 8 hours)
1. Create dashboard models (90 min)
2. Build CRUD handlers (240 min)
3. Implement widget system (90 min)
4. Deploy and test (60 min)

### Tags Service (420 min / 7 hours)
1. Create tag models (60 min)
2. Build CRUD handlers (180 min)
3. Implement tagging system (120 min)
4. Deploy and test (60 min)

### Notifications Service (540 min / 9 hours)
1. Design notification system (90 min)
2. Build notification handlers (180 min)
3. Implement delivery methods (180 min)
4. Deploy and test (90 min)

### Billing Service (600 min / 10 hours)
1. Design billing models (120 min)
2. Implement subscription logic (180 min)
3. Build billing handlers (180 min)
4. Deploy and test (120 min)

### System Service (360 min / 6 hours)
1. Build health check endpoints (90 min)
2. Implement system status (90 min)
3. Create admin endpoints (120 min)
4. Deploy and test (60 min)

### Domains Service (420 min / 7 hours)
1. Analyze domain management (60 min)
2. Build domain handlers (240 min)
3. Implement SSL logic (60 min)
4. Deploy and test (60 min)

### Clients Service (480 min / 8 hours)
1. Design client management (90 min)
2. Build client handlers (240 min)
3. Implement permissions (90 min)
4. Deploy and test (60 min)

### Teams Service (540 min / 9 hours)
1. Implement team models (90 min)
2. Build team handlers (240 min)
3. Implement permissions (120 min)
4. Deploy and test (90 min)

## Summary

### Core Platform Services (Phases 7-10)
- Platforms: 540 min (9 hours)
- Connections (with OAuth): 1,860 min (31 hours)
- Sources & Source Groups: 1,740 min (29 hours)
- Jobs: 990 min (16.5 hours)
**Subtotal: 5,130 minutes (85.5 hours)**

### Utility Services (Phase 11)
- Total: 3,660 minutes (61 hours)

**Grand Total: 8,790 minutes (146.5 hours)**

## Implementation Order
1. Platforms (Phase 7) - Current
2. Connections with OAuth (Phase 8) - Required for sources
3. Sources & Source Groups (Phase 9) - Core functionality
4. Jobs (Phase 10) - Process backups
5. Utility Services (Phase 11) - Supporting features

## Notes
- Each service should follow the prefix pattern (strip prefixes in responses)
- All handlers need JWT authorization
- Use infrastructure resources via CloudFormation imports
- Follow existing patterns from auth, users, and accounts services
- Test each service thoroughly before moving to next