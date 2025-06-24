# CloudFormation Exports Reference - ListBackup.ai v2

## Overview
This document provides a comprehensive reference of all CloudFormation exports across the ListBackup.ai v2 system, their dependencies, and usage patterns.

## Export Naming Convention
All exports follow the pattern: `${AWS::StackName}-{ResourceType}-{ResourceName}`

## Core Service Stack Exports

### Authentication & Authorization
| Export Name | Value | Description | Used By |
|------------|-------|-------------|---------|
| `${AWS::StackName}-UserPoolId` | User Pool ID | Cognito User Pool identifier | Auth, Users services |
| `${AWS::StackName}-UserPoolArn` | User Pool ARN | Cognito User Pool ARN | IAM policies |
| `${AWS::StackName}-UserPoolClientId` | Client ID | Cognito App Client ID | Frontend, Auth handlers |
| `${AWS::StackName}-IdentityPoolId` | Identity Pool ID | Cognito Identity Pool | Frontend SDK |
| `${AWS::StackName}-CoreAuthorizerArn` | Lambda ARN | Core authorizer function | API Gateway |
| `${AWS::StackName}-JwtSecretArn` | Secret ARN | JWT signing secret | Authorizer, Token handlers |

### DynamoDB Tables
| Export Name | Value | Description | Used By |
|------------|-------|-------------|---------|
| `${AWS::StackName}-UsersTableName` | Table Name | Users table | User service |
| `${AWS::StackName}-UsersTableArn` | Table ARN | Users table ARN | IAM policies |
| `${AWS::StackName}-AccountsTableName` | Table Name | Accounts table | Account service |
| `${AWS::StackName}-AccountsTableArn` | Table ARN | Accounts table ARN | IAM policies |
| `${AWS::StackName}-UsersAccountsTableName` | Table Name | User-Account mapping | User, Account services |
| `${AWS::StackName}-SourcesTableName` | Table Name | Sources table | Source service |
| `${AWS::StackName}-SourcesTableArn` | Table ARN | Sources table ARN | IAM policies |
| `${AWS::StackName}-ActivitiesTableName` | Table Name | Activities table | Activity logger |
| `${AWS::StackName}-JobsTableName` | Table Name | Jobs table | Job processor |
| `${AWS::StackName}-ConnectionsTableName` | Table Name | Connections table | OAuth service |
| `${AWS::StackName}-NotificationsTableName` | Table Name | Notifications table | Notification service |
| `${AWS::StackName}-TagsTableName` | Table Name | Tags table | Tag service |
| `${AWS::StackName}-TeamsTableName` | Table Name | Teams table | Team service |
| `${AWS::StackName}-OAuthStatesTableName` | Table Name | OAuth states | OAuth handlers |
| `${AWS::StackName}-OAuthTokensTableName` | Table Name | OAuth tokens | Source service |
| `${AWS::StackName}-RefreshTokensTableName` | Table Name | Refresh tokens | Auth service |

### SQS Queues
| Export Name | Value | Description | Used By |
|------------|-------|-------------|---------|
| `${AWS::StackName}-SourceSyncQueueUrl` | Queue URL | Source sync queue | Source handlers |
| `${AWS::StackName}-SourceSyncQueueArn` | Queue ARN | Source sync queue ARN | IAM policies |
| `${AWS::StackName}-SourceSyncDLQUrl` | DLQ URL | Source sync DLQ | Monitoring |
| `${AWS::StackName}-DataProcessingQueueUrl` | Queue URL | Data processing FIFO | Data processors |
| `${AWS::StackName}-DataProcessingQueueArn` | Queue ARN | Data processing ARN | IAM policies |
| `${AWS::StackName}-ExportQueueUrl` | Queue URL | Export queue | Export handlers |
| `${AWS::StackName}-NotificationQueueUrl` | Queue URL | Notification queue | All services |
| `${AWS::StackName}-ActivityQueueUrl` | Queue URL | Activity FIFO queue | All services |
| `${AWS::StackName}-WebhookQueueUrl` | Queue URL | Webhook queue | Webhook endpoints |
| `${AWS::StackName}-BillingQueueUrl` | Queue URL | Billing FIFO queue | Billing service |

### S3 Buckets
| Export Name | Value | Description | Used By |
|------------|-------|-------------|---------|
| `${AWS::StackName}-DataBucketName` | Bucket Name | Primary data storage | All data services |
| `${AWS::StackName}-DataBucketArn` | Bucket ARN | Data bucket ARN | IAM policies |
| `${AWS::StackName}-AssetsBucketName` | Bucket Name | Static assets | Frontend, APIs |
| `${AWS::StackName}-AssetsBucketUrl` | Bucket URL | Assets URL | CloudFront |
| `${AWS::StackName}-TempBucketName` | Bucket Name | Temporary storage | Processing jobs |
| `${AWS::StackName}-ArchiveBucketName` | Bucket Name | Archive storage | Compliance |
| `${AWS::StackName}-CFTemplatesBucketName` | Bucket Name | CF templates | Deployment |

