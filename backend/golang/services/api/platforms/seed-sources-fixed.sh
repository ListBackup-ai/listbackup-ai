#!/bin/bash

# Add platform sources with correct date format
echo "Adding platform sources to DynamoDB..."

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Add Keap contacts source
aws dynamodb put-item \
  --table-name listbackup-main-platform-sources \
  --item '{
    "platformSourceId": {"S": "platform-source:keap:contacts"},
    "platformId": {"S": "platform:keap"},
    "name": {"S": "Contacts"},
    "sourceType": {"S": "contacts"},
    "description": {"S": "Keap contact records including custom fields"},
    "dataTypes": {"L": [
      {"S": "contacts"},
      {"S": "custom_fields"},
      {"S": "tags"},
      {"S": "notes"}
    ]},
    "supportedOperations": {"L": [
      {"S": "list"},
      {"S": "get"},
      {"S": "search"}
    ]},
    "endpoints": {"L": [
      {"M": {
        "method": {"S": "GET"},
        "path": {"S": "/crm/rest/v1/contacts"},
        "description": {"S": "List all contacts"}
      }},
      {"M": {
        "method": {"S": "GET"},
        "path": {"S": "/crm/rest/v1/contacts/{id}"},
        "description": {"S": "Get contact by ID"}
      }}
    ]},
    "syncConfiguration": {"M": {
      "defaultFrequency": {"S": "daily"},
      "incrementalSync": {"BOOL": true},
      "fullSyncInterval": {"N": "7"},
      "batchSize": {"N": "1000"},
      "estimatedRecordSize": {"N": "2048"}
    }},
    "status": {"S": "active"},
    "createdAt": {"S": "'$TIMESTAMP'"},
    "updatedAt": {"S": "'$TIMESTAMP'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

echo "Keap contacts source added"

# Add Keap campaigns source
aws dynamodb put-item \
  --table-name listbackup-main-platform-sources \
  --item '{
    "platformSourceId": {"S": "platform-source:keap:campaigns"},
    "platformId": {"S": "platform:keap"},
    "name": {"S": "Campaigns"},
    "sourceType": {"S": "campaigns"},
    "description": {"S": "Keap marketing campaigns and sequences"},
    "dataTypes": {"L": [
      {"S": "campaigns"},
      {"S": "sequences"},
      {"S": "emails"}
    ]},
    "supportedOperations": {"L": [
      {"S": "list"},
      {"S": "get"}
    ]},
    "endpoints": {"L": [
      {"M": {
        "method": {"S": "GET"},
        "path": {"S": "/crm/rest/v1/campaigns"},
        "description": {"S": "List all campaigns"}
      }}
    ]},
    "syncConfiguration": {"M": {
      "defaultFrequency": {"S": "daily"},
      "incrementalSync": {"BOOL": false},
      "fullSyncInterval": {"N": "1"},
      "batchSize": {"N": "100"},
      "estimatedRecordSize": {"N": "5120"}
    }},
    "status": {"S": "active"},
    "createdAt": {"S": "'$TIMESTAMP'"},
    "updatedAt": {"S": "'$TIMESTAMP'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

echo "Keap campaigns source added"

echo "All platform sources added successfully!"