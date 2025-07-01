# OAuth Credentials Management with SSM

## Overview
OAuth client credentials (client IDs and secrets) are stored securely in AWS Systems Manager Parameter Store (SSM) rather than in DynamoDB. This provides better security and easier credential rotation.

## SSM Parameter Structure
```
/listbackup/{stage}/platforms/{platform}/oauth/client-id
/listbackup/{stage}/platforms/{platform}/oauth/client-secret
```

Examples:
- `/listbackup/dev/platforms/google/oauth/client-id`
- `/listbackup/dev/platforms/google/oauth/client-secret`
- `/listbackup/prod/platforms/shopify/oauth/client-id`
- `/listbackup/prod/platforms/shopify/oauth/client-secret`

## DynamoDB Platform Schema Update
The platform records in DynamoDB now include SSM references instead of actual credentials:

```json
{
  "platformId": "platform:google",
  "oauth": {
    "clientIdRef": "/listbackup/dev/platforms/google/oauth/client-id",
    "clientSecretRef": "/listbackup/dev/platforms/google/oauth/client-secret",
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth",
    "tokenUrl": "https://oauth2.googleapis.com/token",
    "scopes": ["..."],
    "responseType": "code"
  }
}
```

## Lambda Function Updates Required

### 1. Add SSM Permissions to IAM Role
```yaml
- Effect: Allow
  Action:
    - ssm:GetParameter
    - ssm:GetParameters
    - ssm:GetParametersByPath
  Resource:
    - "arn:aws:ssm:${region}:*:parameter/listbackup/${stage}/platforms/*/oauth/*"
```

### 2. Update Handler Code
The OAuth handlers need to:
1. Read the SSM parameter paths from DynamoDB
2. Fetch the actual credentials from SSM
3. Use the credentials for OAuth operations

Example code in `oauth-start/ssm.go` shows how to implement this.

## Configuration Scripts

### 1. Configure Google OAuth
```bash
./configure-google-oauth-ssm.sh
```
This script:
- Prompts for OAuth credentials
- Stores them securely in SSM
- Updates DynamoDB to reference the SSM parameters

### 2. Create OAuth States Table
```bash
./create-oauth-states-table.sh
```
Creates the DynamoDB table for storing temporary OAuth state parameters.

## Security Benefits
1. **Encryption at Rest**: SSM parameters are encrypted by default
2. **Access Control**: Fine-grained IAM permissions for each parameter
3. **Audit Trail**: CloudTrail logs all parameter access
4. **Rotation**: Easy to rotate credentials without code changes
5. **Environment Isolation**: Separate parameters for dev/staging/prod

## Next Steps
1. Update all OAuth handlers to use SSM for credentials
2. Remove any hardcoded credentials from DynamoDB
3. Set up CloudWatch alarms for parameter access
4. Implement credential rotation strategy