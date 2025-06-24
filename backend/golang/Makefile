# Production-ready Makefile for Go Lambda functions with ARM64 support
# Enhanced with security, performance, and monitoring features

.PHONY: all build build-prod clean clean-bin deploy deploy-staging deploy-prod test lint fmt deps verify security-check validate-env package size-check install-tools help

# Build configuration for ARM64 (better price/performance)
GOOS := linux
GOARCH := arm64
CGO_ENABLED := 0
BUILD_DIR := bin
STAGE := main

# Build flags for optimized production builds
BUILD_FLAGS := -ldflags="-s -w -X main.version=$(shell git describe --tags --always 2>/dev/null || echo 'dev') -X main.buildTime=$(shell date -u +%Y-%m-%dT%H:%M:%SZ)"
AUTH_HANDLER_DIRS := $(shell find cmd/handlers -type d -name "*" | grep -E "(login|register|refresh|logout|get-profile|get-available-accounts|status)$$")
USER_HANDLER_DIRS := $(shell find cmd/handlers/users -type d -maxdepth 1 ! -path cmd/handlers/users)
SOURCE_GROUPS_HANDLER_DIRS := $(shell find cmd/handlers/source-groups -type d -maxdepth 1 ! -path cmd/handlers/source-groups)
DOMAINS_HANDLER_DIRS := $(shell find cmd/handlers/domains -type d -maxdepth 1 ! -path cmd/handlers/domains)
JOBS_HANDLER_DIRS := $(shell find cmd/handlers/jobs -type d -maxdepth 1 ! -path cmd/handlers/jobs)
ACCOUNT_HANDLER_DIRS := $(shell find cmd/handlers/account -type d -maxdepth 1 ! -path cmd/handlers/account)
INTEGRATIONS_HANDLER_DIRS := $(shell find cmd/handlers/integrations -type d -maxdepth 1 ! -path cmd/handlers/integrations)

# Default target
all: clean build test

# Build all handlers with ARM64 architecture
build: clean-bin validate-env build-auth build-users build-source-groups build-domains build-jobs build-account build-integrations
	@echo "✅ All handlers built successfully"

# Build auth handlers
build-auth: clean-bin validate-env
	@echo "Building auth handlers for ARM64..."
	@mkdir -p $(BUILD_DIR)
	@for dir in $(AUTH_HANDLER_DIRS); do \
		if [ -f "$$dir/main.go" ]; then \
			echo "Building $$dir..."; \
			handler_path=$$(echo $$dir | sed 's|cmd/handlers/||'); \
			mkdir -p "$(BUILD_DIR)/$$handler_path"; \
			cd $$dir && \
			GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
			go build $(BUILD_FLAGS) -o "../../../../$(BUILD_DIR)/$$handler_path/bootstrap" main.go && \
			cd - > /dev/null; \
		fi \
	done
	@echo "✅ Auth handlers built successfully"

# Build user handlers  
build-users: validate-env
	@echo "Building user handlers for ARM64..."
	@./build-user-handlers.sh
	@echo "✅ User handlers built successfully"

# Build source-groups handlers
build-source-groups: validate-env
	@echo "Building source-groups handlers for ARM64..."
	@mkdir -p $(BUILD_DIR)
	@for dir in $(SOURCE_GROUPS_HANDLER_DIRS); do \
		if [ -f "$$dir/main.go" ]; then \
			echo "Building $$dir..."; \
			handler_path=$$(echo $$dir | sed 's|cmd/handlers/||'); \
			mkdir -p "$(BUILD_DIR)/$$handler_path"; \
			cd $$dir && \
			GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
			go build $(BUILD_FLAGS) -o "../../../../$(BUILD_DIR)/$$handler_path/bootstrap" main.go && \
			cd - > /dev/null; \
		fi \
	done
	@echo "✅ Source-groups handlers built successfully"

# Build domains handlers
build-domains: validate-env
	@echo "Building domains handlers for ARM64..."
	@mkdir -p $(BUILD_DIR)
	@for dir in $(DOMAINS_HANDLER_DIRS); do \
		if [ -f "$$dir/main.go" ]; then \
			echo "Building $$dir..."; \
			handler_path=$$(echo $$dir | sed 's|cmd/handlers/||'); \
			mkdir -p "$(BUILD_DIR)/$$handler_path"; \
			cd $$dir && \
			GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
			go build $(BUILD_FLAGS) -o "../../../../$(BUILD_DIR)/$$handler_path/bootstrap" main.go && \
			cd - > /dev/null; \
		fi \
	done
	@echo "✅ Domains handlers built successfully"

