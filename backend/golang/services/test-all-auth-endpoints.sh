#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API Configuration
API_URL="https://b554ytt8w9.execute-api.us-west-2.amazonaws.com"
TIMESTAMP=$(date +%s)
TEST_EMAIL="nick+test${TIMESTAMP}@listbackup.ai"
TEST_PASSWORD="TestPass123!"
TEST_NAME="Test User ${TIMESTAMP}"
TEST_COMPANY="Test Company ${TIMESTAMP}"

echo -e "${YELLOW}=== TESTING ALL AUTH SERVICE ENDPOINTS ===${NC}"
echo "Timestamp: ${TIMESTAMP}"
echo "Test Email: ${TEST_EMAIL}"
echo "API URL: ${API_URL}"
echo ""

# Test 1: Register
echo -e "${YELLOW}1. Testing User Registration${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"name\": \"${TEST_NAME}\",
    \"company\": \"${TEST_COMPANY}\"
  }")

echo "Response: ${REGISTER_RESPONSE}"

# Check if registration was successful
if echo "$REGISTER_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Registration successful${NC}"
    USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.userId')
    ACCOUNT_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accountId')
    echo "User ID: ${USER_ID}"
    echo "Account ID: ${ACCOUNT_ID}"
else
    echo -e "${RED}✗ Registration failed${NC}"
    exit 1
fi
echo ""

# Wait a moment for data to propagate
sleep 2

# Test 2: Login
echo -e "${YELLOW}2. Testing User Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\"
  }")

echo "Response: ${LOGIN_RESPONSE}"

# Check if login was successful and extract tokens
if echo "$LOGIN_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Login successful${NC}"
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')
    REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.refreshToken')
    ID_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.idToken')
    echo "Access Token: ${ACCESS_TOKEN:0:50}..."
    echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
    echo "ID Token: ${ID_TOKEN:0:50}..."
else
    echo -e "${RED}✗ Login failed${NC}"
    exit 1
fi
echo ""

