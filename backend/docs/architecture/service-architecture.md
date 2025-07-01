# Service Architecture

This document details the microservices architecture of ListBackup.ai, including service boundaries, communication patterns, and design principles.

## Microservices Overview

```mermaid
graph TB
    subgraph "API Gateway Layer"
        GW[API Gateway<br/>Route Management]
        AUTH_MW[Authorization<br/>Middleware]
    end
    
    subgraph "Core Services"
        AUTH_SVC[Auth Service<br/>Authentication]
        USER_SVC[Users Service<br/>User Management]
        ACC_SVC[Accounts Service<br/>Account Hierarchy]
    end
    
    subgraph "Platform Services"
        PLAT_SVC[Platforms Service<br/>Integration Registry]
        CONN_SVC[Connections Service<br/>OAuth Management]
        SRC_SVC[Sources Service<br/>Data Sources]
    end
    
    subgraph "Processing Services"
        JOB_SVC[Jobs Service<br/>Job Orchestration]
        SYNC_SVC[Sync Service<br/>Data Sync]
        EXPORT_SVC[Export Service<br/>Data Export]
    end
    
    subgraph "Utility Services"
        NOTIFY_SVC[Notifications<br/>Alerts & Email]
        BILL_SVC[Billing Service<br/>Usage & Payments]
        ANALYTICS_SVC[Analytics Service<br/>Metrics & Reports]
    end
    
    GW --> AUTH_MW
    AUTH_MW --> AUTH_SVC
    AUTH_MW --> USER_SVC
    AUTH_MW --> ACC_SVC
    AUTH_MW --> PLAT_SVC
    AUTH_MW --> CONN_SVC
    AUTH_MW --> SRC_SVC
    AUTH_MW --> JOB_SVC
    
    CONN_SVC --> PLAT_SVC
    SRC_SVC --> CONN_SVC
    JOB_SVC --> SRC_SVC
    SYNC_SVC --> JOB_SVC
    EXPORT_SVC --> JOB_SVC
    
    JOB_SVC --> NOTIFY_SVC
    SYNC_SVC --> BILL_SVC
    JOB_SVC --> ANALYTICS_SVC
    
    style AUTH_SVC fill:#ffebee
    style USER_SVC fill:#e3f2fd
    style ACC_SVC fill:#f3e5f5
    style PLAT_SVC fill:#e8f5e9
```

## Service Communication Patterns

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Auth
    participant Service
    participant Queue
    participant Processor
    participant Storage
    
    Client->>Gateway: API Request
    Gateway->>Auth: Validate Token
    Auth-->>Gateway: User Context
    Gateway->>Service: Forward Request
    Service->>Queue: Queue Job
    Service-->>Gateway: Job Accepted
    Gateway-->>Client: 202 Accepted
    
    Queue->>Processor: Process Job
    Processor->>Storage: Store Data
    Processor->>Queue: Complete
    Processor-->>Client: Webhook/Event
```

## Service Boundaries

```mermaid
graph LR
    subgraph "Auth Domain"
        AUTH_API[Auth API]
        COGNITO[Cognito]
        JWT[JWT Handler]
        MFA[MFA Logic]
    end
    
    subgraph "User Domain"
        USER_API[User API]
        PROFILE[Profile Mgmt]
        PREFS[Preferences]
        TEAMS[Team Mgmt]
    end
    
    subgraph "Account Domain"
        ACC_API[Account API]
        HIERARCHY[Hierarchy Logic]
        PERMS[Permissions]
        BILLING_REL[Billing Relations]
    end
    
    subgraph "Platform Domain"
        PLAT_API[Platform API]
        OAUTH[OAuth Handler]
        CREDS[Credentials Mgmt]
        WEBHOOKS[Webhook Handler]
    end
    
    AUTH_API --> USER_API
    USER_API --> ACC_API
    ACC_API --> PLAT_API
    PLAT_API --> OAUTH
    
    style AUTH_API fill:#ffcdd2
    style USER_API fill:#c5cae9
    style ACC_API fill:#ce93d8
    style PLAT_API fill:#a5d6a7
```

## Data Flow Architecture

```mermaid
graph TD
    subgraph "Data Ingestion"
        API[Platform APIs]
        WEBHOOK[Webhooks]
        SCHEDULE[Scheduled Jobs]
    end
    
    subgraph "Processing Pipeline"
        VALIDATE[Validation]
        TRANSFORM[Transformation]
        ENRICH[Enrichment]
        COMPRESS[Compression]
        ENCRYPT[Encryption]
    end
    
    subgraph "Storage Layer"
        HOT[Hot Storage<br/>Recent Data]
        WARM[Warm Storage<br/>30-90 days]
        COLD[Cold Storage<br/>Archive]
    end
    
    subgraph "Access Layer"
        QUERY[Query Engine]
        EXPORT_ENG[Export Engine]
        ANALYTICS[Analytics Engine]
    end
    
    API --> VALIDATE
    WEBHOOK --> VALIDATE
    SCHEDULE --> VALIDATE
    
    VALIDATE --> TRANSFORM
    TRANSFORM --> ENRICH
    ENRICH --> COMPRESS
    COMPRESS --> ENCRYPT
    
    ENCRYPT --> HOT
    HOT --> WARM
    WARM --> COLD
    
    HOT --> QUERY
    WARM --> EXPORT_ENG
    HOT --> ANALYTICS
    
    style API fill:#bbdefb
    style HOT fill:#ffccbc
    style COLD fill:#b0bec5
