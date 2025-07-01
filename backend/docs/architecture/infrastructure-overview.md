# Infrastructure Overview

This document provides a comprehensive overview of the ListBackup.ai AWS infrastructure components and their relationships.

## Infrastructure Architecture

```mermaid
graph TB
    subgraph "Global Infrastructure"
        R53[Route 53<br/>DNS Management]
        CF[CloudFront<br/>CDN]
        ACM[ACM<br/>SSL Certificates]
    end
    
    subgraph "Regional Infrastructure - us-west-2"
        subgraph "Compute"
            LAMBDA[Lambda Functions<br/>Go & Node.js]
            APIGW[API Gateway<br/>HTTP API]
        end
        
        subgraph "Storage"
            subgraph "DynamoDB Tables"
                DDB_USER[Users Table]
                DDB_ACC[Accounts Table]
                DDB_SRC[Sources Table]
                DDB_JOB[Jobs Table]
                DDB_MORE[... 13 more tables]
            end
            
            subgraph "S3 Buckets"
                S3_DATA[Data Bucket<br/>Versioned & Encrypted]
                S3_ASSETS[Assets Bucket<br/>Public CDN]
                S3_EXPORTS[Exports Bucket<br/>Temporary]
            end
        end
        
        subgraph "Messaging & Events"
            subgraph "SQS Queues"
                SQS_SYNC[Sync Queue<br/>FIFO]
                SQS_BACKUP[Backup Queue<br/>FIFO]
                SQS_MORE[... 4 more queues]
            end
            
            EB[EventBridge<br/>Event Bus]
        end
        
        subgraph "Security"
            COGNITO[Cognito<br/>User Pool]
            SM[Secrets Manager<br/>API Keys]
            IAM[IAM Roles<br/>& Policies]
        end
    end
    
    R53 --> CF
    CF --> APIGW
    ACM --> CF
    APIGW --> LAMBDA
    LAMBDA --> DDB_USER
    LAMBDA --> DDB_ACC
    LAMBDA --> S3_DATA
    LAMBDA --> SQS_SYNC
    LAMBDA --> COGNITO
    LAMBDA --> SM
    SQS_SYNC --> LAMBDA
    LAMBDA --> EB
    
    style R53 fill:#f9f
    style CF fill:#f9f
    style LAMBDA fill:#ff9
    style S3_DATA fill:#9f9
```

## Service Dependencies

```mermaid
graph LR
    subgraph "Phase 2 - Infrastructure Services"
        CERT[infrastructure-certificates]
        DDB_SVC[infrastructure-dynamodb]
        SQS_SVC[infrastructure-sqs]
        S3_SVC[infrastructure-s3]
        EB_SVC[infrastructure-eventbridge]
        COG_SVC[infrastructure-cognito]
    end
    
    subgraph "Phase 3 - Core Services"
        CORE[core]
        GW[api/gateway]
    end
    
    subgraph "Phase 4-6 - API Services"
        AUTH[api/auth]
        USERS[api/users]
        ACC[api/accounts]
    end
    
    CERT --> GW
    DDB_SVC --> CORE
    SQS_SVC --> CORE
    S3_SVC --> CORE
    EB_SVC --> CORE
    COG_SVC --> AUTH
    
    CORE --> GW
    GW --> AUTH
    GW --> USERS
    GW --> ACC
    
    style CERT fill:#e1f5fe
    style DDB_SVC fill:#f3e5f5
    style S3_SVC fill:#fff3e0
    style SQS_SVC fill:#e8f5e9
```

## Resource Naming Convention

All resources follow a consistent naming pattern:

```
{service}-{stage}-{resource}
```

### Examples:
- DynamoDB: `listbackup-dev-users`
- S3: `listbackup-data-dev`
- SQS: `listbackup-sync-queue-dev.fifo`
- Lambda: `listbackup-api-dev-getUsers`

## Multi-Stage Architecture

```mermaid
graph TD
    subgraph "Development"
        DEV_API[dev.api.listbackup.ai]
        DEV_LAMBDA[Lambda - Dev]
        DEV_DDB[(DynamoDB - Dev)]
        DEV_S3[(S3 - Dev)]
    end
    
    subgraph "Staging"
        STG_API[staging.api.listbackup.ai]
        STG_LAMBDA[Lambda - Staging]
        STG_DDB[(DynamoDB - Staging)]
        STG_S3[(S3 - Staging)]
    end
    
    subgraph "Production"
        PROD_API[api.listbackup.ai]
        PROD_LAMBDA[Lambda - Prod]
        PROD_DDB[(DynamoDB - Prod)]
        PROD_S3[(S3 - Prod)]
    end
    
    GH[GitHub Actions] --> DEV_LAMBDA
    GH --> STG_LAMBDA
    GH --> PROD_LAMBDA
    
    DEV_API --> DEV_LAMBDA
    STG_API --> STG_LAMBDA
    PROD_API --> PROD_LAMBDA
    
    style DEV_API fill:#e8f5e9
    style STG_API fill:#fff3e0
    style PROD_API fill:#ffebee
```

