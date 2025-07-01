# ListBackup.ai

AI-powered data backup and integration platform for modern businesses.

## Overview

ListBackup.ai is a comprehensive cloud-based solution that automatically backs up your business data from multiple platforms, ensuring you never lose critical information. Built with enterprise-grade security and scalability, it supports hierarchical account structures for organizations of any size.

## 🚀 Features

### Core Capabilities
- **Multi-Platform Integration** - Connect to 15+ business platforms including Keap, Stripe, GoHighLevel, ActiveCampaign, and more
- **Automated Backups** - Schedule regular backups or trigger them on-demand
- **Enterprise Hierarchy** - Support for complex organizational structures with unlimited nesting
- **Real-time Monitoring** - Track backup status, system health, and data flow
- **Secure Storage** - Military-grade encryption for data at rest and in transit
- **Data Export** - Export to multiple formats and external storage providers
- **OAuth 2.0 Support** - Secure authentication for all platform integrations
- **Multi-Account Support** - Manage multiple accounts per platform

### Platform Integrations
- **CRM Systems**: Keap, GoHighLevel, HubSpot, ActiveCampaign
- **Payment Processing**: Stripe, Square, QuickBooks
- **Communication**: MailChimp, Zendesk, Slack
- **Cloud Storage**: Google Drive, Dropbox, Box
- **E-commerce**: Shopify, WooCommerce
- **Custom Integrations**: REST API support for any platform

## 🏗️ Architecture

Built on AWS serverless infrastructure for unlimited scalability:
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Go and Node.js Lambda functions  
- **Infrastructure**: Modular serverless services (DynamoDB, SQS, S3, EventBridge)
- **Database**: 17 DynamoDB tables with automatic scaling
- **Queues**: 6 FIFO SQS queues with dead letter queues
- **Storage**: S3 with versioning and encryption
- **Authentication**: AWS Cognito with MFA support
- **API**: REST API with custom JWT authorizer
- **Events**: EventBridge for event-driven architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## 📋 Prerequisites

- Node.js 20.x or higher
- Go 1.21 or higher
- AWS CLI configured with appropriate credentials
- Serverless Framework v4

## 🛠️ Installation

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/ListBackup-ai/listbackup-ai.git
cd listbackup-ai
```

2. Install dependencies:
```bash
# Frontend
cd platforms/web
npm install

# Backend
cd ../../backend/golang
go mod download
```

3. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the development server:
```bash
cd platforms/web
npm run dev
```

Access the application at `http://localhost:3002`

### Production Deployment

Deploy to AWS using Serverless Compose:

```bash
cd backend/golang
serverless deploy --stage production
```

See deployment guides in `/docs` for detailed instructions.

## 📖 Documentation

### Quick Links
- [Architecture Overview](./ARCHITECTURE.md) - System design and components
- [API Documentation](./project-docs/api/README.md) - REST API reference
- [Developer Quickstart](./project-docs/getting-started/developer-quickstart.md) - Get started quickly
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Security Policy](./SECURITY.md) - Security practices and reporting

### Project Documentation
- [Complete Architecture](./project-docs/architecture/complete-architecture.md) - Detailed system architecture
- [Development Guidelines](./project-docs/development/development-guidelines.md) - Best practices
- [DynamoDB Architecture](./project-docs/development/dynamodb-architecture.md) - Database design
- [Phase Documentation](./project-planning/) - Infrastructure migration phases

### API Endpoints
- [Authentication & Authorization](./project-docs/api/authentication-authorization.md)
- [API Explorer](./project-docs/api/explorer.md)

## 🔒 Security

ListBackup.ai implements industry-leading security practices:
- End-to-end encryption for all data
- AWS Secrets Manager for credential storage
- Per-account data isolation
- Regular security audits
- GDPR and CCPA compliant

Report security issues to: security@listbackup.ai

## 🧪 Testing

Run the test suite:

```bash
# Frontend tests
cd platforms/web
npm test

# Backend tests
cd backend/golang
go test ./...
```

## 🚢 Deployment

The application uses GitHub Actions for CI/CD:
- Push to `develop` → Deploy to staging
- Push to `main` → Deploy to production

Required GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `STAGING_API_URL`
- `PRODUCTION_API_URL`

## 📊 Monitoring

- **CloudWatch** - Logs and metrics
- **X-Ray** - Distributed tracing
- **Custom Dashboards** - Business metrics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙋 Support

- Documentation: [docs.listbackup.ai](https://docs.listbackup.ai)
- Email: support@listbackup.ai
- Issues: [GitHub Issues](https://github.com/ListBackup-ai/listbackup-ai/issues)

## 🎯 Roadmap

### In Progress
- [x] Infrastructure modularization (Phases 1-6 complete)
- [x] OAuth 2.0 implementation for all platforms
- [ ] Phase 7-11: Platform services implementation

### Upcoming Features
- [ ] Mobile applications (iOS/Android)
- [ ] Two-way sync capabilities
- [ ] Advanced analytics dashboard
- [ ] AI-powered insights
- [ ] Webhook support
- [ ] GraphQL API
- [ ] Real-time data sync
- [ ] Custom workflow automation

## 📊 Project Status

| Component | Status | Phase |
|-----------|--------|-------|
| Infrastructure Services | ✅ Complete | Phase 2 |
| API Gateway | ✅ Complete | Phase 3 |
| Auth Service | ✅ Complete | Phase 4 |
| Users Service | ✅ Complete | Phase 5 |
| Accounts Service | ✅ Complete | Phase 6 |
| Platforms Service | 🚧 In Progress | Phase 7 |
| Connections Service | 📋 Planned | Phase 8 |
| Sources Service | 📋 Planned | Phase 9 |
| Jobs Service | 📋 Planned | Phase 10 |
| Utility Services | 📋 Planned | Phase 11 |

## 👥 Team

Built with ❤️ by the ListBackup.ai team.

---

**Status**: Active Development  
**Version**: 1.0.0  
**Last Updated**: December 2024