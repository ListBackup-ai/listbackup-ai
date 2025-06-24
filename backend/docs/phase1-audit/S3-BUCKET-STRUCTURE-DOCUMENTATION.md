# S3 Bucket Structure and Access Patterns

## Overview
This document details the S3 bucket architecture, folder structures, access patterns, and lifecycle policies for the ListBackup.ai Core service.

## Bucket Inventory

### 1. listbackup-data-{accountId}
**Purpose**: Primary data storage for backed up source data  
**Encryption**: AWS KMS (Customer Managed Key per account)  
**Versioning**: Enabled  
**Access**: Private, IAM role-based  

**Structure**:
```
listbackup-data-{accountId}/
├── sources/
│   ├── {sourceId}/
│   │   ├── {year}/
│   │   │   ├── {month}/
│   │   │   │   ├── {day}/
│   │   │   │   │   ├── {syncId}/
│   │   │   │   │   │   ├── manifest.json
│   │   │   │   │   │   ├── contacts/
│   │   │   │   │   │   │   ├── batch-001.json.gz
│   │   │   │   │   │   │   ├── batch-002.json.gz
│   │   │   │   │   │   │   └── ...
│   │   │   │   │   │   ├── orders/
│   │   │   │   │   │   │   ├── batch-001.json.gz
│   │   │   │   │   │   │   └── ...
│   │   │   │   │   │   ├── products/
│   │   │   │   │   │   ├── customers/
│   │   │   │   │   │   └── {dataType}/
│   │   ├── schemas/
│   │   │   ├── v1/
│   │   │   │   ├── contacts.json
│   │   │   │   ├── orders.json
│   │   │   │   └── {dataType}.json
│   │   └── metadata/
│   │       ├── source-config.json
│   │       └── sync-history.json
├── exports/
│   ├── {exportId}/
│   │   ├── metadata.json
│   │   ├── data/
│   │   │   ├── combined-export.zip
│   │   │   └── individual-files/
│   │   └── logs/
├── migrations/
│   ├── {migrationId}/
│   │   ├── source/
│   │   ├── destination/
│   │   ├── mapping-config.json
│   │   └── migration-log.json
└── temp/
    └── {processId}/
```

**Access Patterns**:
- Write: Sync processors only
- Read: API Lambda functions, Export processors
- List: Limited to specific prefixes

**Lifecycle Policies**:
| Path | Transition to IA | Transition to Glacier | Expiration |
|------|------------------|----------------------|------------|
| sources/*/2*/batch-*.json.gz | 30 days | 90 days | 1 year* |
| exports/ | 7 days | - | 30 days |
| temp/ | - | - | 1 day |
| migrations/ | 30 days | 90 days | 2 years |

*Configurable per account subscription

---

### 2. listbackup-system-{region}
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

**Access Patterns**:
- Read: All Lambda functions
- Write: Admin deployment only
- Cache: CloudFront distribution

**Lifecycle Policies**:
- No expiration (system resources)
- Versioning maintains last 10 versions

---

### 3. listbackup-logs-{region}
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

**Access Patterns**:
- Write: Append-only via Kinesis Firehose
- Read: Log analysis tools, Support team
- Query: Athena for analysis

**Lifecycle Policies**:
| Path | Transition to IA | Transition to Glacier | Expiration |
|------|------------------|----------------------|------------|
| */access-logs/ | 7 days | 30 days | 90 days |
| */execution-logs/ | 3 days | - | 30 days |
| lambda/ | 7 days | - | 60 days |
| sync-jobs/ | 14 days | 60 days | 180 days |
| security/ | - | 90 days | 7 years |
| application/ | 7 days | - | 90 days |

---

### 4. listbackup-backups-{region}
**Purpose**: System backups and disaster recovery  
**Encryption**: AWS KMS (Separate key)  
**Versioning**: Enabled  
**Access**: Restricted to backup processes  
**Replication**: Cross-region to DR site  

**Structure**:
```
listbackup-backups-{region}/
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
├── disaster-recovery/
│   ├── runbooks/
│   ├── recovery-points/
│   └── test-results/
└── compliance/
    ├── audit-logs/
    ├── change-history/
    └── access-reports/
```

**Access Patterns**:
- Write: Backup Lambda functions only
- Read: Disaster recovery processes
- List: Audit and compliance tools

