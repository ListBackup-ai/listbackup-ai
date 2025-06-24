# IAM Permissions Matrix - ListBackup.ai v2

## Overview
This document provides a comprehensive matrix of IAM roles, policies, and permissions for all services and components in the ListBackup.ai v2 system.

## IAM Roles Inventory

### 1. Lambda Execution Roles

#### CoreAuthorizerRole
**Role Name**: `${AWS::StackName}-CoreAuthorizerRole`
**Trust Policy**: Lambda Service
**Purpose**: JWT token validation and authorization

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${AWS::StackName}-core-authorizer:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${AWS::StackName}/jwt-secret-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "arn:aws:kms:${AWS::Region}:${AWS::AccountId}:key/*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "secretsmanager.${AWS::Region}.amazonaws.com"
        }
      }
    }
  ]
}
```

#### UserServiceRole
**Role Name**: `${AWS::StackName}-UserServiceRole`
**Trust Policy**: Lambda Service
**Purpose**: User management operations

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:BatchGetItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-users",
        "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-users/index/*",
        "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-users-accounts",
        "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-users-accounts/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminDeleteUser",
        "cognito-idp:AdminUpdateUserAttributes",
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminSetUserPassword",
        "cognito-idp:AdminInitiateAuth"
      ],
      "Resource": "arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${UserPoolId}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": [
        "arn:aws:sqs:${AWS::Region}:${AWS::AccountId}:${AWS::StackName}-activity-queue.fifo",
        "arn:aws:sqs:${AWS::Region}:${AWS::AccountId}:${AWS::StackName}-notification-queue"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:CreateSecret",
        "secretsmanager:UpdateSecret"
      ],
      "Resource": "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${AWS::StackName}/users/*"
    }
  ]
}
```

