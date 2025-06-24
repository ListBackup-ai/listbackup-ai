#!/bin/bash

# Add a single platform to test
echo "Adding Keap platform to DynamoDB..."

aws dynamodb put-item \
  --table-name listbackup-main-platforms \
  --item '{
    "platformId": {"S": "platform:keap"},
    "platformType": {"S": "keap"},
    "name": {"S": "Keap (Infusionsoft)"},
    "category": {"S": "CRM"},
    "description": {"S": "Keap CRM contacts, campaigns, and automation data backup"},
    "status": {"S": "active"},
    "version": {"S": "v1"},
    "logoUrl": {"S": "https://listbackup.ai/logos/keap.svg"},
    "documentationUrl": {"S": "https://docs.listbackup.ai/platforms/keap"},
    "apiConfig": {"M": {
      "baseUrl": {"S": "https://api.infusionsoft.com"},
      "authType": {"S": "oauth"},
      "testEndpoint": {"S": "/oauth/connect/userinfo"},
      "version": {"S": "v1"},
      "rateLimits": {"M": {
        "requestsPerSecond": {"N": "2"},
        "requestsPerMinute": {"N": "120"},
        "requestsPerHour": {"N": "5000"},
        "burstLimit": {"N": "4"}
      }}
    }},
    "oauthConfig": {"M": {
      "authUrl": {"S": "https://accounts.infusionsoft.com/app/oauth/authorize"},
      "tokenUrl": {"S": "https://api.infusionsoft.com/token"},
      "userInfoUrl": {"S": "https://api.infusionsoft.com/oauth/connect/userinfo"},
      "scopes": {"L": [{"S": "full"}]},
      "responseType": {"S": "code"}
    }},
    "createdAt": {"S": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"},
    "updatedAt": {"S": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

echo "Platform added successfully!"