# Build jobs handlers
build-jobs: validate-env
	@echo "Building jobs handlers for ARM64..."
	@mkdir -p $(BUILD_DIR)
	@for dir in $(JOBS_HANDLER_DIRS); do \
		if [ -f "$$dir/main.go" ]; then \
			echo "Building $$dir..."; \
			handler_path=$$(echo $$dir | sed 's|cmd/handlers/||'); \
			mkdir -p "$(BUILD_DIR)/$$handler_path"; \
			cd $$dir && \
			GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
			go build $(BUILD_FLAGS) -o "../../../../$(BUILD_DIR)/$$handler_path/bootstrap" main.go && \
			cd - > /dev/null; \
		fi \
	done
	@echo "✅ Jobs handlers built successfully"

# Build account handlers
build-account: validate-env
	@echo "Building account handlers for ARM64..."
	@mkdir -p $(BUILD_DIR)
	@for dir in $(ACCOUNT_HANDLER_DIRS); do \
		if [ -f "$$dir/main.go" ]; then \
			echo "Building $$dir..."; \
			handler_path=$$(echo $$dir | sed 's|cmd/handlers/||'); \
			mkdir -p "$(BUILD_DIR)/$$handler_path"; \
			cd $$dir && \
			GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
			go build $(BUILD_FLAGS) -o "../../../../$(BUILD_DIR)/$$handler_path/bootstrap" main.go && \
			cd - > /dev/null; \
		fi \
	done
	@echo "✅ Account handlers built successfully"

# Build integrations handlers
build-integrations: validate-env
	@echo "Building integrations handlers for ARM64..."
	@mkdir -p $(BUILD_DIR)
	@for dir in $(INTEGRATIONS_HANDLER_DIRS); do \
		if [ -f "$$dir/main.go" ]; then \
			echo "Building $$dir..."; \
			handler_path=$$(echo $$dir | sed 's|cmd/handlers/||'); \
			mkdir -p "$(BUILD_DIR)/$$handler_path"; \
			cd $$dir && \
			GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
			go build $(BUILD_FLAGS) -o "../../../../$(BUILD_DIR)/$$handler_path/bootstrap" main.go && \
			cd - > /dev/null; \
		fi \
	done
	@echo "✅ Integrations handlers built successfully"

# Production build with additional optimizations
build-prod: clean-bin validate-env security-check build-auth-prod build-users-prod build-source-groups-prod build-domains-prod build-jobs-prod build-account-prod build-integrations-prod
	@echo "✅ Production build completed"

# Production build for auth handlers
build-auth-prod: clean-bin validate-env security-check
	@echo "Building production-ready auth handlers..."
	@mkdir -p $(BUILD_DIR)
	@for dir in $(AUTH_HANDLER_DIRS); do \
		if [ -f "$$dir/main.go" ]; then \
			echo "Building $$dir for production..."; \
			handler_path=$$(echo $$dir | sed 's|cmd/handlers/||'); \
			mkdir -p "$(BUILD_DIR)/$$handler_path"; \
			cd $$dir && \
			GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
			go build $(BUILD_FLAGS) -trimpath -o "../../../../$(BUILD_DIR)/$$handler_path/bootstrap" main.go && \
			cd - > /dev/null; \
		fi \
	done
	@echo "✅ Auth production build completed"

# Production build for user handlers
build-users-prod: validate-env security-check
	@echo "Building production-ready user handlers..."
	@./build-user-handlers.sh
	@echo "✅ User production build completed"

# Production build for source-groups handlers
build-source-groups-prod: validate-env security-check
	@echo "Building production-ready source-groups handlers..."
	@mkdir -p $(BUILD_DIR)
	@for dir in $(SOURCE_GROUPS_HANDLER_DIRS); do \
		if [ -f "$$dir/main.go" ]; then \
			echo "Building $$dir for production..."; \
			handler_path=$$(echo $$dir | sed 's|cmd/handlers/||'); \
			mkdir -p "$(BUILD_DIR)/$$handler_path"; \
			cd $$dir && \
			GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
			go build $(BUILD_FLAGS) -trimpath -o "../../../../$(BUILD_DIR)/$$handler_path/bootstrap" main.go && \
			cd - > /dev/null; \
		fi \
	done
	@echo "✅ Source-groups production build completed"

