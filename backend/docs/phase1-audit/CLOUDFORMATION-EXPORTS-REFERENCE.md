# CloudFormation Exports Reference

## Overview
This document provides a comprehensive reference of all CloudFormation exports from the Core service stack. These exports are used by other services to reference Core resources without hard-coding values.

## Export Naming Convention
All Core service exports follow this pattern:
`${Stage}-core-${ResourceType}-${ResourceName}`

Example: `main-core-table-accounts`

## Complete Export Reference

### DynamoDB Table Exports

| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|---------|
| `${Stage}-core-table-accounts` | DynamoDB Table | Accounts table name | `listbackup-main-core-accounts` | Auth, Users, Billing |
| `${Stage}-core-table-users` | DynamoDB Table | Users table name | `listbackup-main-core-users` | Auth, Users |
| `${Stage}-core-table-users-accounts` | DynamoDB Table | User-Account mapping table | `listbackup-main-core-users-accounts` | Auth, Users |
| `${Stage}-core-table-sources` | DynamoDB Table | Sources table name | `listbackup-main-core-sources` | Sources, Integrations |
| `${Stage}-core-table-sync-schedules` | DynamoDB Table | Sync schedules table | `listbackup-main-core-sync-schedules` | Jobs |
| `${Stage}-core-table-sync-history` | DynamoDB Table | Sync history table | `listbackup-main-core-sync-history` | Jobs, Sources |
| `${Stage}-core-table-activities` | DynamoDB Table | Activity log table | `listbackup-main-core-activities` | All services |
| `${Stage}-core-table-api-keys` | DynamoDB Table | API keys table | `listbackup-main-core-api-keys` | Auth |
| `${Stage}-core-table-webhooks` | DynamoDB Table | Webhooks table | `listbackup-main-core-webhooks` | Integrations |
| `${Stage}-core-table-notifications` | DynamoDB Table | Notifications table | `listbackup-main-core-notifications` | Notifications |
| `${Stage}-core-table-usage-metrics` | DynamoDB Table | Usage metrics table | `listbackup-main-core-usage-metrics` | Billing |
| `${Stage}-core-table-billing-plans` | DynamoDB Table | Billing plans table | `listbackup-main-core-billing-plans` | Billing |
| `${Stage}-core-table-oauth-states` | DynamoDB Table | OAuth states table | `listbackup-main-core-oauth-states` | Auth, Integrations |

### DynamoDB Table ARN Exports

| Export Name | Resource Type | Description | Example Value |
|-------------|---------------|-------------|---------------|
| `${Stage}-core-table-accounts-arn` | DynamoDB ARN | Accounts table ARN | `arn:aws:dynamodb:region:account:table/listbackup-main-core-accounts` |
| `${Stage}-core-table-users-arn` | DynamoDB ARN | Users table ARN | `arn:aws:dynamodb:region:account:table/listbackup-main-core-users` |
| `${Stage}-core-table-sources-arn` | DynamoDB ARN | Sources table ARN | `arn:aws:dynamodb:region:account:table/listbackup-main-core-sources` |
| `${Stage}-core-table-activities-arn` | DynamoDB ARN | Activities table ARN | `arn:aws:dynamodb:region:account:table/listbackup-main-core-activities` |

### DynamoDB Global Secondary Index Exports

| Export Name | Resource Type | Description | Example Value |
|-------------|---------------|-------------|---------------|
| `${Stage}-core-gsi-users-email` | GSI Name | Users email index | `email-index` |
| `${Stage}-core-gsi-sources-account-platform` | GSI Name | Sources by account and platform | `accountId-platformId-index` |
| `${Stage}-core-gsi-activities-user-timestamp` | GSI Name | Activities by user and time | `userId-timestamp-index` |

### SQS Queue Exports

| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|
| `${Stage}-core-queue-sync-jobs-url` | Queue URL | Sync jobs FIFO queue | `https://sqs.region.amazonaws.com/account/listbackup-main-sync-jobs.fifo` | Jobs |
| `${Stage}-core-queue-sync-jobs-arn` | Queue ARN | Sync jobs queue ARN | `arn:aws:sqs:region:account:listbackup-main-sync-jobs.fifo` | Jobs |
| `${Stage}-core-queue-sync-jobs-name` | Queue Name | Sync jobs queue name | `listbackup-main-sync-jobs.fifo` | Jobs |
| `${Stage}-core-queue-activities-url` | Queue URL | Activity events queue | `https://sqs.region.amazonaws.com/account/listbackup-main-activity-events` | All services |
| `${Stage}-core-queue-activities-arn` | Queue ARN | Activity queue ARN | `arn:aws:sqs:region:account:listbackup-main-activity-events` | All services |
| `${Stage}-core-queue-webhooks-url` | Queue URL | Webhook delivery queue | `https://sqs.region.amazonaws.com/account/listbackup-main-webhook-delivery` | Integrations |
| `${Stage}-core-queue-notifications-url` | Queue URL | Notifications queue | `https://sqs.region.amazonaws.com/account/listbackup-main-notification-queue` | Notifications |
| `${Stage}-core-queue-data-processing-url` | Queue URL | Data processing queue | `https://sqs.region.amazonaws.com/account/listbackup-main-data-processing` | Jobs |

### Dead Letter Queue Exports

| Export Name | Resource Type | Description | Example Value |
|-------------|---------------|-------------|---------------|
| `${Stage}-core-dlq-sync-jobs-arn` | DLQ ARN | Sync jobs DLQ | `arn:aws:sqs:region:account:listbackup-main-sync-jobs-dlq` |
| `${Stage}-core-dlq-activities-arn` | DLQ ARN | Activities DLQ | `arn:aws:sqs:region:account:listbackup-main-activity-events-dlq` |
| `${Stage}-core-dlq-webhooks-arn` | DLQ ARN | Webhooks DLQ | `arn:aws:sqs:region:account:listbackup-main-webhook-delivery-dlq` |

### S3 Bucket Exports

| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|
| `${Stage}-core-bucket-system` | Bucket Name | System resources bucket | `listbackup-system-region` | All services |
| `${Stage}-core-bucket-system-arn` | Bucket ARN | System bucket ARN | `arn:aws:s3:::listbackup-system-region` | All services |
| `${Stage}-core-bucket-logs` | Bucket Name | Centralized logs bucket | `listbackup-logs-region` | All services |
| `${Stage}-core-bucket-logs-arn` | Bucket ARN | Logs bucket ARN | `arn:aws:s3:::listbackup-logs-region` | All services |
| `${Stage}-core-bucket-backups` | Bucket Name | Backup bucket | `listbackup-backups-region` | Operations |
| `${Stage}-core-bucket-analytics` | Bucket Name | Analytics bucket | `listbackup-analytics-region` | Analytics |

### IAM Role Exports

| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|
| `${Stage}-core-role-lambda-arn` | Role ARN | Core Lambda execution role | `arn:aws:iam::account:role/listbackup-main-core-lambda` | Core functions |
| `${Stage}-core-role-lambda-name` | Role Name | Core Lambda role name | `listbackup-main-core-lambda` | Core functions |
| `${Stage}-core-role-sync-processor-arn` | Role ARN | Sync processor role | `arn:aws:iam::account:role/listbackup-main-sync-processor` | Jobs |
| `${Stage}-core-role-data-access-arn` | Role ARN | Data access role | `arn:aws:iam::account:role/listbackup-main-data-access` | All services |
| `${Stage}-core-role-monitoring-arn` | Role ARN | Monitoring role | `arn:aws:iam::account:role/listbackup-main-monitoring` | Operations |

### KMS Key Exports

| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|
| `${Stage}-core-kms-key-id` | KMS Key ID | Core encryption key | `12345678-1234-1234-1234-123456789012` | All services |
| `${Stage}-core-kms-key-arn` | KMS Key ARN | Core key ARN | `arn:aws:kms:region:account:key/12345678-1234-1234-1234-123456789012` | All services |
| `${Stage}-core-kms-alias` | KMS Alias | Core key alias | `alias/listbackup-main-core` | All services |

### VPC and Networking Exports

| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|
| `${Stage}-core-vpc-id` | VPC ID | Core VPC identifier | `vpc-12345678` | All services |
| `${Stage}-core-subnet-private-1` | Subnet ID | Private subnet AZ-1 | `subnet-12345678` | Lambda functions |
| `${Stage}-core-subnet-private-2` | Subnet ID | Private subnet AZ-2 | `subnet-87654321` | Lambda functions |
| `${Stage}-core-security-group-lambda` | Security Group | Lambda security group | `sg-12345678` | Lambda functions |
| `${Stage}-core-vpc-endpoint-s3` | VPC Endpoint | S3 VPC endpoint | `vpce-12345678` | All services |
| `${Stage}-core-vpc-endpoint-dynamodb` | VPC Endpoint | DynamoDB VPC endpoint | `vpce-87654321` | All services |

### Lambda Function Exports

| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|
| `${Stage}-core-lambda-authorizer-arn` | Function ARN | Custom authorizer | `arn:aws:lambda:region:account:function:listbackup-main-core-authorizer` | API Gateway |
| `${Stage}-core-lambda-authorizer-name` | Function Name | Authorizer name | `listbackup-main-core-authorizer` | API Gateway |

### API Gateway Exports

| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|
| `${Stage}-core-api-url` | API URL | Core API endpoint | `https://api-id.execute-api.region.amazonaws.com/main` | Frontend |
| `${Stage}-core-api-id` | API ID | Core API Gateway ID | `abcdef1234` | Other services |
| `${Stage}-core-api-root-resource` | Resource ID | API root resource | `xyz789` | Other services |

### CloudWatch Exports

| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|
| `${Stage}-core-log-group-api` | Log Group | API Gateway logs | `/aws/apigateway/listbackup-main-core` | Monitoring |
| `${Stage}-core-log-group-lambda` | Log Group | Lambda logs prefix | `/aws/lambda/listbackup-main-core-` | Monitoring |
| `${Stage}-core-alarm-topic-arn` | SNS Topic | Alarm notifications | `arn:aws:sns:region:account:listbackup-main-alarms` | All services |

### EventBridge Exports

| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|
| `${Stage}-core-eventbus-name` | Event Bus | Core event bus | `listbackup-main-core-events` | All services |
| `${Stage}-core-eventbus-arn` | Event Bus ARN | Event bus ARN | `arn:aws:events:region:account:event-bus/listbackup-main-core-events` | All services |

### Secrets Manager Exports

| Export Name | Resource Type | Description | Example Value | Used By |
|-------------|---------------|-------------|---------------|
| `${Stage}-core-secret-jwt-arn` | Secret ARN | JWT signing secret | `arn:aws:secretsmanager:region:account:secret:listbackup/main/jwt-abc123` | Auth |
| `${Stage}-core-secret-api-keys-prefix` | Secret Prefix | API keys prefix | `listbackup/main/api-keys/` | Auth |

## Usage Examples

### Importing in CloudFormation Templates

```yaml
Resources:
  MyFunction:
    Type: AWS::Lambda::Function
    Properties:
      Environment:
        Variables:
          ACCOUNTS_TABLE:
            Fn::ImportValue: !Sub "${Stage}-core-table-accounts"
          ACTIVITIES_QUEUE_URL:
            Fn::ImportValue: !Sub "${Stage}-core-queue-activities-url"
```

### Importing in Serverless Framework

```yaml
custom:
  accountsTable: ${cf:listbackup-${self:provider.stage}-core.AccountsTableName}
  activitiesQueueUrl: ${cf:listbackup-${self:provider.stage}-core.ActivitiesQueueUrl}

functions:
  myFunction:
    environment:
      ACCOUNTS_TABLE: ${self:custom.accountsTable}
      ACTIVITIES_QUEUE_URL: ${self:custom.activitiesQueueUrl}
```

