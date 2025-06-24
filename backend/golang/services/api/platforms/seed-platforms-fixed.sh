#!/bin/bash

# Add platforms with correct date format
echo "Adding platforms to DynamoDB..."

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Add Keap platform
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
    "createdAt": {"S": "'$TIMESTAMP'"},
    "updatedAt": {"S": "'$TIMESTAMP'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

echo "Keap platform added"

# Add GoHighLevel platform
aws dynamodb put-item \
  --table-name listbackup-main-platforms \
  --item '{
    "platformId": {"S": "platform:gohighlevel"},
    "platformType": {"S": "gohighlevel"},
    "name": {"S": "GoHighLevel"},
    "category": {"S": "CRM"},
    "description": {"S": "GoHighLevel CRM and marketing automation data backup"},
    "status": {"S": "active"},
    "version": {"S": "v1"},
    "logoUrl": {"S": "https://listbackup.ai/logos/gohighlevel.svg"},
    "documentationUrl": {"S": "https://docs.listbackup.ai/platforms/gohighlevel"},
    "apiConfig": {"M": {
      "baseUrl": {"S": "https://api.gohighlevel.com"},
      "authType": {"S": "oauth"},
      "testEndpoint": {"S": "/v1/users/search"},
      "version": {"S": "v1"},
      "rateLimits": {"M": {
        "requestsPerSecond": {"N": "5"},
        "requestsPerMinute": {"N": "100"},
        "requestsPerHour": {"N": "1000"},
        "burstLimit": {"N": "10"}
      }}
    }},
    "oauthConfig": {"M": {
      "authUrl": {"S": "https://marketplace.gohighlevel.com/oauth/chooselocation"},
      "tokenUrl": {"S": "https://services.leadconnectorhq.com/oauth/token"},
      "userInfoUrl": {"S": "https://services.leadconnectorhq.com/oauth/userinfo"},
      "scopes": {"L": [
        {"S": "contacts.readonly"},
        {"S": "campaigns.readonly"},
        {"S": "opportunities.readonly"}
      ]},
      "responseType": {"S": "code"}
    }},
    "createdAt": {"S": "'$TIMESTAMP'"},
    "updatedAt": {"S": "'$TIMESTAMP'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

echo "GoHighLevel platform added"

# Add Stripe platform
aws dynamodb put-item \
  --table-name listbackup-main-platforms \
  --item '{
    "platformId": {"S": "platform:stripe"},
    "platformType": {"S": "stripe"},
    "name": {"S": "Stripe"},
    "category": {"S": "Payment"},
    "description": {"S": "Stripe payments, customers, and transaction data backup"},
    "status": {"S": "active"},
    "version": {"S": "v1"},
    "logoUrl": {"S": "https://listbackup.ai/logos/stripe.svg"},
    "documentationUrl": {"S": "https://docs.listbackup.ai/platforms/stripe"},
    "apiConfig": {"M": {
      "baseUrl": {"S": "https://api.stripe.com"},
      "authType": {"S": "oauth"},
      "testEndpoint": {"S": "/v1/account"},
      "version": {"S": "v1"},
      "rateLimits": {"M": {
        "requestsPerSecond": {"N": "5"},
        "requestsPerMinute": {"N": "100"},
        "requestsPerHour": {"N": "1000"},
        "burstLimit": {"N": "10"}
      }}
    }},
    "oauthConfig": {"M": {
      "authUrl": {"S": "https://connect.stripe.com/oauth/authorize"},
      "tokenUrl": {"S": "https://connect.stripe.com/oauth/token"},
      "userInfoUrl": {"S": "https://api.stripe.com/v1/accounts/{account_id}"},
      "scopes": {"L": [{"S": "read_only"}]},
      "responseType": {"S": "code"}
    }},
    "createdAt": {"S": "'$TIMESTAMP'"},
    "updatedAt": {"S": "'$TIMESTAMP'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

echo "Stripe platform added"

echo "All platforms added successfully!"