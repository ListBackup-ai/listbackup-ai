# SQS Queue Configuration Matrix - ListBackup.ai v2

## Overview
This document provides a comprehensive matrix of all SQS queues, their configurations, relationships, and message flows in the ListBackup.ai v2 system.

## Queue Inventory

### 1. Source Sync Queue
**Queue Name**: `${AWS::StackName}-source-sync-queue`
**Type**: Standard Queue
**Purpose**: Handles source data synchronization jobs

#### Configuration
```yaml
VisibilityTimeout: 900        # 15 minutes
MessageRetentionPeriod: 345600  # 4 days
ReceiveMessageWaitTimeSeconds: 20  # Long polling
MaximumMessageSize: 262144     # 256 KB
DelaySeconds: 0
```

#### Dead Letter Queue
- **DLQ Name**: `${AWS::StackName}-source-sync-dlq`
- **Max Receive Count**: 3
- **Retention**: 14 days

#### Message Schema
```json
{
  "messageId": "string",
  "sourceId": "string",
  "accountId": "string",
  "syncType": "full | incremental | webhook",
  "dataTypes": ["contacts", "orders", "products"],
  "config": {
    "startDate": "string",
    "endDate": "string",
    "filters": "object",
    "priority": "low | medium | high"
  },
  "metadata": {
    "triggeredBy": "scheduled | manual | webhook",
    "userId": "string",
    "retryCount": "number"
  }
}
```

#### Producers
- Source create/update handlers
- Scheduler Lambda (cron jobs)
- Webhook handlers
- Manual sync API endpoints

#### Consumers
- Source sync processor Lambda
- Concurrency: 10

---

### 2. Data Processing Queue
**Queue Name**: `${AWS::StackName}-data-processing-queue`
**Type**: FIFO Queue
**Purpose**: Processes and transforms synchronized data

#### Configuration
```yaml
VisibilityTimeout: 300         # 5 minutes
MessageRetentionPeriod: 86400  # 1 day
ReceiveMessageWaitTimeSeconds: 20
MaximumMessageSize: 262144
ContentBasedDeduplication: true
MessageGroupId: "accountId"    # Ensures account-level ordering
```

#### Dead Letter Queue
- **DLQ Name**: `${AWS::StackName}-data-processing-dlq.fifo`
- **Max Receive Count**: 5
- **Retention**: 7 days

#### Message Schema
```json
{
  "messageId": "string",
  "jobId": "string",
  "sourceId": "string",
  "accountId": "string",
  "processingType": "transform | validate | enrich | deduplicate",
  "s3Location": {
    "bucket": "string",
    "key": "string"
  },
  "dataType": "contacts | orders | products",
  "recordCount": "number",
  "config": {
    "transformations": ["array"],
    "validationRules": "object",
    "enrichmentSources": ["array"]
  }
}
```

#### Producers
- Source sync processor Lambda
- Data import handlers

#### Consumers
- Data processor Lambda
- Concurrency: 5 (per message group)

---

### 3. Export Queue
**Queue Name**: `${AWS::StackName}-export-queue`
**Type**: Standard Queue
**Purpose**: Handles data export jobs to external storage

#### Configuration
```yaml
VisibilityTimeout: 1800        # 30 minutes
MessageRetentionPeriod: 172800 # 2 days
ReceiveMessageWaitTimeSeconds: 20
MaximumMessageSize: 262144
DelaySeconds: 0
```

#### Dead Letter Queue
- **DLQ Name**: `${AWS::StackName}-export-dlq`
- **Max Receive Count**: 2
- **Retention**: 7 days

#### Message Schema
```json
{
  "messageId": "string",
  "exportId": "string",
  "accountId": "string",
  "exportType": "scheduled | manual | migration",
  "destination": {
    "type": "s3 | google-drive | dropbox | sftp",
    "config": "object"
  },
  "sourceData": {
    "sourceIds": ["array"],
    "dataTypes": ["array"],
    "dateRange": "object"
  },
  "format": "json | csv | parquet",
  "compression": "none | gzip | zip",
  "encryption": {
    "enabled": "boolean",
    "keyId": "string"
  }
}
```

