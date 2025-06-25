# API Explorer - Interactive Documentation

**🔧 Complete interactive API documentation for ListBackup.ai v2**

---

## 🚀 Quick Start

### Base URL
```
Production:    https://api.listbackup.ai
Staging:       https://staging.api.listbackup.ai
Development:   https://main.api.listbackup.ai
Local:         http://localhost:3001
```

### Authentication
All API requests require a valid JWT token in the Authorization header:
```bash
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 API Services Overview

| Service | Base Path | Description | Endpoints |
|---------|-----------|-------------|-----------|
| **Authentication** | `/auth` | User authentication and JWT management | 7 |
| **Users** | `/users` | User profile and settings management | 5 |
| **Accounts** | `/account` | Hierarchical account management | 5 |
| **Teams** | `/teams` | Team collaboration and management | 14 |
| **Clients** | `/clients` | Client portal and access management | 20 |
| **Sources** | `/sources` | Data source configuration and sync | 7 |
| **Source Groups** | `/source-groups` | Source organization and batch operations | 8 |
| **Connections** | `/connections` | Platform connectivity and OAuth | 6 |
| **Platforms** | `/platforms` | Integration definitions and templates | 6 |
| **Jobs** | `/jobs` | Background job management and queuing | 6 |
| **Domains** | `/domains` | Custom domain setup and DNS management | 8 |
| **System** | `/system` | Health checks and system information | 3 |

---

## 🔐 Authentication Service

### POST /auth/register
**Register a new user account**

```bash
curl -X POST https://api.listbackup.ai/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@company.com",
    "password": "SecurePassword123!",
    "name": "John Doe",
    "company": "Example Corp"
  }'
```

**Request Body:**
```typescript
interface RegisterRequest {
  email: string           // Valid email address
  password: string        // Min 8 chars, mixed case, numbers, symbols
  name: string           // Full name (2-100 characters)
  company?: string       // Company name (optional)
  termsAccepted: boolean // Must be true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification.",
  "data": {
    "userId": "user_2Nq5XkJ8mR7pL3wV",
    "email": "user@company.com",
    "accountId": "acc_8mR7pL3wV2Nq5XkJ",
    "verificationRequired": true
  }
}
```

### POST /auth/login
**Authenticate user and receive JWT tokens**

```bash
curl -X POST https://api.listbackup.ai/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@company.com",
    "password": "SecurePassword123!"
  }'
```

**Request Body:**
```typescript
interface LoginRequest {
  email: string     // User email address
  password: string  // User password
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIi...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "userId": "user_2Nq5XkJ8mR7pL3wV",
      "email": "user@company.com",
      "name": "John Doe",
      "currentAccountId": "acc_8mR7pL3wV2Nq5XkJ"
    },
    "accounts": [
      {
        "accountId": "acc_8mR7pL3wV2Nq5XkJ",
        "name": "Example Corp",
        "role": "owner",
        "permissions": ["read", "write", "admin"]
      }
    ]
  }
}
```

### POST /auth/refresh
**Refresh expired access token**

```bash
curl -X POST https://api.listbackup.ai/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIi..."
  }'
```

### GET /auth/status
**Check authentication status**

```bash
curl -X GET https://api.listbackup.ai/auth/status \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "userId": "user_2Nq5XkJ8mR7pL3wV",
    "accountId": "acc_8mR7pL3wV2Nq5XkJ",
    "tokenExpiry": "2025-06-20T15:30:00Z",
    "permissions": ["read", "write", "admin"]
  }
}
```

---

## 👤 Users Service

### GET /users/me
**Get current user profile**

```bash
curl -X GET https://api.listbackup.ai/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_2Nq5XkJ8mR7pL3wV",
    "email": "user@company.com",
    "name": "John Doe",
    "status": "active",
    "currentAccountId": "acc_8mR7pL3wV2Nq5XkJ",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-06-20T14:22:00Z",
    "preferences": {
      "theme": "light",
      "timezone": "America/New_York",
      "language": "en",
      "notifications": {
        "email": true,
        "browser": true,
        "mobile": false
      }
    },
    "profile": {
      "avatar": "https://example.com/avatar.jpg",
      "title": "Data Manager",
      "phone": "+1-555-0123"
    }
  }
}
```

### PUT /users/me
**Update user profile**

```bash
curl -X PUT https://api.listbackup.ai/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "profile": {
      "title": "Senior Data Manager",
      "phone": "+1-555-0124"
    }
  }'
