#!/bin/bash

# Test single platform endpoint

# Login first
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "https://dev.api.listbackup.ai/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "platformtest@example.com",
    "password": "PlatformTest123!"
  }')

echo "Login response:"
echo "$LOGIN_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "Failed to get token"
    exit 1
fi

echo -e "\nToken obtained successfully"

# Test GET /platforms/google
echo -e "\nTesting GET /platforms/google..."
curl -s -X GET "https://dev.api.listbackup.ai/platforms/google" \
  -H "Authorization: Bearer $TOKEN" | jq '.'