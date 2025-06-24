#!/bin/bash

# Script to get auth token for testing

API_BASE_URL="https://b554ytt8w9.execute-api.us-west-2.amazonaws.com"

echo "Login to get auth token"
echo "======================="

# Check if email and password are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <email> <password>"
    echo "Example: $0 test@example.com mypassword"
    exit 1
fi

EMAIL=$1
PASSWORD=$2

echo "Logging in with email: $EMAIL"
echo ""

# Make login request
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
    "$API_BASE_URL/auth/login")

# Extract token from response
token=$(echo $response | jq -r '.data.idToken' 2>/dev/null)

if [ "$token" == "null" ] || [ -z "$token" ]; then
    echo "Login failed. Response:"
    echo $response | jq '.' 2>/dev/null || echo $response
    exit 1
fi

echo "Login successful!"
echo ""
echo "Your auth token is:"
echo "==================="
echo $token
echo ""
echo "To test the platforms API, run:"
echo "./test-platforms.sh \"$token\""
echo ""