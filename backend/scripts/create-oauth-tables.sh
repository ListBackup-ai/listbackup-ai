#!/bin/bash

# Create DynamoDB table for OAuth states
# This table stores temporary OAuth state tokens during the OAuth flow

echo "🔨 Creating OAuth states DynamoDB table..."

AWS_PROFILE="listbackup.ai"

# Create oauth-states table
aws dynamodb create-table \
    --table-name oauth-states \
    --attribute-definitions \
        AttributeName=state,AttributeType=S \
    --key-schema \
        AttributeName=state,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --tags \
        Key=Environment,Value=production \
        Key=Application,Value=listbackup \
        Key=Purpose,Value=oauth-flow \
    --profile "$AWS_PROFILE"

if [ $? -eq 0 ]; then
    echo "✅ OAuth states table created successfully"
else
    echo "❌ Failed to create OAuth states table (may already exist)"
fi

# Enable TTL on the table
echo "⏰ Enabling TTL on oauth-states table..."
aws dynamodb update-time-to-live \
    --table-name oauth-states \
    --time-to-live-specification "Enabled=true,AttributeName=ttl" \
    --profile "$AWS_PROFILE"

if [ $? -eq 0 ]; then
    echo "✅ TTL enabled on oauth-states table"
else
    echo "❌ Failed to enable TTL on oauth-states table"
fi

echo ""
echo "✅ OAuth infrastructure setup complete!"
echo ""
echo "Next steps:"
echo "1. Run ./upload-oauth-secrets.sh to upload OAuth credentials"
echo "2. Deploy the Go Lambda functions"
echo "3. Update serverless configurations with OAuth endpoints"