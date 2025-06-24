#!/bin/bash

# Build script for users service Lambda functions

echo "Building users service Lambda functions..."

# Set variables
SERVICE_DIR=$(cd "$(dirname "$0")" && pwd)
CMD_DIR="$SERVICE_DIR/../../../cmd/handlers/users"
BIN_DIR="$SERVICE_DIR/bin/users"

# Create bin directory
mkdir -p "$BIN_DIR"

# Build each handler
HANDLERS=(
    "get-me"
    "update-profile"
    "get-settings"
    "update-settings"
    "get-user-accounts"
)

for handler in "${HANDLERS[@]}"; do
    echo "Building $handler..."
    cd "$CMD_DIR/$handler" || exit 1
    
    # Build for Linux ARM64 (Lambda runtime)
    GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o bootstrap main.go
    
    # Create zip file
    zip -j "$BIN_DIR/$handler.zip" bootstrap
    
    # Clean up
    rm bootstrap
    
    echo "✓ Built $handler"
done

echo "✅ All users service handlers built successfully!"
echo "Binaries are in: $BIN_DIR"