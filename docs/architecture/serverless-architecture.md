# Serverless Architecture

## Overview
ListBackup.ai v2 uses a modular serverless architecture deployed on AWS with clear separation of concerns between infrastructure, API Gateway, and individual services.

## Architecture Components

### 1. Core Infrastructure (`serverless-core.yml`)
**Purpose**: Foundation infrastructure resources
- **DynamoDB Tables**: users, accounts, sources, jobs, runs, files, activity
- **S3 Bucket**: Data storage with lifecycle policies
- **SQS Queues**: Job and data processing with dead letter queues
- **EventBridge**: Real-time event bus
- **Secrets Manager**: API key storage
- **Lambda Functions**: File indexer (S3 triggers)

### 2. API Gateway (`serverless-api.yml`)
**Purpose**: HTTP API and authentication
- **HTTP API Gateway**: Single entry point (api.listbackup.ai)
- **Cognito JWT Authorizer**: Shared authentication
- **OAuth Tables**: State management for integrations
- **API Keys Table**: Integration key storage
- **Custom Domain**: SSL certificate and domain mapping

### 3. Individual Services (Modular)
**Purpose**: Specific business logic endpoints

#### Authentication Service (`serverless-auth.yml`)
- User registration and login
- Password reset and verification
- Cognito integration

#### Sources Service (`serverless-sources.yml`)
- Data source CRUD operations
- Source testing and validation
- Data sync triggering

#### Jobs Service (`serverless-jobs.yml`)
- Backup job management
- Job scheduling and execution
- Run history tracking

#### Data Service (`serverless-data.yml`)
- File browsing and search
- Download functionality
- Data export

#### Account Service (`serverless-account.yml`)
- Account hierarchy management
- User invitations
- Account switching
- Usage tracking

#### Activity Service (`serverless-activity.yml`)
- Event logging and monitoring
- Activity timeline

#### System Service (`serverless-system.yml`)
- Health checks
- System monitoring

#### Billing Service (`serverless-billing.yml`)
- Stripe integration
- Subscription management
- Usage tracking
- Webhook handling

#### Analytics Service (`serverless-analytics.yml`)
- Data analysis
- Reporting
- Metrics collection

#### Integrations Service (`serverless-integrations.yml`)
- Available integrations listing
- Integration configuration

## Deployment Architecture

### Deployment Order
1. **Core Infrastructure** → DynamoDB, S3, SQS, EventBridge
2. **API Gateway** → HTTP API, authorizer, domain
3. **Authentication** → User management (depends on core)
4. **Services** → Business logic (depends on API Gateway)

### Service Dependencies
```
Core Infrastructure
    ↓
API Gateway + Auth
    ↓
┌─────────────┬─────────────┬─────────────┐
│   Sources   │    Jobs     │    Data     │
├─────────────┼─────────────┼─────────────┤
│  Account    │  Activity   │   System    │
├─────────────┼─────────────┼─────────────┤
│  Billing    │ Analytics   │Integrations │
└─────────────┴─────────────┴─────────────┘
```

## API Gateway Configuration

### Shared Infrastructure
- **API Gateway ID**: `ln1x8lz9xc`
- **Custom Domain**: `api.listbackup.ai`
- **SSL Certificate**: Global wildcard (*.listbackup.ai)
- **CORS**: Configured for multiple origins

### Service References
All services reference the main API Gateway:
```yaml
httpApi:
  id: ln1x8lz9xc  # Reference shared gateway
```

## Environment Configuration

### Consistent Variables
All services use these standard environment variables:
```yaml
STAGE: ${self:provider.stage}
DYNAMODB_TABLE_PREFIX: listbackup-${self:provider.stage}
API_VERSION: v2
CORS_ORIGIN: ${ssm:/listbackup/cors-origin}
```

### Stage-Specific Resources
- **main**: Production-like environment
- **dev**: Development environment (legacy)
- **test**: Testing environment

## Security Model

### IAM Permissions
Each service has minimal IAM permissions:
- **DynamoDB**: Table-specific access
- **S3**: Bucket-specific operations
- **SQS**: Queue-specific send/receive
- **EventBridge**: Event publishing
- **Secrets Manager**: Secret retrieval

### Authentication Flow
1. Frontend → API Gateway
2. API Gateway → JWT Authorizer (Cognito)
3. Authorizer → Service Function
4. Service → DynamoDB/S3 operations

## Advantages

### Modular Architecture
- **Independent Deployment**: Services can be deployed separately
- **Fault Isolation**: Service failures don't affect others
- **Scalability**: Each service scales independently
- **Development**: Teams can work on different services

### Infrastructure Separation
- **Core Stability**: Infrastructure changes are isolated
- **API Evolution**: Gateway can evolve without affecting services
- **Resource Management**: Clear ownership of resources

### Operational Benefits
- **Monitoring**: Service-specific metrics
- **Debugging**: Isolated logs per service
- **Cost Tracking**: Per-service cost allocation
- **Security**: Minimal permission boundaries

## Deployment Script

The deployment script handles the correct order:
```bash
# 1. Core infrastructure
serverless deploy --config serverless-core.yml

# 2. API Gateway
serverless deploy --config serverless-api.yml

# 3. Authentication
serverless deploy --config serverless-auth.yml

# 4. All other services
for service in sources jobs data account activity system billing analytics integrations; do
  serverless deploy --config serverless-${service}.yml
done
```