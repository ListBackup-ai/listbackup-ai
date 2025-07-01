# Phase 3 API Gateway Updates - Changes Summary

## Key Changes Made to serverless.yml

### 1. Infrastructure Service Integration

**Before (using core service):**
```yaml
COGNITO_USER_POOL_ID: ${cf:listbackup-core-${self:provider.stage}.CognitoUserPoolId}
COGNITO_CLIENT_ID: ${cf:listbackup-core-${self:provider.stage}.CognitoUserPoolClientId}
```

**After (using infrastructure services):**
```yaml
COGNITO_USER_POOL_ID: ${cf:listbackup-infrastructure-cognito-${self:provider.stage}.CognitoUserPoolId}
COGNITO_CLIENT_ID: ${cf:listbackup-infrastructure-cognito-${self:provider.stage}.CognitoUserPoolClientId}
COGNITO_JWKS_URI: ${cf:listbackup-infrastructure-cognito-${self:provider.stage}.CognitoJwksUri}
COGNITO_ISSUER: ${cf:listbackup-infrastructure-cognito-${self:provider.stage}.CognitoIssuer}
```

### 2. Added DynamoDB Table Environment Variables
```yaml
USERS_TABLE_NAME: ${cf:listbackup-infrastructure-dynamodb-${self:provider.stage}.UsersTableName}
ACCOUNTS_TABLE_NAME: ${cf:listbackup-infrastructure-dynamodb-${self:provider.stage}.AccountsTableName}
USER_ACCOUNTS_TABLE_NAME: ${cf:listbackup-infrastructure-dynamodb-${self:provider.stage}.UserAccountsTableName}
ACTIVITY_TABLE_NAME: ${cf:listbackup-infrastructure-dynamodb-${self:provider.stage}.ActivityTableName}
```

### 3. Added S3 Bucket Integration
```yaml
DATA_BUCKET_NAME: ${cf:listbackup-infrastructure-s3-${self:provider.stage}.DataBucketName}
```

### 4. Staged Custom Domain Configuration

**Before (fixed domain):**
```yaml
DomainName: api.listbackup.ai
```

**After (staged subdomain):**
```yaml
DomainName: ${self:provider.stage}.api.listbackup.ai
```

### 5. Updated SSL Certificate Reference

**Before:**
```yaml
CertificateArn: 
  Fn::ImportValue: listbackup-ssl-certificate-arn
```

**After:**
```yaml
CertificateArn: ${cf:listbackup-infrastructure-domains-${self:provider.stage}.SSLCertificateArn}
```

### 6. Enhanced IAM Permissions
Added S3 bucket permissions:
```yaml
- Effect: Allow
  Action:
    - s3:GetObject
    - s3:PutObject
    - s3:DeleteObject
    - s3:ListBucket
  Resource:
    - ${cf:listbackup-infrastructure-s3-${self:provider.stage}.DataBucketArn}
    - "${cf:listbackup-infrastructure-s3-${self:provider.stage}.DataBucketArn}/*"
```

### 7. Updated JWT Authorizer Configuration

**Before:**
```yaml
issuerUrl: 
  Fn::Sub: "https://cognito-idp.${AWS::Region}.amazonaws.com/${cf:listbackup-core-${self:provider.stage}.CognitoUserPoolId}"
audience:
  - ${cf:listbackup-core-${self:provider.stage}.CognitoUserPoolClientId}
```

**After:**
```yaml
issuerUrl: ${cf:listbackup-infrastructure-cognito-${self:provider.stage}.CognitoIssuer}
audience:
  - ${cf:listbackup-infrastructure-cognito-${self:provider.stage}.CognitoUserPoolClientId}
```

## Deployment Order Requirements

1. **Infrastructure Services (must be deployed first):**
   ```bash
   sls deploy --config infrastructure-cognito.yml --aws-profile listbackup.ai --stage main
   sls deploy --config infrastructure-dynamodb.yml --aws-profile listbackup.ai --stage main
   sls deploy --config infrastructure-s3.yml --aws-profile listbackup.ai --stage main
   sls deploy --config infra/domains/serverless.yml --aws-profile listbackup.ai --stage main
   ```

2. **API Gateway Service:**
   ```bash
   sls deploy --config api-gateway/serverless.yml --aws-profile listbackup.ai --stage main
   ```

## Expected Outputs After Deployment

- **Custom Domain**: `main.api.listbackup.ai` (or `${stage}.api.listbackup.ai`)
- **Health Endpoint**: `https://main.api.listbackup.ai/system/health`
- **OpenAPI Spec**: `https://main.api.listbackup.ai/system/openapi`

## CloudFormation Exports Available for Other Services

- `listbackup-api-gateway-main-HttpApiId`
- `listbackup-api-gateway-main-HttpApiEndpoint`
- `listbackup-api-gateway-main-CustomDomainEndpoint`
- `listbackup-api-gateway-main-CognitoAuthorizerId`

## Troubleshooting

1. **If deployment fails with CloudFormation import errors:**
   - Verify all infrastructure services are deployed first
   - Check that stage names match in all service configurations

2. **If SSL certificate issues occur:**
   - Verify the domains infrastructure service is deployed
   - Check that the wildcard certificate covers `*.api.listbackup.ai`

3. **If JWT authorization fails:**
   - Verify Cognito infrastructure service exports are available
   - Test JWT tokens against the correct issuer URL

---
**Created**: 2025-06-22
**Phase**: 3 - API Gateway Service Updates
**Status**: Implementation Complete