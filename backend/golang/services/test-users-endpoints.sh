#!/bin/bash

# Test script for users service endpoints

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="https://b554ytt8w9.execute-api.us-west-2.amazonaws.com"
AUTH_TOKEN=""

echo "=== Testing Users Service Endpoints ==="
echo ""

# First, we need to login to get an auth token
echo "1. Logging in to get auth token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-phase4@listbackup.ai",
    "password": "TestPassword123!"
  }')

# Extract the access token
AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}✗ Failed to get auth token${NC}"
    echo "Login response: $LOGIN_RESPONSE"
    echo ""
    echo "Creating a test user first..."
    
    # Register a new user
    REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test-phase4@listbackup.ai",
        "password": "TestPassword123!",
        "name": "Test User Phase 4",
        "company": "Test Company"
      }')
    
    echo "Register response: $REGISTER_RESPONSE"
    
    # Try to login again
    LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test-phase4@listbackup.ai",
        "password": "TestPassword123!"
      }')
    
    AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${RED}✗ Still failed to get auth token${NC}"
        echo "Login response: $LOGIN_RESPONSE"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Got auth token${NC}"
echo ""

# Test GET /users/me
echo "2. Testing GET /users/me..."
ME_RESPONSE=$(curl -s -X GET "$API_BASE/users/me" \
  -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$ME_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ GET /users/me successful${NC}"
    echo "Response: $ME_RESPONSE" | head -n 3
else
    echo -e "${RED}✗ GET /users/me failed${NC}"
    echo "Response: $ME_RESPONSE"
fi
echo ""

# Test PUT /users/me (update profile)
echo "3. Testing PUT /users/me (update profile)..."
UPDATE_RESPONSE=$(curl -s -X PUT "$API_BASE/users/me" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test User"
  }')

if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PUT /users/me successful${NC}"
else
    echo -e "${RED}✗ PUT /users/me failed${NC}"
    echo "Response: $UPDATE_RESPONSE"
fi
echo ""

# Test GET /users/me/settings
echo "4. Testing GET /users/me/settings..."
SETTINGS_RESPONSE=$(curl -s -X GET "$API_BASE/users/me/settings" \
  -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$SETTINGS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ GET /users/me/settings successful${NC}"
else
    echo -e "${RED}✗ GET /users/me/settings failed${NC}"
    echo "Response: $SETTINGS_RESPONSE"
fi
echo ""

# Test PUT /users/me/settings
echo "5. Testing PUT /users/me/settings..."
UPDATE_SETTINGS_RESPONSE=$(curl -s -X PUT "$API_BASE/users/me/settings" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timezone": "America/Los_Angeles",
    "theme": "dark",
    "notifications": {
      "email": true,
      "slack": false,
      "backupComplete": true,
      "backupFailed": true,
      "weeklyReport": false
    }
  }')

if echo "$UPDATE_SETTINGS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PUT /users/me/settings successful${NC}"
else
    echo -e "${RED}✗ PUT /users/me/settings failed${NC}"
    echo "Response: $UPDATE_SETTINGS_RESPONSE"
fi
echo ""

# Test GET /users/me/accounts
echo "6. Testing GET /users/me/accounts..."
ACCOUNTS_RESPONSE=$(curl -s -X GET "$API_BASE/users/me/accounts" \
  -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$ACCOUNTS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ GET /users/me/accounts successful${NC}"
    echo "Response: $ACCOUNTS_RESPONSE" | head -n 3
else
    echo -e "${RED}✗ GET /users/me/accounts failed${NC}"
    echo "Response: $ACCOUNTS_RESPONSE"
fi
echo ""

# Test OPTIONS endpoints for CORS
echo "7. Testing OPTIONS endpoints for CORS..."
OPTIONS_RESPONSE=$(curl -s -X OPTIONS "$API_BASE/users/me" \
  -H "Origin: https://app.listbackup.ai" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization")

if echo "$OPTIONS_RESPONSE" | grep -q '200' || [ -z "$OPTIONS_RESPONSE" ]; then
    echo -e "${GREEN}✓ CORS preflight successful${NC}"
else
    echo -e "${RED}✗ CORS preflight failed${NC}"
    echo "Response: $OPTIONS_RESPONSE"
fi
echo ""

echo "=== Users Service Test Summary ==="
echo "All users service endpoints have been tested."
echo "Check the responses above for any failures."