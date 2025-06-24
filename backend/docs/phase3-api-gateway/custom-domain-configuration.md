# Phase 3: Custom Domain Configuration for API Gateway

## Overview

This document provides the complete custom domain strategy for the ListBackup.ai v2 API Gateway service, supporting staged deployments with the pattern: `{stage}.api.listbackup.ai`.

## Domain Strategy

### Stage-Based Domain Mapping
- **main/production**: `api.listbackup.ai` (primary production domain)
- **main (alternate)**: `main.api.listbackup.ai` (explicit main stage)
- **dev**: `dev.api.listbackup.ai`
- **staging**: `staging.api.listbackup.ai`
- **test**: `test.api.listbackup.ai`

### SSL Certificate Strategy
- **Wildcard Certificate**: `*.api.listbackup.ai` covers all stage subdomains
- **Certificate Region**: `us-west-2` (Regional endpoint requirement for HTTP APIs)
- **Validation Method**: DNS validation with Route 53
- **Certificate Management**: AWS Certificate Manager (ACM)

## Implementation Components

### 1. Serverless Domain Manager Plugin

The configuration uses the `serverless-domain-manager` plugin (v8.0.0) which is already installed in the project.

### 2. SSL Certificate Infrastructure

The wildcard SSL certificate is managed by the `listbackup-infra-domains` service:

```yaml
# Located at: services/infra/domains/serverless.yml
ApiSSLCertificate:
  Type: AWS::CertificateManager::Certificate
  Properties:
    DomainName: "*.api.listbackup.ai"
    ValidationMethod: DNS
    DomainValidationOptions:
      - DomainName: "*.api.listbackup.ai"
        HostedZoneId: "Z01040453V93CTQT4QFNW"
```

### 3. Route 53 DNS Configuration

- **Hosted Zone ID**: `Z01040453V93CTQT4QFNW` (listbackup.ai)
- **Record Type**: A record with alias target
- **Target**: API Gateway Regional Domain Name
- **Auto-creation**: Enabled via serverless-domain-manager plugin

## Serverless.yml Configuration Updates

### Plugin Configuration

```yaml
plugins:
  - serverless-go-plugin
  - serverless-domain-manager
  - serverless-aws-documentation
```

### Custom Domain Configuration

```yaml
custom:
  # Stage-specific domain mapping
  domainMap:
    main: api.listbackup.ai
    production: api.listbackup.ai
    dev: dev.api.listbackup.ai
    staging: staging.api.listbackup.ai
    test: test.api.listbackup.ai
  
  # Domain manager configuration
  customDomain:
    domainName: ${self:custom.domainMap.${self:provider.stage}, '${self:provider.stage}.api.listbackup.ai'}
    basePath: ''  # No base path - API at root
    stage: ${self:provider.stage}
    certificateArn: ${ssm:/${self:provider.stage}/domains/api-certificate-arn}
    createRoute53Record: true
    createRoute53IPv6Record: false
    endpointType: REGIONAL
    securityPolicy: TLS_1_2
    apiType: http  # HTTP API (not REST API)
    autoDomain: true
    preserveExternalPathMappings: false
```

### Environment Variables Update

```yaml
provider:
  environment:
    # Existing variables...
    CUSTOM_DOMAIN_NAME: ${self:custom.customDomain.domainName}
    API_BASE_URL: https://${self:custom.customDomain.domainName}
```

## Deployment Process

### 1. Infrastructure Deployment Order

1. **Core Infrastructure**: Deploy `infra/domains` service first
2. **Certificate Validation**: Wait for SSL certificate validation (5-10 minutes)
3. **API Gateway**: Deploy with domain configuration
4. **Domain Creation**: Run domain creation command
5. **Service Deployment**: Deploy application services

### 2. Domain Creation Commands

```bash
# Create domain for specific stage
sls create_domain --stage dev --config services/api-gateway/serverless.yml

# Deploy API Gateway with domain
sls deploy --stage dev --config services/api-gateway/serverless.yml
```

### 3. Automated Domain Setup Script

```bash
#!/bin/bash
# setup-stage-domain.sh
STAGE=${1:-dev}
AWS_PROFILE=${2:-listbackup.ai}

echo "Setting up domain for stage: $STAGE"

# Deploy domain infrastructure if not exists
sls deploy --config services/infra/domains/serverless.yml --stage main --aws-profile $AWS_PROFILE

# Create custom domain
sls create_domain --stage $STAGE --config services/api-gateway/serverless.yml --aws-profile $AWS_PROFILE

# Deploy API Gateway
sls deploy --stage $STAGE --config services/api-gateway/serverless.yml --aws-profile $AWS_PROFILE

echo "Domain setup complete: https://${STAGE}.api.listbackup.ai"
```

## DNS Propagation and Validation

### Timeframes
- **SSL Certificate Validation**: 5-10 minutes (DNS validation)
- **DNS Propagation**: 5-40 minutes (varies by location)
- **API Gateway Domain Creation**: 40 minutes maximum

### Validation Commands

```bash
# Check SSL certificate status
aws acm describe-certificate --certificate-arn <cert-arn> --region us-west-2

# Check domain status
aws apigatewayv2 get-domain-name --domain-name dev.api.listbackup.ai --region us-west-2

# Test domain resolution
nslookup dev.api.listbackup.ai

# Test HTTPS endpoint
curl -I https://dev.api.listbackup.ai/system/health
```

## Security Considerations

### TLS Configuration
- **Security Policy**: TLS 1.2 minimum
- **Certificate Type**: RSA-2048 or ECDSA P-256
- **HSTS**: Consider implementing via CloudFront if needed

### Access Control
- Domain creation restricted to deployment roles
- Certificate management via IAM policies
- Route 53 access limited to deployment automation

## Troubleshooting

### Common Issues

1. **Certificate Not Found**
   - Ensure infra/domains service is deployed first
   - Check SSM parameter exists: `/${stage}/domains/api-certificate-arn`

2. **Domain Creation Timeout**
   - API Gateway custom domains can take up to 40 minutes
   - Check certificate is ISSUED status first

3. **DNS Resolution Issues**
   - Verify Route 53 record exists and points to correct target
   - Check propagation with multiple DNS servers

4. **HTTPS Not Working**
   - Verify certificate covers the domain (wildcard)
   - Check API Gateway domain status is AVAILABLE

### Monitoring and Alerts

- CloudWatch alarms for certificate expiration
- Route 53 health checks for domain availability
- API Gateway metrics for custom domain performance

## Cost Considerations

### AWS Costs
- **Route 53 Hosted Zone**: $0.50/month per zone
- **Route 53 Queries**: $0.40 per million queries
- **ACM Certificate**: Free for AWS services
- **API Gateway Custom Domain**: No additional cost
- **DNS Queries**: Standard Route 53 pricing

### Optimization
- Single wildcard certificate covers all stages
- Regional endpoints reduce latency and cost vs Edge
- Auto-cleanup of unused domains in CI/CD

This configuration provides a robust, scalable, and secure custom domain strategy that supports the multi-stage deployment architecture while maintaining consistency and ease of management.