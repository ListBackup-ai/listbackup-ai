# Core vs Infrastructure Services Resource Comparison

## Summary

This document compares AWS resources defined in the `core/serverless.yml` with what's been migrated to individual infrastructure services.

## DynamoDB Tables Comparison

### Tables in Core Service

1. **UsersTable** - `listbackup-${stage}-users`
2. **AccountsTable** - `listbackup-${stage}-accounts`
3. **UserAccountsTable** - `listbackup-${stage}-user-accounts`
4. **ActivityTable** - `listbackup-${stage}-activity`
5. **SourcesTable** - `listbackup-${stage}-sources`
6. **JobsTable** - `listbackup-${stage}-jobs` (with DynamoDB Streams)
7. **FilesTable** - `listbackup-${stage}-files`
8. **OAuthStatesTable** - `listbackup-${stage}-oauth-states`
9. **ApiKeysTable** - `listbackup-${stage}-api-keys`
10. **PlatformsTable** - `listbackup-${stage}-platforms`
11. **PlatformConnectionsTable** - `listbackup-${stage}-platform-connections`
12. **SourceGroupsTable** - `listbackup-${stage}-source-groups`
13. **PlatformSourcesTable** - `listbackup-${stage}-platform-sources`

### Tables in DynamoDB Infrastructure Service

1. **UsersTable** - `listbackup-${stage}-users` ✅
2. **AccountsTable** - `listbackup-${stage}-accounts` ✅
3. **UserAccountsTable** - `listbackup-${stage}-user-accounts` ✅
4. **ActivityTable** - `listbackup-${stage}-activity` ✅
5. **SourcesTable** - `listbackup-${stage}-sources` ✅
6. **JobsTable** - `listbackup-${stage}-jobs` (with DynamoDB Streams) ✅
7. **PlatformsTable** - `listbackup-${stage}-platforms` ✅
8. **PlatformConnectionsTable** - `listbackup-${stage}-platform-connections` ✅
9. **PlatformSourcesTable** - `listbackup-${stage}-platform-sources` ✅
10. **SourceGroupsTable** - `listbackup-${stage}-source-groups` ✅
11. **JobLogsTable** - `listbackup-${stage}-job-logs` ⚠️ (NEW - not in core)
12. **TeamsTable** - `listbackup-${stage}-teams` ⚠️ (NEW - not in core)
13. **TeamMembersTable** - `listbackup-${stage}-team-members` ⚠️ (NEW - not in core)
14. **NotificationsTable** - `listbackup-${stage}-notifications` ⚠️ (NEW - not in core)
15. **BillingTable** - `listbackup-${stage}-billing` ⚠️ (NEW - not in core)
16. **BillingUsageTable** - `listbackup-${stage}-billing-usage` ⚠️ (NEW - not in core)
17. **TagsTable** - `listbackup-${stage}-tags` ⚠️ (NEW - not in core)

### DynamoDB Tables Gap Analysis

**Missing from Infrastructure Service:**
- **FilesTable** ❌ - `listbackup-${stage}-files`
- **OAuthStatesTable** ❌ - `listbackup-${stage}-oauth-states`
- **ApiKeysTable** ❌ - `listbackup-${stage}-api-keys`

**Additional in Infrastructure Service (not in core):**
- JobLogsTable
- TeamsTable
- TeamMembersTable
- NotificationsTable
- BillingTable
- BillingUsageTable
- TagsTable

**Index Differences:**
- Core PlatformsTable has indexes: TypeIndex, CategoryIndex, StatusIndex
- Infrastructure PlatformsTable has only: TypeIndex (missing CategoryIndex and StatusIndex)
- Core PlatformSourcesTable has indexes: PlatformIndex, DataTypeIndex, CategoryIndex, PopularityIndex, StatusIndex
- Infrastructure PlatformSourcesTable has only: PlatformIndex (missing all others)
- Core SourceGroupsTable includes connectionId attribute and ConnectionIndex
- Infrastructure SourceGroupsTable is missing connectionId attribute and ConnectionIndex

## SQS Queues Comparison

### Queues in Core Service