```

### GET /users/me/settings
**Get user preferences and settings**

### PUT /users/me/settings
**Update user preferences**

```bash
curl -X PUT https://api.listbackup.ai/users/me/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "theme": "dark",
      "timezone": "America/Los_Angeles",
      "notifications": {
        "email": true,
        "browser": false,
        "mobile": true
      }
    }
  }'
```

### GET /users/me/accounts
**Get user's account associations**

```bash
curl -X GET https://api.listbackup.ai/users/me/accounts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "accountId": "acc_8mR7pL3wV2Nq5XkJ",
        "name": "Example Corp",
        "company": "Example Corporation",
        "role": "owner",
        "status": "active",
        "permissions": ["read", "write", "admin"],
        "linkedAt": "2025-01-15T10:30:00Z",
        "lastAccessAt": "2025-06-20T14:00:00Z"
      },
      {
        "accountId": "acc_9nS8qM4xW3Oq6YlK",
        "name": "Client Account",
        "company": "Client Corp",
        "role": "member",
        "status": "active",
        "permissions": ["read", "write"],
        "linkedAt": "2025-03-10T09:15:00Z",
        "lastAccessAt": "2025-06-19T16:45:00Z"
      }
    ],
    "totalCount": 2
  }
}
```

---

## 📊 Sources Service

### GET /sources
**List all data sources for current account**

```bash
curl -X GET "https://api.listbackup.ai/sources?limit=20&status=active" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Query Parameters:**
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status (active, paused, error, deleted)
- `platformId` (optional): Filter by platform
- `groupId` (optional): Filter by source group

**Response:**
```json
{
  "success": true,
  "data": {
    "sources": [
      {
        "sourceId": "src_5Kj8mR7pL3wV2Nq",
        "name": "Customer Contacts",
        "platformId": "keap",
        "platformName": "Keap",
        "connectionId": "conn_7pL3wV2Nq5XkJ8m",
        "platformSourceId": "keap-contacts",
        "groupId": "group_3wV2Nq5XkJ8mR7p",
        "status": "active",
        "lastSyncAt": "2025-06-20T12:00:00Z",
        "nextSyncAt": "2025-06-21T12:00:00Z",
        "settings": {
          "enabled": true,
          "priority": "high",
          "frequency": "daily",
          "retentionDays": 365,
          "incrementalSync": true,
          "notifications": {
            "onSuccess": true,
            "onFailure": true
          }
        },
        "metadata": {
          "recordCount": 15420,
          "lastRecordId": "contact_abc123",
          "dataSize": "2.4MB",
          "syncDuration": 45
        },
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-06-20T12:05:00Z"
      }
    ],
    "totalCount": 1,
    "hasMore": false
  }
}
```

### POST /sources
**Create a new data source**

```bash
curl -X POST https://api.listbackup.ai/sources \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "conn_7pL3wV2Nq5XkJ8m",
    "platformSourceId": "keap-contacts",
    "name": "Customer Contacts",
    "groupId": "group_3wV2Nq5XkJ8mR7p",
    "settings": {
      "enabled": true,
      "priority": "high",
      "frequency": "daily",
      "retentionDays": 365,
      "incrementalSync": true,
      "notifications": {
        "onSuccess": true,
        "onFailure": true
      }
    }
  }'
```

**Request Body:**
```typescript
interface CreateSourceRequest {
  connectionId: string        // Platform connection ID
  platformSourceId: string   // Platform data type identifier
  name: string               // User-defined source name
  groupId?: string           // Optional source group
  settings: {
    enabled: boolean         // Enable/disable sync
    priority: 'low' | 'medium' | 'high'
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
    retentionDays: number    // Data retention period
    incrementalSync: boolean // Full vs incremental sync
    notifications: {
      onSuccess: boolean     // Notify on successful sync
      onFailure: boolean     // Notify on sync failure
    }
  }
}
```

### GET /sources/{sourceId}
**Get detailed information about a specific source**

```bash
curl -X GET https://api.listbackup.ai/sources/src_5Kj8mR7pL3wV2Nq \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### PUT /sources/{sourceId}
**Update source configuration**

```bash
curl -X PUT https://api.listbackup.ai/sources/src_5Kj8mR7pL3wV2Nq \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Customer Contacts",
    "settings": {
      "frequency": "hourly",
      "priority": "medium"
    }
  }'
