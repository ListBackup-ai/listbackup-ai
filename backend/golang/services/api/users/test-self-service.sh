#!/bin/bash

# Test script for users self-service endpoints
# This script tests all /users/me endpoints

# Configuration
API_BASE_URL="https://dev.api.listbackup.ai"
AUTH_ENDPOINT="${API_BASE_URL}/auth/login"
USERS_BASE="${API_BASE_URL}/users/me"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test credentials (you'll need to update these)
TEST_EMAIL="${TEST_EMAIL:-test@example.com}"
TEST_PASSWORD="${TEST_PASSWORD:-TestPassword123!}"

echo "========================================="
echo "Users Self-Service Endpoints Test Script"
echo "========================================="

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Step 1: Login to get access token
echo -e "\n${YELLOW}1. Authenticating...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${AUTH_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

# Extract access token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"idToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}Failed to authenticate. Response:${NC}"
    echo "$LOGIN_RESPONSE"
    echo -e "\n${YELLOW}Please set TEST_EMAIL and TEST_PASSWORD environment variables${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"

# Step 2: Test GET /users/me
echo -e "\n${YELLOW}2. Testing GET /users/me${NC}"
ME_RESPONSE=$(curl -s -X GET "${USERS_BASE}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Response:"
echo "$ME_RESPONSE" | jq '.' 2>/dev/null || echo "$ME_RESPONSE"

# Check if successful
if echo "$ME_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "GET /users/me"
    
    # Extract user data for later tests
    USER_NAME=$(echo "$ME_RESPONSE" | grep -o '"name":"[^"]*' | cut -d'"' -f4)
    USER_EMAIL=$(echo "$ME_RESPONSE" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
else
    print_result 1 "GET /users/me"
fi

# Step 3: Test PUT /users/me (update profile)
echo -e "\n${YELLOW}3. Testing PUT /users/me${NC}"
UPDATE_PROFILE_RESPONSE=$(curl -s -X PUT "${USERS_BASE}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Updated Test User",
        "preferences": {
            "timezone": "America/New_York",
            "theme": "dark",
            "notifications": {
                "email": true,
                "sms": false,
                "inApp": true,
                "backupCompleted": true,
                "backupFailed": true,
                "storageAlerts": false
            }
        }
    }')

echo "Response:"
echo "$UPDATE_PROFILE_RESPONSE" | jq '.' 2>/dev/null || echo "$UPDATE_PROFILE_RESPONSE"

if echo "$UPDATE_PROFILE_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "PUT /users/me"
else
    print_result 1 "PUT /users/me"
fi

# Step 4: Test GET /users/me/settings
echo -e "\n${YELLOW}4. Testing GET /users/me/settings${NC}"
SETTINGS_RESPONSE=$(curl -s -X GET "${USERS_BASE}/settings" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Response:"
echo "$SETTINGS_RESPONSE" | jq '.' 2>/dev/null || echo "$SETTINGS_RESPONSE"

if echo "$SETTINGS_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "GET /users/me/settings"
else
    print_result 1 "GET /users/me/settings"
fi

# Step 5: Test PUT /users/me/settings
echo -e "\n${YELLOW}5. Testing PUT /users/me/settings${NC}"
UPDATE_SETTINGS_RESPONSE=$(curl -s -X PUT "${USERS_BASE}/settings" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "userPreferences": {
            "timezone": "Europe/London",
            "theme": "light",
            "notifications": {
                "email": true,
                "sms": true,
                "inApp": true,
                "backupCompleted": true,
                "backupFailed": true,
                "storageAlerts": true
            }
        }
    }')

echo "Response:"
echo "$UPDATE_SETTINGS_RESPONSE" | jq '.' 2>/dev/null || echo "$UPDATE_SETTINGS_RESPONSE"

if echo "$UPDATE_SETTINGS_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "PUT /users/me/settings"
else
    print_result 1 "PUT /users/me/settings"
fi

# Step 6: Test GET /users/me/accounts
echo -e "\n${YELLOW}6. Testing GET /users/me/accounts${NC}"
ACCOUNTS_RESPONSE=$(curl -s -X GET "${USERS_BASE}/accounts" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Response:"
echo "$ACCOUNTS_RESPONSE" | jq '.' 2>/dev/null || echo "$ACCOUNTS_RESPONSE"

if echo "$ACCOUNTS_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "GET /users/me/accounts"
else
    print_result 1 "GET /users/me/accounts"
fi

# Summary
echo -e "\n${YELLOW}=========================================${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo "All self-service endpoints have been tested."
echo "Check the responses above for any issues."

# Verify profile was updated
echo -e "\n${YELLOW}7. Verifying profile update...${NC}"
VERIFY_RESPONSE=$(curl -s -X GET "${USERS_BASE}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")

UPDATED_NAME=$(echo "$VERIFY_RESPONSE" | grep -o '"name":"[^"]*' | cut -d'"' -f4)
if [ "$UPDATED_NAME" = "Updated Test User" ]; then
    print_result 0 "Profile update verified"
else
    print_result 1 "Profile update verification"
fi

echo -e "\n${GREEN}Testing complete!${NC}"