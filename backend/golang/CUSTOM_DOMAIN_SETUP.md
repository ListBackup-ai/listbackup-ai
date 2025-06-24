# Custom Domain Setup for ListBackup API

This document explains how to set up custom domains for the ListBackup API using the structure:
- `api.listbackup.ai` (for main/production stage)
- `main.api.listbackup.ai` (additional domain for main stage)
- `stage.api.listbackup.ai` (for other stages like dev, staging, test)

## Overview

The custom domain setup uses Serverless Framework's built-in `customDomain` feature, which automatically handles:

1. **SSL Certificate Creation** - Automatic certificate request and validation
2. **API Gateway Domain Names** - Custom domain configuration for API Gateway
3. **Route53 DNS Records** - Automatic DNS record creation and management
4. **API Mappings** - Connecting domains to specific APIs

## Domain Structure

| Stage | Primary Domain | Additional Domain | Purpose |
|-------|----------------|-------------------|---------|
| main | `api.listbackup.ai` | `main.api.listbackup.ai` | Production API |
| prod | `api.listbackup.ai` | `main.api.listbackup.ai` | Production API (alias) |
| production | `api.listbackup.ai` | `main.api.listbackup.ai` | Production API (alias) |
| dev | `dev.api.listbackup.ai` | - | Development API |
| staging | `staging.api.listbackup.ai` | - | Staging API |
| test | `test.api.listbackup.ai` | - | Testing API |

## Prerequisites

1. **Domain Registration**: `listbackup.ai` must be registered and nameservers pointed to Route53
2. **AWS CLI**: Configured with appropriate permissions
3. **Serverless Framework**: Installed globally (`npm install -g serverless`)
4. **AWS Profile**: Set up for the ListBackup account

## Deployment Steps

### 1. Automated Deployment (Recommended)

Use the comprehensive deployment script:

```bash
cd /path/to/listbackup-ai-v2/backend/golang
./scripts/deploy-with-custom-domains.sh [stage] [aws-profile]
```

**Examples:**
```bash
# Deploy main stage (api.listbackup.ai + main.api.listbackup.ai)
./scripts/deploy-with-custom-domains.sh main listbackup.ai

# Deploy dev stage (dev.api.listbackup.ai)  
./scripts/deploy-with-custom-domains.sh dev listbackup.ai

# Deploy staging stage (staging.api.listbackup.ai)
./scripts/deploy-with-custom-domains.sh staging listbackup.ai
```

### 2. Manual Deployment (Step by Step)

If you prefer to deploy manually:

#### Step 1: Deploy Main API Gateway
```bash
sls deploy --config serverless-go-api-gateway.yml --stage main --aws-profile listbackup.ai
```

#### Step 2: Deploy Additional Main Domain (for main stage only)
```bash
sls deploy --config serverless-go-main-domain.yml --stage main --aws-profile listbackup.ai
```

### 3. Verify Deployment

Use the verification script:

```bash
./scripts/check-domain-status.sh listbackup.ai
```

Or check manually:

```bash
# Check domain status
aws apigatewayv2 get-domain-name --domain-name api.listbackup.ai --profile listbackup.ai
aws apigatewayv2 get-domain-name --domain-name main.api.listbackup.ai --profile listbackup.ai

# Check DNS resolution
nslookup api.listbackup.ai
nslookup main.api.listbackup.ai

# Test API endpoints
curl -I https://api.listbackup.ai/placeholder
curl -I https://main.api.listbackup.ai/placeholder
```

## Configuration Files

### Primary Configuration Files

1. **`serverless-go-api-gateway.yml`** - Main API Gateway with custom domains
   - Primary domain configuration (api.listbackup.ai for main stage)
   - Stage-specific domain mapping
   - Serverless customDomain configuration

2. **`serverless-go-main-domain.yml`** - Additional main domain
   - Additional domain for main stage (main.api.listbackup.ai)
   - Separate deployment for the additional domain

### Supporting Files

- `scripts/deploy-with-custom-domains.sh` - Automated deployment
- `scripts/check-domain-status.sh` - Status verification

## How It Works

### Serverless customDomain Feature

The `customDomain` configuration in serverless.yml automatically:

1. **Creates SSL Certificate**: Requests and validates SSL certificate via DNS
2. **Creates API Gateway Domain**: Sets up custom domain in API Gateway
3. **Creates Route53 Records**: Automatically creates A records pointing to API Gateway
4. **Creates API Mappings**: Maps the domain to the API Gateway stage

### Configuration Example

```yaml
customDomain:
  domainName: api.listbackup.ai
  hostedZoneId: Z01040453V93CTQT4QFNW
  createRoute53Record: true
  createRoute53IPv6Record: false
  endpointType: 'REGIONAL'
  securityPolicy: tls_1_2
  autoDomain: true
  autoDomainWaitFor: true
```

## SSL Certificate

Serverless Framework automatically creates SSL certificates that cover:
- The primary domain (e.g., `api.listbackup.ai`)
- Any additional domains (e.g., `main.api.listbackup.ai`)

Certificate validation is automatic via DNS.

## Frontend Configuration

Update your frontend environment files:

### `.env.production`
```env
NEXT_PUBLIC_API_URL=https://api.listbackup.ai
# Alternative: NEXT_PUBLIC_API_URL=https://main.api.listbackup.ai
```

### `.env.development` 
```env
NEXT_PUBLIC_API_URL=https://dev.api.listbackup.ai
```

### `.env.staging`
```env
NEXT_PUBLIC_API_URL=https://staging.api.listbackup.ai
```

## Troubleshooting

### Common Issues

1. **Certificate Pending Validation**
   - Wait 5-10 minutes for DNS validation
   - Check Route53 records for validation CNAME records

2. **Domain Status PENDING**
   - Normal for new domains, wait up to 40 minutes
   - Check certificate status first

3. **DNS Not Resolving**
   - Verify nameservers point to Route53
   - Check A records in hosted zone

4. **API Not Responding**
   - Verify API Gateway is deployed
   - Check API mapping exists
   - Ensure API Gateway has correct authorizers

### Verification Commands

```bash
# Check certificate status
aws acm list-certificates --profile listbackup.ai

# Check domain status
aws apigatewayv2 get-domain-names --profile listbackup.ai

# Check API mappings
aws apigatewayv2 get-api-mappings --domain-name api.listbackup.ai --profile listbackup.ai
aws apigatewayv2 get-api-mappings --domain-name main.api.listbackup.ai --profile listbackup.ai

# Check Route53 records
aws route53 list-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --profile listbackup.ai
```

## Cleanup

To remove a custom domain:

```bash
# Remove the entire stack (includes custom domains)
sls remove --config serverless-go-api-gateway.yml --stage staging --aws-profile listbackup.ai
sls remove --config serverless-go-main-domain.yml --stage main --aws-profile listbackup.ai
```

## Notes

- Domain propagation can take up to 40 minutes
- SSL certificates are validated automatically via DNS
- Serverless Framework handles all the complex setup automatically
- The `customDomain` feature creates everything needed for custom domains
- Main stage supports both `api.listbackup.ai` and `main.api.listbackup.ai`

## Support

For issues with domain setup:
1. Check the deployment logs
2. Verify AWS permissions
3. Use the status checking script
4. Review CloudFormation stack events