```

### POST /sources/{sourceId}/sync
**Trigger manual synchronization**

```bash
curl -X POST https://api.listbackup.ai/sources/src_5Kj8mR7pL3wV2Nq/sync \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullSync": false,
    "priority": "high"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Sync job queued successfully",
  "data": {
    "jobId": "job_9mR7pL3wV2Nq5Xk",
    "sourceId": "src_5Kj8mR7pL3wV2Nq",
    "type": "sync",
    "status": "pending",
    "priority": "high",
    "fullSync": false,
    "estimatedDuration": 60,
    "queuePosition": 2,
    "createdAt": "2025-06-20T14:30:00Z"
  }
}
```

### POST /sources/{sourceId}/test
**Test source connection and configuration**

```bash
curl -X POST https://api.listbackup.ai/sources/src_5Kj8mR7pL3wV2Nq/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connectionStatus": "success",
    "apiStatus": "success",
    "dataAccess": "success",
    "recordCount": 15420,
    "sampleData": [
      {
        "id": "contact_abc123",
        "name": "John Doe",
        "email": "john@example.com",
        "created": "2025-01-15T10:30:00Z"
      }
    ],
    "responseTime": 245,
    "lastModified": "2025-06-20T11:45:00Z"
  }
}
```

### DELETE /sources/{sourceId}
**Delete a data source**

```bash
curl -X DELETE https://api.listbackup.ai/sources/src_5Kj8mR7pL3wV2Nq \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔌 Platforms Service

### GET /platforms
**List all available platforms**

```bash
curl -X GET "https://api.listbackup.ai/platforms?category=crm&status=active" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Query Parameters:**
- `category` (optional): Filter by category (crm, marketing, payment, storage, communication)
- `status` (optional): Filter by status (active, beta, deprecated)
- `type` (optional): Filter by integration type (oauth, api_key, manual)

**Response:**
```json
{
  "success": true,
  "data": {
    "platforms": [
      {
        "platformId": "keap",
        "name": "Keap",
        "description": "CRM and marketing automation platform",
        "category": "crm",
        "type": "oauth",
        "status": "active",
        "logoUrl": "https://assets.listbackup.ai/logos/keap.png",
        "websiteUrl": "https://keap.com",
        "oauth": {
          "authorizationUrl": "https://accounts.keap.com/app/oauth/authorize",
          "tokenUrl": "https://api.keap.com/token",
          "scopes": ["full"],
          "requiresPKCE": false
        },
        "dataSources": [
          {
            "sourceId": "keap-contacts",
            "name": "Contacts",
            "description": "Customer and lead contact information",
            "category": "contacts",
            "estimatedRecords": "10K-100K",
            "updateFrequency": "real-time"
          },
          {
            "sourceId": "keap-orders",
            "name": "Orders",
            "description": "Order and transaction history",
            "category": "transactions",
            "estimatedRecords": "1K-50K",
            "updateFrequency": "real-time"
          }
        ],
        "rateLimit": {
          "requestsPerSecond": 5,
          "requestsPerMinute": 300,
          "requestsPerDay": 100000
        },
        "documentation": "https://developer.keap.com",
        "supportedFeatures": [
          "incremental_sync",
          "webhook_notifications",
          "real_time_updates",
          "bulk_export"
        ]
      }
    ],
    "totalCount": 1
  }
}
```

### GET /platforms/{platformId}
**Get detailed platform information**

```bash
curl -X GET https://api.listbackup.ai/platforms/keap \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### GET /platforms/{platformId}/sources
**Get available data sources for a platform**