#### SourceServiceRole
**Role Name**: `${AWS::StackName}-SourceServiceRole`
**Trust Policy**: Lambda Service
**Purpose**: Source management and data sync operations

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-sources",
        "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-sources/index/*",
        "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-connections",
        "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-oauth-tokens"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::listbackup-data-${AWS::AccountId}-${AWS::Region}/accounts/*/sources/*",
        "arn:aws:s3:::listbackup-data-${AWS::AccountId}-${AWS::Region}"
      ],
      "Condition": {
        "StringLike": {
          "s3:prefix": "accounts/*/sources/*"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": [
        "arn:aws:sqs:${AWS::Region}:${AWS::AccountId}:${AWS::StackName}-source-sync-queue",
        "arn:aws:sqs:${AWS::Region}:${AWS::AccountId}:${AWS::StackName}-data-processing-queue.fifo"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${AWS::StackName}/sources/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:Encrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "arn:aws:kms:${AWS::Region}:${AWS::AccountId}:key/*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": [
            "dynamodb.${AWS::Region}.amazonaws.com",
            "s3.${AWS::Region}.amazonaws.com",
            "secretsmanager.${AWS::Region}.amazonaws.com"
          ]
        }
      }
    }
  ]
}
```

#### DataProcessorRole
**Role Name**: `${AWS::StackName}-DataProcessorRole`
**Trust Policy**: Lambda Service
**Purpose**: Process and transform synchronized data

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::listbackup-data-${AWS::AccountId}-${AWS::Region}/accounts/*/sources/*/raw/*",
        "arn:aws:s3:::listbackup-data-${AWS::AccountId}-${AWS::Region}/accounts/*/sources/*/processed/*",
        "arn:aws:s3:::listbackup-temp-${AWS::AccountId}-${AWS::Region}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:${AWS::Region}:${AWS::AccountId}:${AWS::StackName}-data-processing-queue.fifo"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": [
        "arn:aws:sqs:${AWS::Region}:${AWS::AccountId}:${AWS::StackName}-export-queue",
        "arn:aws:sqs:${AWS::Region}:${AWS::AccountId}:${AWS::StackName}-notification-queue"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:UpdateItem",
        "dynamodb:GetItem"
      ],
      "Resource": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-jobs"
    },
    {
      "Effect": "Allow",
      "Action": [
        "athena:StartQueryExecution",
        "athena:GetQueryResults",
        "athena:GetQueryExecution"
      ],
      "Resource": "arn:aws:athena:${AWS::Region}:${AWS::AccountId}:workgroup/primary"
    },
    {
      "Effect": "Allow",
      "Action": [
        "glue:CreateTable",
        "glue:UpdateTable",
        "glue:GetTable",
        "glue:GetDatabase"
      ],
      "Resource": [
        "arn:aws:glue:${AWS::Region}:${AWS::AccountId}:catalog",
        "arn:aws:glue:${AWS::Region}:${AWS::AccountId}:database/listbackup",
        "arn:aws:glue:${AWS::Region}:${AWS::AccountId}:table/listbackup/*"
      ]
    }
  ]
}
```

#### NotificationServiceRole
**Role Name**: `${AWS::StackName}-NotificationServiceRole`
**Trust Policy**: Lambda Service
**Purpose**: Send notifications via various channels

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendTemplatedEmail"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ses:FromAddress": [
            "noreply@listbackup.ai",
            "support@listbackup.ai"
          ]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:${AWS::Region}:${AWS::AccountId}:${AWS::StackName}-sms-topic"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-notifications",
        "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-notifications/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:${AWS::Region}:${AWS::AccountId}:${AWS::StackName}-notification-queue"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${AWS::StackName}/twilio-*"
    }
  ]
}
```

### 2. Service Roles

#### APIGatewayCloudWatchRole
**Role Name**: `${AWS::StackName}-APIGatewayCloudWatchRole`
**Trust Policy**: API Gateway Service
**Purpose**: Enable API Gateway logging

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:PutLogEvents",
        "logs:GetLogEvents",
        "logs:FilterLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

#### StepFunctionsRole
**Role Name**: `${AWS::StackName}-StepFunctionsRole`
**Trust Policy**: Step Functions Service
**Purpose**: Orchestrate complex workflows

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:${AWS::StackName}-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "states:StartExecution"
      ],
      "Resource": "arn:aws:states:${AWS::Region}:${AWS::AccountId}:stateMachine:${AWS::StackName}-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

#### EventBridgeRole
**Role Name**: `${AWS::StackName}-EventBridgeRole`
**Trust Policy**: EventBridge Service
**Purpose**: Trigger scheduled jobs and event-driven workflows

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:${AWS::StackName}-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": "arn:aws:sqs:${AWS::Region}:${AWS::AccountId}:${AWS::StackName}-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "states:StartExecution"
      ],
      "Resource": "arn:aws:states:${AWS::Region}:${AWS::AccountId}:stateMachine:${AWS::StackName}-*"
    }
  ]
}
```

### 3. Cross-Service Roles

#### S3ReplicationRole
**Role Name**: `${AWS::StackName}-S3ReplicationRole`
**Trust Policy**: S3 Service
**Purpose**: Cross-region replication for disaster recovery

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetReplicationConfiguration",
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::listbackup-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObjectVersionForReplication",
        "s3:GetObjectVersionAcl"
      ],
      "Resource": "arn:aws:s3:::listbackup-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ReplicateObject",
        "s3:ReplicateDelete",
        "s3:ReplicateTags"
      ],
      "Resource": "arn:aws:s3:::listbackup-dr-*/*"
    }
  ]
}
```

### 4. Application User Roles

#### ReadOnlyUserRole
**Role Name**: `${AWS::StackName}-ReadOnlyUserRole`
**Purpose**: Read-only access for auditors and viewers

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:BatchGetItem"
      ],
      "Resource": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-*",
      "Condition": {
        "StringEquals": {
          "dynamodb:LeadingKeys": "${aws:PrincipalTag/accountId}"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::listbackup-data-*/accounts/${aws:PrincipalTag/accountId}/*",
        "arn:aws:s3:::listbackup-data-*"
      ],
      "Condition": {
        "StringLike": {
          "s3:prefix": "accounts/${aws:PrincipalTag/accountId}/*"
        }
      }
    }
  ]
}
```