### API Gateway
| Export Name | Value | Description | Used By |
|------------|-------|-------------|---------|
| `${AWS::StackName}-ApiGatewayId` | API ID | REST API identifier | All services |
| `${AWS::StackName}-ApiGatewayRootResource` | Resource ID | Root resource | Route creation |
| `${AWS::StackName}-ApiGatewayUrl` | API URL | Base API endpoint | Frontend |
| `${AWS::StackName}-ApiGatewayArn` | API ARN | API Gateway ARN | IAM policies |
| `${AWS::StackName}-ApiGatewayExecutionArn` | Execution ARN | Execution ARN | Lambda permissions |
| `${AWS::StackName}-WebSocketApiId` | API ID | WebSocket API | Real-time features |
| `${AWS::StackName}-WebSocketApiUrl` | WSS URL | WebSocket endpoint | Frontend |

### Lambda Functions
| Export Name | Value | Description | Used By |
|------------|-------|-------------|---------|
| `${AWS::StackName}-CoreAuthorizerName` | Function Name | Authorizer function | API Gateway |
| `${AWS::StackName}-UserLoginFunctionArn` | Function ARN | Login handler | API routes |
| `${AWS::StackName}-UserRegisterFunctionArn` | Function ARN | Registration handler | API routes |
| `${AWS::StackName}-SourceCreateFunctionArn` | Function ARN | Source creation | API routes |
| `${AWS::StackName}-SourceSyncFunctionArn` | Function ARN | Sync processor | SQS trigger |
| `${AWS::StackName}-DataProcessorFunctionArn` | Function ARN | Data processor | SQS trigger |
| `${AWS::StackName}-NotificationProcessorArn` | Function ARN | Notification sender | SQS trigger |

### IAM Roles
| Export Name | Value | Description | Used By |
|------------|-------|-------------|---------|
| `${AWS::StackName}-LambdaExecutionRoleArn` | Role ARN | Basic Lambda role | Lambda functions |
| `${AWS::StackName}-UserServiceRoleArn` | Role ARN | User service role | User handlers |
| `${AWS::StackName}-SourceServiceRoleArn` | Role ARN | Source service role | Source handlers |
| `${AWS::StackName}-DataProcessorRoleArn` | Role ARN | Data processor role | Processing jobs |
| `${AWS::StackName}-NotificationRoleArn` | Role ARN | Notification role | Notification service |

### KMS Keys
| Export Name | Value | Description | Used By |
|------------|-------|-------------|---------|
| `${AWS::StackName}-DataEncryptionKeyId` | Key ID | Data encryption key | S3, DynamoDB |
| `${AWS::StackName}-DataEncryptionKeyArn` | Key ARN | Data key ARN | IAM policies |
| `${AWS::StackName}-SecretsEncryptionKeyId` | Key ID | Secrets key | Secrets Manager |

### Networking (VPC)
| Export Name | Value | Description | Used By |
|------------|-------|-------------|---------|
| `${AWS::StackName}-VpcId` | VPC ID | Main VPC | All resources |
| `${AWS::StackName}-PrivateSubnetIds` | Subnet IDs (comma-separated) | Private subnets | Lambda, RDS |
| `${AWS::StackName}-PublicSubnetIds` | Subnet IDs (comma-separated) | Public subnets | NAT, ALB |
| `${AWS::StackName}-SecurityGroupId` | Security Group ID | Default SG | Lambda functions |

## Service-Specific Stack Exports

### Auth Service
| Export Name | Value | Description | Used By |
|------------|-------|-------------|---------|
| `${AWS::StackName}-auth-LoginEndpoint` | API Endpoint | Login URL | Frontend |
| `${AWS::StackName}-auth-RegisterEndpoint` | API Endpoint | Registration URL | Frontend |
| `${AWS::StackName}-auth-RefreshEndpoint` | API Endpoint | Token refresh URL | Frontend |
| `${AWS::StackName}-auth-MFASecretArn` | Secret ARN | MFA configuration | Auth handlers |

### Users Service
| Export Name | Value | Description | Used By |
|------------|-------|-------------|---------|
| `${AWS::StackName}-users-ApiResourceId` | Resource ID | Users API resource | API Gateway |
| `${AWS::StackName}-users-ProfileEndpoint` | API Endpoint | Profile URL | Frontend |
| `${AWS::StackName}-users-ListEndpoint` | API Endpoint | Users list URL | Admin UI |

