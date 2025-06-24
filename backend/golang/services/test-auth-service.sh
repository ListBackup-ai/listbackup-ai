#!/bin/bash

# Test script for auth service endpoints

API_URL="https://b554ytt8w9.execute-api.us-west-2.amazonaws.com"
TIMESTAMP=$(date +%s)

echo "Testing Auth Service Endpoints..."
echo "================================"

# Test 1: User Registration
echo -e "\n1. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nick+test'${TIMESTAMP}'@listbackup.ai",
    "password": "SecurePass123!",
    "name": "Test User '${TIMESTAMP}'",
    "company": "Test Company"
  }')

echo "Response: ${REGISTER_RESPONSE}"

# Extract userId if registration was successful
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.userId // empty')

if [ -n "$USER_ID" ]; then
  echo "✓ Registration successful. User ID: ${USER_ID}"
else
  echo "✗ Registration failed"
fi

# Test 2: User Login
echo -e "\n2. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nick+test'${TIMESTAMP}'@listbackup.ai",
    "password": "SecurePass123!"
  }')

echo "Response: ${LOGIN_RESPONSE}"

# Extract tokens
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // empty')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.refreshToken // empty')

if [ -n "$ACCESS_TOKEN" ]; then
  echo "✓ Login successful. Access token received."
else
  echo "✗ Login failed"
  exit 1
fi

# Test 3: Auth Status (Protected Endpoint)
echo -e "\n3. Testing Auth Status (Protected Endpoint)..."
STATUS_RESPONSE=$(curl -s -X GET "${API_URL}/auth/status" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Response: ${STATUS_RESPONSE}"

# Test 4: Token Refresh
echo -e "\n4. Testing Token Refresh..."
REFRESH_RESPONSE=$(curl -s -X POST "${API_URL}/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'${REFRESH_TOKEN}'"
  }')

echo "Response: ${REFRESH_RESPONSE}"

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.data.accessToken // empty')
if [ -n "$NEW_ACCESS_TOKEN" ]; then
  echo "✓ Token refresh successful"
else
  echo "✗ Token refresh failed"
fi

# Test 5: Get Profile (Protected Endpoint)
echo -e "\n5. Testing Get Profile (Protected Endpoint)..."
PROFILE_RESPONSE=$(curl -s -X GET "${API_URL}/auth/profile" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Response: ${PROFILE_RESPONSE}"

# Test 6: Get Available Accounts (Protected Endpoint)
echo -e "\n6. Testing Get Available Accounts (Protected Endpoint)..."
ACCOUNTS_RESPONSE=$(curl -s -X GET "${API_URL}/auth/accounts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Response: ${ACCOUNTS_RESPONSE}"

# Test 7: Logout
echo -e "\n7. Testing Logout..."
LOGOUT_RESPONSE=$(curl -s -X POST "${API_URL}/auth/logout" \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "'${ACCESS_TOKEN}'"
  }')

echo "Response: ${LOGOUT_RESPONSE}"

echo -e "\n================================"
echo "Auth Service Testing Complete"