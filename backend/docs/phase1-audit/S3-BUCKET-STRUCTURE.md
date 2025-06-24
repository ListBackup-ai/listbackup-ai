# S3 Bucket Structure and Access Patterns - ListBackup.ai v2

## Overview
This document details the S3 bucket architecture, folder structures, access patterns, and lifecycle policies for the ListBackup.ai v2 system.

## Bucket Inventory

### 1. Primary Data Bucket
**Bucket Name**: `listbackup-data-${AWS::AccountId}-${AWS::Region}`
**Purpose**: Primary storage for all backed-up customer data
**Encryption**: SSE-S3 with bucket keys enabled
**Versioning**: Enabled

#### Folder Structure
```
/
├── accounts/
│   └── {accountId}/
│       ├── sources/
│       │   └── {sourceId}/
│       │       ├── raw/
│       │       │   └── {year}/{month}/{day}/
│       │       │       ├── contacts/
│       │       │       │   └── {timestamp}-{batchId}.json.gz
│       │       │       ├── orders/
│       │       │       │   └── {timestamp}-{batchId}.json.gz
│       │       │       ├── products/
│       │       │       │   └── {timestamp}-{batchId}.json.gz
│       │       │       └── custom/
│       │       │           └── {dataType}/
│       │       │               └── {timestamp}-{batchId}.json.gz
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
│       │       │           └── {dataType}.{format}
│       │       └── metadata/
│       │           ├── schema/
│       │           │   └── {dataType}-schema-v{version}.json
│       │           └── statistics/
│       │               └── {year}/{month}/
│       │                   └── stats-{dataType}.json
│       └── shared/
│           ├── reports/
│           │   └── {year}/{month}/
│           │       └── {reportType}-{timestamp}.pdf
│           └── templates/
│               └── {templateType}/
│                   └── {templateName}.json
```

#### Access Patterns
1. **Write Patterns**
   - Sync processors write to `/raw/` hourly
   - Data processors write to `/processed/` daily
   - Export jobs write to `/exports/` on-demand

2. **Read Patterns**
   - Latest data from `/processed/current/`
   - Historical queries from `/processed/history/`
   - Export downloads from `/exports/`

#### Lifecycle Policies
```json
{
  "Rules": [
    {
      "Id": "MoveRawToIA",
      "Status": "Enabled",
      "Prefix": "accounts/*/sources/*/raw/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    },
    {
      "Id": "DeleteOldExports",
      "Status": "Enabled",
      "Prefix": "accounts/*/sources/*/exports/",
      "Expiration": {
        "Days": 7
      }
    },
    {
      "Id": "ArchiveProcessedHistory",
      "Status": "Enabled",
      "Prefix": "accounts/*/sources/*/processed/*/history/",
      "Transitions": [
        {
          "Days": 180,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

---

### 2. Application Assets Bucket
**Bucket Name**: `listbackup-assets-${AWS::AccountId}-${AWS::Region}`
**Purpose**: Static assets, logos, and public files
**Encryption**: SSE-S3
**Versioning**: Enabled
**CDN**: CloudFront distribution

#### Folder Structure
```
/
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

#### Access Patterns
1. **Public Access**
   - `/public/*` - Public read via CloudFront
   - `/logos/platforms/*` - Public read

2. **Private Access**
   - `/logos/accounts/*` - Signed URLs only
   - `/templates/*` - Lambda function access only

#### CORS Configuration
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

---

### 3. Temporary Processing Bucket
**Bucket Name**: `listbackup-temp-${AWS::AccountId}-${AWS::Region}`
**Purpose**: Temporary storage for processing large files
**Encryption**: SSE-S3
**Versioning**: Disabled

#### Folder Structure
```
/
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

#### Lifecycle Policies
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

---

### 4. Backup and Archive Bucket
**Bucket Name**: `listbackup-archive-${AWS::AccountId}-${AWS::Region}`
**Purpose**: Long-term archival and compliance storage
**Encryption**: SSE-KMS with customer-managed keys
**Versioning**: Enabled
**Replication**: Cross-region to disaster recovery region

#### Folder Structure
```
/
├── compliance/
│   └── {accountId}/
│       └── {year}/
│           └── {complianceType}/
│               └── {timestamp}-archive.tar.gz
├── audit-logs/
│   └── {year}/{month}/{day}/
│       └── {hour}/
│           └── audit-{timestamp}.json.gz
└── backups/
    └── {service}/
        └── {date}/
            └── backup-{timestamp}.zip
