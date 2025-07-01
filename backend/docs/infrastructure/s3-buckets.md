# S3 Bucket Structure and Architecture

This document provides comprehensive documentation for all S3 buckets in the ListBackup.ai infrastructure.

## Table of Contents
1. [Overview](#overview)
2. [Bucket Inventory](#bucket-inventory)
3. [Access Patterns](#access-patterns)
4. [Security Configuration](#security-configuration)
5. [Lifecycle Policies](#lifecycle-policies)
6. [Performance Optimization](#performance-optimization)
7. [Cost Management](#cost-management)
8. [Monitoring and Alerts](#monitoring-and-alerts)
9. [Disaster Recovery](#disaster-recovery)
10. [Best Practices](#best-practices)

## Overview

The ListBackup.ai platform uses multiple S3 buckets for different purposes, following AWS best practices for security, performance, and cost optimization. All buckets follow a consistent naming convention: `listbackup-{purpose}-{accountId}-{region}`.

### Bucket Categories

- **Data Storage**: Primary backed-up customer data
- **System Resources**: Platform configurations and shared resources
- **Logging**: Centralized logging for all services
- **Backup & Archive**: System backups and compliance storage
- **Analytics**: Analytics and reporting data
- **Temporary**: Short-lived processing data
- **Assets**: Static assets and public files
- **CloudFormation**: Templates and deployment artifacts

## Bucket Inventory

### 1. Primary Data Bucket
**Bucket Name**: `listbackup-data-{accountId}-{region}`  
**Purpose**: Primary storage for all backed-up customer data  
**Encryption**: SSE-KMS with customer-managed keys per account  
**Versioning**: Enabled  
**Access**: Private, IAM role-based  

**Structure**:
```
listbackup-data-{accountId}-{region}/
├── accounts/
│   └── {accountId}/
│       ├── sources/
│       │   └── {sourceId}/
│       │       ├── raw/
│       │       │   └── {year}/{month}/{day}/
│       │       │       ├── {syncId}/
│       │       │       │   ├── manifest.json
│       │       │       │   ├── contacts/
│       │       │       │   │   ├── batch-001.json.gz
│       │       │       │   │   └── batch-002.json.gz
│       │       │       │   ├── orders/
│       │       │       │   │   └── batch-001.json.gz
│       │       │       │   ├── products/
│       │       │       │   └── {dataType}/
│       │       │       └── {timestamp}-{batchId}.json.gz
│       │       ├── processed/
│       │       │   └── {year}/{month}/{day}/
│       │       │       └── {dataType}/
│       │       │           ├── current/
│       │       │           │   └── {dataType}-latest.parquet
│       │       │           └── history/
│       │       │               └── {timestamp}-{dataType}.parquet
│       │       ├── exports/
│       │       │   └── {exportId}/
│       │       │       ├── manifest.json
│       │       │       └── data/
│       │       │           ├── combined-export.zip
│       │       │           └── {dataType}.{format}
│       │       ├── schemas/
│       │       │   └── v{version}/
│       │       │       └── {dataType}-schema.json
│       │       └── metadata/
│       │           ├── source-config.json
│       │           ├── sync-history.json
│       │           └── statistics/
│       │               └── {year}/{month}/
│       │                   └── stats-{dataType}.json
│       ├── migrations/
│       │   └── {migrationId}/
│       │       ├── source/
│       │       ├── destination/
│       │       ├── mapping-config.json
│       │       └── migration-log.json
│       └── shared/
│           ├── reports/
│           │   └── {year}/{month}/
│           │       └── {reportType}-{timestamp}.pdf
│           └── templates/
│               └── {templateType}/
│                   └── {templateName}.json
└── temp/
    └── {processId}/
```

**Access Patterns**:
- Write: Sync processors only
- Read: API Lambda functions, Export processors
- List: Limited to specific prefixes

### 2. System Resources Bucket
**Bucket Name**: `listbackup-system-{region}`  
**Purpose**: System-wide shared resources and configurations  
**Encryption**: AWS Managed KMS  
**Versioning**: Enabled  
**Access**: Read-only for Lambda functions  

**Structure**:
```
listbackup-system-{region}/
├── platform-configs/
│   ├── keap/
│   │   ├── api-schema-v1.json
│   │   ├── field-mappings.json
│   │   └── rate-limits.json
│   ├── stripe/
│   ├── gohighlevel/
│   └── {platform}/
├── templates/
│   ├── export-templates/
│   │   ├── csv/
│   │   ├── excel/
│   │   └── json/
│   ├── migration-mappings/
│   │   ├── keap-to-gohighlevel.json
│   │   └── {source}-to-{destination}.json
│   └── webhook-templates/
├── schemas/
│   ├── common/
│   │   ├── contact-v1.json
│   │   ├── order-v1.json
│   │   └── {entity}-v{version}.json
│   └── platform-specific/
├── documentation/
│   ├── api-docs/
│   ├── integration-guides/
│   └── error-codes/
└── static-assets/
    ├── logos/
    ├── email-templates/
    └── ui-components/
```

### 3. Application Assets Bucket
**Bucket Name**: `listbackup-assets-{accountId}-{region}`  
**Purpose**: Static assets, logos, and public files  
**Encryption**: SSE-S3  
**Versioning**: Enabled  
**CDN**: CloudFront distribution  

**Structure**:
```
listbackup-assets-{accountId}-{region}/
├── logos/
│   ├── platforms/
│   │   ├── keap.svg
│   │   ├── stripe.svg
│   │   └── {platform}.svg
│   └── accounts/
│       └── {accountId}/
│           └── logo.{ext}
├── templates/
│   ├── email/
│   │   └── {templateName}.html
│   └── export/
│       └── {format}-template.{ext}
├── documentation/
│   ├── api/
│   │   └── swagger.json
│   └── user-guides/
│       └── {guide-name}.pdf
└── public/
    ├── images/
    └── downloads/
```

### 4. Logs Bucket
**Bucket Name**: `listbackup-logs-{region}`  
**Purpose**: Centralized logging for all services  
**Encryption**: AWS Managed KMS  
**Versioning**: Disabled  
**Access**: Write-only for services, Read for log processors  

**Structure**:
```
listbackup-logs-{region}/
├── cloudfront/
│   └── {distribution-id}/
├── api-gateway/
│   ├── access-logs/
│   │   └── {year}/{month}/{day}/
│   └── execution-logs/
│       └── {year}/{month}/{day}/
├── lambda/
│   ├── {function-name}/
│   │   └── {year}/{month}/{day}/
│   │       └── {hour}/
├── s3-access-logs/
│   └── {bucket-name}/
│       └── {year}/{month}/{day}/
├── sync-jobs/
│   ├── {year}/{month}/{day}/
│   │   ├── success/
│   │   ├── failures/
│   │   └── performance/
├── security/
│   ├── access-denied/
│   ├── authentication-failures/
│   └── suspicious-activity/
└── application/
    ├── errors/
    ├── warnings/
    └── debug/
```

### 5. Backup and Archive Bucket
**Bucket Name**: `listbackup-archive-{accountId}-{region}`  
**Purpose**: Long-term archival and compliance storage  
**Encryption**: SSE-KMS with customer-managed keys  
**Versioning**: Enabled  
**Replication**: Cross-region to disaster recovery region  
**Object Lock**: Enabled (Compliance mode, 7 years)  

**Structure**:
```
listbackup-archive-{accountId}-{region}/
├── compliance/
│   └── {accountId}/
│       └── {year}/
│           └── {complianceType}/
│               └── {timestamp}-archive.tar.gz
├── audit-logs/
│   └── {year}/{month}/{day}/
│       └── {hour}/
│           └── audit-{timestamp}.json.gz
├── disaster-recovery/
│   ├── runbooks/
│   ├── recovery-points/
│   └── test-results/
└── backups/
    ├── dynamodb/
    │   ├── daily/
    │   │   └── {table-name}/
    │   │       └── {date}/
    │   ├── weekly/
    │   └── monthly/
    ├── configurations/
    │   ├── lambda-configs/
    │   ├── api-gateway/
    │   └── iam-policies/
    └── {service}/
        └── {date}/
            └── backup-{timestamp}.zip
```

### 6. Analytics Bucket
**Bucket Name**: `listbackup-analytics-{region}`  
**Purpose**: Analytics and reporting data  
**Encryption**: AWS Managed KMS  
**Versioning**: Disabled  
**Access**: Analytics services and BI tools  

**Structure**:
```
listbackup-analytics-{region}/
├── raw-data/
│   ├── events/
│   │   └── {year}/{month}/{day}/{hour}/
│   ├── metrics/
│   │   └── {year}/{month}/{day}/
│   └── user-behavior/
├── processed-data/
│   ├── daily-aggregates/
│   ├── monthly-summaries/
│   └── custom-reports/
├── ml-models/
│   ├── anomaly-detection/
│   ├── usage-prediction/
│   └── churn-analysis/
├── s3-inventory/
│   └── {bucket-name}/
│       └── {date}/
└── exports/
    ├── dashboard-data/
    └── report-cache/
```

### 7. Temporary Processing Bucket
**Bucket Name**: `listbackup-temp-{accountId}-{region}`  
**Purpose**: Temporary storage for processing large files  
**Encryption**: SSE-S3  
**Versioning**: Disabled  

**Structure**:
```
listbackup-temp-{accountId}-{region}/
├── uploads/
│   └── {sessionId}/
│       └── {filename}
├── processing/
│   └── {jobId}/
│       ├── input/
│       ├── working/
│       └── output/
└── staging/
    └── {exportId}/
        └── {files}
```

### 8. CloudFormation Templates Bucket
**Bucket Name**: `listbackup-cf-templates-{accountId}-{region}`  
**Purpose**: Store CloudFormation templates and deployment artifacts  
**Encryption**: SSE-S3  
**Versioning**: Enabled  

**Structure**:
```
listbackup-cf-templates-{accountId}-{region}/
├── templates/
│   ├── current/
│   │   └── {service}-template.yaml
│   └── versions/
│       └── {version}/
│           └── {service}-template.yaml
├── functions/
│   └── {service}/
│       └── {version}/
│           └── function.zip
└── layers/
    └── {layer-name}/
        └── {version}/
            └── layer.zip
```

## Access Patterns

### Common Query Patterns

1. **Data Access**
   - Latest data from `/processed/current/`
   - Historical queries from `/processed/history/`
   - Export downloads from `/exports/`
   - Raw data access for reprocessing

2. **System Resource Access**
   - Platform configurations (cached)
   - Schema definitions
   - Template retrieval

3. **Analytics Access**
   - Time-series data queries
   - Aggregated metrics
   - ML model retrieval

### Performance Optimization

#### Request Patterns
- **Hot Data**: `/processed/current/` - Frequent access
- **Warm Data**: Recent raw data (last 30 days)
- **Cold Data**: Historical raw data (30-90 days)
- **Archive Data**: Compliance and old backups

#### Optimization Strategies
1. **S3 Intelligent-Tiering** for unpredictable access patterns
2. **CloudFront caching** for static assets
3. **S3 Transfer Acceleration** for large uploads
4. **Multipart uploads** for files > 100MB
5. **Parallel uploads** with thread pooling
6. **Compression** before storage (gzip/snappy)

#### Prefix Sharding
For high-throughput scenarios:
```
sources/{sourceId}/{year}/{month}/{day}/{syncId}/
becomes
sources/{sourceId}/{hex-prefix}/{year}/{month}/{day}/{syncId}/

where hex-prefix = first 2 chars of MD5(syncId)
```

## Security Configuration

### Encryption
1. **Data at Rest**
   - KMS encryption for sensitive data buckets
   - SSE-S3 for general purpose buckets
   - Customer-managed KMS keys per account (Enterprise)
   - Automatic key rotation enabled

2. **Data in Transit**
   - TLS 1.2 minimum
   - VPC endpoints for internal traffic
   - Signed URLs for temporary access

### Bucket Policies

#### Standard Security Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyUnencryptedObjectUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::listbackup-*/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": ["AES256", "aws:kms"]
        }
      }
    },
    {
      "Sid": "DenyInsecureConnections",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::listbackup-*",
        "arn:aws:s3:::listbackup-*/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "AllowAccountAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/ListBackupDataAccessRole"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::listbackup-data-ACCOUNT_ID",
        "arn:aws:s3:::listbackup-data-ACCOUNT_ID/*"
      ]
    }
  ]
}
```

### Access Control
1. **Principle of Least Privilege**
   - Separate roles for read/write
   - Bucket policies enforce encryption
   - MFA delete for production buckets

2. **Audit and Compliance**
   - CloudTrail logging for all API calls
   - Access Analyzer weekly reports
   - Macie scanning for sensitive data

### CORS Configuration (Assets Bucket)
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://*.listbackup.ai"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

### VPC Endpoints
All S3 access uses VPC endpoints:
- `vpce-data`: For data buckets
- `vpce-logs`: For log buckets
- `vpce-system`: For system resources

## Lifecycle Policies

### Data Bucket Lifecycle
| Path | Transition to IA | Transition to Glacier | Expiration |
|------|------------------|----------------------|------------|
| accounts/*/sources/*/raw/ | 30 days | 90 days | 1 year* |
| accounts/*/sources/*/processed/*/history/ | 60 days | 180 days | 2 years* |
| accounts/*/sources/*/exports/ | 7 days | - | 30 days |
| temp/ | - | - | 1 day |
| migrations/ | 30 days | 90 days | 2 years |

*Configurable per account subscription

### Logs Bucket Lifecycle
| Path | Transition to IA | Transition to Glacier | Expiration |
|------|------------------|----------------------|------------|
| */access-logs/ | 7 days | 30 days | 90 days |
| */execution-logs/ | 3 days | - | 30 days |
| lambda/ | 7 days | - | 60 days |
| sync-jobs/ | 14 days | 60 days | 180 days |
| security/ | - | 90 days | 7 years |
| application/ | 7 days | - | 90 days |

### Archive Bucket Lifecycle
| Path | Retention | Archive |
|------|-----------|---------|
| compliance/ | 7 years | Immediate to Glacier |
| audit-logs/ | 7 years | Glacier after 90 days |
| backups/dynamodb/daily/ | 7 days | - |
| backups/dynamodb/weekly/ | 4 weeks | Glacier after 1 week |
| backups/dynamodb/monthly/ | 12 months | Glacier after 1 month |
| backups/configurations/ | Infinite | Glacier after 90 days |

### Temporary Bucket Lifecycle
```json
{
  "Rules": [
    {
      "Id": "DeleteTempFiles",
      "Status": "Enabled",
      "Prefix": "",
      "Expiration": {
        "Days": 1
      }
    },
    {
      "Id": "AbortIncompleteMultipart",
      "Status": "Enabled",
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 1
      }
    }
  ]
}
```

## Performance Optimization

### Multipart Upload Configuration
- Files > 100MB: Mandatory multipart
- Files > 10MB: Recommended multipart
- Part size: 10MB (optimized for Lambda memory)
- Concurrent parts: 10 (default)

### Transfer Acceleration
Enabled for:
- Export downloads
- Large data migrations
- Cross-region transfers
- International users

### Caching Strategy

#### CloudFront Distribution
- System resources: 24 hour cache
- Platform configurations: 1 hour cache
- Static assets: 30 day cache
- API documentation: 1 hour cache

#### Lambda Function Cache
- Platform configs: 5 minute in-memory cache
- Schema definitions: 15 minute cache
- Frequently accessed metadata: 1 minute cache

## Cost Management

### Storage Class Strategy
| Use Case | Storage Class | Transition Strategy |
|----------|--------------|-------------------|
| Active sync data | Standard | IA after 30 days |
| Historical data | Standard-IA | Glacier after 90 days |
| Compliance data | Glacier | Deep Archive after 1 year |
| Temporary data | Standard | Delete after 24 hours |
| Frequently accessed | Standard | Intelligent-Tiering |

### Cost Optimization Rules

1. **Intelligent-Tiering**
   - Enable for buckets > 100GB
   - Automatic cost optimization
   - No retrieval fees

2. **Lifecycle Transitions**
   - Monitor access patterns monthly
   - Adjust transition days based on usage
   - Consider Glacier Instant Retrieval

3. **Request Optimization**
   - Batch small files into archives
   - Use S3 Select for partial retrieval
   - Enable request metrics for analysis

4. **Storage Optimization**
   - Enable S3 Inventory for analysis
   - Remove incomplete multipart uploads
   - Delete old export files automatically

## Monitoring and Alerts

### CloudWatch Metrics

#### Bucket-Level Metrics
- BucketSizeBytes
- NumberOfObjects
- AllRequests
- 4xxErrors
- 5xxErrors

#### Request Metrics (Detailed)
- GetRequests
- PutRequests
- DeleteRequests
- ListRequests
- BytesDownloaded
- BytesUploaded
- FirstByteLatency
- TotalRequestLatency

### Alerting Thresholds
| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| 4xxErrors | > 10/min | > 50/min | Check permissions |
| 5xxErrors | > 5/min | > 20/min | AWS support ticket |
| Request latency | > 1000ms | > 5000ms | Enable Transfer Acceleration |
| Bucket size | > 1TB | > 5TB | Review lifecycle policies |
| Daily cost | > $100 | > $500 | Cost optimization review |

### S3 Inventory Configuration
```yaml
Configuration:
  Frequency: Daily
  Format: Apache ORC
  Destination: listbackup-analytics-{region}/s3-inventory/
  Fields:
    - Size
    - LastModifiedDate
    - StorageClass
    - ETag
    - IsMultipartUploaded
    - ReplicationStatus
    - EncryptionStatus
```

### Access Logging
```yaml
Target Bucket: listbackup-logs-{region}
Prefix: s3-access-logs/{bucket-name}/
Fields Captured:
  - Time
  - Remote IP
  - Requester
  - Request ID
  - Operation
  - Key
  - HTTP status
  - Error code
  - Bytes sent
  - Total time
```

## Disaster Recovery

### Backup Strategy
- **RPO**: 1 hour for critical data
- **RTO**: 4 hours for full recovery
- **Backup Frequency**: Continuous replication for critical data

### Replication Configuration
```yaml
Primary Region: us-east-1
DR Region: us-west-2

Replication Rules:
  - Critical Data: Real-time replication
  - Processed Data: Daily replication
  - Archive Data: Weekly replication

RPO/RTO by Data Type:
  - Critical Data: RPO < 1 hour, RTO < 2 hours
  - Standard Data: RPO < 24 hours, RTO < 4 hours
  - Archive Data: RPO < 7 days, RTO < 24 hours
```

### Recovery Procedures

1. **Bucket Corruption**
   - Switch to replica bucket
   - Verify data integrity
   - Investigate root cause
   - Update DNS/endpoints

2. **Mass Deletion**
   - Restore from versioning
   - Check MFA delete logs
   - Review access patterns
   - Enable additional safeguards

3. **Region Failure**
   - Failover to DR region
   - Update Lambda environment variables
   - Verify application connectivity
   - Monitor performance

### Testing Schedule
- Monthly: Backup verification
- Quarterly: Restore testing
- Annually: Full DR drill

## Best Practices

### 1. Naming Conventions
- Use lowercase letters, numbers, and hyphens
- Include account ID for uniqueness
- Include region for clarity
- Prefix with service name

### 2. Object Key Design
- Use hierarchical structure for organization
- Include dates in sortable format (YYYY/MM/DD)
- Avoid sequential names for performance
- Use random prefixes for high-frequency access

### 3. Performance Guidelines
- Enable Transfer Acceleration for uploads > 1GB
- Use multipart uploads for files > 100MB
- Implement request rate limiting
- Distribute requests across key prefixes

### 4. Security Guidelines
- Enable default encryption on all buckets
- Use bucket policies to enforce encryption
- Enable versioning for data protection
- Configure lifecycle policies for all buckets

### 5. Cost Guidelines
- Monitor S3 Storage Lens dashboard
- Use S3 Analytics for access pattern insights
- Set budget alerts for unexpected costs
- Review and optimize storage classes quarterly

### 6. Operational Guidelines
- Document all bucket purposes
- Maintain access control matrix
- Regular security audits
- Automate monitoring and alerting

## Migration Support

### Data Import Methods
1. **Direct Upload**
   - S3 Transfer Acceleration
   - Multipart upload
   - Signed URLs

2. **AWS DataSync**
   - From on-premises
   - From other clouds
   - Scheduled transfers

3. **Database Migration**
   - DMS for database sources
   - Kinesis for streaming
   - Batch processing

### Export Capabilities
1. **Direct Download**
   - Pre-signed URLs
   - CloudFront distribution
   - Byte-range requests

2. **External Storage Sync**
   - S3 to Google Drive
   - S3 to Dropbox
   - S3 to Azure Blob

3. **API Access**
   - RESTful data export
   - GraphQL queries
   - Webhook notifications

## Future Considerations

1. **S3 Express One Zone** for high-performance workloads
2. **S3 Batch Operations** for large-scale processing
3. **S3 Object Lambda** for on-the-fly transformations
4. **AWS Backup** integration for centralized backup management
5. **S3 Storage Lens** for organization-wide visibility