#!/bin/bash

# Script to configure Google OAuth credentials using AWS SSM Parameter Store

echo "=== Google OAuth Configuration for ListBackup.ai (Using SSM) ==="
echo
echo "Before running this script, ensure you have:"
echo "1. Created an OAuth 2.0 Client ID in Google Cloud Console"
echo "2. Added these redirect URIs:"
echo "   - https://dev.api.listbackup.ai/platforms/oauth/callback"
echo "   - https://api.listbackup.ai/platforms/oauth/callback"
echo "   - http://localhost:3000/platforms/oauth/callback (for local testing)"
echo
echo "To create/view credentials, visit:"
echo "https://console.cloud.google.com/apis/credentials?project=app-listbackup-ai"
echo

# Function to store parameter in SSM
store_ssm_param() {
    local name=$1
    local value=$2
    local description=$3
    local stage=$4
    
    echo "Storing $description in SSM..."
    aws ssm put-parameter \
        --name "$name" \
        --value "$value" \
        --type "SecureString" \
        --description "$description" \
        --overwrite \
        --profile listbackup.ai \
        --region us-west-2
    
    if [ $? -eq 0 ]; then
        echo "✓ Successfully stored $description"
    else
        echo "✗ Failed to store $description"
        return 1
    fi
}

# Prompt for credentials
read -p "Enter your Google OAuth Client ID: " CLIENT_ID
read -s -p "Enter your Google OAuth Client Secret: " CLIENT_SECRET
echo

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "Error: Client ID and Secret are required"
    exit 1
fi

# Store in SSM for dev environment
echo -e "\nStoring OAuth credentials in SSM Parameter Store..."

# Store client ID (less sensitive, could be String type)
store_ssm_param \
    "/listbackup/dev/platforms/google/oauth/client-id" \
    "$CLIENT_ID" \
    "Google OAuth Client ID (dev)" \
    "dev"

# Store client secret (sensitive, SecureString type)
store_ssm_param \
    "/listbackup/dev/platforms/google/oauth/client-secret" \
    "$CLIENT_SECRET" \
    "Google OAuth Client Secret (dev)" \
    "dev"

# Update platform configuration in DynamoDB to reference SSM parameters
echo -e "\nUpdating Google platform configuration in DynamoDB..."

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Remove sensitive data from DynamoDB and add SSM references
aws dynamodb update-item \
  --table-name listbackup-dev-platforms \
  --key '{"platformId": {"S": "platform:google"}}' \
  --update-expression "SET #oauth.#clientIdRef = :clientIdRef, #oauth.#clientSecretRef = :clientSecretRef, #oauth.#tokenUrl = :tokenUrl, updatedAt = :timestamp REMOVE #oauth.#clientId, #oauth.#clientSecret" \
  --expression-attribute-names '{
    "#oauth": "oauth",
    "#clientId": "clientId",
    "#clientSecret": "clientSecret",
    "#clientIdRef": "clientIdRef",
    "#clientSecretRef": "clientSecretRef",
    "#tokenUrl": "tokenUrl"
  }' \
  --expression-attribute-values '{
    ":clientIdRef": {"S": "/listbackup/dev/platforms/google/oauth/client-id"},
    ":clientSecretRef": {"S": "/listbackup/dev/platforms/google/oauth/client-secret"},
    ":tokenUrl": {"S": "https://oauth2.googleapis.com/token"},
    ":timestamp": {"S": "'"$TIMESTAMP"'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

if [ $? -eq 0 ]; then
    echo "✓ Successfully updated Google platform configuration"
else
    echo "✗ Failed to update configuration"
fi

# Ask about production
read -p "Do you want to configure production environment too? (y/N): " UPDATE_PROD

if [[ $UPDATE_PROD =~ ^[Yy]$ ]]; then
    echo -e "\nConfiguring production environment..."
    
    # Store in SSM for prod
    store_ssm_param \
        "/listbackup/prod/platforms/google/oauth/client-id" \
        "$CLIENT_ID" \
        "Google OAuth Client ID (prod)" \
        "prod"
    
    store_ssm_param \
        "/listbackup/prod/platforms/google/oauth/client-secret" \
        "$CLIENT_SECRET" \
        "Google OAuth Client Secret (prod)" \
        "prod"
    
    # Update prod DynamoDB (if table exists)
    aws dynamodb update-item \
      --table-name listbackup-prod-platforms \
      --key '{"platformId": {"S": "platform:google"}}' \
      --update-expression "SET #oauth.#clientIdRef = :clientIdRef, #oauth.#clientSecretRef = :clientSecretRef, #oauth.#tokenUrl = :tokenUrl, updatedAt = :timestamp REMOVE #oauth.#clientId, #oauth.#clientSecret" \
      --expression-attribute-names '{
        "#oauth": "oauth",
        "#clientId": "clientId",
        "#clientSecret": "clientSecret",
        "#clientIdRef": "clientIdRef",
        "#clientSecretRef": "clientSecretRef",
        "#tokenUrl": "tokenUrl"
      }' \
      --expression-attribute-values '{
        ":clientIdRef": {"S": "/listbackup/prod/platforms/google/oauth/client-id"},
        ":clientSecretRef": {"S": "/listbackup/prod/platforms/google/oauth/client-secret"},
        ":tokenUrl": {"S": "https://oauth2.googleapis.com/token"},
        ":timestamp": {"S": "'"$TIMESTAMP"'"}
      }' \
      --profile listbackup.ai \
      --region us-west-2 2>/dev/null
fi

echo -e "\n=== Configuration Complete ==="
echo "The OAuth credentials are now securely stored in SSM Parameter Store."
echo
echo "To verify the parameters were created:"
echo "aws ssm get-parameter --name /listbackup/dev/platforms/google/oauth/client-id --profile listbackup.ai --region us-west-2"
echo
echo "Note: Lambda functions need to be updated to read from SSM instead of DynamoDB for OAuth credentials."
echo
echo "Required Lambda IAM permissions:"
echo "- ssm:GetParameter for /listbackup/\${stage}/platforms/*/oauth/*"