```bash
curl -X GET https://api.listbackup.ai/platforms/keap/sources \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### GET /platforms/{platformId}/sources/{sourceId}
**Get detailed information about a platform data source**

```bash
curl -X GET https://api.listbackup.ai/platforms/keap/sources/keap-contacts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sourceId": "keap-contacts",
    "platformId": "keap",
    "name": "Contacts",
    "description": "Customer and lead contact information including custom fields, tags, and communication preferences",
    "category": "contacts",
    "dataSchema": {
      "fields": [
        {
          "name": "id",
          "type": "string",
          "required": true,
          "description": "Unique contact identifier"
        },
        {
          "name": "email",
          "type": "string",
          "required": false,
          "description": "Primary email address"
        },
        {
          "name": "firstName",
          "type": "string",
          "required": false,
          "description": "Contact first name"
        },
        {
          "name": "lastName",
          "type": "string",
          "required": false,
          "description": "Contact last name"
        },
        {
          "name": "tags",
          "type": "array",
          "required": false,
          "description": "Applied tags and categories"
        }
      ]
    },
    "sampleData": {
      "id": "contact_123",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "tags": ["customer", "vip"],
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-06-20T14:22:00Z"
    },
    "estimatedRecords": "10K-100K",
    "updateFrequency": "real-time",
    "syncOptions": {
      "incrementalSync": true,
      "webhookSupport": true,
      "bulkExport": true,
      "customFields": true
    }
  }
}
```

---

## 🔗 Connections Service

### GET /connections
**List platform connections**

```bash
curl -X GET "https://api.listbackup.ai/connections?platformId=keap&status=active" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connections": [
      {
        "connectionId": "conn_7pL3wV2Nq5XkJ8m",
        "name": "Main Keap Account",
        "platformId": "keap",
        "platformName": "Keap",
        "authType": "oauth",
        "status": "active",
        "expiresAt": "2025-12-20T14:30:00Z",
        "lastUsedAt": "2025-06-20T12:00:00Z",
        "metadata": {
          "accountName": "Example Corp Keap",
          "userId": "user_keap_123",
          "scopes": ["full"],
          "apiVersion": "v1"
        },
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-06-20T12:05:00Z"
      }
    ],
    "totalCount": 1
  }
}
```

### POST /connections
**Create a new platform connection (manual/API key)**

```bash
curl -X POST https://api.listbackup.ai/connections \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platformId": "stripe",
    "name": "Main Stripe Account",
    "authType": "api_key",
    "credentials": {
      "apiKey": "sk_test_...",
      "publishableKey": "pk_test_..."
    }
  }'
```

### GET /connections/{connectionId}
**Get connection details**

```bash
curl -X GET https://api.listbackup.ai/connections/conn_7pL3wV2Nq5XkJ8m \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### POST /connections/{connectionId}/test
**Test connection validity**

```bash
curl -X POST https://api.listbackup.ai/connections/conn_7pL3wV2Nq5XkJ8m/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connectionStatus": "success",
    "apiStatus": "success",
    "authenticationValid": true,
    "permissionsValid": true,
    "responseTime": 245,
    "lastTested": "2025-06-20T14:30:00Z",
    "capabilities": [
      "read_contacts",
      "read_orders",
      "webhook_support"
    ],
    "quotas": {
      "requestsRemaining": 99750,
      "resetTime": "2025-06-21T00:00:00Z"
    }
  }
}
```

### PUT /connections/{connectionId}
**Update connection configuration**

### DELETE /connections/{connectionId}
**Delete a platform connection**

---

## ⚙️ Jobs Service

### GET /jobs
**List background jobs**

```bash
curl -X GET "https://api.listbackup.ai/jobs?type=backup&status=completed&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Query Parameters:**
- `type` (optional): Filter by job type (backup, sync, export, cleanup)
- `status` (optional): Filter by status (pending, running, completed, failed)
- `sourceId` (optional): Filter by source
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "jobId": "job_9mR7pL3wV2Nq5Xk",
        "type": "backup",
        "status": "completed",
        "sourceId": "src_5Kj8mR7pL3wV2Nq",
        "sourceName": "Customer Contacts",
        "progress": {
          "percentage": 100,
          "recordsProcessed": 15420,
          "recordsTotal": 15420,
          "bytesProcessed": 2457600,
          "currentOperation": "completed"
        },
        "createdAt": "2025-06-20T12:00:00Z",
        "startedAt": "2025-06-20T12:00:15Z",
        "completedAt": "2025-06-20T12:01:30Z",
        "metadata": {
          "fullSync": false,
          "recordsAdded": 25,
          "recordsUpdated": 143,
          "recordsDeleted": 2,
          "filesGenerated": 3,
          "compressionRatio": 0.65
        },
        "retryCount": 0
      }
    ],
    "totalCount": 1
  }
}
```

### POST /jobs
**Create a new background job**

```bash
curl -X POST https://api.listbackup.ai/jobs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "backup",
    "sourceId": "src_5Kj8mR7pL3wV2Nq",
    "priority": "high",
    "parameters": {
      "fullSync": false,
      "compression": true,
      "encryption": true
    }
  }'
```

### GET /jobs/{jobId}
**Get detailed job information**

```bash
curl -X GET https://api.listbackup.ai/jobs/job_9mR7pL3wV2Nq5Xk \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### POST /jobs/{jobId}/queue
**Queue job for immediate execution**

```bash
curl -X POST https://api.listbackup.ai/jobs/job_9mR7pL3wV2Nq5Xk/queue \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": "high"
  }'
