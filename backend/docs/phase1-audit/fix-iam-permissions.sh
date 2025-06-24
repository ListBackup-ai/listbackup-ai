#!/bin/bash

# Script to help fix IAM permissions in serverless.yml files
# This script provides the correct IAM statements to replace wildcard permissions

echo "=== IAM Permission Fix Script ==="
echo "This script will help you fix the wildcard permissions in auth and users services"
echo ""

cat << 'EOF' > auth-iam-fix.yml
# Replace the current iam section in auth/serverless.yml with:
  iam:
    role:
      statements:
        # Cognito permissions
        - Effect: Allow
          Action:
            - cognito-idp:AdminCreateUser
            - cognito-idp:AdminSetUserPassword
            - cognito-idp:AdminInitiateAuth
            - cognito-idp:AdminRespondToAuthChallenge
            - cognito-idp:AdminUserGlobalSignOut
            - cognito-idp:AdminGetUser
            - cognito-idp:AdminUpdateUserAttributes
          Resource: 
            - Fn::Sub: "arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${self:provider.environment.COGNITO_USER_POOL_ID}"
        
        # DynamoDB permissions
        - Effect: Allow
          Action:
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:Query
          Resource:
            - Fn::Sub: "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${self:provider.stage}-users"
            - Fn::Sub: "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${self:provider.stage}-accounts"
            - Fn::Sub: "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${self:provider.stage}-user-accounts"
            - Fn::Sub: "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${self:provider.stage}-activity"
        
        # EventBridge permissions
        - Effect: Allow
          Action:
            - events:PutEvents
          Resource:
            - Fn::Sub: "arn:aws:events:${AWS::Region}:${AWS::AccountId}:event-bus/listbackup-events-${self:provider.stage}"
        
        # X-Ray permissions
        - Effect: Allow
          Action:
            - xray:PutTraceSegments
            - xray:PutTelemetryRecords
          Resource: "*"
EOF

cat << 'EOF' > users-iam-fix.yml
# Replace the current iam section in users/serverless.yml with:
  iam:
    role:
      statements:
        # DynamoDB permissions
        - Effect: Allow
          Action:
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
            - dynamodb:Query
            - dynamodb:Scan
          Resource:
            - Fn::Sub: "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${self:provider.stage}-users"
            - Fn::Sub: "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${self:provider.stage}-users/index/*"
            - Fn::Sub: "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${self:provider.stage}-user-accounts"
            - Fn::Sub: "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/listbackup-${self:provider.stage}-user-accounts/index/*"
        
        # Cognito permissions for user management
        - Effect: Allow
          Action:
            - cognito-idp:AdminGetUser
            - cognito-idp:AdminUpdateUserAttributes
            - cognito-idp:AdminDeleteUser
            - cognito-idp:AdminEnableUser
            - cognito-idp:AdminDisableUser
          Resource: 
            - Fn::Sub: "arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${self:provider.environment.COGNITO_USER_POOL_ID}"
        
        # EventBridge permissions
        - Effect: Allow
          Action:
            - events:PutEvents
          Resource:
            - Fn::Sub: "arn:aws:events:${AWS::Region}:${AWS::AccountId}:event-bus/listbackup-events-${self:provider.stage}"
        
        # X-Ray permissions
        - Effect: Allow
          Action:
            - xray:PutTraceSegments
            - xray:PutTelemetryRecords
          Resource: "*"
EOF

echo "Generated fix files:"
echo "  - auth-iam-fix.yml"
echo "  - users-iam-fix.yml"
echo ""
echo "To apply these fixes:"
echo "1. Review the generated files"
echo "2. Backup your current serverless.yml files"
echo "3. Replace the iam sections in auth/serverless.yml and users/serverless.yml"
echo "4. Test in development environment before deploying to production"
echo ""
echo "Additional recommendations:"
echo "- Enable AWS CloudTrail for audit logging"
echo "- Set up CloudWatch alarms for unauthorized access attempts"
echo "- Review other services for overly broad permissions"