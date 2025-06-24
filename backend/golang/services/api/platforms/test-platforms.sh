#!/bin/bash

# Test script for platforms service endpoints

# Configuration
API_BASE_URL="https://b554ytt8w9.execute-api.us-west-2.amazonaws.com"
AUTH_TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Platforms Service API Tests"
echo "========================================="
echo ""

# Function to make API requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}Test: $description${NC}"
    echo "Method: $method"
    echo "Endpoint: $endpoint"
    
    if [ -n "$data" ]; then
        echo "Request Body: $data"
    fi
    
    echo "Response:"
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -X GET \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            "$API_BASE_URL$endpoint" | jq '.' 2>/dev/null || echo "Failed to parse JSON")
    else
        response=$(curl -s -X POST \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE_URL$endpoint" | jq '.' 2>/dev/null || echo "Failed to parse JSON")
    fi
    
    # Check if response contains error
    if echo "$response" | grep -q "error\|Error\|UnauthorizedException"; then
        echo -e "${RED}$response${NC}"
    else
        echo -e "${GREEN}$response${NC}"
    fi
    
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Check if auth token is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide an authorization token${NC}"
    echo "Usage: $0 <auth_token> [platform_id] [platform_source_id]"
    echo ""
    echo "You need to login first to get an auth token:"
    echo "curl -X POST $API_BASE_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"your_email\",\"password\":\"your_password\"}'"
    exit 1
fi

AUTH_TOKEN=$1
PLATFORM_ID=${2:-"platform:keap"}  # Default to keap if not provided
PLATFORM_SOURCE_ID=${3:-"platform-source:keap:contacts"}  # Default to contacts if not provided

echo "Using auth token: ${AUTH_TOKEN:0:20}..."
echo ""

# Test 1: List all platforms
make_request "GET" "/platforms" "" "List all available platforms"

# Test 2: Get specific platform details
make_request "GET" "/platforms/$PLATFORM_ID" "" "Get details for platform: $PLATFORM_ID"

# Test 3: List platform sources
make_request "GET" "/platforms/$PLATFORM_ID/sources" "" "List data sources for platform: $PLATFORM_ID"

# Test 4: Get specific platform source
make_request "GET" "/platforms/$PLATFORM_ID/sources/$PLATFORM_SOURCE_ID" "" "Get details for platform source: $PLATFORM_ID/$PLATFORM_SOURCE_ID"

# Test 5: List platform connections
make_request "GET" "/platforms/$PLATFORM_ID/connections" "" "List connections for platform: $PLATFORM_ID"

# Test 6: Create platform connection (example)
connection_data='{
    "name": "Test Connection",
    "description": "Test connection created by test script",
    "authType": "oauth",
    "config": {
        "clientId": "test_client_id",
        "clientSecret": "test_client_secret"
    }
}'
make_request "POST" "/platforms/$PLATFORM_ID/connections" "$connection_data" "Create new connection for platform: $PLATFORM_ID"

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""
echo "All tests completed. Check the responses above for any errors."
echo ""
echo "Note: If you see 'Unauthorized' errors, your token may have expired."
echo "Get a new token by logging in again."
echo ""