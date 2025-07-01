# CloudFormation Exports Reference

This document provides a comprehensive reference of all CloudFormation exports in the ListBackup.ai infrastructure, their dependencies, and usage patterns.

## Table of Contents
1. [Overview](#overview)
2. [Export Naming Convention](#export-naming-convention)
3. [Infrastructure Service Exports](#infrastructure-service-exports)
4. [Cross-Stack Dependencies](#cross-stack-dependencies)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

CloudFormation exports enable sharing of resource information between stacks without hardcoding values. The ListBackup.ai platform uses exports extensively to maintain loose coupling between services while ensuring resource references remain consistent.

## Export Naming Convention

All exports follow these patterns:
- Infrastructure exports: `${Stage}-${ServiceName}-${ResourceType}-${ResourceName}`
- Service exports: `${AWS::StackName}-${ResourceType}-${ResourceName}`

Examples:
- `main-infrastructure-table-users`
- `listbackup-main-users-api-endpoint`

## Infrastructure Service Exports

### DynamoDB Tables

#### User Management Tables
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-table-users` | Table Name | Users table | `listbackup-main-users` | Users, Auth services |
| `${Stage}-infrastructure-table-users-arn` | Table ARN | Users table ARN | `arn:aws:dynamodb:region:account:table/listbackup-main-users` | IAM policies |
| `${Stage}-infrastructure-table-accounts` | Table Name | Accounts table | `listbackup-main-accounts` | Accounts, Billing services |
| `${Stage}-infrastructure-table-accounts-arn` | Table ARN | Accounts table ARN | `arn:aws:dynamodb:region:account:table/listbackup-main-accounts` | IAM policies |
| `${Stage}-infrastructure-table-user-accounts` | Table Name | User-Account mapping | `listbackup-main-user-accounts` | Users, Accounts services |

#### Platform Integration Tables
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-table-platforms` | Table Name | Platforms table | `listbackup-main-platforms` | Integrations service |
| `${Stage}-infrastructure-table-platform-connections` | Table Name | Platform connections | `listbackup-main-platform-connections` | Integrations, Sources |
| `${Stage}-infrastructure-table-platform-sources` | Table Name | Platform source templates | `listbackup-main-platform-sources` | Sources service |

#### Data Management Tables
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-table-sources` | Table Name | Sources table | `listbackup-main-sources` | Sources, Jobs services |
| `${Stage}-infrastructure-table-source-groups` | Table Name | Source groups | `listbackup-main-source-groups` | Sources service |
| `${Stage}-infrastructure-table-jobs` | Table Name | Jobs table | `listbackup-main-jobs` | Jobs service |
| `${Stage}-infrastructure-table-job-logs` | Table Name | Job logs table | `listbackup-main-job-logs` | Jobs service |

#### Team Collaboration Tables
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-table-teams` | Table Name | Teams table | `listbackup-main-teams` | Teams service |
| `${Stage}-infrastructure-table-team-members` | Table Name | Team members | `listbackup-main-team-members` | Teams service |

#### System Tables
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-table-activity` | Table Name | Activity log | `listbackup-main-activity` | All services |
| `${Stage}-infrastructure-table-notifications` | Table Name | Notifications | `listbackup-main-notifications` | Notifications service |
| `${Stage}-infrastructure-table-billing` | Table Name | Billing records | `listbackup-main-billing` | Billing service |
| `${Stage}-infrastructure-table-billing-usage` | Table Name | Usage tracking | `listbackup-main-billing-usage` | Billing service |
| `${Stage}-infrastructure-table-tags` | Table Name | Tags table | `listbackup-main-tags` | All services |

### DynamoDB Global Secondary Indexes
| Export Name | Resource Type | Description | Example Value |
|-------------|---------------|-------------|---------------|
| `${Stage}-infrastructure-gsi-users-email` | GSI Name | Users email index | `EmailIndex` |
| `${Stage}-infrastructure-gsi-accounts-parent` | GSI Name | Account hierarchy index | `ParentAccountIndex` |
| `${Stage}-infrastructure-gsi-sources-account` | GSI Name | Sources by account | `AccountIndex` |
| `${Stage}-infrastructure-gsi-activity-user` | GSI Name | Activity by user | `UserIndex` |

### SQS Queues

#### Processing Queues
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-queue-sync-jobs-url` | Queue URL | Sync jobs FIFO queue | `https://sqs.region.amazonaws.com/account/listbackup-main-sync-jobs.fifo` | Jobs service |
| `${Stage}-infrastructure-queue-sync-jobs-arn` | Queue ARN | Sync jobs queue ARN | `arn:aws:sqs:region:account:listbackup-main-sync-jobs.fifo` | IAM policies |
| `${Stage}-infrastructure-queue-sync-jobs-name` | Queue Name | Sync jobs queue name | `listbackup-main-sync-jobs.fifo` | Jobs service |
| `${Stage}-infrastructure-queue-data-processing-url` | Queue URL | Data processing queue | `https://sqs.region.amazonaws.com/account/listbackup-main-data-processing` | Jobs service |
| `${Stage}-infrastructure-queue-export-jobs-url` | Queue URL | Export jobs queue | `https://sqs.region.amazonaws.com/account/listbackup-main-export-jobs` | Export service |

#### Event Queues
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-queue-activities-url` | Queue URL | Activity events queue | `https://sqs.region.amazonaws.com/account/listbackup-main-activity-events` | All services |
| `${Stage}-infrastructure-queue-activities-arn` | Queue ARN | Activity queue ARN | `arn:aws:sqs:region:account:listbackup-main-activity-events` | IAM policies |
| `${Stage}-infrastructure-queue-notifications-url` | Queue URL | Notifications queue | `https://sqs.region.amazonaws.com/account/listbackup-main-notification-queue` | Notifications service |
| `${Stage}-infrastructure-queue-webhooks-url` | Queue URL | Webhook delivery queue | `https://sqs.region.amazonaws.com/account/listbackup-main-webhook-delivery` | Integrations service |

#### Dead Letter Queues
| Export Name | Resource Type | Description | Example Value |
|-------------|---------------|-------------|---------------|
| `${Stage}-infrastructure-dlq-sync-jobs-arn` | DLQ ARN | Sync jobs DLQ | `arn:aws:sqs:region:account:listbackup-main-sync-jobs-dlq` |
| `${Stage}-infrastructure-dlq-activities-arn` | DLQ ARN | Activities DLQ | `arn:aws:sqs:region:account:listbackup-main-activity-events-dlq` |
| `${Stage}-infrastructure-dlq-webhooks-arn` | DLQ ARN | Webhooks DLQ | `arn:aws:sqs:region:account:listbackup-main-webhook-delivery-dlq` |

### S3 Buckets

#### Data Storage Buckets
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-bucket-data` | Bucket Name | Primary data storage | `listbackup-data-accountid-region` | All data services |
| `${Stage}-infrastructure-bucket-data-arn` | Bucket ARN | Data bucket ARN | `arn:aws:s3:::listbackup-data-accountid-region` | IAM policies |
| `${Stage}-infrastructure-bucket-temp` | Bucket Name | Temporary storage | `listbackup-temp-accountid-region` | Processing services |
| `${Stage}-infrastructure-bucket-archive` | Bucket Name | Archive storage | `listbackup-archive-accountid-region` | Compliance service |

#### System Buckets
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-bucket-system` | Bucket Name | System resources | `listbackup-system-region` | All services |
| `${Stage}-infrastructure-bucket-system-arn` | Bucket ARN | System bucket ARN | `arn:aws:s3:::listbackup-system-region` | IAM policies |
| `${Stage}-infrastructure-bucket-logs` | Bucket Name | Centralized logs | `listbackup-logs-region` | All services |
| `${Stage}-infrastructure-bucket-logs-arn` | Bucket ARN | Logs bucket ARN | `arn:aws:s3:::listbackup-logs-region` | IAM policies |
| `${Stage}-infrastructure-bucket-analytics` | Bucket Name | Analytics data | `listbackup-analytics-region` | Analytics service |
| `${Stage}-infrastructure-bucket-assets` | Bucket Name | Static assets | `listbackup-assets-accountid-region` | Frontend, CDN |

### IAM Roles
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-role-lambda-arn` | Role ARN | Lambda execution role | `arn:aws:iam::account:role/listbackup-main-lambda` | All Lambda functions |
| `${Stage}-infrastructure-role-sync-processor-arn` | Role ARN | Sync processor role | `arn:aws:iam::account:role/listbackup-main-sync-processor` | Jobs service |
| `${Stage}-infrastructure-role-data-access-arn` | Role ARN | Data access role | `arn:aws:iam::account:role/listbackup-main-data-access` | All services |

### KMS Keys
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-kms-key-id` | KMS Key ID | Data encryption key | `12345678-1234-1234-1234-123456789012` | All services |
| `${Stage}-infrastructure-kms-key-arn` | KMS Key ARN | Data key ARN | `arn:aws:kms:region:account:key/12345678-1234-1234-1234-123456789012` | IAM policies |
| `${Stage}-infrastructure-kms-alias` | KMS Alias | Data key alias | `alias/listbackup-main-data` | All services |

### VPC and Networking
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-vpc-id` | VPC ID | Main VPC identifier | `vpc-12345678` | All services |
| `${Stage}-infrastructure-subnet-private-1` | Subnet ID | Private subnet AZ-1 | `subnet-12345678` | Lambda functions |
| `${Stage}-infrastructure-subnet-private-2` | Subnet ID | Private subnet AZ-2 | `subnet-87654321` | Lambda functions |
| `${Stage}-infrastructure-security-group-lambda` | Security Group | Lambda security group | `sg-12345678` | Lambda functions |
| `${Stage}-infrastructure-vpc-endpoint-s3` | VPC Endpoint | S3 VPC endpoint | `vpce-12345678` | All services |
| `${Stage}-infrastructure-vpc-endpoint-dynamodb` | VPC Endpoint | DynamoDB VPC endpoint | `vpce-87654321` | All services |

### CloudWatch Resources
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-log-group-prefix` | Log Group Prefix | Log group prefix | `/aws/lambda/listbackup-main-` | Monitoring |
| `${Stage}-infrastructure-alarm-topic-arn` | SNS Topic | Alarm notifications | `arn:aws:sns:region:account:listbackup-main-alarms` | All services |

### EventBridge Resources
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-eventbus-name` | Event Bus | Main event bus | `listbackup-main-events` | All services |
| `${Stage}-infrastructure-eventbus-arn` | Event Bus ARN | Event bus ARN | `arn:aws:events:region:account:event-bus/listbackup-main-events` | IAM policies |

### Secrets Manager
| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-infrastructure-secret-jwt-arn` | Secret ARN | JWT signing secret | `arn:aws:secretsmanager:region:account:secret:listbackup/main/jwt-abc123` | Auth service |
| `${Stage}-infrastructure-secret-api-keys-prefix` | Secret Prefix | API keys prefix | `listbackup/main/api-keys/` | Auth service |

## Cross-Stack Dependencies

### Service Dependencies Matrix

| Consumer Service | Required Infrastructure Exports | Purpose |
|-----------------|--------------------------------|---------|
| Auth Service | users table, jwt secret, kms key | User authentication |
| Users Service | users, accounts, user-accounts tables, activity queue | User management |
| Accounts Service | accounts, user-accounts tables, activity queue | Account management |
| Sources Service | sources, source-groups, platform-connections tables, sync queue | Source management |
| Jobs Service | jobs, job-logs tables, all processing queues, data bucket | Job processing |
| Integrations Service | platforms, platform-connections tables, webhook queue | Platform integrations |
| Billing Service | billing, billing-usage, accounts tables, billing queue | Billing management |
| Notifications Service | notifications table, notification queue, users table | Notification delivery |

### Import Order

1. Infrastructure stack (provides all base resources)
2. Auth service (depends on infrastructure)
3. Users/Accounts services (depend on auth)
4. Sources/Jobs services (depend on users/accounts)
5. Integrations service (depends on sources)
6. Billing/Notifications services (depend on all above)

## Usage Examples

### Importing in CloudFormation Templates

```yaml
Resources:
  MyFunction:
    Type: AWS::Lambda::Function
    Properties:
      Environment:
        Variables:
          USERS_TABLE:
            Fn::ImportValue: !Sub "${Stage}-infrastructure-table-users"
          ACTIVITIES_QUEUE_URL:
            Fn::ImportValue: !Sub "${Stage}-infrastructure-queue-activities-url"
          DATA_BUCKET:
            Fn::ImportValue: !Sub "${Stage}-infrastructure-bucket-data"
```

### Importing in Serverless Framework

```yaml
custom:
  stage: ${opt:stage, 'dev'}
  usersTable: ${cf:listbackup-${self:custom.stage}-infrastructure.UsersTableName}
  activitiesQueueUrl: ${cf:listbackup-${self:custom.stage}-infrastructure.ActivitiesQueueUrl}
  dataBucket: ${cf:listbackup-${self:custom.stage}-infrastructure.DataBucketName}

functions:
  myFunction:
    environment:
      USERS_TABLE: ${self:custom.usersTable}
      ACTIVITIES_QUEUE_URL: ${self:custom.activitiesQueueUrl}
      DATA_BUCKET: ${self:custom.dataBucket}
```

### Importing in CDK

```typescript
const usersTableName = cdk.Fn.importValue(`${stage}-infrastructure-table-users`);
const activitiesQueueUrl = cdk.Fn.importValue(`${stage}-infrastructure-queue-activities-url`);
const dataBucket = cdk.Fn.importValue(`${stage}-infrastructure-bucket-data`);

new lambda.Function(this, 'MyFunction', {
  environment: {
    USERS_TABLE: usersTableName,
    ACTIVITIES_QUEUE_URL: activitiesQueueUrl,
    DATA_BUCKET: dataBucket,
  },
});
```

### Importing in Terraform

```hcl
data "aws_cloudformation_export" "users_table" {
  name = "${var.stage}-infrastructure-table-users"
}

data "aws_cloudformation_export" "activities_queue_url" {
  name = "${var.stage}-infrastructure-queue-activities-url"
}

data "aws_cloudformation_export" "data_bucket" {
  name = "${var.stage}-infrastructure-bucket-data"
}

resource "aws_lambda_function" "my_function" {
  environment {
    variables = {
      USERS_TABLE = data.aws_cloudformation_export.users_table.value
      ACTIVITIES_QUEUE_URL = data.aws_cloudformation_export.activities_queue_url.value
      DATA_BUCKET = data.aws_cloudformation_export.data_bucket.value
    }
  }
}
```

## Best Practices

### 1. Naming Consistency
- Always include stage in export name
- Use lowercase with hyphens
- Include resource type in name
- Be descriptive but concise

### 2. Version Management
- Never change export values in production
- Create new exports for breaking changes
- Deprecate old exports gradually
- Document all changes

### 3. Documentation
- Document all exports in this file
- Include usage examples
- Note dependent services
- Keep examples up to date

### 4. Security
- Don't export sensitive values directly
- Use Secrets Manager for credentials
- Export ARNs for IAM policies
- Limit export visibility when possible

### 5. Organization
- Group related exports together
- Use consistent prefixes
- Consider namespace pollution
- Plan for growth

### 6. Performance
- Minimize number of exports
- Use parameter store for many values
- Consider service discovery alternatives
- Cache imported values

## Troubleshooting

### Common Issues

#### 1. Export Not Found
```bash
# List all exports
aws cloudformation list-exports --query "Exports[?starts_with(Name, 'main-infrastructure')]"

# Check specific export
aws cloudformation list-exports --query "Exports[?Name=='main-infrastructure-table-users']"
```

#### 2. Circular Dependencies
- Use parameters instead of exports
- Deploy in correct order
- Consider event-driven architecture
- Use service discovery

#### 3. Export Already in Use
```bash
# Find stacks using an export
aws cloudformation list-imports --export-name "main-infrastructure-table-users"
```

#### 4. Export Limits
- Maximum 1000 exports per region
- Maximum 100 imports per stack
- Plan export strategy accordingly
- Use SSM Parameter Store for overflow

### Debug Commands

```bash
# List all exports from a stack
aws cloudformation describe-stacks --stack-name listbackup-main-infrastructure \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue,ExportName]' \
  --output table

# Validate export exists
aws cloudformation describe-stacks --stack-name listbackup-main-infrastructure \
  --query 'Stacks[0].Outputs[?OutputKey==`UsersTableName`]'

# Check stack dependencies
aws cloudformation describe-stack-resources --stack-name consumer-stack \
  --query 'StackResources[?contains(PhysicalResourceId, `ImportValue`)].LogicalResourceId'
```

## Migration Guide

### Adding New Exports
1. Add output to source stack template
2. Deploy source stack to all environments
3. Update documentation
4. Update dependent services
5. Deploy dependent services

### Deprecating Exports
1. Mark as deprecated in documentation
2. Add deprecation date
3. Notify all consumers
4. Wait deprecation period (minimum 30 days)
5. Remove from template
6. Deploy changes

### Renaming Exports
1. Create new export with new name
2. Keep old export active
3. Update all consumers gradually
4. Mark old export as deprecated
5. Remove old export after migration

### Breaking Changes
1. Never modify export values
2. Create new exports for changes
3. Version exports if needed (v1, v2)
4. Maintain backward compatibility
5. Document migration path

## Export Validation Checklist

Before deploying infrastructure changes:

- [ ] All new resources have exports
- [ ] Export names follow naming convention
- [ ] Documentation is updated
- [ ] No sensitive values exported
- [ ] Dependencies are documented
- [ ] Examples are provided
- [ ] Breaking changes are versioned
- [ ] Deprecation notices added
- [ ] Consumer services identified
- [ ] Migration plan documented