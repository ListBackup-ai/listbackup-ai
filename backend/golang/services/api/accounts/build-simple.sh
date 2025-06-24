#!/bin/bash

# Simple build script for accounts service Lambda functions

echo "Building accounts service Lambda functions (simple)..."

# Set variables
SERVICE_DIR=$(dirname "$0")
BIN_DIR="$SERVICE_DIR/bin/accounts"

# Create bin directory
mkdir -p "$BIN_DIR"

# Create simple placeholder handlers for now
cat > /tmp/placeholder.go << 'EOF'
package main

import (
    "context"
    "encoding/json"
    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
)

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    response := map[string]interface{}{
        "success": true,
        "message": "Accounts service placeholder - function not yet implemented",
        "path": request.Path,
        "method": request.HTTPMethod,
    }
    
    body, _ := json.Marshal(response)
    
    return events.APIGatewayProxyResponse{
        StatusCode: 200,
        Headers: map[string]string{
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        Body: string(body),
    }, nil
}

func main() {
    lambda.Start(handler)
}
EOF

# Build each handler
HANDLERS=(
    "list"
    "create"
    "get"
    "update"
    "delete"
)

for handler in "${HANDLERS[@]}"; do
    echo "Building placeholder for $handler..."
    
    # Build for Linux ARM64 (Lambda runtime)
    cd /tmp
    GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -o bootstrap placeholder.go
    
    if [ -f bootstrap ]; then
        # Create zip file
        zip -j "$BIN_DIR/$handler.zip" bootstrap
        echo "✓ Built placeholder for $handler"
    else
        echo "❌ Build failed for $handler"
    fi
done

# Clean up
rm -f /tmp/placeholder.go /tmp/bootstrap

echo "✅ All accounts service placeholder handlers built!"
echo "Binaries are in: $BIN_DIR"