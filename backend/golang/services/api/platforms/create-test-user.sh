#!/bin/bash

# Script to create a test user for platform connections testing

BASE_URL="https://dev.api.listbackup.ai"
TEST_EMAIL="platformtest@example.com"
TEST_PASSWORD="PlatformTest123!"
TEST_NAME="Platform Test User"
TEST_COMPANY="Test Company"

echo "Creating test user..."

# Register new user
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"$TEST_NAME\",
    \"companyName\": \"$TEST_COMPANY\",
    \"phoneNumber\": \"+1234567890\"
  }")

echo "Register response:"
echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null || echo "$REGISTER_RESPONSE"

# Extract token if successful
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token' 2>/dev/null)

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo -e "\nTest user created successfully!"
    echo "Email: $TEST_EMAIL"
    echo "Password: $TEST_PASSWORD"
    echo "Token: $TOKEN"
    
    # Update test script with new credentials
    sed -i '' "s/TEST_EMAIL=\".*\"/TEST_EMAIL=\"$TEST_EMAIL\"/" test-platform-connections.sh
    sed -i '' "s/TEST_PASSWORD=\".*\"/TEST_PASSWORD=\"$TEST_PASSWORD\"/" test-platform-connections.sh
    echo -e "\nTest script updated with new credentials."
else
    echo -e "\nFailed to create test user. Trying to login with existing credentials..."
    
    # Try to login
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
      }")
    
    echo "Login response:"
    echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token' 2>/dev/null)
    
    if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
        echo -e "\nLogin successful with existing user!"
        echo "Token: $TOKEN"
        
        # Update test script with credentials
        sed -i '' "s/TEST_EMAIL=\".*\"/TEST_EMAIL=\"$TEST_EMAIL\"/" test-platform-connections.sh
        sed -i '' "s/TEST_PASSWORD=\".*\"/TEST_PASSWORD=\"$TEST_PASSWORD\"/" test-platform-connections.sh
        echo -e "\nTest script updated with credentials."
    fi
fi