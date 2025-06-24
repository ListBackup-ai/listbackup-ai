#!/bin/bash

# Build script for auth service Lambda functions

set -e

echo "Building auth service Lambda functions..."

# Base directories
CMD_DIR="../cmd/handlers/auth"
SERVICE_DIR="api/auth"

# Create bin directory in service
mkdir -p "${SERVICE_DIR}/bin/auth"

# List of auth handlers to build
handlers=(
    "register"
    "login" 
    "status"
    "refresh"
    "logout"
    "get-profile"
    "get-available-accounts"
)

# Build each handler
for handler in "${handlers[@]}"; do
    echo "Building ${handler}..."
    
    # Check if handler directory exists
    if [ -d "${CMD_DIR}/${handler}" ]; then
        # Build for Linux ARM64 (Lambda runtime)
        cd "${CMD_DIR}/${handler}"
        GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o bootstrap main.go
        
        # Create zip file
        zip -j "../../../${SERVICE_DIR}/bin/auth/${handler}.zip" bootstrap
        
        # Clean up
        rm -f bootstrap
        
        cd - > /dev/null
        
        echo "✓ ${handler} built successfully"
    else
        echo "✗ Warning: ${handler} directory not found at ${CMD_DIR}/${handler}"
    fi
done

echo "Auth service build complete!"
echo "Artifacts created in: ${SERVICE_DIR}/bin/auth/"