1. **SyncQueue** + **SyncDeadLetterQueue** ✅
2. **BackupQueue** + **BackupDeadLetterQueue** ✅
3. **ExportQueue** + **ExportDeadLetterQueue** ✅
4. **AnalyticsQueue** + **AnalyticsDeadLetterQueue** ✅
5. **MaintenanceQueue** + **MaintenanceDeadLetterQueue** ✅
6. **AlertQueue** + **AlertDeadLetterQueue** ✅

### Queues in SQS Infrastructure Service

All 6 queue pairs match exactly between core and infrastructure services. ✅

## S3 Buckets Comparison

### Buckets in Core Service

1. **DataBucket** - `listbackup-data-${stage}`

### Buckets in S3 Infrastructure Service

1. **DataBucket** - `listbackup-data-${stage}-${AccountId}-${Region}` ⚠️

**Difference:** Infrastructure service uses a more specific naming convention including AccountId and Region.

## Cognito Resources Comparison

### Cognito in Core Service

1. **CognitoUserPool** - `listbackup-users-${stage}`
2. **CognitoUserPoolClient** - `listbackup-client-${stage}`

### Cognito in Infrastructure Service

1. **CognitoUserPool** - `listbackup-user-pool-${stage}` ⚠️ (different naming)
2. **CognitoUserPoolClient** - `listbackup-app-client-${stage}` ⚠️ (different naming)
3. **CognitoSmsRole** ⚠️ (NEW - for SMS MFA)
4. **Multiple User Groups** ⚠️ (NEW - SuperAdmins, Admins, Staff, Customer tiers)
5. **SSM Parameters** ⚠️ (NEW - for storing Cognito IDs)

**Key Differences:**
- Infrastructure service has MFA enabled (SMS and Software Token)
- Infrastructure service includes predefined user groups
- Infrastructure service stores outputs in SSM Parameter Store
- Different naming conventions for resources

## EventBridge Resources Comparison

### EventBridge in Core Service

1. **EventBus** - `listbackup-events-${stage}`

### EventBridge in Infrastructure Service

1. **EventBus** - `listbackup-events-${stage}` ✅
2. **DataSyncEventsRule** ⚠️ (NEW)
3. **JobEventsRule** ⚠️ (NEW)
4. **UserEventsRule** ⚠️ (NEW)
5. **BillingEventsRule** ⚠️ (NEW)
6. **PlatformEventsRule** ⚠️ (NEW)
7. **SystemEventsRule** ⚠️ (NEW)
8. **EventBridgeLogGroup** ⚠️ (NEW)
9. **EventBridgeLogRole** ⚠️ (NEW)

Infrastructure service includes predefined event rules and logging configuration not present in core.

## Recommendations

### Critical Issues to Address

1. **Missing Tables in Infrastructure Service:**
   - Add `FilesTable` to DynamoDB infrastructure service
   - Add `OAuthStatesTable` to DynamoDB infrastructure service
   - Add `ApiKeysTable` to DynamoDB infrastructure service

2. **Missing Indexes:**
   - Add CategoryIndex and StatusIndex to PlatformsTable
   - Add DataTypeIndex, CategoryIndex, PopularityIndex, and StatusIndex to PlatformSourcesTable
   - Add connectionId attribute and ConnectionIndex to SourceGroupsTable

3. **Resource Naming Inconsistencies:**
   - S3 bucket naming differs (consider if AccountId/Region suffix is needed)
   - Cognito resource names differ between services

### Migration Considerations

1. **Data Migration:** The additional tables in infrastructure service (Teams, Billing, etc.) suggest new features not in core. Ensure these are intentional additions.

2. **Export Names:** Infrastructure services use different export naming patterns. Applications importing these will need updates.

3. **Cognito Migration:** The infrastructure Cognito setup is more comprehensive with MFA and user groups. This requires careful migration planning.

4. **EventBridge Rules:** The predefined rules in infrastructure service provide better event routing but may need coordination with consuming services.

## Next Steps

1. Add the three missing DynamoDB tables to the infrastructure service
2. Update missing indexes on existing tables
3. Decide on consistent naming conventions for resources
4. Plan migration strategy for differences in Cognito setup
5. Document the purpose of new tables not in core service