```

## Service Dependencies Matrix

```mermaid
graph TD
    subgraph "Layer 1 - Infrastructure"
        DDB[DynamoDB]
        S3[S3]
        SQS[SQS]
        SM[Secrets Manager]
    end
    
    subgraph "Layer 2 - Core Services"
        AUTH[Auth Service]
        USERS[Users Service]
        ACCOUNTS[Accounts Service]
    end
    
    subgraph "Layer 3 - Platform Services"
        PLATFORMS[Platforms Service]
        CONNECTIONS[Connections Service]
        SOURCES[Sources Service]
    end
    
    subgraph "Layer 4 - Business Services"
        JOBS[Jobs Service]
        SYNC[Sync Service]
        EXPORT[Export Service]
    end
    
    DDB --> AUTH
    DDB --> USERS
    DDB --> ACCOUNTS
    SM --> AUTH
    
    AUTH --> PLATFORMS
    USERS --> PLATFORMS
    ACCOUNTS --> PLATFORMS
    
    PLATFORMS --> CONNECTIONS
    CONNECTIONS --> SOURCES
    
    SOURCES --> JOBS
    SQS --> JOBS
    JOBS --> SYNC
    JOBS --> EXPORT
    S3 --> SYNC
    S3 --> EXPORT
```

## Event-Driven Architecture

```mermaid
graph LR
    subgraph "Event Producers"
        USER_SVC[User Service]
        CONN_SVC[Connection Service]
        JOB_SVC[Job Service]
        SYNC_SVC[Sync Service]
    end
    
    subgraph "Event Bus"
        EB[EventBridge<br/>Central Bus]
        RULES[Event Rules]
        ARCHIVE[Event Archive]
    end
    
    subgraph "Event Consumers"
        ANALYTICS[Analytics]
        NOTIFY[Notifications]
        AUDIT[Audit Logger]
        BILLING[Billing]
    end
    
    USER_SVC --> EB
    CONN_SVC --> EB
    JOB_SVC --> EB
    SYNC_SVC --> EB
    
    EB --> RULES
    EB --> ARCHIVE
    
    RULES --> ANALYTICS
    RULES --> NOTIFY
    RULES --> AUDIT
    RULES --> BILLING
    
    style EB fill:#e1bee7
```

### Event Types

```mermaid
mindmap
  root((Events))
    User Events
      user.created
      user.updated
      user.deleted
      user.login
    Account Events
      account.created
      account.upgraded
      account.suspended
    Connection Events
      connection.created
      connection.authorized
      connection.failed
      connection.revoked
    Job Events
      job.created
      job.started
      job.completed
      job.failed
    Data Events
      data.synced
      data.exported
      data.deleted
```

## Service Deployment Architecture

```mermaid
graph TB
    subgraph "Development Pipeline"
        CODE[Source Code]
        TEST[Unit Tests]
        BUILD[Build]
        PACKAGE[Package]
    end
    
    subgraph "Deployment Stages"
        DEV[Dev Environment]
        STAGING[Staging Environment]
        PROD[Production Environment]
    end
    
    subgraph "Service Mesh"
        LB[Load Balancer]
        HEALTH[Health Checks]
        METRICS[Metrics Collection]
        TRACE[Distributed Tracing]
    end
    
    CODE --> TEST
    TEST --> BUILD
    BUILD --> PACKAGE
    
    PACKAGE --> DEV
    DEV --> STAGING
    STAGING --> PROD
    
    PROD --> LB
    LB --> HEALTH
    HEALTH --> METRICS
    METRICS --> TRACE
    
    style CODE fill:#c8e6c9
    style PROD fill:#ffccbc
