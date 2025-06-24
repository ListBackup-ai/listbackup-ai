#!/bin/bash

# Build script for domain management handlers

set -e

echo "Building domain management handlers..."

# Set environment variables
export GOOS=linux
export GOARCH=arm64
export CGO_ENABLED=0

# Create bin directory if it doesn't exist
mkdir -p bin

# Domain handlers
echo "Building domains-add..."
cd cmd/handlers/domains/add
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/domains-add.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building domains-list..."
cd cmd/handlers/domains/list
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/domains-list.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building domains-get..."
cd cmd/handlers/domains/get
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/domains-get.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building domains-update..."
cd cmd/handlers/domains/update
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/domains-update.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building domains-remove..."
cd cmd/handlers/domains/remove
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/domains-remove.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building domains-verify..."
cd cmd/handlers/domains/verify
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/domains-verify.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building domains-check-verification..."
cd cmd/handlers/domains/check-verification
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/domains-check-verification.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building domains-request-certificate..."
cd cmd/handlers/domains/request-certificate
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/domains-request-certificate.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building domains-create-dns..."
cd cmd/handlers/domains/create-dns
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/domains-create-dns.zip bootstrap
rm bootstrap
cd ../../../..

# Branding handlers
echo "Building branding-add..."
cd cmd/handlers/branding/add
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/branding-add.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building branding-update..."
cd cmd/handlers/branding/update
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/branding-update.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building branding-get..."
cd cmd/handlers/branding/get
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/branding-get.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building branding-list..."
cd cmd/handlers/branding/list
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/branding-list.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building branding-upload-logo..."
cd cmd/handlers/branding/upload-logo
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/branding-upload-logo.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building branding-upload-favicon..."
cd cmd/handlers/branding/upload-favicon
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/branding-upload-favicon.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building branding-get-by-domain..."
cd cmd/handlers/branding/get-by-domain
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/branding-get-by-domain.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building domains-get-dns-instructions..."
cd cmd/handlers/domains/get-dns-instructions
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/domains-get-dns-instructions.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building domains-configure-mail..."
cd cmd/handlers/domains/configure-mail
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/domains-configure-mail.zip bootstrap
rm bootstrap
cd ../../../..

echo "Building domains-activate..."
cd cmd/handlers/domains/activate
go build -ldflags="-s -w" -o bootstrap main.go
zip -j ../../../../bin/domains-activate.zip bootstrap
rm bootstrap
cd ../../../..

echo "Domain management handlers built successfully!"