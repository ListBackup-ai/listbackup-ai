# Service Dependencies Analysis

## Overview
This document analyzes the dependencies between services in the ListBackup.ai v2 Go backend architecture. Understanding these dependencies is critical for determining deployment order and identifying potential circular dependencies.

## Service Categories

### 1. Infrastructure Services (Layer 0)
These services create foundational AWS resources and have no dependencies on other services.

#### infra/dynamodb
- **Dependencies**: None
- **Creates**: DynamoDB tables with SSM parameters
- **Tables Created**:
  - users
  - accounts
  - user-accounts
  - activity
  - sources
  - jobs
  - tags
  - entity-tags
  - teams
  - team-members
  - team-accounts
  - team-invitations

#### infra/s3
- **Dependencies**: None
- **Creates**: S3 buckets for data storage

#### infra/cognito
- **Dependencies**: None
- **Creates**: Cognito User Pool and Client

#### infra/domains
- **Dependencies**: None
- **Creates**: Route53 hosted zones and SSL certificates

### 2. Core Service (Layer 1)
The core service creates the main infrastructure and depends only on base AWS services.

#### core
- **Dependencies**: None (creates its own resources)
- **Creates**:
  - All DynamoDB tables (duplicated from infra/dynamodb)
  - S3 bucket for data storage
  - SQS FIFO queues (sync, backup, export, analytics, maintenance, alert)
  - Dead Letter Queues for each queue
  - Cognito User Pool and Client
  - EventBridge Event Bus
- **Exports**: CloudFormation outputs for other services to reference
- **Note**: This service appears to duplicate resources from infra services

### 3. API Gateway Service (Layer 2)
Creates the HTTP API and depends on core infrastructure.

#### api-gateway
- **Dependencies**:
  - `listbackup-core` (for Cognito User Pool ID and Client ID)
  - SSL certificate and Route53 hosted zone (via ImportValue)
- **Creates**:
  - HTTP API Gateway
  - Custom domain (api.listbackup.ai)
  - Route53 A record
  - Cognito JWT authorizer
- **Exports**:
  - HttpApiId (used by all function services)
  - HttpApiEndpoint
  - CognitoAuthorizerId

### 4. Function Services (Layer 3)
These services contain Lambda functions and depend on both core infrastructure and API Gateway.

#### auth
- **Dependencies**:
  - `listbackup-core` (for Cognito resources and table names)
  - `listbackup-api-gateway` (for HttpApiId)
- **Functions**:
  - register, login, status, refresh, logout
  - get-profile, get-available-accounts
- **Hard-coded authorizer ID**: `c0vpx0` (potential issue)

#### users
- **Dependencies**:
  - `listbackup-core` (for Cognito resources and table names)
  - `listbackup-api-gateway` (for HttpApiId)
- **Functions**:
  - get-me, update-profile
  - get-settings, update-settings
  - get-user-accounts
- **Hard-coded authorizer ID**: `c0vpx0`

#### accounts
- **Dependencies**:
  - `listbackup-core` (for table names)
  - `listbackup-api-gateway` (for HttpApiId)

#### sources
- **Dependencies**:
  - `listbackup-core` (for table names)
  - `listbackup-api-gateway` (for HttpApiId)
- **Custom variables reference tables**

#### platforms
- **Dependencies**:
  - `listbackup-core` (for table names)
  - `listbackup-api-gateway` (for HttpApiId)

#### integrations
- **Dependencies**:
  - `listbackup-core` (for table names)
  - `listbackup-api-gateway` (for HttpApiId)

#### jobs
- **Dependencies**:
  - `listbackup-core` (for table names and SQS queues)
  - `listbackup-api-gateway` (for HttpApiId)

#### Other Function Services
Similar dependency pattern:
- billing, clients, connections, dashboards
- domains, notifications, source-groups
- system, tags, teams

## Dependency Graph

```
Layer 0: Infrastructure (No Dependencies)
├── infra/dynamodb
├── infra/s3
├── infra/cognito
└── infra/domains

Layer 1: Core Infrastructure
└── core (creates all resources)

Layer 2: API Gateway
└── api-gateway (depends on core)

Layer 3: Function Services (depend on core + api-gateway)
├── auth
├── users
├── accounts
├── sources
├── platforms
├── integrations
├── jobs
├── billing
├── clients
├── connections
├── dashboards
├── domains
├── domains-simple
├── notifications
├── source-groups
├── system
├── tags
└── teams
```

## Deployment Order Requirements

### Recommended Deployment Sequence:

1. **Infrastructure Services** (optional, as core duplicates these)
   - Can be deployed in any order
   - infra/dynamodb, infra/s3, infra/cognito, infra/domains

2. **Core Service** (required first)
   - Must be deployed before any other service
   - Creates all shared resources

3. **API Gateway Service** (required second)
   - Must be deployed after core
   - Must be deployed before any function services

4. **Function Services** (can be deployed in parallel)
   - All function services can be deployed simultaneously
   - Each depends only on core and api-gateway

## Critical Issues Found

### 1. Resource Duplication
- The `core` service creates all DynamoDB tables
- The `infra/dynamodb` service also creates the same tables
- This creates a conflict - only one should create these resources

### 2. Hard-coded Authorizer IDs
- Multiple services use hard-coded authorizer ID: `c0vpx0`
- This should be dynamically referenced from api-gateway exports

### 3. Missing CloudFormation References
- Some services might be missing proper CloudFormation imports
- Table names should use CloudFormation exports consistently

### 4. Circular Dependencies
- No circular dependencies detected
- Clean hierarchical structure

## Recommendations

1. **Resolve Resource Duplication**
   - Either use infra services OR core service for resource creation
   - Remove duplicate resource definitions

2. **Fix Authorizer References**
   - Replace hard-coded `c0vpx0` with:
     ```yaml
     authorizer:
       id: ${cf:listbackup-api-gateway-${self:provider.stage}.CognitoAuthorizerId}
     ```

3. **Standardize Table References**
   - Use CloudFormation exports consistently
   - Consider using SSM parameters for table names

4. **Deployment Automation**
   - Create a deployment script that enforces order:
     ```bash
     # Deploy core first
     sls deploy -c core/serverless.yml
     
     # Deploy API Gateway
     sls deploy -c api-gateway/serverless.yml
     
     # Deploy all function services in parallel
     for service in auth users accounts ...; do
       sls deploy -c $service/serverless.yml &
     done
     wait
     ```

5. **Consider Service Grouping**
   - Group related function services for easier management
   - Consider combining small services to reduce complexity

## Service Relationships Summary

- **Independent Services**: infra/* services have no dependencies
- **Foundation Service**: core provides all shared resources
- **Gateway Service**: api-gateway provides HTTP API for all functions
- **Function Services**: All depend on core + api-gateway, but not on each other
- **Deployment Flexibility**: After core and api-gateway, all other services can deploy in any order