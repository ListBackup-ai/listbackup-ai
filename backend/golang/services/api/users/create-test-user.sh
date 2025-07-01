#!/bin/bash

# Script to create a test user for testing purposes

API_BASE_URL="https://dev.api.listbackup.ai"
REGISTER_ENDPOINT="${API_BASE_URL}/auth/register"

# Generate a unique test email
TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="Test User ${TIMESTAMP}"
TEST_PHONE="+15551234567"

echo "Creating test user..."
echo "Email: ${TEST_EMAIL}"
echo "Password: ${TEST_PASSWORD}"

# Register the user
RESPONSE=$(curl -s -X POST "${REGISTER_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${TEST_EMAIL}\",
        \"password\": \"${TEST_PASSWORD}\",
        \"name\": \"${TEST_NAME}\",
        \"phoneNumber\": \"${TEST_PHONE}\"
    }")

echo -e "\nRegistration Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "\n✓ Test user created successfully!"
    echo -e "\nYou can now run the test script with:"
    echo "export TEST_EMAIL=\"${TEST_EMAIL}\""
    echo "export TEST_PASSWORD=\"${TEST_PASSWORD}\""
    echo "./test-self-service.sh"
else
    echo -e "\n✗ Failed to create test user"
fi