### Importing in CDK

```typescript
const accountsTableName = cdk.Fn.importValue(`${stage}-core-table-accounts`);
const activitiesQueueUrl = cdk.Fn.importValue(`${stage}-core-queue-activities-url`);

new lambda.Function(this, 'MyFunction', {
  environment: {
    ACCOUNTS_TABLE: accountsTableName,
    ACTIVITIES_QUEUE_URL: activitiesQueueUrl,
  },
});
```

### Importing in Terraform

```hcl
data "aws_cloudformation_export" "accounts_table" {
  name = "${var.stage}-core-table-accounts"
}

data "aws_cloudformation_export" "activities_queue_url" {
  name = "${var.stage}-core-queue-activities-url"
}

resource "aws_lambda_function" "my_function" {
  environment {
    variables = {
      ACCOUNTS_TABLE = data.aws_cloudformation_export.accounts_table.value
      ACTIVITIES_QUEUE_URL = data.aws_cloudformation_export.activities_queue_url.value
    }
  }
}
```

## Export Dependencies

### Services That Depend on Core Exports

1. **Auth Service**
   - Uses: users, api_keys tables
   - Uses: JWT secret
   - Uses: Core Lambda role

2. **Users Service**
   - Uses: users, users_accounts, accounts tables
   - Uses: Activities queue
   - Uses: Notifications queue

3. **Sources Service**
   - Uses: sources, sync_schedules tables
   - Uses: Sync jobs queue
   - Uses: Data buckets

4. **Integrations Service**
   - Uses: sources, webhooks tables
   - Uses: OAuth states table
   - Uses: Webhook delivery queue

5. **Jobs Service**
   - Uses: sync_history, sync_schedules tables
   - Uses: All processing queues
   - Uses: Data processing role

6. **Billing Service**
   - Uses: usage_metrics, billing_plans tables
   - Uses: Accounts table
   - Uses: Analytics bucket

7. **Notifications Service**
   - Uses: notifications table
   - Uses: Notifications queue
   - Uses: Users table

## Best Practices

1. **Naming Consistency**
   - Always include stage in export name
   - Use lowercase with hyphens
   - Include resource type in name

2. **Version Management**
   - Never change export values
   - Create new exports for updates
   - Deprecate old exports gradually

3. **Documentation**
   - Document all new exports here
   - Include usage examples
   - Note dependent services

4. **Security**
   - Don't export sensitive values
   - Use Secrets Manager for secrets
   - Limit export visibility

5. **Monitoring**
   - Track export usage
   - Alert on missing exports
   - Monitor CloudFormation limits

## Troubleshooting

### Common Issues

1. **Export Not Found**
   ```bash
   # List all exports
   aws cloudformation list-exports --query "Exports[?starts_with(Name, 'main-core')]"
   
   # Check specific export
   aws cloudformation list-exports --query "Exports[?Name=='main-core-table-accounts']"
   ```

2. **Circular Dependencies**
   - Use parameters instead of exports
   - Deploy in correct order
   - Consider service mesh pattern

3. **Export Limits**
   - Maximum 1000 exports per region
   - Plan export strategy
   - Use parameter store for overflow

4. **Cross-Region Access**
   - Exports are region-specific
   - Use SSM Parameter Store
   - Consider EventBridge for cross-region

## Migration Guide

### Adding New Exports
1. Add to Core CloudFormation template
2. Update this documentation
3. Deploy to all environments
4. Update dependent services
5. Monitor for issues

### Deprecating Exports
1. Mark as deprecated in docs
2. Add deprecation notice
3. Update dependent services
4. Wait 30 days
5. Remove from template

### Renaming Exports
1. Create new export with new name
2. Keep old export active
3. Update all consumers
4. Deprecate old export
5. Remove after migration