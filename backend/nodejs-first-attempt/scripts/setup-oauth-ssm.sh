#!/bin/bash

# Script to set up OAuth configuration in AWS Systems Manager Parameter Store
# Run this script to configure OAuth client IDs and secrets for various integrations

# Set your AWS profile
AWS_PROFILE=${AWS_PROFILE:-listbackup.ai}
REGION=${AWS_REGION:-us-east-1}

echo "Setting up OAuth configuration in AWS SSM Parameter Store..."
echo "Using AWS Profile: $AWS_PROFILE"
echo "Region: $REGION"

# Function to create or update SSM parameter
put_parameter() {
    local name=$1
    local value=$2
    local description=$3
    
    echo "Setting parameter: $name"
    aws ssm put-parameter \
        --name "$name" \
        --value "$value" \
        --type "SecureString" \
        --description "$description" \
        --overwrite \
        --profile "$AWS_PROFILE" \
        --region "$REGION" 2>/dev/null || echo "Failed to set $name"
}

# HubSpot OAuth Configuration
# Get these from: https://developers.hubspot.com/
put_parameter "/listbackup/oauth/hubspot/client-id" "YOUR_HUBSPOT_CLIENT_ID" "HubSpot OAuth Client ID"
put_parameter "/listbackup/oauth/hubspot/client-secret" "YOUR_HUBSPOT_CLIENT_SECRET" "HubSpot OAuth Client Secret"

# Google OAuth Configuration  
# Get these from: https://console.cloud.google.com/apis/credentials
put_parameter "/listbackup/oauth/google/client-id" "YOUR_GOOGLE_CLIENT_ID" "Google OAuth Client ID"
put_parameter "/listbackup/oauth/google/client-secret" "YOUR_GOOGLE_CLIENT_SECRET" "Google OAuth Client Secret"

# Dropbox OAuth Configuration
# Get these from: https://www.dropbox.com/developers/apps
put_parameter "/listbackup/oauth/dropbox/client-id" "YOUR_DROPBOX_CLIENT_ID" "Dropbox OAuth Client ID"
put_parameter "/listbackup/oauth/dropbox/client-secret" "YOUR_DROPBOX_CLIENT_SECRET" "Dropbox OAuth Client Secret"

# Box OAuth Configuration
# Get these from: https://app.box.com/developers/console
put_parameter "/listbackup/oauth/box/client-id" "YOUR_BOX_CLIENT_ID" "Box OAuth Client ID"
put_parameter "/listbackup/oauth/box/client-secret" "YOUR_BOX_CLIENT_SECRET" "Box OAuth Client Secret"

# Shopify OAuth Configuration
# Get these from: https://partners.shopify.com/
put_parameter "/listbackup/oauth/shopify/client-id" "YOUR_SHOPIFY_CLIENT_ID" "Shopify OAuth Client ID"
put_parameter "/listbackup/oauth/shopify/client-secret" "YOUR_SHOPIFY_CLIENT_SECRET" "Shopify OAuth Client Secret"

# Frontend URL (for OAuth redirects)
put_parameter "/listbackup/frontend-url" "https://app.listbackup.ai" "Frontend URL for OAuth redirects"

# CORS Origin
put_parameter "/listbackup/cors-origin" "https://app.listbackup.ai" "CORS allowed origin"

echo "OAuth configuration setup complete!"
echo ""
echo "Next steps:"
echo "1. Replace YOUR_*_CLIENT_ID and YOUR_*_CLIENT_SECRET with actual values"
echo "2. For each OAuth provider, add the following redirect URI:"
echo "   https://api.listbackup.ai/integrations/{provider}/oauth/callback"
echo "   Where {provider} is: hubspot, google, dropbox, box, or shopify"
echo ""
echo "Example redirect URIs to add in provider dashboards:"
echo "- HubSpot: https://api.listbackup.ai/integrations/hubspot/oauth/callback"
echo "- Google: https://api.listbackup.ai/integrations/google/oauth/callback"
echo "- Dropbox: https://api.listbackup.ai/integrations/dropbox/oauth/callback"
echo "- Box: https://api.listbackup.ai/integrations/box/oauth/callback"
echo "- Shopify: https://api.listbackup.ai/integrations/shopify/oauth/callback"