#!/bin/bash

# Add a platform source for Keap
echo "Adding Keap contacts source to DynamoDB..."

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
    "createdAt": {"S": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"},
    "updatedAt": {"S": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}
  }' \
  --profile listbackup.ai \
  --region us-west-2

echo "Platform source added successfully!"