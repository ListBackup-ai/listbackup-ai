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
mkdir -p "$BIN_DIR/platform-sources/list"
mkdir -p "$BIN_DIR/platform-sources/get"
mkdir -p "$BIN_DIR/platform-connections/list"
mkdir -p "$BIN_DIR/platform-connections/create"
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

# Build platform-sources handlers
echo "Building platform-sources handlers..."

if [ -d "$CMD_DIR/platform-sources/list" ]; then
    echo "Building platform-sources/list..."
    cd "$CMD_DIR/platform-sources/list" || exit 1
    GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -tags lambda.norpc -o bootstrap main.go
    if [ -f bootstrap ]; then
        mkdir -p "$BIN_DIR/platform-sources/list"
        cp bootstrap "$BIN_DIR/platform-sources/list/"
        cd "$BIN_DIR/platform-sources/list" || exit 1
        zip -j "$DIST_DIR/platform-sources-list.zip" bootstrap
        rm bootstrap
        echo "✓ Built platform-sources/list"
    else
        echo "❌ Build failed for platform-sources/list"
    fi
fi

if [ -d "$CMD_DIR/platform-sources/get" ]; then
    echo "Building platform-sources/get..."
    cd "$CMD_DIR/platform-sources/get" || exit 1
    GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -tags lambda.norpc -o bootstrap main.go
    if [ -f bootstrap ]; then
        mkdir -p "$BIN_DIR/platform-sources/get"
        cp bootstrap "$BIN_DIR/platform-sources/get/"
        cd "$BIN_DIR/platform-sources/get" || exit 1
        zip -j "$DIST_DIR/platform-sources-get.zip" bootstrap
        rm bootstrap
        echo "✓ Built platform-sources/get"
    else
        echo "❌ Build failed for platform-sources/get"
    fi
fi

# Build platform-connections handlers
echo "Building platform-connections handlers..."

if [ -d "$CMD_DIR/platform-connections/list" ]; then
    echo "Building platform-connections/list..."
    cd "$CMD_DIR/platform-connections/list" || exit 1
    GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -tags lambda.norpc -o bootstrap main.go
    if [ -f bootstrap ]; then
        mkdir -p "$BIN_DIR/platform-connections/list"
        cp bootstrap "$BIN_DIR/platform-connections/list/"
        cd "$BIN_DIR/platform-connections/list" || exit 1
        zip -j "$DIST_DIR/platform-connections-list.zip" bootstrap
        rm bootstrap
        echo "✓ Built platform-connections/list"
    else
        echo "❌ Build failed for platform-connections/list"
    fi
fi

if [ -d "$CMD_DIR/platform-connections/create" ]; then
    echo "Building platform-connections/create..."
    cd "$CMD_DIR/platform-connections/create" || exit 1
    GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -tags lambda.norpc -o bootstrap main.go
    if [ -f bootstrap ]; then
        mkdir -p "$BIN_DIR/platform-connections/create"
        cp bootstrap "$BIN_DIR/platform-connections/create/"
        cd "$BIN_DIR/platform-connections/create" || exit 1
        zip -j "$DIST_DIR/platform-connections-create.zip" bootstrap
        rm bootstrap
        echo "✓ Built platform-connections/create"
    else
        echo "❌ Build failed for platform-connections/create"
    fi
fi

# Build OAuth handlers
if [ -d "$CMD_DIR/platform-connections/oauth-start" ]; then
    echo "Building platform-connections/oauth-start..."
    cd "$CMD_DIR/platform-connections/oauth-start" || exit 1
    GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -tags lambda.norpc -o bootstrap main.go
    if [ -f bootstrap ]; then
        mkdir -p "$BIN_DIR/platform-connections/oauth-start"
        cp bootstrap "$BIN_DIR/platform-connections/oauth-start/"
        cd "$BIN_DIR/platform-connections/oauth-start" || exit 1
        zip -j "$DIST_DIR/platform-connections-oauth-start.zip" bootstrap
        rm bootstrap
        echo "✓ Built platform-connections/oauth-start"
    else
        echo "❌ Build failed for platform-connections/oauth-start"
    fi
fi

if [ -d "$CMD_DIR/platform-connections/oauth-callback" ]; then
    echo "Building platform-connections/oauth-callback..."
    cd "$CMD_DIR/platform-connections/oauth-callback" || exit 1
    GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -tags lambda.norpc -o bootstrap main.go
    if [ -f bootstrap ]; then
        mkdir -p "$BIN_DIR/platform-connections/oauth-callback"
        cp bootstrap "$BIN_DIR/platform-connections/oauth-callback/"
        cd "$BIN_DIR/platform-connections/oauth-callback" || exit 1
        zip -j "$DIST_DIR/platform-connections-oauth-callback.zip" bootstrap
        rm bootstrap
        echo "✓ Built platform-connections/oauth-callback"
    else
        echo "❌ Build failed for platform-connections/oauth-callback"
    fi
fi

echo "✅ All platforms service handlers processed!"
echo "Binaries are in: $DIST_DIR"
echo ""
echo "Next steps:"
echo "1. Run: serverless deploy --stage dev"
echo "2. Test the deployed endpoints"