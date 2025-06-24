#!/bin/bash

# Script to seed platforms table with OAuth provider data
# Run with: AWS_PROFILE=listbackup.ai ./scripts/seed-platforms.sh

set -e

TABLE_NAME="listbackup-main-platforms"
REGION="us-east-1"

echo "Seeding platforms table: $TABLE_NAME"

# Function to create platform
create_platform() {
    local platform_id="$1"
    local name="$2"
    local description="$3"
    local category="$4"
    local website="$5"
    local requires_oauth="$6"
    local features="$7"

    # Check if platform already exists
    local existing_item=$(aws dynamodb get-item --table-name "$TABLE_NAME" --region "$REGION" --key "{\"platformId\":{\"S\":\"$platform_id\"}}" --output text --query 'Item' 2>/dev/null)
    if [ -n "$existing_item" ] && [ "$existing_item" != "None" ]; then
        echo "Platform $name already exists, skipping"
        return 0
    fi

    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    echo "Creating platform: $name"
    
    aws dynamodb put-item --table-name "$TABLE_NAME" --region "$REGION" --item "{
        \"platformId\": {\"S\": \"$platform_id\"},
        \"name\": {\"S\": \"$name\"},
        \"description\": {\"S\": \"$description\"},
        \"category\": {\"S\": \"$category\"},
        \"website\": {\"S\": \"$website\"},
        \"logoUrl\": {\"S\": \"https://logos.listbackup.ai/$platform_id.png\"},
        \"requiresOAuth\": {\"BOOL\": $requires_oauth},
        \"isActive\": {\"BOOL\": true},
        \"supportedFeatures\": {\"SS\": [$features]},
        \"createdAt\": {\"S\": \"$timestamp\"},
        \"updatedAt\": {\"S\": \"$timestamp\"}
    }"
    
    if [ $? -eq 0 ]; then
        echo "✅ Created platform: $name"
    else
        echo "❌ Failed to create platform: $name"
    fi
}

# OAuth-enabled platforms from the OAuth configuration
create_platform "gohighlevel" "GoHighLevel" "All-in-one marketing and CRM platform" "CRM" "https://gohighlevel.com" "true" "\"contacts\",\"opportunities\",\"campaigns\""

create_platform "hubspot" "HubSpot" "Inbound marketing, sales, and customer service platform" "CRM" "https://hubspot.com" "true" "\"contacts\",\"companies\",\"deals\",\"tickets\""

create_platform "google" "Google Workspace" "Google's suite of productivity and collaboration tools" "Productivity" "https://workspace.google.com" "true" "\"drive\",\"sheets\",\"calendar\",\"contacts\""

create_platform "dropbox" "Dropbox" "Cloud storage and file synchronization service" "Storage" "https://dropbox.com" "true" "\"files\",\"folders\",\"sharing\""

create_platform "box" "Box" "Enterprise cloud content management platform" "Storage" "https://box.com" "true" "\"files\",\"folders\",\"collaboration\""

create_platform "quickbooks" "QuickBooks" "Accounting software for small and medium businesses" "Accounting" "https://quickbooks.intuit.com" "true" "\"customers\",\"invoices\",\"payments\",\"items\""

create_platform "shopify" "Shopify" "E-commerce platform for online stores and retail POS" "E-commerce" "https://shopify.com" "true" "\"products\",\"orders\",\"customers\",\"inventory\""

# Additional platforms that have connectors but may not be OAuth
create_platform "mailchimp" "Mailchimp" "Email marketing and automation platform" "Email Marketing" "https://mailchimp.com" "true" "\"lists\",\"campaigns\",\"members\",\"reports\""

create_platform "activecampaign" "ActiveCampaign" "Email marketing, marketing automation, and CRM platform" "Email Marketing" "https://activecampaign.com" "false" "\"contacts\",\"deals\",\"campaigns\""

create_platform "zendesk" "Zendesk" "Customer service and support ticket platform" "Customer Support" "https://zendesk.com" "false" "\"tickets\",\"users\",\"organizations\""

echo ""
echo "Platform seeding complete!"
echo ""
echo "Verifying platforms were created:"
aws dynamodb scan --table-name "$TABLE_NAME" --region "$REGION" --output table --query 'Items[*].{PlatformID:platformId.S,Name:name.S,Category:category.S,OAuth:requiresOAuth.BOOL}'