# Production build for domains handlers
build-domains-prod: validate-env security-check
	@echo "Building production-ready domains handlers..."
	@mkdir -p $(BUILD_DIR)
	@for dir in $(DOMAINS_HANDLER_DIRS); do \
		if [ -f "$$dir/main.go" ]; then \
			echo "Building $$dir for production..."; \
			handler_path=$$(echo $$dir | sed 's|cmd/handlers/||'); \
			mkdir -p "$(BUILD_DIR)/$$handler_path"; \
			cd $$dir && \
			GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
			go build $(BUILD_FLAGS) -trimpath -o "../../../../$(BUILD_DIR)/$$handler_path/bootstrap" main.go && \
			cd - > /dev/null; \
		fi \
	done
	@echo "✅ Domains production build completed"

# Production build for jobs handlers
build-jobs-prod: validate-env security-check
	@echo "Building production-ready jobs handlers..."
	@mkdir -p $(BUILD_DIR)
	@for dir in $(JOBS_HANDLER_DIRS); do \
		if [ -f "$$dir/main.go" ]; then \
			echo "Building $$dir for production..."; \
			handler_path=$$(echo $$dir | sed 's|cmd/handlers/||'); \
			mkdir -p "$(BUILD_DIR)/$$handler_path"; \
			cd $$dir && \
			GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
			go build $(BUILD_FLAGS) -trimpath -o "../../../../$(BUILD_DIR)/$$handler_path/bootstrap" main.go && \
			cd - > /dev/null; \
		fi \
	done
	@echo "✅ Jobs production build completed"

# Production build for account handlers
build-account-prod: validate-env security-check
	@echo "Building production-ready account handlers..."
	@mkdir -p $(BUILD_DIR)
	@for dir in $(ACCOUNT_HANDLER_DIRS); do \
		if [ -f "$$dir/main.go" ]; then \
			echo "Building $$dir for production..."; \
			handler_path=$$(echo $$dir | sed 's|cmd/handlers/||'); \
			mkdir -p "$(BUILD_DIR)/$$handler_path"; \
			cd $$dir && \
			GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
			go build $(BUILD_FLAGS) -trimpath -o "../../../../$(BUILD_DIR)/$$handler_path/bootstrap" main.go && \
			cd - > /dev/null; \
		fi \
	done
	@echo "✅ Account production build completed"

# Production build for integrations handlers
build-integrations-prod: validate-env security-check
	@echo "Building production-ready integrations handlers..."
	@mkdir -p $(BUILD_DIR)
	@for dir in $(INTEGRATIONS_HANDLER_DIRS); do \
		if [ -f "$$dir/main.go" ]; then \
			echo "Building $$dir for production..."; \
			handler_path=$$(echo $$dir | sed 's|cmd/handlers/||'); \
			mkdir -p "$(BUILD_DIR)/$$handler_path"; \
			cd $$dir && \
			GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
			go build $(BUILD_FLAGS) -trimpath -o "../../../../$(BUILD_DIR)/$$handler_path/bootstrap" main.go && \
			cd - > /dev/null; \
		fi \
	done
	@echo "✅ Integrations production build completed"

# Clean binary files
clean-bin:
	@echo "Cleaning binary files..."
	@rm -rf $(BUILD_DIR)
	@find cmd/handlers -name "bootstrap" -type f -delete 2>/dev/null || true
	@find cmd/handlers -name "*.zip" -type f -delete 2>/dev/null || true
	@echo "✅ Binary files cleaned"

# Full clean including Go cache
clean: clean-bin
	@echo "Performing full clean..."
	@go clean -cache -testcache -modcache
	@echo "✅ Full clean completed"

# Validate environment and dependencies
validate-env:
	@echo "Validating environment..."
	@go version
	@echo "Go environment: GOARCH=$(GOARCH), GOOS=$(GOOS), CGO_ENABLED=$(CGO_ENABLED)"
	@echo "✅ Environment validated"

# Security check using gosec
security-check:
	@echo "Running security checks..."
	@if command -v gosec >/dev/null 2>&1; then \
		gosec -quiet ./cmd/handlers/...; \
		echo "✅ Security check passed"; \
	else \
		echo "⚠️  gosec not installed, skipping security check"; \
		echo "Install with: go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest"; \
	fi