**Lifecycle Policies**:
| Path | Retention | Archive |
|------|-----------|---------|
| dynamodb/daily/ | 7 days | - |
| dynamodb/weekly/ | 4 weeks | Glacier after 1 week |
| dynamodb/monthly/ | 12 months | Glacier after 1 month |
| configurations/ | Infinite | Glacier after 90 days |
| compliance/ | 7 years | Glacier after 1 year |

---

### 5. listbackup-analytics-{region}
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
└── exports/
    ├── dashboard-data/
    └── report-cache/
```

**Access Patterns**:
- Write: Stream processors, ETL jobs
- Read: Analytics queries, ML training
- Query: Athena, QuickSight

**Lifecycle Policies**:
| Path | Transition to IA | Expiration |
|------|------------------|------------|
| raw-data/ | 30 days | 180 days |
| processed-data/ | 60 days | 1 year |
| ml-models/ | - | - |
| exports/ | 7 days | 30 days |

---

## Access Control Patterns

### IAM Bucket Policies

#### Data Bucket Policy Example
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyUnencryptedObjectUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::listbackup-data-*/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "aws:kms"
        }
      }
    },
    {
      "Sid": "DenyInsecureConnections",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::listbackup-data-*",
        "arn:aws:s3:::listbackup-data-*/*"
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

### VPC Endpoints
All S3 access uses VPC endpoints to avoid internet transit:
- `vpce-data`: For data buckets
- `vpce-logs`: For log buckets
- `vpce-system`: For system resources

---

## Performance Optimization

### Request Patterns

#### Prefix Sharding
For high-throughput scenarios, use hex prefix sharding:
```
sources/{sourceId}/{year}/{month}/{day}/{syncId}/
becomes
sources/{sourceId}/{hex-prefix}/{year}/{month}/{day}/{syncId}/

where hex-prefix = first 2 chars of MD5(syncId)
```

#### Multipart Upload Thresholds
- Files > 100MB: Mandatory multipart
- Files > 10MB: Recommended multipart
- Part size: 10MB (optimized for Lambda memory)

#### Transfer Acceleration
Enabled for:
- Export downloads
- Large data migrations
- Cross-region transfers

### Caching Strategy

#### CloudFront Distribution
- System resources (24 hour cache)
- Platform configurations (1 hour cache)
- Static assets (30 day cache)

#### Lambda Function Cache
- Platform configs: 5 minute in-memory cache
- Schema definitions: 15 minute cache
- Frequently accessed metadata: 1 minute cache

---

## Cost Management

### Storage Classes Usage

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

---

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

### S3 Inventory Configuration
- Frequency: Daily
- Output: CSV with encryption
- Fields: Size, StorageClass, LastModified, ETag
- Destination: listbackup-analytics bucket

---

## Security Best Practices

### Encryption
1. **Data at Rest**
   - KMS encryption for all buckets
   - Separate keys per account
   - Automatic key rotation enabled

2. **Data in Transit**
   - TLS 1.2 minimum
   - VPC endpoints for internal traffic
   - Signed URLs for temporary access

### Access Control
1. **Principle of Least Privilege**
   - Separate roles for read/write
   - Bucket policies enforce encryption
   - MFA delete for production buckets

2. **Audit and Compliance**
   - CloudTrail logging for all API calls
   - Access Analyzer weekly reports
   - Macie scanning for sensitive data

### Data Protection
1. **Versioning**
   - Enabled for data integrity
   - MFA delete protection
   - 30-day version retention

2. **Replication**
   - Cross-region for disaster recovery
   - Same-region for high availability
   - Replication metrics monitoring

---

## Disaster Recovery

### Backup Strategy
- **RPO**: 1 hour for critical data
- **RTO**: 4 hours for full recovery
- **Backup Frequency**: Continuous replication

### Recovery Procedures
1. **Bucket Corruption**
   - Switch to replica bucket
   - Verify data integrity
   - Investigate root cause

2. **Mass Deletion**
   - Restore from versioning
   - Check MFA delete logs
   - Review access patterns

3. **Region Failure**
   - Failover to DR region
   - Update DNS/endpoints
   - Verify application connectivity

### Testing Schedule
- Monthly: Backup verification
- Quarterly: Restore testing
- Annually: Full DR drill

---

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