#### Producers
- Export API handlers
- Scheduled export Lambda
- Migration tools

#### Consumers
- Export processor Lambda
- Concurrency: 5

---

### 4. Notification Queue
**Queue Name**: `${AWS::StackName}-notification-queue`
**Type**: Standard Queue
**Purpose**: Handles all system notifications

#### Configuration
```yaml
VisibilityTimeout: 60          # 1 minute
MessageRetentionPeriod: 86400  # 1 day
ReceiveMessageWaitTimeSeconds: 10
MaximumMessageSize: 65536      # 64 KB
DelaySeconds: 0
```

#### Dead Letter Queue
- **DLQ Name**: `${AWS::StackName}-notification-dlq`
- **Max Receive Count**: 3
- **Retention**: 3 days

#### Message Schema
```json
{
  "messageId": "string",
  "notificationId": "string",
  "userId": "string",
  "accountId": "string",
  "type": "email | sms | push | in-app",
  "template": "string",
  "priority": "low | medium | high | critical",
  "data": {
    "subject": "string",
    "variables": "object",
    "attachments": ["array"]
  },
  "scheduling": {
    "sendAt": "string",
    "timezone": "string"
  }
}
```

#### Producers
- All service handlers (on events)
- Monitoring systems
- Scheduled notification Lambda

#### Consumers
- Notification processor Lambda
- Concurrency: 20

---

### 5. Activity Queue
**Queue Name**: `${AWS::StackName}-activity-queue`
**Type**: FIFO Queue
**Purpose**: Records all system activities for audit trail

#### Configuration
```yaml
VisibilityTimeout: 30
MessageRetentionPeriod: 86400
ReceiveMessageWaitTimeSeconds: 5
MaximumMessageSize: 65536
ContentBasedDeduplication: true
MessageGroupId: "accountId"
```

#### Message Schema
```json
{
  "messageId": "string",
  "eventId": "string",
  "accountId": "string",
  "userId": "string",
  "eventType": "string",
  "resourceType": "string",
  "resourceId": "string",
  "action": "string",
  "details": "object",
  "timestamp": "string"
}
```

#### Producers
- All service handlers
- API Gateway (via Lambda)

#### Consumers
- Activity logger Lambda
- Concurrency: 10

---

### 6. Webhook Queue
**Queue Name**: `${AWS::StackName}-webhook-queue`
**Type**: Standard Queue
**Purpose**: Processes incoming webhooks from platforms

#### Configuration
```yaml
VisibilityTimeout: 120         # 2 minutes
MessageRetentionPeriod: 86400  # 1 day
ReceiveMessageWaitTimeSeconds: 0  # No long polling (real-time)
MaximumMessageSize: 262144
DelaySeconds: 0
```

#### Dead Letter Queue
- **DLQ Name**: `${AWS::StackName}-webhook-dlq`
- **Max Receive Count**: 5
- **Retention**: 7 days

#### Message Schema
```json
{
  "messageId": "string",
  "webhookId": "string",
  "sourceId": "string",
  "platform": "string",
  "eventType": "string",
  "signature": "string",
  "headers": "object",
  "body": "object",
  "receivedAt": "string"
}
```

#### Producers
- Webhook endpoint Lambda

#### Consumers
- Webhook processor Lambda
- Concurrency: 50

---

### 7. Billing Queue
**Queue Name**: `${AWS::StackName}-billing-queue`
**Type**: FIFO Queue
**Purpose**: Handles billing events and subscription updates

#### Configuration
```yaml
VisibilityTimeout: 300
MessageRetentionPeriod: 604800  # 7 days
ReceiveMessageWaitTimeSeconds: 20
MaximumMessageSize: 65536
ContentBasedDeduplication: true
MessageGroupId: "accountId"
```