```

#### Access Controls
- Object Lock: Enabled (Compliance mode, 7 years)
- MFA Delete: Required
- Bucket Policy: Deny all deletes except by compliance role

---

### 5. CloudFormation Templates Bucket
**Bucket Name**: `listbackup-cf-templates-${AWS::AccountId}-${AWS::Region}`
**Purpose**: Store CloudFormation templates and deployment artifacts
**Encryption**: SSE-S3
**Versioning**: Enabled

#### Folder Structure
```
/
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

---

## Access Patterns and Optimization

### 1. Read Optimization
```yaml
Request Patterns:
  - Frequent Access: /processed/current/ (Hot data)
  - Occasional Access: /raw/ from last 30 days
  - Rare Access: /raw/ older than 90 days
  - Archive Access: /compliance/ (retrieval requests)

Optimization Strategies:
  - S3 Intelligent-Tiering for processed data
  - Lifecycle transitions for raw data
  - CloudFront caching for assets
  - S3 Transfer Acceleration for large uploads
```

### 2. Write Optimization
```yaml
Write Patterns:
  - Batch writes every 15 minutes (raw data)
  - Daily consolidation (processed data)
  - On-demand exports
  
Optimization Strategies:
  - Multipart uploads for files > 100MB
  - S3 Batch Operations for bulk processing
  - Parallel uploads with thread pooling
  - Compression before storage (gzip/snappy)
```

### 3. Cost Optimization
```yaml
Storage Classes:
  - STANDARD: Current processed data, recent raw data
  - STANDARD_IA: Raw data 30-90 days old
  - GLACIER: Raw data > 90 days, historical processed data
  - DEEP_ARCHIVE: Compliance data

Cost Reduction:
  - S3 Inventory for unused object cleanup
  - Incomplete multipart upload abortion
  - Lifecycle policies for automatic transitions
  - Request metrics to optimize access patterns
```

## Security and Access Control

### 1. Bucket Policies
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
          "s3:x-amz-server-side-encryption": "AES256"
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
    }
  ]
}
```

### 2. IAM Policies

#### Lambda Execution Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::listbackup-data-*/accounts/${aws:PrincipalTag/accountId}/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::listbackup-data-*",
      "Condition": {
        "StringLike": {
          "s3:prefix": "accounts/${aws:PrincipalTag/accountId}/*"
        }
      }
    }
  ]
}
```

### 3. Encryption Configuration
```yaml
Default Encryption:
  - SSE-S3 for general data
  - SSE-KMS for sensitive data
  - Customer-managed KMS keys per account (Enterprise)

Encryption in Transit:
  - HTTPS required for all operations
  - VPC endpoints for internal traffic
  - TLS 1.2 minimum
```

## Monitoring and Metrics

### 1. CloudWatch Metrics
```yaml
Bucket Metrics:
  - BucketSizeBytes
  - NumberOfObjects
  - AllRequests
  - 4xxErrors
  - 5xxErrors
  - FirstByteLatency
  - TotalRequestLatency

Request Metrics:
  - GetRequests
  - PutRequests
  - DeleteRequests
  - HeadRequests
  - PostRequests
```

### 2. S3 Inventory
```yaml
Configuration:
  - Frequency: Daily
  - Format: Apache ORC
  - Fields:
    - Size
    - LastModifiedDate
    - StorageClass
    - ETag
    - IsMultipartUploaded
    - ReplicationStatus
    - EncryptionStatus
```

### 3. Access Logging
```yaml
Target Bucket: listbackup-logs-{account}-{region}
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

### 1. Backup Strategy
```yaml
Primary Region: us-east-1
DR Region: us-west-2

Replication Rules:
  - Critical Data: Real-time replication
  - Processed Data: Daily replication
  - Archive Data: Weekly replication

RPO/RTO:
  - Critical Data: RPO < 1 hour, RTO < 2 hours
  - Standard Data: RPO < 24 hours, RTO < 4 hours
  - Archive Data: RPO < 7 days, RTO < 24 hours
```

### 2. Recovery Procedures
```yaml
Bucket Failure:
  1. Switch DNS to DR region bucket
  2. Update Lambda environment variables
  3. Verify data consistency
  4. Resume operations

Data Corruption:
  1. Identify affected objects via S3 Inventory
  2. Restore from object versions
  3. Verify data integrity
  4. Update affected downstream systems
```

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

### 4. Cost Management
- Enable S3 Analytics for access pattern insights
- Use Intelligent-Tiering for unpredictable access
- Set lifecycle policies for all buckets
- Monitor CloudWatch billing metrics
- Use S3 Batch Operations for bulk actions