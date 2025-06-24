# ListBackup.ai v2 Documentation

## Overview
ListBackup.ai v2 is a comprehensive data backup and management platform designed for agencies and businesses requiring multi-account management capabilities.

## Documentation Structure

### Architecture
- [Serverless Architecture](./architecture/serverless-architecture.md)
- [Hierarchical Account Structure](./architecture/hierarchical-accounts.md)
- [Data Flow Architecture](./architecture/data-flow.md)
- [Security & Permissions](./architecture/security.md)

### Development
- [Getting Started](./development/getting-started.md)
- [API Endpoints](./development/api-endpoints.md)
- [Database Schema](./development/database-schema.md)
- [Deployment Guide](./development/deployment.md)

### Features
- [Account Management](./features/account-management.md)
- [Data Connectors](./features/data-connectors.md)
- [Backup & Sync](./features/backup-sync.md)
- [User Management](./features/user-management.md)

### Implementation
- [Development Roadmap](./implementation/roadmap.md)
- [Current Status](./implementation/status.md)
- [Next Steps](./implementation/next-steps.md)

## Quick Start

1. **Backend Setup**
   ```bash
   cd backend/nodejs
   npm install
   # Deploy in correct order
   ./scripts/deploy.sh main all
   ```

2. **Frontend Setup**
   ```bash
   cd ../..
   npm install
   npm run dev
   ```

3. **Environment Configuration**
   - Configure AWS credentials with profile `listbackup.ai`
   - Set up SSM parameters for JWT secrets
   - Update .env.local with API endpoints

## Key Features

### Hierarchical Account Management
- Unlimited account nesting (agency → client → subsidiary)
- Role-based permissions (Owner, Manager, Viewer)
- Account switching UI
- Invitation system with 6-digit codes

### Data Connectors
- Keap (Infusionsoft)
- Stripe
- GoHighLevel
- ActiveCampaign
- MailChimp
- Zendesk

### Enterprise Features
- Data isolation by accountId
- External storage sync (Google Drive, Dropbox)
- Two-factor authentication
- White-label capabilities

## Development Status

**Current Phase**: Modular serverless architecture completed, testing deployment
**Architecture**: ✅ Complete - 12 modular services with shared infrastructure
**Launch Requirements**: Account hierarchy, permissions, invitation system
**Next Release**: Q1 2025

### Recent Achievements
- ✅ Modular serverless architecture with 12 services
- ✅ API Gateway consolidation with custom domain
- ✅ Clean separation of infrastructure and business logic
- ✅ Deployment script with proper service ordering
- ✅ Consistent environment and IAM configurations