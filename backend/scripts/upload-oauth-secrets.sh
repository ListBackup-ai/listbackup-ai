#!/bin/bash

# Upload OAuth Secrets to AWS Secrets Manager
# This script uploads all OAuth client IDs and secrets for various platforms

echo "🔐 Uploading OAuth credentials to AWS Secrets Manager..."

# Set AWS profile
AWS_PROFILE="listbackup.ai"

# Function to create or update a secret
upload_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    echo "📤 Uploading $secret_name..."
    
    # Check if secret exists
    if aws secretsmanager describe-secret --secret-id "$secret_name" --profile "$AWS_PROFILE" 2>/dev/null; then
        # Update existing secret
        aws secretsmanager update-secret \
            --secret-id "$secret_name" \
            --secret-string "$secret_value" \
            --profile "$AWS_PROFILE"
        echo "✅ Updated $secret_name"
    else
        # Create new secret
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --description "$description" \
            --secret-string "$secret_value" \
            --profile "$AWS_PROFILE"
        echo "✅ Created $secret_name"
    fi
}

# Google OAuth
upload_secret "app/oauth/google/client_id" \
    "711602602927-08rm88vil0gak6cu9pnki767t1n36pkv.apps.googleusercontent.com" \
    "Google OAuth Client ID for ListBackup.ai"

# Note: You'll need to add the client secret manually
echo "⚠️  Remember to upload app/oauth/google/client_secret manually"

# HubSpot OAuth
upload_secret "app/oauth/hubspot/client_id" \
    "e11e9b4f-468e-402b-92da-90e9ba4658ac" \
    "HubSpot OAuth Client ID for ListBackup.ai"

echo "⚠️  Remember to upload app/oauth/hubspot/client_secret manually"

# GoHighLevel OAuth
upload_secret "app/oauth/ghl/client_id" \
    "67a18506d0c00c53779aea39-m6px2qki" \
    "GoHighLevel OAuth Client ID for ListBackup.ai"

echo "⚠️  Remember to upload app/oauth/ghl/client_secret manually"

# Dropbox OAuth
upload_secret "app/oauth/dropbox/client_id" \
    "ruqprebg7njvlkd" \
    "Dropbox OAuth Client ID for ListBackup.ai"

echo "⚠️  Remember to upload app/oauth/dropbox/client_secret manually"

# Box OAuth
upload_secret "app/oauth/box/client_id" \
    "yj1xr1ov7w1nmwslx7b3cac1ooo2pbnk" \
    "Box OAuth Client ID for ListBackup.ai"

echo "⚠️  Remember to upload app/oauth/box/client_secret manually"

# QuickBooks OAuth
upload_secret "app/oauth/quickbooks/client_id" \
    "ABM3ihX7LbyIRPalDESlY55H6iQXqtTqZRXJrv1qp5411HsTqJ" \
    "QuickBooks OAuth Client ID for ListBackup.ai"

echo "⚠️  Remember to upload app/oauth/quickbooks/client_secret manually"

# Shopify OAuth (placeholder - needs actual client ID)
echo "⚠️  Shopify OAuth credentials need to be created and uploaded:"
echo "    - app/oauth/shopify/client_id"
echo "    - app/oauth/shopify/client_secret"

# Keap OAuth (placeholder - needs actual client ID)
echo "⚠️  Keap OAuth credentials need to be created and uploaded:"
echo "    - app/oauth/keap/client_id"
echo "    - app/oauth/keap/client_secret"

# Stripe OAuth (placeholder - needs actual client ID)
echo "⚠️  Stripe OAuth credentials need to be created and uploaded:"
echo "    - app/oauth/stripe/client_id"
echo "    - app/oauth/stripe/client_secret"

echo ""
echo "✅ OAuth client IDs uploaded successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Upload the client secrets for each platform manually (for security)"
echo "2. Create OAuth apps for Shopify, Keap, and Stripe if not already done"
echo "3. Update the secrets with the actual values"
echo ""
echo "To upload a client secret manually, use:"
echo "aws secretsmanager create-secret --name 'app/oauth/{platform}/client_secret' --secret-string 'YOUR_SECRET' --profile listbackup.ai"