### Sources Service
| Export Name | Value | Description | Used By |
|------------|-------|-------------|---------|
| `${AWS::StackName}-sources-ApiResourceId` | Resource ID | Sources API resource | API Gateway |
| `${AWS::StackName}-sources-CreateEndpoint` | API Endpoint | Create source URL | Frontend |
| `${AWS::StackName}-sources-SyncEndpoint` | API Endpoint | Manual sync URL | Frontend |
| `${AWS::StackName}-sources-OAuthStartEndpoint` | API Endpoint | OAuth initiation | Frontend |
| `${AWS::StackName}-sources-OAuthCallbackEndpoint` | API Endpoint | OAuth callback | OAuth providers |

### Billing Service
| Export Name | Value | Description | Used By |
|------------|-------|-------------|---------|
| `${AWS::StackName}-billing-StripeWebhookArn` | Function ARN | Stripe webhook | Stripe |
| `${AWS::StackName}-billing-SubscriptionEndpoint` | API Endpoint | Subscription API | Frontend |
| `${AWS::StackName}-billing-InvoiceEndpoint` | API Endpoint | Invoice API | Frontend |

## Cross-Stack Dependencies

### Dependency Matrix
| Consumer Stack | Required Exports | Provider Stack |
|----------------|------------------|----------------|
| Auth Service | UserPoolId, UsersTableName, CoreAuthorizerArn | Core |
| Users Service | UsersTableName, AccountsTableName, CoreAuthorizerArn | Core |
| Sources Service | SourcesTableName, SourceSyncQueueUrl, DataBucketName | Core |
| API Gateway | All Lambda ARNs, CoreAuthorizerArn | Core, All Services |
| Monitoring | All Queue URLs, All Table Names | Core |

### Import Patterns

#### Using Fn::ImportValue
```yaml
Resources:
  MyFunction:
    Type: AWS::Lambda::Function
    Properties:
      Environment:
        Variables:
          USERS_TABLE: !ImportValue 
            Fn::Sub: "${CoreStackName}-UsersTableName"
          DATA_BUCKET: !ImportValue
            Fn::Sub: "${CoreStackName}-DataBucketName"
```

#### Using Parameters
```yaml
Parameters:
  CoreStackName:
    Type: String
    Description: Name of the core infrastructure stack
    
  UsersTableName:
    Type: String
    Default: !ImportValue
      Fn::Sub: "${CoreStackName}-UsersTableName"
```

## Export Validation

### Required Exports Checklist
- [ ] All table names and ARNs exported
- [ ] All queue URLs and ARNs exported
- [ ] All bucket names and ARNs exported
- [ ] All Lambda function ARNs exported
- [ ] All IAM role ARNs exported
- [ ] API Gateway IDs and URLs exported
- [ ] KMS key IDs exported

### Export Naming Validation
```bash
# List all exports
aws cloudformation list-exports --query 'Exports[?starts_with(Name, `listbackup-main`)].Name' --output table

# Validate specific export
aws cloudformation describe-stacks --stack-name listbackup-main-core \
  --query 'Stacks[0].Outputs[?OutputKey==`UsersTableName`]'
```

## Troubleshooting

### Common Issues

1. **Export Not Found**
   - Verify stack deployment order
   - Check export name matches exactly
   - Ensure source stack has completed

2. **Circular Dependencies**
   - Use parameters instead of imports
   - Deploy in phases
   - Consider service discovery

3. **Export Already in Use**
   - Cannot delete stack with active exports
   - Must remove consuming stacks first
   - Use stack dependencies

### Debug Commands
```bash
# Find stacks using an export
aws cloudformation list-imports --export-name "listbackup-main-UsersTableName"

# List all exports from a stack
aws cloudformation describe-stacks --stack-name listbackup-main-core \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue,ExportName]' \
  --output table
```

## Best Practices

### 1. Export Organization
- Group related exports together
- Use consistent naming patterns
- Document all exports
- Version breaking changes

### 2. Dependency Management
- Minimize cross-stack dependencies
- Use service discovery where possible
- Consider parameter store for configuration
- Implement graceful fallbacks

### 3. Change Management
- Never modify export names in production
- Use aliases for versioning
- Test import changes in lower environments
- Document breaking changes

### 4. Security
- Don't export sensitive values
- Use Secrets Manager for credentials
- Implement least privilege access
- Audit export usage regularly

## Migration Guide

### Adding New Exports
1. Add to source stack outputs
2. Deploy source stack
3. Update consumer stacks
4. Deploy consumer stacks

### Removing Exports
1. Identify all consumers
2. Update consumers to not use export
3. Deploy all consumer stacks
4. Remove export from source stack
5. Deploy source stack

### Renaming Exports
1. Add new export with new name
2. Deploy source stack
3. Update consumers to use new export
4. Deploy consumer stacks
5. Remove old export
6. Deploy source stack again