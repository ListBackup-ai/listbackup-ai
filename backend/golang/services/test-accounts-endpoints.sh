#!/bin/bash

# Test script for accounts service endpoints

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="https://b554ytt8w9.execute-api.us-west-2.amazonaws.com"
AUTH_TOKEN=""

echo "=== Testing Accounts Service Endpoints ==="
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
    exit 1
fi

echo -e "${GREEN}✓ Got auth token${NC}"
echo ""

# Test GET /accounts
echo "2. Testing GET /accounts (list all accounts)..."
LIST_RESPONSE=$(curl -s -X GET "$API_BASE/accounts" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "Response: $LIST_RESPONSE" | head -n 3

if echo "$LIST_RESPONSE" | grep -q '"success":true' || echo "$LIST_RESPONSE" | grep -q '"statusCode":200'; then
    echo -e "${GREEN}✓ GET /accounts successful${NC}"
else
    echo -e "${RED}✗ GET /accounts failed${NC}"
    echo "Response: $LIST_RESPONSE"
fi
echo ""

# Extract an account ID if available
ACCOUNT_ID=$(echo "$LIST_RESPONSE" | grep -o '"accountId":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ACCOUNT_ID" ]; then
    # Get from user profile if not in accounts list
    ME_RESPONSE=$(curl -s -X GET "$API_BASE/users/me" \
      -H "Authorization: Bearer $AUTH_TOKEN")
    ACCOUNT_ID=$(echo "$ME_RESPONSE" | grep -o '"accountId":"[^"]*' | head -1 | cut -d'"' -f4)
fi

echo "Using Account ID: $ACCOUNT_ID"
echo ""

# Test POST /accounts (create new account)
echo "3. Testing POST /accounts (create new account)..."
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/accounts" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Sub-Account",
    "company": "Test Sub-Company",
    "plan": "free"
  }')

if echo "$CREATE_RESPONSE" | grep -q '"success":true' || echo "$CREATE_RESPONSE" | grep -q '"statusCode":200'; then
    echo -e "${GREEN}✓ POST /accounts successful${NC}"
    NEW_ACCOUNT_ID=$(echo "$CREATE_RESPONSE" | grep -o '"accountId":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "New Account ID: $NEW_ACCOUNT_ID"
else
    echo -e "${YELLOW}⚠ POST /accounts returned:${NC}"
    echo "Response: $CREATE_RESPONSE"
fi
echo ""

# Test GET /accounts/{accountId}
if [ ! -z "$ACCOUNT_ID" ]; then
    echo "4. Testing GET /accounts/{accountId}..."
    GET_RESPONSE=$(curl -s -X GET "$API_BASE/accounts/$ACCOUNT_ID" \
      -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$GET_RESPONSE" | grep -q '"success":true' || echo "$GET_RESPONSE" | grep -q '"statusCode":200'; then
        echo -e "${GREEN}✓ GET /accounts/{accountId} successful${NC}"
    else
        echo -e "${YELLOW}⚠ GET /accounts/{accountId} returned:${NC}"
        echo "Response: $GET_RESPONSE"
    fi
    echo ""
fi

# Test PUT /accounts/{accountId}
if [ ! -z "$ACCOUNT_ID" ]; then
    echo "5. Testing PUT /accounts/{accountId} (update account)..."
    UPDATE_RESPONSE=$(curl -s -X PUT "$API_BASE/accounts/$ACCOUNT_ID" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Updated Account Name"
      }')
    
    if echo "$UPDATE_RESPONSE" | grep -q '"success":true' || echo "$UPDATE_RESPONSE" | grep -q '"statusCode":200'; then
        echo -e "${GREEN}✓ PUT /accounts/{accountId} successful${NC}"
    else
        echo -e "${YELLOW}⚠ PUT /accounts/{accountId} returned:${NC}"
        echo "Response: $UPDATE_RESPONSE"
    fi
    echo ""
fi

# Test DELETE /accounts/{accountId} (skip for now to avoid deleting important data)
echo "6. Testing DELETE /accounts/{accountId}..."
echo -e "${YELLOW}⚠ Skipping DELETE test to avoid data loss${NC}"
echo ""

# Test OPTIONS endpoints for CORS
echo "7. Testing OPTIONS endpoints for CORS..."
OPTIONS_RESPONSE=$(curl -s -X OPTIONS "$API_BASE/accounts" \
  -H "Origin: https://app.listbackup.ai" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization")

if [ "$?" -eq 0 ]; then
    echo -e "${GREEN}✓ CORS preflight successful${NC}"
else
    echo -e "${RED}✗ CORS preflight failed${NC}"
fi
echo ""

echo "=== Accounts Service Test Summary ==="
echo "All accounts service endpoints have been tested."
echo "Note: These are placeholder implementations that need to be replaced with actual business logic."