```

## API Design Patterns

### RESTful Resource Structure

```mermaid
graph TD
    subgraph "Resource Hierarchy"
        ACCOUNTS[/accounts]
        ACC_ID[/accounts/{id}]
        ACC_MEMBERS[/accounts/{id}/members]
        ACC_SOURCES[/accounts/{id}/sources]
        ACC_BILLING[/accounts/{id}/billing]
        
        SOURCES[/sources]
        SRC_ID[/sources/{id}]
        SRC_SYNC[/sources/{id}/sync]
        SRC_LOGS[/sources/{id}/logs]
        
        JOBS[/jobs]
        JOB_ID[/jobs/{id}]
        JOB_LOGS[/jobs/{id}/logs]
        JOB_CANCEL[/jobs/{id}/cancel]
    end
    
    ACCOUNTS --> ACC_ID
    ACC_ID --> ACC_MEMBERS
    ACC_ID --> ACC_SOURCES
    ACC_ID --> ACC_BILLING
    
    SOURCES --> SRC_ID
    SRC_ID --> SRC_SYNC
    SRC_ID --> SRC_LOGS
    
    JOBS --> JOB_ID
    JOB_ID --> JOB_LOGS
    JOB_ID --> JOB_CANCEL
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Network Security"
            WAF[WAF Rules]
            NACL[Network ACLs]
            SG[Security Groups]
        end
        
        subgraph "Application Security"
            AUTHZ[Authorization]
            AUTHN[Authentication]
            RBAC[Role-Based Access]
            AUDIT[Audit Logging]
        end
        
        subgraph "Data Security"
            ENCRYPT_TRANSIT[TLS 1.3]
            ENCRYPT_REST[AES-256]
            TOKEN_MGMT[Token Management]
            SECRET_ROTATION[Secret Rotation]
        end
    end
    
    WAF --> NACL
    NACL --> SG
    SG --> AUTHZ
    AUTHZ --> AUTHN
    AUTHN --> RBAC
    RBAC --> AUDIT
    
    AUDIT --> ENCRYPT_TRANSIT
    ENCRYPT_TRANSIT --> ENCRYPT_REST
    ENCRYPT_REST --> TOKEN_MGMT
    TOKEN_MGMT --> SECRET_ROTATION
    
    style WAF fill:#ffcdd2
    style ENCRYPT_REST fill:#c5e1a5
```

## Service Health Monitoring

```mermaid
graph LR
    subgraph "Health Checks"
        PING[Ping Check]
        DB_CHECK[Database Check]
        DEPS_CHECK[Dependencies Check]
        CUSTOM[Custom Checks]
    end
    
    subgraph "Monitoring Stack"
        CW[CloudWatch]
        XRAY[X-Ray]
        CUSTOM_DASH[Custom Dashboards]
    end
    
    subgraph "Alerting"
        THRESHOLD[Threshold Alerts]
        ANOMALY[Anomaly Detection]
        ESCALATION[Escalation Policy]
    end
    
    PING --> CW
    DB_CHECK --> CW
    DEPS_CHECK --> CW
    CUSTOM --> CW
    
    CW --> CUSTOM_DASH
    CW --> XRAY
    
    CUSTOM_DASH --> THRESHOLD
    CUSTOM_DASH --> ANOMALY
    THRESHOLD --> ESCALATION
    ANOMALY --> ESCALATION
```

## Performance Optimization

```mermaid
graph TD
    subgraph "Optimization Strategies"
        subgraph "Caching"
            CDN[CDN Cache]
            API_CACHE[API Gateway Cache]
            APP_CACHE[Application Cache]
            DB_CACHE[Database Cache]
        end
        
        subgraph "Async Processing"
            QUEUE[Queue Processing]
            BATCH[Batch Operations]
            PARALLEL[Parallel Execution]
        end
        
        subgraph "Resource Optimization"
            LAMBDA_OPT[Lambda Optimization]
            DB_OPT[Database Optimization]
            STORAGE_OPT[Storage Optimization]
        end
    end
    
    CDN --> API_CACHE
    API_CACHE --> APP_CACHE
    APP_CACHE --> DB_CACHE
    
    QUEUE --> BATCH
    BATCH --> PARALLEL
    
    LAMBDA_OPT --> DB_OPT
    DB_OPT --> STORAGE_OPT
```

## Service Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Design: New Service
    Design --> Develop: Approved
    Develop --> Test: Code Complete
    Test --> Stage: Tests Pass
    Test --> Develop: Tests Fail
    Stage --> Deploy: Staging Pass
    Stage --> Test: Staging Fail
    Deploy --> Monitor: Deployed
    Monitor --> Optimize: Metrics Analysis
    Optimize --> Monitor: Optimized
    Monitor --> Deprecate: End of Life
    Deprecate --> [*]: Removed
```

## Best Practices

### 1. Service Design
- Single responsibility principle
- Clear API contracts
- Idempotent operations
- Graceful degradation

### 2. Data Management
- Event sourcing for audit trails
- CQRS for read/write separation
- Eventual consistency where appropriate
- Data locality optimization

### 3. Error Handling
- Circuit breakers for external calls
- Exponential backoff with jitter
- Dead letter queues for failed messages
- Comprehensive error logging

### 4. Monitoring
- Business metrics alongside technical metrics
- Distributed tracing for request flow
- Proactive alerting
- Regular performance reviews

## Migration Path

For services still being migrated to the new architecture:

1. **Phase 1-6**: Infrastructure and core services ✅
2. **Phase 7**: Platform services (in progress)
3. **Phase 8**: Connection services
4. **Phase 9**: Source services
5. **Phase 10**: Job services
6. **Phase 11**: Utility services

See [Phase Documentation](../phases/) for detailed migration plans.