# ListBackup.ai API Endpoints Summary

This document provides a comprehensive list of all API endpoints available in the ListBackup.ai backend systems.

## Production API (project/backend)

Base URL: `https://api.listbackup.ai`

### Authentication & Users
- `POST /users/login` - User login
- `POST /users/register` - User registration
- `POST /users/login/reset` - Reset password
- `POST /users/change-password` - Change password (requires auth)
- `GET /users/me` - Get current user info (requires auth)
- `GET /users/accounts` - Get linked accounts (requires auth)
- `GET /users/accounts/invites` - Get account invites (requires auth)
- `POST /users/accounts` - Link user to account (requires auth)
- `DELETE /users/accounts` - Unlink user from account (requires auth)
- `PUT /users/{userId}` - Update user (requires auth)
- `DELETE /users/{userId}` - Delete user (requires auth)
- `POST /auth/refresh` - Refresh auth token

### Accounts
- `POST /accounts` - Create account (requires auth)
- `GET /accounts/{accountId}` - Get account details (requires auth)
- `PUT /accounts/{accountId}` - Update account (requires auth)
- `DELETE /accounts/{accountId}` - Delete account (requires auth)
- `GET /accounts/users` - Get account users (requires auth)
- `POST /accounts/users/invite` - Invite user to account (requires auth)

### Jobs & Backups
- `GET /jobs` - Get user jobs (requires auth)
- `POST /jobs` - Create job (requires auth)
- `GET /jobs/{jobId}` - Get job details (requires auth)
- `PUT /jobs/{jobId}` - Update job (requires auth)
- `DELETE /jobs/{jobId}` - Delete job (requires auth)
- `POST /jobs/{jobId}/run` - Run job (requires auth)
- `GET /jobs/{jobId}/data` - Get job data/files (requires auth)

### Job Runs
- `GET /jobs/runs` - Get account job runs (requires auth)
- `GET /jobs/{jobId}/runs` - Get runs for specific job (requires auth)
- `GET /jobRuns/{jobRunId}` - Get specific job run (requires auth)

### Files
- `POST /files` - Upload file (requires auth)
- `GET /files` - Get user files (requires auth)
- `GET /files/{fileId}` - Get file details (requires auth)
- `PUT /files/{fileId}` - Update file (requires auth)
- `DELETE /files/{fileId}` - Delete file (requires auth)
- `GET /file/{userId}/{s3fileId}` - Direct S3 file access (requires auth)

### Data Access
- `GET /data` - Get account data (requires auth)
- `GET /data/{proxy+}` - Get data with path (requires auth)
- `GET /dataAccess/{proxy+}` - Get signed URL for data access (requires auth)

### Integrations
- `GET /integrations` - List user integrations (requires auth)
- `POST /integrations` - Create integration (requires auth)
- `GET /integrations/{integrationId}` - Get integration details (requires auth)
- `PUT /integrations/{integrationId}` - Update integration (requires auth)
- `DELETE /integrations/{integrationId}` - Delete integration (requires auth)
- `GET /app/integrations` - List available integrations
- `GET /app/integrations/{integrationId}` - Get available integration details

### OAuth Integration
- `GET /appIntegrations/{appIntegrationId}/oauth/start` - Start OAuth flow (requires auth)
- `GET /appIntegrations/{appIntegrationId}/oauth/callback` - OAuth callback
- `GET /appIntegrations/{appIntegrationId}/oauth/status` - Check OAuth status (requires auth)
- `DELETE /appIntegrations/{appIntegrationId}/oauth/revoke` - Revoke OAuth token (requires auth)

### Billing & Payments
- `GET /accounts/{accountId}/billing/cards` - Get billing cards (requires auth)
- `GET /accounts/{accountId}/billing/invoices` - Get invoices (requires auth)
- `GET /accounts/{accountId}/billing/subscriptions` - Get subscriptions (requires auth)
- `PUT /accounts/{accountId}/billing/subscriptions/{subscriptionId}` - Update subscription (requires auth)
- `POST /integration/stripe/checkout` - Create checkout session (requires auth)
- `POST /integration/stripe/webhook` - Stripe webhook

### Activity & Analytics
- `GET /activity` - Get activity feed (requires auth)

