#!/bin/bash

# Add platforms to dev environment with correct table names
echo "Adding platforms to DynamoDB dev environment..."

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Add Google platform
aws dynamodb put-item \
  --table-name listbackup-dev-platforms \
  --item '{
    "platformId": {"S": "platform:google"},
    "name": {"S": "Google"},
    "displayName": {"S": "Google"},
    "category": {"S": "Analytics"},
    "description": {"S": "Google Analytics, Search Console, and other Google services"},
    "icon": {"S": "google"},
    "status": {"S": "active"},
    "dataTypes": {"L": [
      {"S": "analytics"},
      {"S": "search_console"},
      {"S": "ads"},
      {"S": "my_business"}
    ]},
    "supportedScopes": {"L": [
      {"S": "https://www.googleapis.com/auth/analytics.readonly"},
      {"S": "https://www.googleapis.com/auth/webmasters.readonly"},
      {"S": "https://www.googleapis.com/auth/adwords"}
    ]},
    "apiConfig": {"M": {
      "authType": {"S": "oauth"},
      "baseUrl": {"S": "https://www.googleapis.com"},
      "rateLimit": {"N": "1000"},
      "headers": {"M": {}},
      "customConfig": {"M": {}}
    }},
    "oauth": {"M": {
      "clientId": {"S": "test-client-id"},
      "clientSecret": {"S": "test-client-secret"},
      "authUrl": {"S": "https://accounts.google.com/o/oauth2/v2/auth"},
      "tokenUrl": {"S": "https://oauth2.googleapis.com/token"},
      "scopes": {"L": [
        {"S": "https://www.googleapis.com/auth/analytics.readonly"},
        {"S": "https://www.googleapis.com/auth/webmasters.readonly"}
      ]},
      "responseType": {"S": "code"}
    }},
    "createdAt": {"S": "'$TIMESTAMP'"},
    "updatedAt": {"S": "'$TIMESTAMP'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

echo "Google platform added"

# Add Shopify platform
aws dynamodb put-item \
  --table-name listbackup-dev-platforms \
  --item '{
    "platformId": {"S": "platform:shopify"},
    "name": {"S": "Shopify"},
    "displayName": {"S": "Shopify"},
    "category": {"S": "E-commerce"},
    "description": {"S": "Shopify store data including products, orders, and customers"},
    "icon": {"S": "shopify"},
    "status": {"S": "active"},
    "dataTypes": {"L": [
      {"S": "products"},
      {"S": "orders"},
      {"S": "customers"},
      {"S": "inventory"}
    ]},
    "supportedScopes": {"L": [
      {"S": "read_products"},
      {"S": "read_orders"},
      {"S": "read_customers"},
      {"S": "read_inventory"}
    ]},
    "apiConfig": {"M": {
      "authType": {"S": "oauth"},
      "baseUrl": {"S": "https://{shop}.myshopify.com"},
      "rateLimit": {"N": "40"},
      "headers": {"M": {
        "X-Shopify-Access-Token": {"S": "{access_token}"}
      }},
      "customConfig": {"M": {
        "apiVersion": {"S": "2024-01"}
      }}
    }},
    "oauth": {"M": {
      "clientId": {"S": "test-shopify-client"},
      "clientSecret": {"S": "test-shopify-secret"},
      "authUrl": {"S": "https://{shop}.myshopify.com/admin/oauth/authorize"},
      "tokenUrl": {"S": "https://{shop}.myshopify.com/admin/oauth/access_token"},
      "scopes": {"L": [
        {"S": "read_products"},
        {"S": "read_orders"},
        {"S": "read_customers"}
      ]},
      "responseType": {"S": "code"}
    }},
    "createdAt": {"S": "'$TIMESTAMP'"},
    "updatedAt": {"S": "'$TIMESTAMP'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

echo "Shopify platform added"

# Add Facebook platform
aws dynamodb put-item \
  --table-name listbackup-dev-platforms \
  --item '{
    "platformId": {"S": "platform:facebook"},
    "name": {"S": "Facebook"},
    "displayName": {"S": "Facebook"},
    "category": {"S": "Social Media"},
    "description": {"S": "Facebook Pages, Groups, and Insights data"},
    "icon": {"S": "facebook"},
    "status": {"S": "active"},
    "dataTypes": {"L": [
      {"S": "pages"},
      {"S": "posts"},
      {"S": "insights"},
      {"S": "ads"}
    ]},
    "supportedScopes": {"L": [
      {"S": "pages_read_engagement"},
      {"S": "pages_show_list"},
      {"S": "read_insights"}
    ]},
    "apiConfig": {"M": {
      "authType": {"S": "oauth"},
      "baseUrl": {"S": "https://graph.facebook.com"},
      "rateLimit": {"N": "200"},
      "headers": {"M": {}},
      "customConfig": {"M": {
        "apiVersion": {"S": "v18.0"}
      }}
    }},
    "oauth": {"M": {
      "clientId": {"S": "test-facebook-app-id"},
      "clientSecret": {"S": "test-facebook-secret"},
      "authUrl": {"S": "https://www.facebook.com/v18.0/dialog/oauth"},
      "tokenUrl": {"S": "https://graph.facebook.com/v18.0/oauth/access_token"},
      "scopes": {"L": [
        {"S": "pages_read_engagement"},
        {"S": "pages_show_list"}
      ]},
      "responseType": {"S": "code"}
    }},
    "createdAt": {"S": "'$TIMESTAMP'"},
    "updatedAt": {"S": "'$TIMESTAMP'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

echo "Facebook platform added"

echo "All platforms added successfully!"

# Now add some platform sources for Google
echo -e "\nAdding platform sources for Google..."

# Google Analytics source
aws dynamodb put-item \
  --table-name listbackup-dev-platform-sources \
  --item '{
    "platformSourceId": {"S": "platform-source:analytics"},
    "platformId": {"S": "platform:google"},
    "name": {"S": "Google Analytics"},
    "description": {"S": "Website traffic, user behavior, and conversion data"},
    "category": {"S": "Analytics"},
    "dataType": {"S": "analytics"},
    "status": {"S": "active"},
    "popularity": {"N": "100"},
    "features": {"L": [
      {"S": "real-time-data"},
      {"S": "historical-data"},
      {"S": "custom-reports"}
    ]},
    "requiredScopes": {"L": [
      {"S": "https://www.googleapis.com/auth/analytics.readonly"}
    ]},
    "dataPoints": {"L": [
      {"S": "sessions"},
      {"S": "users"},
      {"S": "pageviews"},
      {"S": "conversions"}
    ]},
    "createdAt": {"S": "'$TIMESTAMP'"},
    "updatedAt": {"S": "'$TIMESTAMP'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

echo "Google Analytics source added"

# Google Search Console source
aws dynamodb put-item \
  --table-name listbackup-dev-platform-sources \
  --item '{
    "platformSourceId": {"S": "platform-source:search-console"},
    "platformId": {"S": "platform:google"},
    "name": {"S": "Search Console"},
    "description": {"S": "Search performance, indexing status, and site issues"},
    "category": {"S": "SEO"},
    "dataType": {"S": "search_console"},
    "status": {"S": "active"},
    "popularity": {"N": "85"},
    "features": {"L": [
      {"S": "search-queries"},
      {"S": "page-performance"},
      {"S": "index-coverage"}
    ]},
    "requiredScopes": {"L": [
      {"S": "https://www.googleapis.com/auth/webmasters.readonly"}
    ]},
    "dataPoints": {"L": [
      {"S": "impressions"},
      {"S": "clicks"},
      {"S": "position"},
      {"S": "ctr"}
    ]},
    "createdAt": {"S": "'$TIMESTAMP'"},
    "updatedAt": {"S": "'$TIMESTAMP'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

echo "Search Console source added"

echo -e "\nAll platforms and sources added successfully!"