# Test 3: Auth Status (Protected)
echo -e "${YELLOW}3. Testing Auth Status (Protected Endpoint)${NC}"
STATUS_RESPONSE=$(curl -s -X GET "${API_URL}/auth/status" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Response: ${STATUS_RESPONSE}"

if echo "$STATUS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Auth status check successful${NC}"
    echo "Authenticated: $(echo "$STATUS_RESPONSE" | jq -r '.data.authenticated')"
    echo "User ID from JWT: $(echo "$STATUS_RESPONSE" | jq -r '.data.userId')"
else
    echo -e "${RED}✗ Auth status check failed${NC}"
fi
echo ""

# Test 4: Get Profile (Protected)
echo -e "${YELLOW}4. Testing Get Profile (Protected Endpoint)${NC}"
PROFILE_RESPONSE=$(curl -s -X GET "${API_URL}/auth/profile" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Response: ${PROFILE_RESPONSE}"

if echo "$PROFILE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Get profile successful${NC}"
    echo "Email: $(echo "$PROFILE_RESPONSE" | jq -r '.data.email')"
    echo "Name: $(echo "$PROFILE_RESPONSE" | jq -r '.data.name')"
else
    echo -e "${RED}✗ Get profile failed${NC}"
fi
echo ""

# Test 5: Get Available Accounts (Protected)
echo -e "${YELLOW}5. Testing Get Available Accounts (Protected Endpoint)${NC}"
ACCOUNTS_RESPONSE=$(curl -s -X GET "${API_URL}/auth/accounts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Response: ${ACCOUNTS_RESPONSE}"

if echo "$ACCOUNTS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Get accounts successful${NC}"
    echo "Number of accounts: $(echo "$ACCOUNTS_RESPONSE" | jq '.data.accounts | length')"
else
    echo -e "${RED}✗ Get accounts failed${NC}"
fi
echo ""

# Test 6: Refresh Token
echo -e "${YELLOW}6. Testing Token Refresh${NC}"
REFRESH_RESPONSE=$(curl -s -X POST "${API_URL}/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"${REFRESH_TOKEN}\"
  }")

echo "Response: ${REFRESH_RESPONSE}"

if echo "$REFRESH_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Token refresh successful${NC}"
    NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.data.accessToken')
    echo "New Access Token: ${NEW_ACCESS_TOKEN:0:50}..."
else
    echo -e "${RED}✗ Token refresh failed${NC}"
fi
echo ""

# Test 7: Verify new token works
echo -e "${YELLOW}7. Testing New Access Token (Status Check)${NC}"
NEW_TOKEN_STATUS=$(curl -s -X GET "${API_URL}/auth/status" \
  -H "Authorization: Bearer ${NEW_ACCESS_TOKEN}")

echo "Response: ${NEW_TOKEN_STATUS}"

if echo "$NEW_TOKEN_STATUS" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ New token works correctly${NC}"
else
    echo -e "${RED}✗ New token verification failed${NC}"
fi
echo ""

# Test 8: Logout
echo -e "${YELLOW}8. Testing Logout${NC}"
LOGOUT_RESPONSE=$(curl -s -X POST "${API_URL}/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{
    \"accessToken\": \"${ACCESS_TOKEN}\"
  }")

echo "Response: ${LOGOUT_RESPONSE}"

if echo "$LOGOUT_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Logout successful${NC}"
else
    echo -e "${RED}✗ Logout failed${NC}"
fi
echo ""

# Test 9: Verify token is invalidated after logout
echo -e "${YELLOW}9. Testing Token After Logout (Should Fail)${NC}"
POST_LOGOUT_STATUS=$(curl -s -X GET "${API_URL}/auth/status" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Response: ${POST_LOGOUT_STATUS}"

# For this test, we expect it to fail
if echo "$POST_LOGOUT_STATUS" | jq -e '.message == "Unauthorized"' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Token correctly invalidated after logout${NC}"
else
    echo -e "${YELLOW}⚠ Token may still be valid (depends on implementation)${NC}"
fi
echo ""

# Test 10: Test invalid token
echo -e "${YELLOW}10. Testing Invalid Token (Should Fail)${NC}"
INVALID_TOKEN_RESPONSE=$(curl -s -X GET "${API_URL}/auth/status" \
  -H "Authorization: Bearer invalid-token-12345")

echo "Response: ${INVALID_TOKEN_RESPONSE}"

if echo "$INVALID_TOKEN_RESPONSE" | jq -e '.message == "Unauthorized"' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Invalid token correctly rejected${NC}"
else
    echo -e "${RED}✗ Invalid token not properly rejected${NC}"
fi
echo ""

# Test 11: Test missing auth header
echo -e "${YELLOW}11. Testing Missing Auth Header (Should Fail)${NC}"
NO_AUTH_RESPONSE=$(curl -s -X GET "${API_URL}/auth/status")

echo "Response: ${NO_AUTH_RESPONSE}"

if echo "$NO_AUTH_RESPONSE" | jq -e '.message == "Unauthorized"' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Missing auth header correctly rejected${NC}"
else
    echo -e "${RED}✗ Missing auth header not properly rejected${NC}"
fi
echo ""

# Test 12: Test duplicate registration (should fail)
echo -e "${YELLOW}12. Testing Duplicate Registration (Should Fail)${NC}"
DUPLICATE_RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"name\": \"${TEST_NAME}\",
    \"company\": \"${TEST_COMPANY}\"
  }")

echo "Response: ${DUPLICATE_RESPONSE}"

if echo "$DUPLICATE_RESPONSE" | jq -e '.success == false' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Duplicate registration correctly prevented${NC}"
else
    echo -e "${RED}✗ Duplicate registration not prevented${NC}"
fi
echo ""

# Summary
echo -e "${YELLOW}=== TEST SUMMARY ===${NC}"
echo "Test user created: ${TEST_EMAIL}"
echo "User ID: ${USER_ID}"
echo "Account ID: ${ACCOUNT_ID}"
echo ""
echo -e "${GREEN}All auth endpoint tests completed!${NC}"