## Permission Boundaries

### LambdaPermissionBoundary
**Purpose**: Limit maximum permissions for Lambda functions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Action": [
        "iam:CreateAccessKey",
        "iam:DeleteAccessKey",
        "iam:UpdateAccessKey",
        "iam:CreateUser",
        "iam:DeleteUser",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachUserPolicy",
        "iam:DetachUserPolicy",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutUserPolicy",
        "iam:PutRolePolicy"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Action": [
        "ec2:TerminateInstances",
        "rds:DeleteDBInstance",
        "dynamodb:DeleteTable",
        "s3:DeleteBucket"
      ],
      "Resource": "*"
    }
  ]
}
```

## Service-to-Service Permissions Matrix

| Service | Can Access | Permissions | Conditions |
|---------|------------|-------------|------------|
| User Service | DynamoDB (users, users-accounts) | Read/Write | accountId match |
| User Service | Cognito User Pool | Admin operations | - |
| User Service | SQS (activity, notification) | Send | - |
| Source Service | DynamoDB (sources, connections) | Full CRUD | accountId match |
| Source Service | S3 (data bucket) | Read/Write | accountId prefix |
| Source Service | SQS (sync, processing) | Send/Receive | - |
| Source Service | Secrets Manager | Read | source prefix |
| Data Processor | S3 (data, temp) | Read/Write | - |
| Data Processor | SQS (processing) | Receive/Delete | - |
| Data Processor | DynamoDB (jobs) | Update | - |
| Notification Service | SES | Send Email | From address |
| Notification Service | SNS | Publish | SMS topic |
| Notification Service | DynamoDB (notifications) | Write | - |
| Authorizer | Secrets Manager | Read | JWT secret |

## Least Privilege Analysis

### Over-Privileged Risks
1. **S3 Bucket Policies**: Ensure prefix conditions are enforced
2. **DynamoDB Access**: Implement leading key conditions
3. **Secrets Manager**: Limit to specific secret paths
4. **KMS Keys**: Use ViaService conditions

### Under-Privileged Risks
1. **Cross-Region Access**: May need for DR scenarios
2. **EventBridge Rules**: Dynamic rule creation
3. **CloudWatch Logs**: Cross-account aggregation

## Compliance Requirements

### SOC 2 Type II
- Principle of least privilege enforced
- Regular access reviews required
- MFA enforcement for sensitive operations
- Audit logging for all access

### GDPR
- Data isolation by accountId
- Encryption at rest and in transit
- Right to erasure implementation
- Cross-border transfer controls

### HIPAA (Future)
- PHI data segregation
- Encryption key management
- Access logging and monitoring
- Incident response procedures

## Security Best Practices

### 1. Role Assumption
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "${ExternalId}"
        }
      }
    }
  ]
}
```

### 2. Session Tags
- Include accountId in session tags
- Use tags for dynamic policy evaluation
- Enforce tag-based access control

### 3. Temporary Credentials
- Use STS for cross-account access
- Implement credential rotation
- Set maximum session duration

## Monitoring and Alerting

### CloudTrail Events
Monitor these high-risk actions:
- AssumeRole calls
- Secret access
- Data deletion
- Policy changes
- Failed authentication

### Access Analyzer Findings
Regular scans for:
- Public access
- Cross-account access
- Unused permissions
- Policy violations

## Regular Review Checklist

### Monthly
- [ ] Review unused IAM roles
- [ ] Check for overly permissive policies
- [ ] Validate permission boundaries
- [ ] Audit cross-account access

### Quarterly
- [ ] Full permission audit
- [ ] Update least privilege policies
- [ ] Review compliance requirements
- [ ] Update documentation

### Annually
- [ ] Complete security assessment
- [ ] Third-party penetration testing
- [ ] Compliance certification renewal
- [ ] Disaster recovery testing