```

### DELETE /jobs/{jobId}
**Cancel or delete a job**

---

## 🏢 Accounts Service

### GET /account
**Get current account details**

```bash
curl -X GET https://api.listbackup.ai/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accountId": "acc_8mR7pL3wV2Nq5XkJ",
    "name": "Example Corp",
    "company": "Example Corporation",
    "parentAccountId": null,
    "accountPath": "/example-corp/",
    "level": 0,
    "plan": "enterprise",
    "status": "active",
    "settings": {
      "timezone": "America/New_York",
      "currency": "USD",
      "dataRetention": 2555,
      "features": {
        "apiAccess": true,
        "customBranding": true,
        "advancedAnalytics": true,
        "prioritySupport": true
      }
    },
    "limits": {
      "maxSources": 1000,
      "maxTeamMembers": 100,
      "maxClients": 50,
      "storageQuotaGB": 10000,
      "apiRequestsPerMonth": 1000000
    },
    "usage": {
      "activeSources": 25,
      "teamMembers": 8,
      "clients": 3,
      "storageUsedGB": 245.7,
      "apiRequestsThisMonth": 45230
    },
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-06-20T14:22:00Z"
  }
}
```

### PUT /account
**Update account information**

```bash
curl -X PUT https://api.listbackup.ai/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Corporation",
    "settings": {
      "timezone": "America/Los_Angeles",
      "dataRetention": 2920
    }
  }'
```

### POST /account/sub-accounts
**Create a sub-account**

```bash
curl -X POST https://api.listbackup.ai/account/sub-accounts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "West Coast Division",
    "company": "Example Corp West",
    "plan": "professional",
    "settings": {
      "timezone": "America/Los_Angeles",
      "currency": "USD"
    },
    "limits": {
      "maxSources": 100,
      "maxTeamMembers": 20,
      "storageQuotaGB": 1000
    }
  }'
```

### GET /account/hierarchy
**Get account hierarchy tree**

```bash
curl -X GET https://api.listbackup.ai/account/hierarchy \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accountId": "acc_8mR7pL3wV2Nq5XkJ",
    "name": "Example Corp",
    "level": 0,
    "accountPath": "/example-corp/",
    "subAccounts": [
      {
        "accountId": "acc_9nS8qM4xW3Oq6YlK",
        "name": "West Coast Division",
        "level": 1,
        "accountPath": "/example-corp/west-coast/",
        "subAccounts": [
          {
            "accountId": "acc_1pT9rN5yX4Pr7ZmL",
            "name": "California Operations",
            "level": 2,
            "accountPath": "/example-corp/west-coast/california/",
            "subAccounts": []
          }
        ]
      },
      {
        "accountId": "acc_2qU0sO6zY5Qs8AnM",
        "name": "East Coast Division",
        "level": 1,
        "accountPath": "/example-corp/east-coast/",
        "subAccounts": []
      }
    ]
  }
}
```

### POST /account/switch-context
**Switch to different account context**

```bash
curl -X POST https://api.listbackup.ai/account/switch-context \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "acc_9nS8qM4xW3Oq6YlK"
  }'
```

---

## 📊 Error Handling

### Standard Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "Detailed error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field that caused the error",
    "value": "Invalid value",
    "expected": "Expected value format"
  },
  "timestamp": "2025-06-20T14:30:00Z",
  "requestId": "req_abc123def456"
}
```

### HTTP Status Codes

| Status | Meaning | Usage |
|--------|---------|-------|
| **200** | OK | Successful GET requests |
| **201** | Created | Successful resource creation |
| **400** | Bad Request | Validation errors, malformed requests |
| **401** | Unauthorized | Authentication required or invalid token |
| **403** | Forbidden | Access denied, insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource already exists or state conflict |
| **422** | Unprocessable Entity | Valid JSON but logical errors |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server-side errors |
| **503** | Service Unavailable | Temporary service issues |

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `AUTH_TOKEN_EXPIRED` | JWT token has expired | Refresh token or re-authenticate |
| `AUTH_TOKEN_INVALID` | Malformed or invalid token | Check token format and signature |
| `PERMISSION_DENIED` | Insufficient permissions for action | Contact admin or check role |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist | Verify resource ID |
| `VALIDATION_FAILED` | Request validation errors | Check required fields and formats |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry with backoff |
| `PLATFORM_CONNECTION_FAILED` | External platform API error | Check platform status and credentials |
| `QUOTA_EXCEEDED` | Account usage limits reached | Upgrade plan or reduce usage |

---

## 🔄 Rate Limiting

### Rate Limit Headers

