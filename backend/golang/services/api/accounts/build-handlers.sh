#!/bin/bash

# Build script for accounts service Lambda functions

echo "Building accounts service Lambda functions..."

# Set variables
HANDLERS_DIR="/Users/nickkulavic/Projects/listbackup.ai/listbackup-ai-v2/backend/golang/cmd/handlers/accounts"
BIN_DIR="./bin/accounts"

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
    if [ -d "$HANDLERS_DIR/$handler" ]; then
        # Build for Linux ARM64 (Lambda runtime)
        GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -tags lambda.norpc -o "$BIN_DIR/${handler}_bootstrap" "$HANDLERS_DIR/$handler/main.go"
        
        if [ -f "$BIN_DIR/${handler}_bootstrap" ]; then
            # Create zip file
            (cd "$BIN_DIR" && zip -j "$handler.zip" "${handler}_bootstrap" && rm "${handler}_bootstrap")
            echo "✓ Built $handler"
        else
            echo "❌ Build failed for $handler"
        fi
    else
        echo "⚠️  Handler $handler not found"
    fi
done

echo "✅ All accounts service handlers processed!"
echo "Binaries are in: $BIN_DIR"