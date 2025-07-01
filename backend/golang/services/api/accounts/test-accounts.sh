#!/bin/bash

# Test script for accounts service endpoints
# This script tests all account management endpoints

# Configuration
API_BASE_URL="https://dev.api.listbackup.ai"
AUTH_ENDPOINT="${API_BASE_URL}/auth/login"
ACCOUNTS_BASE="${API_BASE_URL}/accounts"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test credentials (reuse from users test or set new ones)
TEST_EMAIL="${TEST_EMAIL:-testuser1751404586@example.com}"
TEST_PASSWORD="${TEST_PASSWORD:-TestPassword123!}"

echo "========================================="
echo "Accounts Service Endpoints Test Script"
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
    exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"

# Step 2: Test GET /accounts (list accounts)
echo -e "\n${YELLOW}2. Testing GET /accounts${NC}"
LIST_RESPONSE=$(curl -s -X GET "${ACCOUNTS_BASE}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Response:"
echo "$LIST_RESPONSE" | jq '.' 2>/dev/null || echo "$LIST_RESPONSE"

if echo "$LIST_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "GET /accounts"
    
    # Extract the first account ID for later tests
    ACCOUNT_ID=$(echo "$LIST_RESPONSE" | grep -o '"accountId":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "Using account ID: $ACCOUNT_ID"
else
    print_result 1 "GET /accounts"
fi

# Step 3: Test GET /accounts/{accountId}
echo -e "\n${YELLOW}3. Testing GET /accounts/{accountId}${NC}"
if [ ! -z "$ACCOUNT_ID" ]; then
    GET_RESPONSE=$(curl -s -X GET "${ACCOUNTS_BASE}/${ACCOUNT_ID}" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")
    
    echo "Response:"
    echo "$GET_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_RESPONSE"
    
    if echo "$GET_RESPONSE" | grep -q '"success":true'; then
        print_result 0 "GET /accounts/{accountId}"
    else
        print_result 1 "GET /accounts/{accountId}"
    fi
else
    echo "Skipping - no account ID available"
fi

# Step 4: Test PUT /accounts/{accountId} (update account)
echo -e "\n${YELLOW}4. Testing PUT /accounts/{accountId}${NC}"
if [ ! -z "$ACCOUNT_ID" ]; then
    UPDATE_RESPONSE=$(curl -s -X PUT "${ACCOUNTS_BASE}/${ACCOUNT_ID}" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Updated Test Account",
            "company": "Test Company Inc",
            "settings": {
                "maxSources": 10,
                "maxStorageGB": 100,
                "retentionDays": 30
            }
        }')
    
    echo "Response:"
    echo "$UPDATE_RESPONSE" | jq '.' 2>/dev/null || echo "$UPDATE_RESPONSE"
    
    if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
        print_result 0 "PUT /accounts/{accountId}"
    else
        print_result 1 "PUT /accounts/{accountId}"
    fi
else
    echo "Skipping - no account ID available"
fi

# Step 5: Test POST /accounts (create new account)
echo -e "\n${YELLOW}5. Testing POST /accounts${NC}"
TIMESTAMP=$(date +%s)
CREATE_RESPONSE=$(curl -s -X POST "${ACCOUNTS_BASE}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"Test Account ${TIMESTAMP}\",
        \"company\": \"Test Company ${TIMESTAMP}\",
        \"plan\": \"free\"
    }")

echo "Response:"
echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"

if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "POST /accounts"
    
    # Extract new account ID
    NEW_ACCOUNT_ID=$(echo "$CREATE_RESPONSE" | grep -o '"accountId":"[^"]*' | cut -d'"' -f4)
    echo "Created account ID: $NEW_ACCOUNT_ID"
else
    print_result 1 "POST /accounts"
fi

# Step 6: Test POST /accounts/{parentAccountId}/sub-accounts
echo -e "\n${YELLOW}6. Testing POST /accounts/{parentAccountId}/sub-accounts${NC}"
if [ ! -z "$ACCOUNT_ID" ]; then
    SUB_ACCOUNT_RESPONSE=$(curl -s -X POST "${ACCOUNTS_BASE}/${ACCOUNT_ID}/sub-accounts" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Sub Account ${TIMESTAMP}\",
            \"company\": \"Sub Company ${TIMESTAMP}\"
        }")
    
    echo "Response:"
    echo "$SUB_ACCOUNT_RESPONSE" | jq '.' 2>/dev/null || echo "$SUB_ACCOUNT_RESPONSE"
    
    if echo "$SUB_ACCOUNT_RESPONSE" | grep -q '"success":true'; then
        print_result 0 "POST /accounts/{parentAccountId}/sub-accounts"
        
        # Extract sub-account ID
        SUB_ACCOUNT_ID=$(echo "$SUB_ACCOUNT_RESPONSE" | grep -o '"accountId":"[^"]*' | cut -d'"' -f4)
    else
        print_result 1 "POST /accounts/{parentAccountId}/sub-accounts"
    fi
else
    echo "Skipping - no parent account ID available"
fi

# Step 7: Test GET /accounts/{accountId}/hierarchy
echo -e "\n${YELLOW}7. Testing GET /accounts/{accountId}/hierarchy${NC}"
if [ ! -z "$ACCOUNT_ID" ]; then
    HIERARCHY_RESPONSE=$(curl -s -X GET "${ACCOUNTS_BASE}/${ACCOUNT_ID}/hierarchy" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")
    
    echo "Response:"
    echo "$HIERARCHY_RESPONSE" | jq '.' 2>/dev/null || echo "$HIERARCHY_RESPONSE"
    
    if echo "$HIERARCHY_RESPONSE" | grep -q '"success":true'; then
        print_result 0 "GET /accounts/{accountId}/hierarchy"
    else
        print_result 1 "GET /accounts/{accountId}/hierarchy"
    fi
else
    echo "Skipping - no account ID available"
fi

# Step 8: Test POST /accounts/switch
echo -e "\n${YELLOW}8. Testing POST /accounts/switch${NC}"
if [ ! -z "$NEW_ACCOUNT_ID" ]; then
    SWITCH_RESPONSE=$(curl -s -X POST "${ACCOUNTS_BASE}/switch" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"accountId\": \"${NEW_ACCOUNT_ID}\"}")
    
    echo "Response:"
    echo "$SWITCH_RESPONSE" | jq '.' 2>/dev/null || echo "$SWITCH_RESPONSE"
    
    if echo "$SWITCH_RESPONSE" | grep -q '"success":true'; then
        print_result 0 "POST /accounts/switch"
    else
        print_result 1 "POST /accounts/switch"
    fi
else
    echo "Skipping - no account ID to switch to"
fi

# Step 9: Test DELETE /accounts/{accountId} (cleanup)
echo -e "\n${YELLOW}9. Testing DELETE /accounts/{accountId}${NC}"
if [ ! -z "$SUB_ACCOUNT_ID" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${ACCOUNTS_BASE}/${SUB_ACCOUNT_ID}" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")
    
    echo "Response:"
    echo "$DELETE_RESPONSE" | jq '.' 2>/dev/null || echo "$DELETE_RESPONSE"
    
    if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
        print_result 0 "DELETE /accounts/{accountId}"
    else
        print_result 1 "DELETE /accounts/{accountId}"
    fi
else
    echo "Skipping - no account to delete"
fi

# Summary
echo -e "\n${YELLOW}=========================================${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo "All accounts service endpoints have been tested."
echo "Check the responses above for any issues."

echo -e "\n${GREEN}Testing complete!${NC}"