All API responses include rate limiting information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1624387200
X-RateLimit-Reset-After: 3600
```

### Rate Limits by Endpoint Category

| Category | Limit | Window |
|----------|-------|--------|
| **Authentication** | 5 requests | per minute |
| **User Management** | 100 requests | per minute |
| **Data Operations** | 1,000 requests | per minute |
| **Background Jobs** | 50 requests | per minute |
| **Platform Connections** | 200 requests | per minute |

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 1000,
    "window": 3600,
    "retryAfter": 1800
  }
}
```

---

## 🧪 Testing and Examples

### Authentication Flow Example

```bash
#!/bin/bash

# 1. Login to get access token
LOGIN_RESPONSE=$(curl -s -X POST https://api.listbackup.ai/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@company.com",
    "password": "SecurePassword123!"
  }')

# Extract access token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

# 2. Use token for authenticated requests
curl -X GET https://api.listbackup.ai/sources \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. Refresh token when needed
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.refreshToken')
curl -X POST https://api.listbackup.ai/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}"
```

### Source Creation and Sync Flow

```bash
#!/bin/bash

# Set access token
ACCESS_TOKEN="your_access_token_here"

# 1. List available platforms
curl -X GET https://api.listbackup.ai/platforms \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 2. Create platform connection (manual example)
CONNECTION_RESPONSE=$(curl -s -X POST https://api.listbackup.ai/connections \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platformId": "stripe",
    "name": "Main Stripe Account",
    "authType": "api_key",
    "credentials": {
      "apiKey": "sk_test_..."
    }
  }')

CONNECTION_ID=$(echo $CONNECTION_RESPONSE | jq -r '.data.connectionId')

# 3. Test connection
curl -X POST https://api.listbackup.ai/connections/$CONNECTION_ID/test \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 4. Create data source
SOURCE_RESPONSE=$(curl -s -X POST https://api.listbackup.ai/sources \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"connectionId\": \"$CONNECTION_ID\",
    \"platformSourceId\": \"stripe-customers\",
    \"name\": \"Customer Records\",
    \"settings\": {
      \"enabled\": true,
      \"priority\": \"high\",
      \"frequency\": \"daily\"
    }
  }")

SOURCE_ID=$(echo $SOURCE_RESPONSE | jq -r '.data.sourceId')

# 5. Trigger manual sync
curl -X POST https://api.listbackup.ai/sources/$SOURCE_ID/sync \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullSync": false,
    "priority": "high"
  }'
```

---

## 📚 SDK Examples

### JavaScript/TypeScript SDK

```typescript
import { ListBackupAPI } from '@listbackup/sdk'

// Initialize client
const client = new ListBackupAPI({
  apiKey: 'your_api_key',
  baseURL: 'https://api.listbackup.ai'
})

// Authenticate
const authResult = await client.auth.login({
  email: 'user@company.com',
  password: 'SecurePassword123!'
})

// Create source
const source = await client.sources.create({
  connectionId: 'conn_123',
  platformSourceId: 'keap-contacts',
  name: 'Customer Contacts',
  settings: {
    enabled: true,
    frequency: 'daily'
  }
})

// Trigger sync
const job = await client.sources.sync(source.sourceId, {
  fullSync: false,
  priority: 'high'
})

// Monitor job progress
const progress = await client.jobs.get(job.jobId)
console.log(`Progress: ${progress.progress.percentage}%`)
```

### Python SDK

```python
from listbackup import Client

# Initialize client
client = Client(
    api_key='your_api_key',
    base_url='https://api.listbackup.ai'
)

# Authenticate
auth_result = client.auth.login(
    email='user@company.com',
    password='SecurePassword123!'
)

# Create source
source = client.sources.create(
    connection_id='conn_123',
    platform_source_id='keap-contacts',
    name='Customer Contacts',
    settings={
        'enabled': True,
        'frequency': 'daily'
    }
)

# Trigger sync
job = client.sources.sync(
    source['sourceId'],
    full_sync=False,
    priority='high'
)

# Monitor progress
progress = client.jobs.get(job['jobId'])
print(f"Progress: {progress['progress']['percentage']}%")
```

---

*This interactive API documentation provides comprehensive examples and real-world usage patterns for all ListBackup.ai v2 endpoints. For additional support, visit our [Developer Portal](https://developers.listbackup.ai) or contact [support@listbackup.ai](mailto:support@listbackup.ai).*

**🔧 API Version**: v1  
**📚 Documentation Version**: 2.0  
**🕒 Last Updated**: 2025-06-20