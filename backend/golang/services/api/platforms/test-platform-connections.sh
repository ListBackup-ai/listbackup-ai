#!/bin/bash

# Platform Connections Service Test Script
# This script tests all platform connection endpoints

# Configuration
BASE_URL="https://dev.api.listbackup.ai"
API_PREFIX=""

# Test user credentials (replace with actual test credentials)
TEST_EMAIL="platformtest@example.com"
TEST_PASSWORD="PlatformTest123!"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to handle API responses
handle_response() {
    local response=$1
    local endpoint=$2
    
    if [ -z "$response" ]; then
        print_error "$endpoint: Empty response"
        return 1
    fi
    
    # Check if response contains an error
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        local error=$(echo "$response" | jq -r '.error')
        print_error "$endpoint: $error"
        return 1
    fi
    
    print_success "$endpoint"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    return 0
}

# Login to get JWT token
print_info "Logging in to get JWT token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL$API_PREFIX/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken' 2>/dev/null)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    print_error "Failed to get authentication token"
    echo "Login response: $LOGIN_RESPONSE"
    exit 1
fi

print_success "Authentication successful"

# Test 1: List Platforms
echo -e "\n${YELLOW}=== Test 1: List Platforms ===${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL$API_PREFIX/platforms" \
  -H "Authorization: Bearer $TOKEN")
handle_response "$RESPONSE" "GET /platforms"

# Test 2: Get Specific Platform (Google)
echo -e "\n${YELLOW}=== Test 2: Get Google Platform ===${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL$API_PREFIX/platforms/google" \
  -H "Authorization: Bearer $TOKEN")
handle_response "$RESPONSE" "GET /platforms/google"

# Test 3: List Platform Sources for Google
echo -e "\n${YELLOW}=== Test 3: List Google Platform Sources ===${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL$API_PREFIX/platforms/google/sources" \
  -H "Authorization: Bearer $TOKEN")
handle_response "$RESPONSE" "GET /platforms/google/sources"

# Test 4: Get Specific Platform Source
echo -e "\n${YELLOW}=== Test 4: Get Google Analytics Source ===${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL$API_PREFIX/platforms/google/sources/analytics" \
  -H "Authorization: Bearer $TOKEN")
handle_response "$RESPONSE" "GET /platforms/google/sources/analytics"

# Test 5: List Platform Connections for Google
echo -e "\n${YELLOW}=== Test 5: List Google Platform Connections ===${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL$API_PREFIX/platforms/google/connections" \
  -H "Authorization: Bearer $TOKEN")
handle_response "$RESPONSE" "GET /platforms/google/connections"

# Test 6: Create Platform Connection with API Key
echo -e "\n${YELLOW}=== Test 6: Create Platform Connection (API Key) ===${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL$API_PREFIX/platforms/google/connections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Google Connection",
    "authType": "apikey",
    "credentials": {
      "apiKey": "test-api-key-123"
    }
  }')
handle_response "$RESPONSE" "POST /platforms/google/connections"

# Test 7: Start OAuth Flow for Google
echo -e "\n${YELLOW}=== Test 7: Start OAuth Flow ===${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL$API_PREFIX/platforms/google/oauth/start" \
  -H "Authorization: Bearer $TOKEN")
handle_response "$RESPONSE" "GET /platforms/google/oauth/start"

# Extract OAuth URL if successful
if [ $? -eq 0 ]; then
    AUTH_URL=$(echo "$RESPONSE" | jq -r '.data.authUrl' 2>/dev/null)
    if [ "$AUTH_URL" != "null" ] && [ -n "$AUTH_URL" ]; then
        print_info "OAuth URL: $AUTH_URL"
    fi
fi

# Test 8: Test OAuth Callback (this will fail without valid OAuth code)
echo -e "\n${YELLOW}=== Test 8: OAuth Callback (Expected to Fail) ===${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL$API_PREFIX/platforms/oauth/callback?code=test&state=test" \
  -H "Authorization: Bearer $TOKEN")
# We expect this to fail, so we just display the response
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Test 9: Create Platform Connection with Missing Fields
echo -e "\n${YELLOW}=== Test 9: Create Connection - Missing Fields (Expected to Fail) ===${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL$API_PREFIX/platforms/google/connections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Connection"
  }')
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Test 10: Test with Invalid Platform ID
echo -e "\n${YELLOW}=== Test 10: Invalid Platform ID (Expected to Fail) ===${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL$API_PREFIX/platforms/invalid-platform/connections" \
  -H "Authorization: Bearer $TOKEN")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo -e "\n${GREEN}=== Platform Connections Tests Complete ===${NC}"