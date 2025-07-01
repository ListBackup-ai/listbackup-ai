#!/bin/bash

# Build script for auth service Lambda functions

echo "Building auth service Lambda functions..."

# Set variables
SERVICE_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR="$SERVICE_DIR/../../.."
HANDLERS_DIR="$ROOT_DIR/cmd/handlers/auth"
BIN_DIR="$SERVICE_DIR/bin/auth"

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
    "mfa-setup"
    "mfa-verify"
    "password-reset-request"
    "password-reset-confirm"
    "change-password"
    "verify-account"
)

for handler in "${HANDLERS[@]}"; do
    echo "Building $handler..."
    if [ -d "$HANDLERS_DIR/$handler" ]; then
        # Build for Linux ARM64 (Lambda runtime)
        cd "$HANDLERS_DIR/$handler" && GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -tags lambda.norpc -o "$BIN_DIR/${handler}_bootstrap" main.go && cd - > /dev/null
        
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