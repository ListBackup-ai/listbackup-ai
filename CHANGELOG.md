# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-06-24

### Added
- Initial release of ListBackup.ai
- Multi-platform integration support:
  - Keap (Infusionsoft)
  - Stripe
  - GoHighLevel
  - ActiveCampaign
  - MailChimp
  - Zendesk
  - HubSpot
  - Google (Gmail, Drive, Contacts)
  - QuickBooks
- OAuth 2.0 authentication for secure platform connections
- Hierarchical account structure supporting enterprise organizations
- Real-time data backup to AWS S3
- Activity tracking and audit logs
- User authentication with AWS Cognito
- Serverless architecture using AWS Lambda
- Next.js web application with responsive design
- Go and Node.js backend services
- Infrastructure as Code with Serverless Framework v4
- CI/CD pipeline with GitHub Actions
- Comprehensive API documentation
- Security-first approach with encryption at rest and in transit

### Security
- Implemented AWS Secrets Manager for credential storage
- Added multi-factor authentication support
- Enabled per-account data isolation
- Implemented rate limiting and DDoS protection

### Infrastructure
- Deployed on AWS with multi-AZ redundancy
- Implemented auto-scaling for all services
- Set up CloudWatch monitoring and alerting
- Configured automated backups and disaster recovery

[Unreleased]: https://github.com/ListBackup-ai/listbackup-ai/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ListBackup-ai/listbackup-ai/releases/tag/v1.0.0