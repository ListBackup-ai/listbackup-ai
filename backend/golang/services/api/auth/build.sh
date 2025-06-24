#!/bin/bash

# Build script for auth service Lambda functions

echo "Building auth service Lambda functions..."

# Set variables
HANDLERS_DIR="/Users/nickkulavic/Projects/listbackup.ai/listbackup-ai-v2/backend/golang/cmd/handlers/auth"
BIN_DIR="./bin/auth"

# Create bin directory
mkdir -p "$BIN_DIR"

# Build each handler
HANDLERS=(
    "register"
    "login"
    "logout"
    "refresh"
    "status"
    "get-profile"
    "get-available-accounts"
)

for handler in "${HANDLERS[@]}"; do
    echo "Building $handler..."
    if [ -d "$HANDLERS_DIR/$handler" ]; then
        # Build for Linux ARM64 (Lambda runtime)
        GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -tags lambda.norpc -o "$BIN_DIR/${handler}_bootstrap" "$HANDLERS_DIR/$handler/main.go"
        
        if [ -f "$BIN_DIR/${handler}_bootstrap" ]; then
            # Rename to bootstrap and create zip file
            mv "$BIN_DIR/${handler}_bootstrap" "$BIN_DIR/bootstrap"
            (cd "$BIN_DIR" && zip -j "$handler.zip" "bootstrap" && rm "bootstrap")
            echo "✓ Built $handler"
        else
            echo "❌ Build failed for $handler"
        fi
    else
        echo "⚠️  Handler $handler not found"
    fi
done

echo "✅ All auth service handlers processed!"
echo "Binaries are in: $BIN_DIR"