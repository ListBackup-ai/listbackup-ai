# Modern API Documentation System

## Overview
ListBackup.ai v2 will feature a comprehensive, interactive API documentation system that serves both internal development and external integrations. The documentation will be built using modern tools and provide an excellent developer experience.

## Documentation Architecture

### Technology Stack
- **OpenAPI 3.0** - Industry standard API specification
- **Swagger UI** - Interactive API explorer
- **Redoc** - Beautiful documentation renderer
- **Next.js Integration** - Seamless integration with our frontend
- **Auto-generation** - Documentation generated from code annotations

### Documentation Structure
```
/docs/api/
├── v2/
│   ├── overview.md
│   ├── authentication.md
│   ├── rate-limiting.md
│   ├── error-handling.md
│   ├── webhooks.md
│   ├── sdks.md
│   └── endpoints/
│       ├── accounts.yaml
│       ├── sources.yaml
│       ├── jobs.yaml
│       ├── billing.yaml
│       └── analytics.yaml
├── examples/
│   ├── curl/
│   ├── javascript/
│   ├── python/
│   ├── postman/
│   └── insomnia/
└── guides/
    ├── getting-started.md
    ├── authentication-guide.md
    ├── webhooks-guide.md
    └── migration-v1-to-v2.md
```

## API Documentation Features

### Interactive Documentation
- **Live API Explorer** - Test endpoints directly from docs
- **Request/Response Examples** - Real examples with syntax highlighting
- **Authentication Testing** - Built-in auth token management
- **Multi-language Examples** - Code samples in multiple languages
- **Schema Validation** - Real-time request validation

### Developer Experience
- **Search Functionality** - Full-text search across all documentation
- **Responsive Design** - Mobile-friendly documentation
- **Dark/Light Theme** - User preference theme switching
- **Copy-to-Clipboard** - Easy code sample copying
- **Permalink Support** - Direct links to specific endpoints

### API Reference Structure
```yaml
# Example OpenAPI specification structure
openapi: 3.0.3
info:
  title: ListBackup.ai API
  version: 2.0.0
  description: |
    # ListBackup.ai API v2
    
    The ListBackup.ai API provides comprehensive data backup and management 
    capabilities for modern businesses. Our API supports hierarchical account 
    management, multi-platform integrations, and enterprise-grade security.
    
    ## Features
    - **Hierarchical Accounts** - Manage complex organizational structures
    - **Multi-Platform Sources** - Connect to 50+ data sources
    - **Real-time Monitoring** - Track backup jobs and system health
    - **Advanced Analytics** - Deep insights into your data ecosystem
    
    ## Base URL
    ```
    https://api.listbackup.ai/v2
    ```
    
  contact:
    name: ListBackup.ai Support
    url: https://listbackup.ai/support
    email: api-support@listbackup.ai
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.listbackup.ai/v2
    description: Production server
  - url: https://staging-api.listbackup.ai/v2
    description: Staging server

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        Use your API token in the Authorization header:
        ```
        Authorization: Bearer your_api_token_here
        ```
```

## Documentation Page Design

