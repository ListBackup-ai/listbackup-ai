# Claude Code Analysis Prompt for ListBackup.AI

```
I need you to analyze my entire codebase for ListBackup.AI and provide comprehensive documentation on the system architecture, data flow, business processes, and REST API endpoints. This is a full-stack application with the following structure:

**PROJECT OVERVIEW:**
- **Frontend**: React TypeScript application using Vite, Material-UI, and modern React patterns (located in `project/frontend/typescript-app/`)
- **Backend**: Serverless AWS architecture with Node.js Lambda functions (located in `project/backend/`)
- **Infrastructure**: AWS services including DynamoDB, S3, SQS, Cognito, and Stripe integration

**COMPREHENSIVE ANALYSIS REQUESTS:**

1. **ARCHITECTURE DOCUMENTATION:**
   - Map out the complete system architecture showing how frontend, backend, and AWS services interact
   - Document the serverless infrastructure (Lambda functions, DynamoDB tables, S3 buckets, SQS queues)
   - Explain the authentication flow using AWS Cognito
   - Detail the payment processing integration with Stripe
   - AWS Infrastructure as Code - Analyze CloudFormation/CDK resources in serverless configs

2. **REST API ENDPOINTS DOCUMENTATION:**
   - Systematically catalog ALL REST API endpoints from the backend handlers
   - For each endpoint, document: HTTP method, path, parameters, request/response, auth requirements, business purpose
   - Organize by functional areas: auth, users, accounts, integrations, jobs, files, data, analytics, assistants, billing, webhooks, activity
   - Document serverless function mappings and API Gateway configurations
   - API versioning, rate limiting, and backwards compatibility strategies

3. **SECURITY & AUTHENTICATION:**
   - IAM roles and permissions - Analyze all AWS IAM policies and resource access
   - API authentication patterns - JWT tokens, API keys, Cognito integration
   - Data encryption - At rest and in transit
   - Secrets management - How API keys and sensitive data are stored/accessed
   - CORS and security headers configuration
   - Input validation and sanitization across all endpoints
   - Authorization levels - User, admin, system permissions

4. **DATA ARCHITECTURE:**
   - DynamoDB schema design - Tables, indexes, partition/sort keys, relationships
   - Data modeling patterns - Single table design, access patterns
   - S3 bucket organization - Folder structure, naming conventions, lifecycle policies
   - Data consistency and transaction patterns
   - Backup and disaster recovery strategies
   - Data privacy and compliance (GDPR, data retention policies)

5. **INTEGRATION ECOSYSTEM:**
   - Third-party API integrations - OAuth flows, webhook handling, rate limiting
   - External service dependencies - Stripe, OpenAI, Twilio, MixRank, etc.
   - Webhook architecture - Incoming/outgoing webhooks, retry logic, security
   - API client patterns - How frontend and backend consume external APIs
   - Integration error handling and fallback strategies

6. **PERFORMANCE & SCALABILITY:**
   - Caching strategies - Browser caching, API caching, CDN usage
   - Database optimization - Query patterns, indexing strategies
   - Lambda performance - Cold starts, memory allocation, timeout handling
   - SQS queue processing - Batch processing, DLQ handling, scaling patterns
   - File upload/download optimization - Multipart uploads, streaming, compression
   - Frontend performance - Code splitting, lazy loading, bundle optimization

7. **ERROR HANDLING & MONITORING:**
   - Error handling patterns - Try/catch blocks, error boundaries, fallbacks
   - Logging strategy - What gets logged, log levels, structured logging
   - Monitoring and alerting - CloudWatch, X-Ray tracing, custom metrics
   - Health checks and status endpoints
   - Error reporting - How errors are tracked and resolved
   - User feedback mechanisms - Error messages, user notifications

8. **DEVELOPMENT WORKFLOW:**
   - Environment configurations - Local, staging, production setups
   - Build and deployment processes - CI/CD pipelines, deployment strategies
   - Testing strategies - Unit tests, integration tests, E2E tests
   - Local development setup - How to run the project locally
   - Debugging approaches - Development tools, logging, troubleshooting
   - Code quality tools - Linting, formatting, type checking

9. **BUSINESS LOGIC DEEP DIVE:**
   - User lifecycle management - Registration, onboarding, subscription management
   - Job execution workflows - How backup jobs are created, scheduled, and executed
   - Data processing pipelines - ETL processes, data transformation, analytics
   - Billing and subscription logic - Stripe integration, plan management, usage tracking
   - AI/Assistant functionality - OpenAI integration, conversation management, context handling
   - Export and backup processes - Data extraction, formatting, delivery

10. **FRONTEND ARCHITECTURE:**
    - Component hierarchy and patterns - Reusable components, composition patterns
    - State management - Local state, context, data fetching patterns
    - Routing and navigation - Protected routes, deep linking, breadcrumbs
    - Form handling and validation - Formik integration, validation schemas
    - UI/UX patterns - Material-UI usage, responsive design, accessibility
    - Asset management - Images, icons, fonts, static files

11. **CONFIGURATION MANAGEMENT:**
    - Environment variables - How configs are managed across environments
    - Feature flags - Any toggles or conditional functionality
    - Third-party service configurations - API keys, endpoints, settings
    - Database connection and pooling configurations
    - AWS service configurations - Region settings, resource naming patterns

12. **ANALYTICS & OBSERVABILITY:**
    - User analytics tracking - What user actions are tracked
    - Business metrics - KPIs, conversion funnels, usage patterns
    - System metrics - Performance metrics, error rates, availability
    - Data lake architecture - How analytics data is structured and queried
    - Reporting capabilities - Dashboards, exports, scheduled reports

**DELIVERABLES:**
1. **Complete REST API Reference** with full specifications
2. **System Architecture Diagram** (text/ASCII format)
3. **Security Architecture Documentation**
4. **Database Schema & Relationships**
5. **Integration Architecture Map**
6. **Performance & Scalability Analysis**
7. **Error Handling & Monitoring Strategy**
8. **Development & Deployment Guide**
9. **Business Logic Flow Diagrams**
10. **Configuration & Environment Guide**
11. **Analytics & Metrics Framework**
12. **Technical Stack Summary**

**API DOCUMENTATION FORMAT:**
For each endpoint, provide:
```
### [Method] [Endpoint Path]
**Purpose**: Brief description
**Authentication**: Required/Optional + method
**Parameters**: 
  - Path: {param} - description
  - Query: ?param=value - description
  - Body: JSON structure
**Response**: 
  - Success: HTTP status + JSON structure
  - Error: HTTP status + error format
**Example Request/Response**
**Related Frontend Usage**
```

**ANALYSIS METHODOLOGY:**
- Examine ALL files systematically, including configuration files, environment files, build scripts
- Analyze package.json dependencies for third-party integrations
- Check serverless configuration files for AWS resource definitions
- Document any microservices or satellite applications
- Note any TODO comments or known technical debt
- Identify optimization opportunities and potential issues
- Look for patterns in code organization and architectural decisions

Please provide a comprehensive analysis that serves as both technical documentation and an architectural review, enabling complete understanding of the system for new developers, stakeholders, and future maintenance.
```

## Usage Instructions

1. Copy the entire prompt above (everything within the code block)
2. Paste it into Claude Code when running `claude` in your project directory
3. Claude Code will systematically analyze your entire codebase and provide comprehensive documentation

## Expected Output

Claude Code will generate:
- Complete API documentation for all REST endpoints
- System architecture diagrams
- Data flow documentation
- Security analysis
- Performance recommendations
- Development workflow documentation
- Business logic explanations

This prompt ensures no aspect of your ListBackup.AI system is left undocumented.
