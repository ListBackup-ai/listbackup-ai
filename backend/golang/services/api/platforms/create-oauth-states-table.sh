#!/bin/bash

# Create OAuth states table for storing temporary OAuth state parameters

echo "Creating OAuth states table..."

aws dynamodb create-table \
  --table-name listbackup-dev-oauth-states \
  --attribute-definitions \
    AttributeName=stateId,AttributeType=S \
  --key-schema \
    AttributeName=stateId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --profile listbackup.ai \
  --region us-west-2

if [ $? -eq 0 ]; then
    echo "✓ OAuth states table created successfully"
    
    # Add TTL to automatically delete expired states
    echo "Enabling TTL on expiresAt attribute..."
    sleep 5  # Wait for table to be active
    
    aws dynamodb update-time-to-live \
      --table-name listbackup-dev-oauth-states \
      --time-to-live-specification "Enabled=true,AttributeName=expiresAt" \
      --profile listbackup.ai \
      --region us-west-2
    
    if [ $? -eq 0 ]; then
        echo "✓ TTL enabled on OAuth states table"
    else
        echo "Note: Failed to enable TTL, but table was created"
    fi
else
    echo "✗ Failed to create OAuth states table"
fi