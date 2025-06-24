#\!/bin/bash

# Simplified build script for existing domain management handlers

set -e

echo "Building domain management handlers (simplified)..."

# Set environment variables
export GOOS=linux
export GOARCH=arm64
export CGO_ENABLED=0

# Create bin directory if it doesn't exist
mkdir -p bin

# Build only the handlers that exist
handlers=(
    "domains/add"
    "domains/remove"
    "domains/activate"
    "domains/get-dns-instructions"
    "domains/configure-mail"
    "domains/setup-custom"
)

for handler in "${handlers[@]}"; do
    handler_name=$(echo $handler  < /dev/null |  sed 's/\//-/g')
    echo "Building ${handler_name}..."
    
    if [ -d "cmd/handlers/${handler}" ]; then
        cd "cmd/handlers/${handler}"
        if [ -f "main.go" ]; then
            go build -ldflags="-s -w" -o bootstrap main.go && \
            zip -j "../../../bin/${handler_name}.zip" bootstrap && \
            rm bootstrap && \
            echo "✓ Built ${handler_name}"
        else
            echo "⚠ No main.go found for ${handler}"
        fi
        cd ../../..
    else
        echo "⚠ Handler directory not found: ${handler}"
    fi
done

echo "Domain management handlers build complete\!"
