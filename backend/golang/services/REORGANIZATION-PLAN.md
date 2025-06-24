# Service Reorganization Plan

## Current Structure (Messy)
```
services/
├── infrastructure/     # ✅ Already organized
├── api-gateway/       # API Gateway configuration
├── auth/              # Should be under api/
├── users/             # Should be under api/
├── accounts/          # Should be under api/
├── billing/           # Should be under api/
├── clients/           # Should be under api/
├── connections/       # Should be under api/
├── dashboards/        # Should be under api/
├── integrations/      # Should be under api/
├── jobs/              # Should be under api/
├── notifications/     # Should be under api/
├── platforms/         # Should be under api/
├── source-groups/     # Should be under api/
├── sources/           # Should be under api/
├── system/            # Should be under api/
├── tags/              # Should be under api/
├── teams/             # Should be under api/
└── ...
```

## Proposed Structure (Clean)
```
services/
├── infrastructure/         # All infrastructure services
│   ├── cognito/
│   ├── domains/
│   ├── dynamodb/
│   ├── eventbridge/
│   ├── s3/
│   └── sqs/
└── api/                   # All API-related services
    ├── gateway/           # API Gateway configuration
    ├── auth/              # Authentication endpoints
    ├── users/             # User management endpoints
    ├── accounts/          # Account management endpoints
    ├── billing/           # Billing endpoints
    ├── clients/           # Client management endpoints
    ├── connections/       # Connection management endpoints
    ├── dashboards/        # Dashboard endpoints
    ├── integrations/      # Integration endpoints
    ├── jobs/              # Job management endpoints
    ├── notifications/     # Notification endpoints
    ├── platforms/         # Platform management endpoints
    ├── source-groups/     # Source group endpoints
    ├── sources/           # Source management endpoints
    ├── system/            # System endpoints
    ├── tags/              # Tag management endpoints
    └── teams/             # Team management endpoints
```

## Benefits
1. **Clear separation** between infrastructure and API layers
2. **Logical grouping** - all API-related services (gateway + endpoints) under api/ directory
3. **Easier navigation** - developers know where to find things
4. **Better dependency management** - api/gateway is clearly the parent of all api/* services
5. **Scalability** - easy to add new API services in the right place
6. **Consistent hierarchy** - infrastructure → api/gateway → api/services

## Migration Steps
1. Create api/ directory
2. Move all endpoint services to api/
3. Update serverless-compose.yml paths
4. Update any cross-service references
5. Test deployments