## Infrastructure as Code

### Serverless Framework Structure

```mermaid
graph TD
    subgraph "Serverless Compose"
        COMPOSE[serverless-compose.yml]
    end
    
    subgraph "Infrastructure Services"
        INFRA1[certificates/serverless.yml]
        INFRA2[dynamodb/serverless.yml]
        INFRA3[sqs/serverless.yml]
        INFRA4[s3/serverless.yml]
        INFRA5[eventbridge/serverless.yml]
        INFRA6[cognito/serverless.yml]
    end
    
    subgraph "API Services"
        API1[gateway/serverless.yml]
        API2[auth/serverless.yml]
        API3[users/serverless.yml]
        API4[accounts/serverless.yml]
    end
    
    COMPOSE --> INFRA1
    COMPOSE --> INFRA2
    COMPOSE --> INFRA3
    COMPOSE --> INFRA4
    COMPOSE --> INFRA5
    COMPOSE --> INFRA6
    COMPOSE --> API1
    COMPOSE --> API2
    COMPOSE --> API3
    COMPOSE --> API4
    
    style COMPOSE fill:#f9f
```

## Security Architecture

```mermaid
graph TB
    subgraph "External"
        USER[User]
        ATTACKER[Potential Attacker]
    end
    
    subgraph "Edge Security"
        WAF[AWS WAF<br/>Rules]
        CF_SEC[CloudFront<br/>Security Headers]
        SHIELD[AWS Shield<br/>DDoS Protection]
    end
    
    subgraph "Application Security"
        AUTH_LAMBDA[Authorizer<br/>Lambda]
        JWT[JWT Token<br/>Validation]
        RBAC[Role-Based<br/>Access Control]
    end
    
    subgraph "Data Security"
        ENC_TRANSIT[TLS 1.3<br/>In Transit]
        ENC_REST[AES-256<br/>At Rest]
        KMS[AWS KMS<br/>Key Management]
    end
    
    USER --> WAF
    ATTACKER -.-> WAF
    WAF --> CF_SEC
    CF_SEC --> AUTH_LAMBDA
    AUTH_LAMBDA --> JWT
    JWT --> RBAC
    RBAC --> ENC_TRANSIT
    ENC_TRANSIT --> ENC_REST
    ENC_REST --> KMS
    
    style ATTACKER fill:#ffcccc
    style WAF fill:#ccffcc
    style KMS fill:#ccccff
```

## Monitoring and Observability

```mermaid
graph LR
    subgraph "Data Sources"
        LAMBDA_LOGS[Lambda Logs]
        API_LOGS[API Gateway Logs]
        APP_METRICS[Application Metrics]
        DDB_METRICS[DynamoDB Metrics]
    end
    
    subgraph "CloudWatch"
        CW_LOGS[CloudWatch Logs]
        CW_METRICS[CloudWatch Metrics]
        CW_DASH[CloudWatch Dashboards]
        CW_ALARMS[CloudWatch Alarms]
    end
    
    subgraph "Alerting"
        SNS[SNS Topics]
        EMAIL[Email Alerts]
        SLACK[Slack Integration]
        PAGER[PagerDuty]
    end
    
    LAMBDA_LOGS --> CW_LOGS
    API_LOGS --> CW_LOGS
    APP_METRICS --> CW_METRICS
    DDB_METRICS --> CW_METRICS
    
    CW_LOGS --> CW_DASH
    CW_METRICS --> CW_DASH
    CW_METRICS --> CW_ALARMS
    
    CW_ALARMS --> SNS
    SNS --> EMAIL
    SNS --> SLACK
    SNS --> PAGER
```

## Cost Optimization Strategy

```mermaid
pie title Monthly AWS Cost Distribution
    "Lambda Functions" : 20
    "DynamoDB" : 25
    "S3 Storage" : 30
    "API Gateway" : 10
    "CloudFront" : 10
    "Other Services" : 5
```

### Cost Optimization Measures

1. **Lambda**: 
   - Provisioned concurrency only for critical functions
   - Memory optimization based on profiling
   - ARM-based Graviton2 processors

2. **DynamoDB**:
   - On-demand billing for unpredictable workloads
   - Auto-scaling for predictable patterns
   - Appropriate index projections

