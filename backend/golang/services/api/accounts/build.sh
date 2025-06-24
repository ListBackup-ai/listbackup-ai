#!/bin/bash

# Build script for accounts service Lambda functions

echo "Building accounts service Lambda functions..."

# Set variables
SERVICE_DIR=$(cd "$(dirname "$0")" && pwd)
CMD_DIR="$SERVICE_DIR/../../../cmd/handlers/accounts"
BIN_DIR="$SERVICE_DIR/bin/accounts"

# Create bin directory
mkdir -p "$BIN_DIR"

# Build each handler
HANDLERS=(
    "list"
    "create"
    "get"
    "update"
    "delete"
    "create-sub-account"
    "list-hierarchy"
    "switch-context"
)

for handler in "${HANDLERS[@]}"; do
    echo "Building $handler..."
    if [ -d "$CMD_DIR/$handler" ]; then
        cd "$CMD_DIR/$handler" || exit 1
        
        # Build for Linux ARM64 (Lambda runtime)
        GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -tags lambda.norpc -o bootstrap main.go
        
        if [ -f bootstrap ]; then
            # Create zip file
            zip -j "$BIN_DIR/$handler.zip" bootstrap
            
            # Clean up
            rm bootstrap
            
            echo "✓ Built $handler"
        else
            echo "❌ Build failed for $handler"
        fi
    else
        echo "⚠️  Handler $handler not found at $CMD_DIR/$handler"
    fi
done

# No need for missing handlers section since all are included above

echo "✅ All accounts service handlers processed!"
echo "Binaries are in: $BIN_DIR"
echo ""