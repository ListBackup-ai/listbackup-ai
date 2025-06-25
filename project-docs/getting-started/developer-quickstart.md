# Developer Quick Start Guide

**🎯 Goal**: Get a developer up and running with ListBackup.ai v2 in under 30 minutes**

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] **macOS, Linux, or WSL2** (Windows with Linux subsystem)
- [ ] **Node.js 18+** and **npm/yarn** installed
- [ ] **Go 1.21+** installed
- [ ] **Git** configured with SSH keys
- [ ] **AWS CLI v2** installed
- [ ] **Docker Desktop** running (for local services)

## Quick Setup (15 minutes)

### 1. Clone the Repository (2 minutes)

```bash
# Clone the main repository
git clone git@github.com:listbackup/listbackup.ai.git
cd listbackup.ai

# Verify you're in the right place
ls -la
# You should see: listbackup-ai-v2/, project/, docs/, etc.
```

### 2. AWS Configuration (3 minutes)

```bash
# Configure AWS CLI with ListBackup profile
aws configure --profile listbackup.ai
# AWS Access Key ID: [Get from team lead]
# AWS Secret Access Key: [Get from team lead]
# Default region: us-east-1
# Default output format: json

# Verify access
aws sts get-caller-identity --profile listbackup.ai
```

### 3. Backend Setup (5 minutes)

```bash
# Navigate to Go backend
cd listbackup-ai-v2/backend/golang

# Install dependencies
go mod download

# Build all handlers
chmod +x scripts/build-all-handlers.sh
./scripts/build-all-handlers.sh

# Deploy core infrastructure (if needed)
npx serverless deploy --config serverless-go-core.yml --aws-profile listbackup.ai --stage main
```

### 4. Frontend Setup (5 minutes)

```bash
# Navigate to web frontend
cd ../../../platforms/web

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Update .env.local with your settings
echo "NEXT_PUBLIC_API_URL=https://main.api.listbackup.ai" >> .env.local
echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_[GET_FROM_TEAM]" >> .env.local
echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=[GET_FROM_TEAM]" >> .env.local

# Start development server
npm run dev
```

## Development Workflow

### Daily Development Commands

```bash
# Start backend development
cd listbackup-ai-v2/backend/golang
./scripts/build-all-handlers.sh  # Build all Go functions
sls deploy --stage main --aws-profile listbackup.ai  # Deploy changes

# Start frontend development
cd platforms/web
npm run dev  # Start Next.js dev server at http://localhost:3000

# Run tests
npm run test  # Frontend tests
cd ../../backend/golang && go test ./...  # Backend tests
```

### Making Your First Change

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** (start with something small like updating a component)

3. **Test your changes**:
   ```bash
   # Test frontend
   npm run build
   npm run test
   
   # Test backend
   go test ./internal/...
   ```

4. **Deploy to development**:
   ```bash
   # Deploy backend changes
   cd backend/golang
   sls deploy --stage main --aws-profile listbackup.ai
   
   # Frontend auto-deploys on commit to main
   ```

5. **Create a Pull Request** following our [Git Workflow](../developer/git-workflow.md)

## Local Development Environment

### Frontend Development Server

```bash
cd platforms/web
npm run dev

# Available at:
# - Web App: http://localhost:3000
# - Storybook: npm run storybook (http://localhost:6006)
```

### Backend Testing

```bash
cd listbackup-ai-v2/backend/golang

# Test individual services
go test ./internal/services/...

# Test handlers
go test ./cmd/handlers/...

# Build specific handler
cd cmd/handlers/auth/login
go build -o bootstrap main.go
```

### Database Access

```bash
# List DynamoDB tables
aws dynamodb list-tables --profile listbackup.ai

# Query specific table
aws dynamodb scan --table-name listbackup-main-users --profile listbackup.ai --limit 5
```

## Common Development Tasks

### 1. Adding a New API Endpoint

```bash
# 1. Create handler directory
mkdir -p cmd/handlers/your-service/new-endpoint

# 2. Create main.go file
cat > cmd/handlers/your-service/new-endpoint/main.go << 'EOF'
package main

import (
    "context"
    "encoding/json"
    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
)

func handler(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
    // Your handler logic here
    return events.APIGatewayV2HTTPResponse{
        StatusCode: 200,
        Headers: map[string]string{
            "Content-Type": "application/json",
        },
        Body: `{"success": true, "message": "Hello World"}`,
    }, nil
}

func main() {
    lambda.Start(handler)
}
EOF

# 3. Add to serverless configuration
# Edit appropriate serverless-go-*.yml file

# 4. Build and deploy
./scripts/build-all-handlers.sh
sls deploy --stage main --aws-profile listbackup.ai
```