#### Message Schema
```json
{
  "messageId": "string",
  "accountId": "string",
  "eventType": "subscription.created | subscription.updated | payment.succeeded | payment.failed",
  "stripeEventId": "string",
  "data": {
    "customerId": "string",
    "subscriptionId": "string",
    "amount": "number",
    "currency": "string"
  },
  "metadata": "object"
}
```

#### Producers
- Stripe webhook handler
- Admin API endpoints

#### Consumers
- Billing processor Lambda
- Concurrency: 3

---

## Queue Relationships and Message Flow

### 1. Source Sync Flow
```
Source Sync Queue → Source Sync Processor
                 ↓
         Data Processing Queue → Data Processor
                 ↓                      ↓
         Activity Queue          Export Queue
                 ↓                      ↓
         Notification Queue      External Storage
```

### 2. Webhook Flow
```
API Gateway → Webhook Queue → Webhook Processor
                           ↓
                   Source Sync Queue
                           ↓
                   Data Processing Queue
```

### 3. Export Flow
```
Export API → Export Queue → Export Processor
                        ↓
                External Storage
                        ↓
                Notification Queue
```

### 4. Billing Flow
```
Stripe Webhook → Billing Queue → Billing Processor
                             ↓
                     Update DynamoDB
                             ↓
                     Notification Queue
```

## Queue Metrics and Monitoring

### CloudWatch Metrics
All queues have the following metrics enabled:
- ApproximateNumberOfMessages
- ApproximateNumberOfMessagesDelayed
- ApproximateNumberOfMessagesNotVisible
- NumberOfMessagesReceived
- NumberOfMessagesSent
- NumberOfMessagesDeleted

### Alarms Configuration

#### Critical Alarms
1. **Queue Depth**
   - Threshold: > 1000 messages for 5 minutes
   - Queues: All production queues

2. **Message Age**
   - Threshold: > 1 hour
   - Queues: Source Sync, Data Processing

3. **DLQ Messages**
   - Threshold: > 0
   - Queues: All DLQs

#### Warning Alarms
1. **Processing Time**
   - Threshold: > 80% of visibility timeout
   - Queues: All queues

2. **Consumer Errors**
   - Threshold: > 10 errors in 5 minutes
   - Queues: All queues

## Security Configuration

### Encryption
- All queues use SSE-SQS (AWS managed keys)
- Sensitive queues (Billing, OAuth) use customer-managed KMS keys

### Access Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage"
      ],
      "Resource": "arn:aws:sqs:region:account:queue-name",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "arn:aws:lambda:region:account:function:*"
        }
      }
    }
  ]
}
```

## Best Practices

### 1. Message Design
- Keep messages small (< 64KB)
- Store large data in S3, reference in message
- Include idempotency keys
- Version message schemas

### 2. Error Handling
- Implement exponential backoff
- Use DLQs for all queues
- Monitor DLQ depth
- Implement circuit breakers

### 3. Performance
- Use batch operations (10 messages max)
- Enable long polling (20 seconds)
- Set appropriate visibility timeouts
- Use FIFO queues only when ordering required

### 4. Cost Optimization
- Delete processed messages immediately
- Use appropriate retention periods
- Monitor and adjust concurrency
- Implement message deduplication

## Disaster Recovery

### Backup Strategy
- DLQs retain failed messages
- CloudWatch Logs capture all processing
- S3 stores message payloads
- DynamoDB tracks message processing state

### Recovery Procedures
1. **Queue Failure**
   - Switch to backup region queue
   - Replay from DLQ
   - Restore from S3 archives

2. **Consumer Failure**
   - Messages return to queue after visibility timeout
   - Scale up healthy consumers
   - Fix and redeploy failed consumers

3. **Data Loss Prevention**
   - All messages logged before processing
   - Critical data persisted to DynamoDB
   - S3 versioning enabled for payloads