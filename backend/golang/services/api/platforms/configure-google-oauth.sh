#!/bin/bash

# Script to configure Google OAuth credentials for ListBackup.ai

echo "=== Google OAuth Configuration for ListBackup.ai ==="
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

# Prompt for credentials
read -p "Enter your Google OAuth Client ID: " CLIENT_ID
read -s -p "Enter your Google OAuth Client Secret: " CLIENT_SECRET
echo

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "Error: Client ID and Secret are required"
    exit 1
fi

# Update the Google platform in DynamoDB
echo -e "\nUpdating Google platform OAuth configuration in DynamoDB..."

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

aws dynamodb update-item \
  --table-name listbackup-dev-platforms \
  --key '{"platformId": {"S": "platform:google"}}' \
  --update-expression "SET #oauth.#clientId = :clientId, #oauth.#clientSecret = :clientSecret, #oauth.#tokenUrl = :tokenUrl, updatedAt = :timestamp" \
  --expression-attribute-names '{
    "#oauth": "oauth",
    "#clientId": "clientId",
    "#clientSecret": "clientSecret",
    "#tokenUrl": "tokenUrl"
  }' \
  --expression-attribute-values '{
    ":clientId": {"S": "'"$CLIENT_ID"'"},
    ":clientSecret": {"S": "'"$CLIENT_SECRET"'"},
    ":tokenUrl": {"S": "https://oauth2.googleapis.com/token"},
    ":timestamp": {"S": "'"$TIMESTAMP"'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

if [ $? -eq 0 ]; then
    echo "✓ Successfully updated Google OAuth configuration"
else
    echo "✗ Failed to update configuration"
    exit 1
fi

# Also update for production if needed
read -p "Do you want to update the production environment too? (y/N): " UPDATE_PROD

if [[ $UPDATE_PROD =~ ^[Yy]$ ]]; then
    echo "Updating production Google platform..."
    
    aws dynamodb update-item \
      --table-name listbackup-prod-platforms \
      --key '{"platformId": {"S": "platform:google"}}' \
      --update-expression "SET #oauth.#clientId = :clientId, #oauth.#clientSecret = :clientSecret, #oauth.#tokenUrl = :tokenUrl, updatedAt = :timestamp" \
      --expression-attribute-names '{
        "#oauth": "oauth",
        "#clientId": "clientId",
        "#clientSecret": "clientSecret",
        "#tokenUrl": "tokenUrl"
      }' \
      --expression-attribute-values '{
        ":clientId": {"S": "'"$CLIENT_ID"'"},
        ":clientSecret": {"S": "'"$CLIENT_SECRET"'"},
        ":tokenUrl": {"S": "https://oauth2.googleapis.com/token"},
        ":timestamp": {"S": "'"$TIMESTAMP"'"}
      }' \
      --profile listbackup.ai \
      --region us-west-2 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✓ Successfully updated production configuration"
    else
        echo "Note: Production table might not exist yet"
    fi
fi

echo -e "\n=== Configuration Complete ==="
echo "Next steps:"
echo "1. Test the OAuth flow with: ./test-oauth-flow.sh"
echo "2. Ensure your Google Cloud project has the following APIs enabled:"
echo "   - Google Analytics API"
echo "   - Google Search Console API"
echo "   - Any other Google APIs you plan to use"

# Create a test OAuth flow script
cat > test-oauth-flow.sh << 'EOF'
#!/bin/bash

# Test Google OAuth flow

echo "Testing Google OAuth flow..."

# Get test user token
LOGIN_RESPONSE=$(curl -s -X POST "https://dev.api.listbackup.ai/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "platformtest@example.com",
    "password": "PlatformTest123!"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "Failed to get authentication token"
    exit 1
fi

echo "✓ Authenticated successfully"

# Start OAuth flow
echo -e "\nStarting OAuth flow for Google..."
OAUTH_RESPONSE=$(curl -s -X GET "https://dev.api.listbackup.ai/platforms/google/oauth/start" \
  -H "Authorization: Bearer $TOKEN")

echo "OAuth response:"
echo "$OAUTH_RESPONSE" | jq '.'

AUTH_URL=$(echo "$OAUTH_RESPONSE" | jq -r '.data.authUrl')
if [ "$AUTH_URL" != "null" ] && [ -n "$AUTH_URL" ]; then
    echo -e "\n✓ OAuth URL generated successfully!"
    echo "Visit this URL to authorize:"
    echo "$AUTH_URL"
else
    echo -e "\n✗ Failed to generate OAuth URL"
fi
EOF

chmod +x test-oauth-flow.sh

echo -e "\nCreated test-oauth-flow.sh - run it to test the OAuth integration"