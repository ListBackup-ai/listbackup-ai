# DynamoDB Architecture Guidelines

## Current DynamoDB Implementation

### Existing Tables and Usage
Based on the current backend implementation at `../listbackup.ai/project/backend/src/handlers/`, the system uses **DynamoDB extensively**:

#### Core Tables
- **Users Table**: User profiles and account mappings
- **Accounts Table**: Account-level settings and configurations
- **Conversations Table**: Chat conversations with AI assistants
- **Messages Table**: Individual messages within conversations
- **Jobs Table**: Backup job definitions and configurations
- **JobRuns Table**: Individual job execution instances
- **Integrations Table**: Connected platform integrations (OAuth tokens, settings)
- **Analytics Table**: Query history and usage analytics

### DynamoDB Design Patterns

#### Single Table Design Considerations
For v2, consider consolidating related entities using single table design where appropriate:
```
PK: USER#123                SK: PROFILE            # User profile
PK: USER#123                SK: ACCOUNT#456        # User account mapping
PK: ACCOUNT#456             SK: SETTINGS           # Account settings
PK: CONVERSATION#789        SK: METADATA           # Conversation details
PK: CONVERSATION#789        SK: MESSAGE#001        # Individual messages
```

#### Current Access Patterns
- **User Management**: Get user by ID, list user accounts
- **Chat System**: Get conversation history, append messages, stream responses
- **Job Management**: List jobs by account, get job execution history
- **Analytics**: Query by user/account, time-based aggregations
- **Integrations**: OAuth flow management, token refresh

### Best Practices for v2

#### DynamoDB Optimization
- **Use composite keys** for hierarchical relationships
- **Implement GSI** for alternate query patterns
- **Batch operations** for bulk data operations
- **DynamoDB Streams** for real-time data processing
- **TTL attributes** for message retention and cleanup

#### Cost Optimization
- **On-demand billing** for unpredictable workloads
- **Provisioned billing** for steady, predictable traffic
- **Use DynamoDB-local** for development/testing
- **Implement caching** with ElastiCache for frequently accessed data

#### Security Patterns
- **IAM roles** for fine-grained access control
- **Encryption at rest** enabled by default
- **VPC endpoints** for secure communication
- **Audit trail** with CloudTrail logging

### Migration Strategy

#### Maintaining Compatibility
- **Keep existing table structure** for seamless v2 integration
- **Add new fields** using sparse indexing where needed
- **Version API responses** to handle schema evolution
- **Use feature flags** for gradual rollout of new functionality

#### Recommended Enhancements
- **Add created/updated timestamps** to all records
- **Implement soft deletes** with TTL for audit trails
- **Use partition key** design for better distribution
- **Add secondary indexes** for common query patterns

### Connection Patterns for Frontend

#### React Integration
```typescript
// Use existing patterns from v1
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

// Maintain compatibility with existing API endpoints
const apiClient = new DynamoDBDocumentClient(dynamoDbClient)
```

#### State Management with TanStack Query
```typescript
// Leverage existing DynamoDB queries through API layer
const { data: conversations } = useQuery({
  queryKey: ['conversations', accountId],
  queryFn: () => fetchConversations(accountId),
  staleTime: 5 * 60 * 1000 // 5 minutes
})
```

### Performance Considerations

#### Read Optimization
- **Use consistent reads** only when necessary
- **Implement pagination** for large result sets
- **Cache frequently accessed data** in Redis
- **Use parallel scans** for analytics queries

#### Write Optimization
- **Batch write operations** when possible
- **Use conditional writes** to prevent race conditions
- **Implement retry logic** with exponential backoff
- **Monitor throttling** and adjust capacity accordingly

### Development Guidelines

#### Local Development
- **DynamoDB Local** for offline development
- **Seed data scripts** for consistent testing
- **Mock data generators** for realistic testing scenarios
- **Integration tests** with real DynamoDB tables

#### Production Monitoring
- **CloudWatch metrics** for performance monitoring
- **Custom dashboards** for business metrics
- **Alerting** on throttling and error rates
- **Cost monitoring** for budget management 