### Homepage Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏠 ListBackup.ai    [Docs] [API] [Guides] [SDKs]    [🔍 Search]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│             📚 ListBackup.ai API Documentation                 │
│                                                                 │
│         The complete guide to integrating with our API         │
│                                                                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│ │ 🚀 Get Started  │ │ 📖 API Reference│ │ 🔧 Interactive │   │
│ │                 │ │                 │ │ Explorer        │   │
│ │ Authentication  │ │ All endpoints   │ │ Test APIs live  │   │
│ │ First API call  │ │ Request/Response│ │ No coding needed│   │
│ │ Sample projects │ │ Error codes     │ │ Real responses  │   │
│ │                 │ │                 │ │                 │   │
│ │ [Start →]       │ │ [Browse →]      │ │ [Try Now →]     │   │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│ Popular Endpoints                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ POST /sources          Create data source                │ │
│ │ GET  /accounts         List user accounts                │ │
│ │ POST /jobs             Create backup job                 │ │
│ │ GET  /data/files       Browse backed up files            │ │
│ │ POST /billing/portal   Create billing portal session     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ SDKs & Libraries                                                │
│ [JavaScript] [Python] [PHP] [Ruby] [Go] [Java] [.NET]         │
│                                                                 │
│ Latest Updates                              📺 Video Tutorials │
│ • v2.1.0 - Hierarchical accounts          • Getting Started    │
│ • v2.0.5 - Stripe billing integration     • Authentication     │
│ • v2.0.0 - Major API redesign             • Webhooks Setup     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### API Reference Page
```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] API Reference                          [🌙] [🔍 Search]│
├──────────────────┬──────────────────────────────────────────────┤
│ Navigation       │ POST /accounts/{id}/sub-accounts          │
│                  │                                              │
│ Overview         │ Create Sub-Account                           │
│ Authentication   │ Create a new sub-account under the specified│
│ Rate Limiting    │ parent account. Requires Owner or Manager   │
│ Error Handling   │ role with canCreateSubAccounts permission.  │
│                  │                                              │
│ 📁 Accounts      │ Parameters                                   │
│   Get Accounts   │ Path Parameters:                             │
│   Create Sub-Acc │ • id (string, required) - Parent account ID │
│   Switch Account │                                              │
│   Invite User    │ Request Body:                                │
│                  │ ┌──────────────────────────────────────────┐ │
│ 📁 Sources       │ │ {                                        │ │
│   List Sources   │ │   "name": "North America Division",     │ │
│   Create Source  │ │   "company": "PepsiCo Inc.",            │ │
│   Test Source    │ │   "description": "Regional operations", │ │
│   Sync Source    │ │   "settings": {                         │ │
│                  │ │     "allowSubAccounts": true,           │ │
│ 📁 Jobs          │ │     "maxSubAccounts": 5                 │ │
│   List Jobs      │ │   }                                      │ │
│   Create Job     │ │ }                                        │ │
│   Run Job        │ └──────────────────────────────────────────┘ │
│                  │                                              │
│ 📁 Billing       │ Responses                                    │
│   Get Plans      │ ✅ 201 Created                              │
│   Create Portal  │ ┌──────────────────────────────────────────┐ │
│   Webhooks       │ │ {                                        │ │
│                  │ │   "accountId": "acc_abc123",             │ │
│ 📁 Data          │ │   "parentAccountId": "acc_parent456",    │ │
│   List Files     │ │   "name": "North America Division",     │ │
│   Search Files   │ │   "level": 2,                            │ │
│   Download File  │ │   "accountPath": "/parent/child",        │ │
│                  │ │   "isActive": true,                      │ │
│                  │ │   "createdAt": "2024-12-11T10:30:00Z"    │ │
│                  │ │ }                                        │ │
│                  │ └──────────────────────────────────────────┘ │
│                  │                                              │
│                  │ ❌ 403 Forbidden                            │
│                  │ ┌──────────────────────────────────────────┐ │
│                  │ │ {                                        │ │
│                  │ │   "error": "INSUFFICIENT_PERMISSIONS",  │ │
│                  │ │   "message": "Cannot create sub-accounts"│ │
│                  │ │ }                                        │ │
│                  │ └──────────────────────────────────────────┘ │
│                  │                                              │
│                  │ [📋 Copy cURL] [🧪 Try it] [📝 Examples]   │
│                  │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

### Interactive API Explorer
```
┌─────────────────────────────────────────────────────────────────┐
│ API Explorer                                    [Authorize 🔑]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Try POST /accounts/{id}/sub-accounts                         │
│                                                                 │
│ Parameters                                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Path Parameters                                             │ │
│ │ id*: [acc_parent123_________________] (Parent Account ID)   │ │
│ │                                                             │ │
│ │ Headers                                                     │ │
│ │ Authorization: Bearer [your_token_here________________]     │ │
│ │ Content-Type: application/json                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Request Body                                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ {                                                           │ │
│ │   "name": "Marketing Division",                             │ │
│ │   "company": "PepsiCo Marketing Inc.",                      │ │
│ │   "description": "Global marketing operations",            │ │
│ │   "settings": {                                             │ │
│ │     "allowSubAccounts": true,                               │ │
│ │     "maxSubAccounts": 10,                                   │ │
│ │     "whiteLabel": {                                         │ │
│ │       "enabled": true,                                      │ │
│ │       "brandName": "PepsiCo Marketing Portal"              │ │
│ │     }                                                       │ │
│ │   }                                                         │ │
│ │ }                                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                            [Clear] [Execute]    │
│                                                                 │
│ Response                                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Status: 201 Created                                         │ │
│ │ Time: 247ms                                                 │ │
│ │                                                             │ │
│ │ Response Body:                                              │ │
│ │ {                                                           │ │
│ │   "accountId": "acc_new789",                                │ │
│ │   "parentAccountId": "acc_parent123",                       │ │
│ │   "name": "Marketing Division",                             │ │
│ │   "level": 1,                                               │ │
│ │   "accountPath": "/acc_parent123/acc_new789",               │ │
│ │   "settings": {                                             │ │
│ │     "allowSubAccounts": true,                               │ │
│ │     "maxSubAccounts": 10                                    │ │
│ │   },                                                        │ │
│ │   "createdAt": "2024-12-11T15:23:45.123Z"                  │ │
│ │ }                                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [📋 Copy as cURL] [📋 Copy Response] [📤 Share]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: OpenAPI Specification (Week 1)
```typescript
// Backend: Generate OpenAPI spec from code
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ListBackup.ai API',
      version: '2.0.0',
      description: 'Comprehensive data backup and management API',
    },
    servers: [
      {
        url: process.env.API_BASE_URL,
        description: 'API Server',
      },
    ],
  },
  apis: ['./src/handlers/**/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJSDoc(options);
```