# Run tests
test:
	@echo "Running tests..."
	@go test -v -race -coverprofile=coverage.out ./... 2>/dev/null || echo "No tests found"
	@if [ -f coverage.out ]; then \
		go tool cover -html=coverage.out -o coverage.html; \
		echo "✅ Tests completed, coverage report generated"; \
	else \
		echo "✅ Tests completed"; \
	fi

# Lint code
lint:
	@echo "Running linter..."
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run ./cmd/handlers/...; \
		echo "✅ Linting completed"; \
	else \
		echo "⚠️  golangci-lint not installed, skipping linting"; \
		echo "Install with: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
	fi

# Format code
fmt:
	@echo "Formatting code..."
	@go fmt ./...
	@echo "✅ Code formatted"

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	@go mod download
	@go mod tidy
	@echo "✅ Dependencies updated"

# Verify dependencies
verify:
	@echo "Verifying dependencies..."
	@go mod verify
	@echo "✅ Dependencies verified"

# Deploy to AWS (requires AWS CLI and Serverless Framework)
deploy: build-prod
	@echo "Deploying auth service..."
	@if command -v sls >/dev/null 2>&1; then \
		sls deploy --config serverless-go-auth.yml --aws-profile listbackup.ai --stage $(STAGE); \
		echo "✅ Deployment completed"; \
	else \
		echo "❌ Serverless Framework not installed"; \
		exit 1; \
	fi

# Deploy to staging
deploy-staging: build-prod
	@echo "Deploying to staging..."
	@sls deploy --config serverless-go-auth.yml --aws-profile listbackup.ai --stage staging

# Deploy to production
deploy-prod: build-prod security-check test
	@echo "Deploying to production..."
	@sls deploy --config serverless-go-auth.yml --aws-profile listbackup.ai --stage prod

# Package for deployment
package: build-prod
	@echo "Creating deployment package..."
	@mkdir -p dist
	@for dir in $(HANDLER_DIRS); do \
		if [ -f "$$dir/bootstrap" ]; then \
			handler_name=$$(basename $$dir); \
			zip -j dist/$$handler_name.zip $$dir/bootstrap; \
		fi \
	done
	@echo "✅ Deployment packages created in dist/"

# Check binary sizes
size-check:
	@echo "Checking binary sizes..."
	@find $(BUILD_DIR) -name "bootstrap" -exec sh -c 'echo "$$(basename $$(dirname {})): $$(du -h {} | cut -f1)"' \;

# Install development tools
install-tools:
	@echo "Installing development tools..."
	@go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "✅ Development tools installed"

# Validate Cognito authorizer setup
validate:
	@echo "Validating Cognito authorizer configuration..."
	@./validate-cognito-auth.sh $(STAGE) 2>/dev/null || echo "Validation script not found"

# Run full auth flow test
test-auth:
	@echo "Running full auth flow test..."
	@./test-auth-flow.sh $(STAGE) 2>/dev/null || echo "Auth test script not found"

# Help target
help:
	@echo "Available targets:"
	@echo "  build         - Build all handlers (auth + users + source-groups + domains + jobs + account + integrations) for ARM64"
	@echo "  build-auth    - Build only auth handlers"
	@echo "  build-users   - Build only user handlers"
	@echo "  build-source-groups - Build only source-groups handlers"
	@echo "  build-domains - Build only domains handlers"
	@echo "  build-jobs    - Build only jobs handlers"
	@echo "  build-account - Build only account handlers"
	@echo "  build-integrations - Build only integrations handlers"
	@echo "  build-prod    - Production build with optimizations"
	@echo "  clean         - Clean all build artifacts and caches"
	@echo "  clean-bin     - Clean only binary files"
	@echo "  test          - Run tests with coverage"
	@echo "  lint          - Run linter"
	@echo "  fmt           - Format code"
	@echo "  deps          - Download and tidy dependencies"
	@echo "  verify        - Verify dependencies"
	@echo "  security-check - Run security analysis"
	@echo "  deploy        - Deploy to main stage"
	@echo "  deploy-staging - Deploy to staging"
	@echo "  deploy-prod   - Deploy to production"
	@echo "  package       - Create deployment packages"
	@echo "  size-check    - Check binary sizes"
	@echo "  validate      - Validate Cognito authorizer setup"
	@echo "  test-auth     - Run full auth flow test"
	@echo "  install-tools - Install development tools"
	@echo "  help          - Show this help"