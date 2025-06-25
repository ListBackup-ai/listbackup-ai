# Phase 2: Infrastructure Services Creation

## Objective
Create dedicated infrastructure services with proper CloudFormation outputs for cross-stack references. Move all infrastructure resources from core service to specialized services.

## Implementation Details

### Task 2.1: Create infrastructure-dynamodb.yml (ID: 42988417)
- Move all 23 DynamoDB tables from core/serverless.yml to dedicated service
- Include proper CloudFormation exports for table names and ARNs
- Maintain existing table schemas and configurations
- Add cross-stack reference outputs

### Task 2.2: Create infrastructure-sqs.yml (ID: 42988420)
- Move all 6 FIFO queues + 6 DLQs from core service
- Configure proper queue settings and permissions
- Add CloudFormation exports for queue URLs and ARNs
- Maintain message retention and visibility timeout settings

### Task 2.3: Create infrastructure-s3.yml (ID: 42988423)
- Move S3 bucket configuration from core service
- Include bucket policies and CORS settings
- Add CloudFormation exports for bucket name and ARN
- Maintain existing access patterns and permissions

### Task 2.4: Create infrastructure-eventbridge.yml (ID: 42988427)
- Move EventBridge rules and targets from core service
- Configure proper event patterns and routing
- Add CloudFormation exports for EventBridge ARN
- Maintain existing event-driven architecture

### Task 2.5: Update infrastructure-cognito.yml (ID: 42988430)
- Ensure existing Cognito service has proper exports
- Add missing CloudFormation outputs for User Pool ID and Client ID
- Verify Cognito configuration matches core requirements
- Update with proper cross-stack reference capabilities

## Documentation Updates Made
- Created this CLAUDE.md for Phase 2 planning
- Will update architecture diagrams to show infrastructure separation
- Will document cross-stack reference patterns
- Will update deployment procedures

## Dependencies
- Depends on Phase 1 audit completion
- Phase 3+ services depend on these infrastructure services
- API Gateway service must be deployed after infrastructure

## Completion Status
- [ ] Task 2.1: Create infrastructure-dynamodb.yml
- [ ] Task 2.2: Create infrastructure-sqs.yml
- [ ] Task 2.3: Create infrastructure-s3.yml
- [ ] Task 2.4: Create infrastructure-eventbridge.yml
- [ ] Task 2.5: Update infrastructure-cognito.yml
- [ ] Board cards created and tracked
- [ ] Cross-stack exports validated

## Files to be Modified/Created
- infrastructure-dynamodb.yml (new)
- infrastructure-sqs.yml (new)
- infrastructure-s3.yml (new)
- infrastructure-eventbridge.yml (new)
- infrastructure-cognito.yml (update)

## Next Steps
Move to Phase 3: API Gateway Service Updates once infrastructure services are complete.

## Critical Requirements
- All resources must have CloudFormation exports
- Export names must follow consistent naming pattern
- Resources must maintain existing functionality
- Cross-stack imports must be properly configured

## Priority
HIGH - Foundation infrastructure blocking all service updates