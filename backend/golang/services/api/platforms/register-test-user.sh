#!/bin/bash

# Register a test user for platforms testing
echo "Registering test user..."

curl -X POST https://b554ytt8w9.execute-api.us-west-2.amazonaws.com/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"platforms-test@listbackup.ai","password":"Test123!","name":"Platforms Test User"}'

echo ""