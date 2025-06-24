#!/bin/bash

# Build script for platforms service Lambda functions

echo "Building platforms service Lambda functions..."

# Set variables
SERVICE_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR="$SERVICE_DIR/../../.."
CMD_DIR="$ROOT_DIR/cmd/handlers"
BIN_DIR="$SERVICE_DIR/bin"
DIST_DIR="$SERVICE_DIR/dist"

# Create directories
mkdir -p "$BIN_DIR/platforms/list"
mkdir -p "$BIN_DIR/platforms/get"
mkdir -p "$BIN_DIR/api"
mkdir -p "$DIST_DIR"

# Build platform handlers
echo "Building platform handlers..."

# Build platforms/list
if [ -d "$CMD_DIR/platforms/list" ]; then
    echo "Building platforms/list..."
    cd "$CMD_DIR/platforms/list" || exit 1
    GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -tags lambda.norpc -o bootstrap main.go
    if [ -f bootstrap ]; then
        cp bootstrap "$BIN_DIR/platforms/list/"
        cd "$BIN_DIR/platforms/list" || exit 1
        zip -j "$DIST_DIR/platforms-list.zip" bootstrap
        rm bootstrap
        echo "✓ Built platforms/list"
    else
        echo "❌ Build failed for platforms/list"
    fi
fi

# Build platforms/get
if [ -d "$CMD_DIR/platforms/get" ]; then
    echo "Building platforms/get..."
    cd "$CMD_DIR/platforms/get" || exit 1
    GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -tags lambda.norpc -o bootstrap main.go
    if [ -f bootstrap ]; then
        cp bootstrap "$BIN_DIR/platforms/get/"
        cd "$BIN_DIR/platforms/get" || exit 1
        zip -j "$DIST_DIR/platforms-get.zip" bootstrap
        rm bootstrap
        echo "✓ Built platforms/get"
    else
        echo "❌ Build failed for platforms/get"
    fi
fi

# Build API handlers
echo "Building API handlers..."

# Array of API handlers
API_HANDLERS=(
    "platform-sources-list"
    "platform-sources-get"
    "platform-connections-list"
    "platform-connections-create"
)

for handler in "${API_HANDLERS[@]}"; do
    if [ -d "$CMD_DIR/api/$handler" ]; then
        echo "Building api/$handler..."
        cd "$CMD_DIR/api/$handler" || exit 1
        GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -tags lambda.norpc -o bootstrap main.go
        if [ -f bootstrap ]; then
            mkdir -p "$BIN_DIR/api/$handler"
            cp bootstrap "$BIN_DIR/api/$handler/"
            cd "$BIN_DIR/api/$handler" || exit 1
            zip -j "$DIST_DIR/platforms-$handler.zip" bootstrap
            rm bootstrap
            echo "✓ Built api/$handler"
        else
            echo "❌ Build failed for api/$handler"
        fi
    else
        echo "⚠️  Handler api/$handler not found"
    fi
done

echo "✅ All platforms service handlers processed!"
echo "Binaries are in: $DIST_DIR"
echo ""
echo "Next steps:"
echo "1. Run: sls deploy --config serverless.yml --aws-profile listbackup.ai --stage main --force"
echo "2. Test the deployed endpoints"