### AI Assistants
- `POST /assistants` - Create assistant (requires auth)
- `GET /assistants` - List assistants (requires auth)
- `GET /assistants/{assistantId}` - Get assistant details (requires auth)
- `PUT /assistants/{assistantId}` - Update assistant (requires auth)
- `DELETE /assistants/{assistantId}` - Delete assistant (requires auth)

### Threads (Conversations)
- `POST /threads` - Create thread (requires auth)
- `GET /threads` - List threads (requires auth)
- `GET /threads/{threadId}` - Get thread details (requires auth)
- `PUT /threads/{threadId}` - Update thread (requires auth)
- `DELETE /threads/{threadId}` - Delete thread (requires auth)
- `GET /threads/{threadId}/messages` - List thread messages (requires auth)
- `POST /threads/{threadId}/messages` - Create thread message (requires auth)
- `POST /threads/{threadId}/run` - Run thread (requires auth)

## Analytics API (project/backend/serverless-analytics.yml)

Base URL: `https://api.listbackup.ai`

### Analytics & AI
- `POST /analytics/query` - Execute AI query (requires auth)
- `GET /analytics/datasets` - Get analytics datasets (requires auth)
- `GET /analytics/accounts/{accountId}/ai-settings` - Get AI settings (requires auth)
- `PUT /analytics/accounts/{accountId}/ai-settings` - Update AI settings (requires auth)

## Chat API (project/backend/serverless-chat.yml)

Base URL: `https://chat.api.listbackup.ai`

### Streaming Chat & MCP
- `POST /chat/stream` - Stream chat (requires auth)
- `POST /mcp/sse` - Model Context Protocol SSE (requires auth)
- `POST /mcp` - Model Context Protocol JSON-RPC (requires auth)

### Conversations
- `POST /conversations` - Create conversation (requires auth)
- `GET /conversations` - List conversations (requires auth)
- `GET /conversations/{conversationId}` - Get conversation (requires auth)
- `PUT /conversations/{conversationId}` - Update conversation (requires auth)
- `DELETE /conversations/{conversationId}` - Delete conversation (requires auth)

### Messages
- `POST /conversations/{conversationId}/messages` - Send message (requires auth)
- `GET /conversations/{conversationId}/messages` - Get messages (requires auth)
- `PUT /conversations/{conversationId}/messages/{messageId}` - Update message (requires auth)
- `DELETE /conversations/{conversationId}/messages/{messageId}` - Delete message (requires auth)

## V2 API (listbackup-ai-v2/backend-v2)

Base URL: TBD (uses HTTP API Gateway)

### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### User Management
- `GET /users/profile` - Get profile
- `PUT /users/profile` - Update profile

### Account Management
- `GET /account/settings` - Get settings
- `PUT /account/settings` - Update settings
- `GET /account/usage` - Get usage stats

### Data Sources
- `GET /sources` - List sources
- `POST /sources` - Create source
- `PUT /sources/{sourceId}` - Update source
- `DELETE /sources/{sourceId}` - Delete source
- `POST /sources/{sourceId}/test` - Test source connection

### Backup Jobs
- `GET /jobs` - List jobs
- `GET /jobs/{jobId}` - Get job details
- `POST /jobs` - Create job
- `PUT /jobs/{jobId}` - Update job
- `DELETE /jobs/{jobId}` - Delete job
- `POST /jobs/{jobId}/run` - Run job
- `POST /jobs/{jobId}/stop` - Stop job

### Job Runs & Monitoring
- `GET /runs` - List runs
- `GET /runs/{runId}` - Get run details
- `GET /runs/{runId}/logs` - Get run logs

### Data Browsing
- `GET /data` - List data
- `POST /data/search` - Search data
- `POST /data/download` - Download data

### Analytics & Monitoring
- `GET /analytics/stats` - Get stats
- `GET /analytics/activity` - Get activity
- `GET /system/health` - System health check

### Integrations & OAuth
- `GET /integrations` - List integrations
- `GET /oauth/{provider}/callback` - OAuth callback
- `POST /oauth/{provider}/initiate` - Initiate OAuth

## Authentication

Most endpoints require authentication via Cognito User Pools. The authentication token should be passed in the `Authorization` header as a Bearer token.

## CORS

All endpoints have CORS enabled to allow cross-origin requests from the frontend application.