### 2. Adding a Frontend Component

```bash
cd platforms/web

# Create component file
mkdir -p components/your-feature
cat > components/your-feature/your-component.tsx << 'EOF'
'use client'

import { Button } from '@/components/ui/button'

interface YourComponentProps {
  title: string
}

export function YourComponent({ title }: YourComponentProps) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button>Click me</Button>
    </div>
  )
}
EOF

# Add to export index
echo "export { YourComponent } from './your-component'" >> components/your-feature/index.ts
```

### 3. Testing API Endpoints

```bash
# Get authentication token
TOKEN=$(curl -X POST https://main.api.listbackup.ai/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@listbackup.ai","password":"your-password"}' \
  | jq -r '.data.accessToken')

# Test authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://main.api.listbackup.ai/sources
```

## Debugging and Troubleshooting

### Common Issues and Solutions

#### 1. AWS Access Denied
```bash
# Check your AWS credentials
aws sts get-caller-identity --profile listbackup.ai

# If fails, reconfigure
aws configure --profile listbackup.ai
```

#### 2. Build Failures
```bash
# Clear Go module cache
go clean -modcache
go mod download

# Rebuild everything
cd backend/golang
./scripts/build-all-handlers.sh
```

#### 3. Frontend Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Clear node modules
rm -rf node_modules package-lock.json
npm install
```

#### 4. Database Connection Issues
```bash
# Check if tables exist
aws dynamodb list-tables --profile listbackup.ai --region us-east-1

# If tables missing, deploy core infrastructure
cd backend/golang
npx serverless deploy --config serverless-go-core.yml --aws-profile listbackup.ai --stage main
```

### Development Tools

#### Useful VS Code Extensions
- **Go** - Official Go extension
- **AWS Toolkit** - AWS integration
- **ES7+ React/Redux/React-Native snippets** - React snippets
- **Tailwind CSS IntelliSense** - CSS class suggestions
- **Thunder Client** - API testing

#### Recommended Settings
```json
// .vscode/settings.json
{
  "go.toolsManagement.checkForUpdates": "local",
  "go.useLanguageServer": true,
  "go.formatTool": "goimports",
  "editor.formatOnSave": true,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Environment-Specific Information

### Development (main stage)
- **API URL**: `https://main.api.listbackup.ai`
- **Web URL**: `https://main.app.listbackup.ai`
- **Database**: `listbackup-main-*` tables
- **AWS Profile**: `listbackup.ai`

### Local Development
- **Frontend**: `http://localhost:3000`
- **API**: Uses `main` stage for backend services
- **Database**: Shared development DynamoDB tables

## Next Steps

After completing this quick start:

1. **Read the [Architecture Overview](../architecture/complete-architecture.md)** to understand the system
2. **Review [Code Standards](../developer/code-standards.md)** for coding guidelines
3. **Check [Testing Strategy](../developer/testing.md)** for testing approaches
4. **Explore [API Documentation](../api/explorer.md)** for API details
5. **Join the team Slack** for questions and discussions

## Getting Help

### Quick Help Channels
- **Slack**: `#dev-team` for general questions
- **Slack**: `#dev-backend` for Go/AWS questions  
- **Slack**: `#dev-frontend` for React/Next.js questions
- **GitHub Issues**: For bugs and feature requests

### Common Questions

**Q: How do I access AWS resources?**
A: Use the `listbackup.ai` AWS profile with provided credentials.

**Q: Which stage should I use for development?**
A: Use `main` stage for active development and testing.

**Q: How do I test OAuth integrations?**
A: Use test accounts with `@listbackup.ai` email addresses.

**Q: Where are the environment variables stored?**
A: Backend: AWS Secrets Manager, Frontend: `.env.local` file.

**Q: How do I deploy my changes?**
A: Backend: `sls deploy --stage main`, Frontend: auto-deploys on merge to main.

---

## Success Checklist

After completing this guide, you should be able to:

- [ ] Clone and build the project locally
- [ ] Run the frontend development server
- [ ] Deploy backend changes to the main stage
- [ ] Make API calls to development endpoints
- [ ] Create and test a simple component
- [ ] Run the test suite successfully
- [ ] Access AWS resources with proper credentials

**🎉 Congratulations!** You're now set up for productive development on ListBackup.ai v2.

**⏱️ Total Time**: Should take 15-30 minutes depending on download speeds and AWS setup.

---

*Need help? Reach out in #dev-team Slack or create an issue in GitHub.*