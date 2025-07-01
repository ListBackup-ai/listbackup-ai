# API Services

This directory contains all API-related services for ListBackup.ai, including the API Gateway and all endpoint services.

## Directory Structure

```
api/
├── gateway/         # API Gateway configuration (central HTTP API)
├── auth/            # Authentication endpoints (login, register, token refresh)
├── users/           # User management endpoints
├── accounts/        # Account management endpoints
├── billing/         # Billing and subscription endpoints
├── clients/         # Client management endpoints
├── connections/     # Platform connection endpoints
├── dashboards/      # Dashboard and analytics endpoints
├── integrations/    # Integration management endpoints
├── jobs/            # Job processing endpoints
├── notifications/   # Notification system endpoints
├── platforms/       # Platform configuration endpoints
├── source-groups/   # Source grouping endpoints
├── sources/         # Data source management endpoints
├── system/          # System health and status endpoints
├── tags/            # Tag management endpoints
└── teams/           # Team management endpoints
```

## Architecture Overview

### API Gateway
The `gateway` service provides:
- Central HTTP API configuration
- Custom domain setup (stage.api.listbackup.ai)
- JWT authorization using Cognito
- Request routing to Lambda functions
- CORS configuration

### Service Dependencies
All API services depend on:
1. **API Gateway** - For HTTP endpoint configuration
2. **Infrastructure Services** - For AWS resources (DynamoDB, S3, etc.)

## Service Patterns

Each API service follows a consistent pattern:
- **Handler Functions**: Individual Lambda functions for each endpoint
- **Shared Libraries**: Common code for database access, validation, etc.
- **Environment Variables**: Configuration via CloudFormation imports
- **IAM Permissions**: Least-privilege access to required resources

## Deployment

Services are deployed using Serverless Framework v4 with Compose:

```bash
# Deploy all services
cd /path/to/services
sls compose deploy

# Deploy individual service
cd api/auth
sls deploy --aws-profile listbackup.ai --stage main
```

## Common Environment Variables

All services have access to:
- `STAGE`: Deployment stage (main, dev, staging)
- `USERS_TABLE`: DynamoDB users table name
- `ACCOUNTS_TABLE`: DynamoDB accounts table name
- `COGNITO_USER_POOL_ID`: Cognito user pool for authentication
- `EVENT_BUS_NAME`: EventBridge for async events

## API Endpoints

### Authentication (`/auth/*`)
- POST `/auth/register` - User registration
- POST `/auth/login` - User login
- POST `/auth/refresh` - Token refresh
- POST `/auth/logout` - User logout
- GET `/auth/status` - Auth status check
- GET `/auth/profile` - User profile

### Users (`/users/*`)
- GET `/users` - List users
- GET `/users/{userId}` - Get user details
- PUT `/users/{userId}` - Update user
- DELETE `/users/{userId}` - Delete user

### Accounts (`/accounts/*`)
- GET `/accounts` - List accounts
- POST `/accounts` - Create account
- GET `/accounts/{accountId}` - Get account details
- PUT `/accounts/{accountId}` - Update account
- DELETE `/accounts/{accountId}` - Delete account

[Additional endpoints for other services...]

## Development Guidelines

1. **Consistent Naming**: Use kebab-case for directories, PascalCase for Go types
2. **Error Handling**: Return appropriate HTTP status codes with error messages
3. **Validation**: Validate all inputs before processing
4. **Logging**: Use structured logging for debugging
5. **Testing**: Include unit and integration tests
6. **Documentation**: Keep OpenAPI specs updated

## Security

- All endpoints (except auth) require JWT authentication
- Use IAM roles for AWS service access
- Validate and sanitize all inputs
- Follow OWASP guidelines for API security