3. **S3**:
   - Intelligent-Tiering for automatic cost optimization
   - Lifecycle policies for old data
   - S3 Select for reduced data transfer

4. **API Gateway**:
   - Caching enabled for frequently accessed endpoints
   - Request throttling to prevent abuse

## Disaster Recovery

```mermaid
graph TD
    subgraph "Primary Region - us-west-2"
        PRIMARY_API[API Services]
        PRIMARY_DDB[(DynamoDB)]
        PRIMARY_S3[(S3 Buckets)]
    end
    
    subgraph "Backup Strategy"
        DDB_PITR[DynamoDB<br/>Point-in-Time Recovery]
        S3_REPL[S3 Cross-Region<br/>Replication]
        LAMBDA_BACKUP[Lambda Function<br/>Versioning]
    end
    
    subgraph "DR Region - us-east-1"
        DR_S3[(S3 DR Buckets)]
        DR_READY[Cold Standby<br/>Infrastructure]
    end
    
    PRIMARY_DDB --> DDB_PITR
    PRIMARY_S3 --> S3_REPL
    PRIMARY_API --> LAMBDA_BACKUP
    
    S3_REPL --> DR_S3
    DDB_PITR -.-> DR_READY
    LAMBDA_BACKUP -.-> DR_READY
    
    style PRIMARY_API fill:#ccffcc
    style DR_READY fill:#ffcccc
```

### RTO and RPO Targets

- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 24 hours
- **Backup Frequency**: Daily automated backups
- **Backup Retention**: 30 days

## Scaling Strategy

```mermaid
graph LR
    subgraph "Auto-Scaling Components"
        LAMBDA_SCALE[Lambda<br/>Concurrent Executions]
        DDB_SCALE[DynamoDB<br/>Read/Write Capacity]
        S3_SCALE[S3<br/>Unlimited Storage]
    end
    
    subgraph "Scaling Triggers"
        CPU[CPU Utilization]
        REQUESTS[Request Rate]
        QUEUE[Queue Depth]
        STORAGE[Storage Usage]
    end
    
    subgraph "Scaling Actions"
        SCALE_UP[Scale Up ↑]
        SCALE_DOWN[Scale Down ↓]
        ALERT[Alert DevOps]
    end
    
    CPU --> LAMBDA_SCALE
    REQUESTS --> LAMBDA_SCALE
    QUEUE --> LAMBDA_SCALE
    
    REQUESTS --> DDB_SCALE
    STORAGE --> S3_SCALE
    
    LAMBDA_SCALE --> SCALE_UP
    LAMBDA_SCALE --> SCALE_DOWN
    DDB_SCALE --> SCALE_UP
    DDB_SCALE --> SCALE_DOWN
    SCALE_UP --> ALERT
```

## Infrastructure Deployment Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant GHA as GitHub Actions
    participant AWS as AWS
    participant CF as CloudFormation
    
    Dev->>GH: Push to branch
    GH->>GHA: Trigger workflow
    GHA->>GHA: Run tests
    GHA->>GHA: Build artifacts
    GHA->>AWS: Assume deploy role
    AWS->>GHA: Return credentials
    GHA->>CF: Deploy infrastructure
    CF->>CF: Create/Update stacks
    CF->>GHA: Return stack outputs
    GHA->>GH: Update PR status
    GHA->>Dev: Notify completion
```

## Key Infrastructure Components

### 1. **API Gateway**
- HTTP API (not REST) for better performance
- Custom domain with ACM certificate
- Request validation and throttling
- CORS configuration

### 2. **Lambda Functions**
- Go for performance-critical functions
- Node.js for integration handlers
- 1GB default memory allocation
- 5-minute timeout for processing functions

### 3. **DynamoDB**
- Single-table design where appropriate
- Global secondary indexes for access patterns
- On-demand billing for cost optimization
- Point-in-time recovery enabled

### 4. **S3 Storage**
- Separate buckets by concern
- Versioning for data protection
- Encryption at rest (SSE-S3)
- Lifecycle policies for cost management

### 5. **SQS Queues**
- FIFO queues for ordered processing
- Dead letter queues for error handling
- Long polling for efficiency
- Message retention: 14 days

### 6. **EventBridge**
- Central event bus for all services
- Event replay capability
- Schema registry for events
- Archive for compliance

## Next Steps

For detailed information about specific infrastructure components:
- [DynamoDB Tables](../infrastructure/dynamodb-tables.md)
- [SQS Queues](../infrastructure/sqs-queues.md)
- [S3 Buckets](../infrastructure/s3-buckets.md)
- [CloudFormation Exports](../infrastructure/cloudformation-exports.md)