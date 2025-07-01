# Cross-Stack Reference Issues and Recommended Fixes

## Critical Issues Found

### 1. Hardcoded Authorizer ID

**Issue**: All services use a hardcoded authorizer ID `c0vpx0` instead of importing it from the API Gateway service.

**Location**: All application services (auth, users, accounts, etc.)

**Current Code**:
```yaml
authorizer:
  id: c0vpx0
```

**Recommended Fix**:
```yaml
authorizer:
  id: ${cf:listbackup-api-gateway-${self:provider.stage}.CognitoAuthorizerId}
```

**Impact**: Medium - Could break if authorizer is recreated with a different ID

**Priority**: High - Easy fix with significant reliability improvement

### 2. SSL Certificate Export Name Mismatch

**Issue**: API Gateway expects a different export name than what the domains service provides.

**Location**: 
- `api-gateway/serverless.yml` (line 130)
- `infra/domains/serverless.yml` (line 44)

**Current State**:
```yaml
# API Gateway expects:
CertificateArn: 
  Fn::ImportValue: listbackup-ssl-certificate-arn

# But domains service exports:
Export:
  Name: ${self:service}-${self:provider.stage}-SSLCertificateArn
  # Resolves to: listbackup-infra-domains-main-SSLCertificateArn
```

**Recommended Fix**:

Option 1 - Update API Gateway import:
```yaml
CertificateArn: 
  Fn::ImportValue: listbackup-infra-domains-${self:provider.stage}-SSLCertificateArn
```

Option 2 - Update domains export (Breaking change):
```yaml
Export:
  Name: listbackup-ssl-certificate-arn
```

**Impact**: High - Deployment failure

**Priority**: Critical - Blocks API Gateway deployment

### 3. Missing Hosted Zone Export

**Issue**: API Gateway imports a hosted zone ID that no service exports.

**Location**: `api-gateway/serverless.yml` (line 150)

**Current Code**:
```yaml
HostedZoneId: 
  Fn::ImportValue: listbackup-hosted-zone-id
```

**Recommended Fix**:

Create a new infrastructure service or add to domains service:
```yaml
Resources:
  # ... existing resources ...
  
Outputs:
  HostedZoneId:
    Description: "Route53 Hosted Zone ID for listbackup.ai"
    Value: "Z01040453V93CTQT4QFNW"  # Currently hardcoded in domains service
    Export:
      Name: listbackup-hosted-zone-id
```

**Impact**: High - Deployment failure

**Priority**: Critical - Blocks API Gateway deployment

### 4. Inconsistent Export Naming Convention

**Issue**: Export names don't follow a consistent pattern.

**Examples**:
- Some use full service name: `listbackup-core-main-UsersTableName`
- Some are missing stage: `listbackup-ssl-certificate-arn`
- Some are missing service prefix entirely

**Recommended Standard**:
```yaml
Export:
  Name: ${self:service}-${self:provider.stage}-${ResourceName}
```

**Impact**: Low - Confusion and maintenance overhead

**Priority**: Medium - Improve during next major refactor

## Non-Critical Issues

### 1. Overly Permissive IAM Policies

**Issue**: Many services have wildcard permissions:
```yaml
- Effect: Allow
  Action: "*"
  Resource: "*"
```

**Recommendation**: Apply principle of least privilege

**Priority**: Low - Security improvement for production

### 2. Missing Service Dependencies in package.json

**Issue**: No explicit dependency management for deployment order

**Recommendation**: Create a deployment orchestration tool or use AWS CDK

**Priority**: Low - Nice to have

## Implementation Plan

### Phase 1: Critical Fixes (Immediate)

1. **Fix SSL Certificate Import** (1 hour)
   - Update `api-gateway/serverless.yml` to use correct import name
   - Test deployment

2. **Add Hosted Zone Export** (1 hour)
   - Add export to `infra/domains/serverless.yml`
   - Redeploy domains service
   - Test API Gateway deployment

### Phase 2: High Priority Fixes (This Week)

3. **Replace Hardcoded Authorizer IDs** (2-3 hours)
   - Update all application services
   - Test each service individually
   - Deploy to dev environment first

### Phase 3: Medium Priority Improvements (Next Sprint)

4. **Standardize Export Names** (4-6 hours)
   - Create naming convention document
   - Update all exports to follow convention
   - Update all imports accordingly
   - Requires coordinated deployment

5. **Improve IAM Policies** (1-2 days)
   - Audit actual permissions needed
   - Create service-specific policies
   - Test thoroughly

## Testing Checklist

Before deploying fixes:

- [ ] Run `serverless package` to validate CloudFormation templates
- [ ] Deploy to dev environment first
- [ ] Test all service endpoints
- [ ] Verify CloudFormation exports are created
- [ ] Check for any DELETE_FAILED stacks
- [ ] Document any breaking changes

## Rollback Plan

If issues occur:

1. **For Export Changes**:
   - Keep old exports temporarily
   - Add new exports alongside
   - Update imports one by one
   - Remove old exports after verification

2. **For Import Changes**:
   - Deploy services with both old and new import methods
   - Use conditionals to check which is available
   - Gradually phase out old method

## Monitoring After Fixes

Set up CloudWatch alarms for:
- Stack update failures
- Lambda function errors increase
- API Gateway 5xx errors
- DynamoDB throttling

## Long-term Recommendations

1. **Consider AWS CDK**: Would provide type-safe imports and better dependency management
2. **Implement Blue-Green Deployments**: For zero-downtime updates
3. **Create Integration Tests**: To catch cross-stack issues early
4. **Document All Exports**: In service README files
5. **Version Exports**: Add version suffix for breaking changes