# Phase 1: Core Planning and Initial Audit

## Objective
Establish foundation for serverless architecture reorganization with comprehensive documentation of existing resources, dependencies, and deployment patterns.

## Implementation Details
Complete audit and documentation of current serverless architecture before reorganization:

### Task 1.1: Document Core Service Resources (ID: 42988410)
- Audit all 23 DynamoDB tables in core/serverless.yml with complete schemas
- Document 6 FIFO queues + 6 DLQs with configurations and purposes
- Detail S3 bucket configuration and access policies
- Map EventBridge rules and targets
- Document Cognito User Pool settings and client configurations
- Inventory all IAM roles and policies
- Create comprehensive resource spreadsheet

### Task 1.2: Document Existing Cross-Stack References (ID: 42988411)
- Map all CloudFormation imports/exports between services
- Document service interdependencies and communication patterns
- Identify current cross-stack reference usage
- Create architecture diagram of current state

### Task 1.3: Audit Service Dependencies (ID: 42988412)
- Map service-to-service dependencies
- Identify deployment order requirements
- Document blocking relationships for orchestration
- Plan dependency resolution for new architecture

### Task 1.4: Audit Current IAM Permissions (ID: 42988413)
- Document all IAM roles across services
- Map cross-service permission requirements
- Identify security boundaries and access patterns
- Plan IAM updates for separated infrastructure

### Task 1.5: Audit Integrations Service for Merge (ID: 42988414)
- Review integrations service structure and resources
- Evaluate merge vs separation decision
- Document OAuth handlers and platform-specific resources
- Plan integration with new architecture

## Documentation Updates Made
- Created this CLAUDE.md for Phase 1 planning
- Will update project README.md with new architecture overview
- Will create resource inventory spreadsheet
- Will update deployment documentation

## Dependencies
- None (this is the foundation phase)

## Completion Status
- [ ] Task 1.1: Document Core Service Resources
- [ ] Task 1.2: Document Existing Cross-Stack References  
- [ ] Task 1.3: Audit Service Dependencies
- [ ] Task 1.4: Audit Current IAM Permissions
- [ ] Task 1.5: Audit Integrations Service for Merge
- [ ] Board cards created and tracked
- [ ] Documentation uploaded to Teamwork

## Files to be Modified/Created
- Resource inventory spreadsheet
- Architecture diagrams (current state)
- Service dependency maps
- IAM permission matrices
- Integration service analysis report

## Next Steps
Move to Phase 2: Infrastructure Services Creation once audit is complete.

## Critical Architecture Requirements
- Infrastructure separation by service type (cognito, s3, dynamodb)
- API Gateway as main deployment source with {stage}.api.listbackup.ai
- Proper cross-stack references for service linking
- Staged domain configuration for environments
- Prevention of accidental infrastructure deletion

## Priority
HIGH - Foundation phase blocking all subsequent work