### Phase 2: Documentation Frontend (Week 2)
```typescript
// Frontend: Documentation page
// app/docs/api/page.tsx
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function APIDocumentation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DocumentationHeader />
      <div className="container mx-auto px-4 py-8">
        <SwaggerUI 
          url="/api/docs/openapi.json"
          docExpansion="list"
          deepLinking={true}
          displayRequestDuration={true}
          tryItOutEnabled={true}
        />
      </div>
    </div>
  );
}
```

### Phase 3: Interactive Features (Week 3)
- Authentication integration
- Live API testing
- Code generation
- Response validation

### Phase 4: Developer Resources (Week 4)
- SDK documentation
- Tutorial guides
- Postman collections
- Example applications

## Documentation Content Structure

### Getting Started Guide
```markdown
# Getting Started with ListBackup.ai API

## Quick Start
1. **Sign up** for a ListBackup.ai account
2. **Generate** your API token
3. **Make** your first API call
4. **Explore** our interactive documentation

## Authentication
All API requests require authentication using Bearer tokens:

```bash
curl -H "Authorization: Bearer your_api_token" \
  https://api.listbackup.ai/accounts
```

## Your First API Call
Let's start by fetching your account information:

```javascript
const response = await fetch('https://api.listbackup.ai/account', {
  headers: {
    'Authorization': 'Bearer your_api_token',
    'Content-Type': 'application/json'
  }
});

const account = await response.json();
console.log(account);
```
```

### Code Examples
```yaml
# Example endpoint documentation with code samples
paths:
  /sources:
    post:
      summary: Create Data Source
      description: |
        Create a new data source connection for backup operations.
        
        This endpoint allows you to configure connections to various platforms
        like Keap, Stripe, GoHighLevel, and more.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateSourceRequest'
            examples:
              keap-source:
                summary: Keap Integration
                value:
                  name: "Production Keap"
                  type: "keap"
                  config:
                    api_token: "KeapAK-..."
                    environment: "production"
              stripe-source:
                summary: Stripe Integration
                value:
                  name: "Live Stripe Account"
                  type: "stripe"
                  config:
                    secret_key: "sk_live_..."
                    webhook_secret: "whsec_..."
      responses:
        '201':
          description: Source created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Source'
              example:
                sourceId: "src_abc123"
                name: "Production Keap"
                type: "keap"
                status: "active"
                createdAt: "2024-12-11T10:30:00Z"
```

## Developer Experience Features

### API Console Integration
- **Authentication Manager** - Store and manage API tokens
- **Request Builder** - Visual request construction
- **Response Inspector** - Detailed response analysis
- **History Tracking** - Request history and favorites
- **Environment Management** - Switch between environments

### Documentation Search
```typescript
// Advanced search functionality
interface SearchIndex {
  endpoints: EndpointSearchItem[];
  schemas: SchemaSearchItem[];
  examples: ExampleSearchItem[];
  guides: GuideSearchItem[];
}

interface EndpointSearchItem {
  path: string;
  method: string;
  summary: string;
  tags: string[];
  operationId: string;
}
```

### SDK Code Generation
```yaml
# Automatic SDK generation configuration
generators:
  javascript:
    package: "@listbackup/api-client"
    version: "2.0.0"
    features:
      - typescript
      - async-await
      - error-handling
  python:
    package: "listbackup-client"
    version: "2.0.0"
    features:
      - type-hints
      - async-support
      - pydantic-models
  php:
    package: "listbackup/api-client"
    namespace: "ListBackup\\API"
    features:
      - psr-4
      - guzzle-http
      - psalm-types
```

### Documentation Analytics
- Page views and popular endpoints
- API explorer usage statistics
- Search query analysis
- Developer feedback collection

This comprehensive API documentation system will provide developers with everything they need to integrate with ListBackup.ai, from getting started guides to advanced use cases, all presented in a modern, interactive interface.