# Phase 3: SSL Certificate Management Strategy

## Overview

This document outlines the SSL certificate management strategy for the ListBackup.ai v2 API Gateway custom domains, focusing on automated certificate provisioning, validation, renewal, and monitoring using AWS Certificate Manager (ACM).

## Certificate Architecture

### Wildcard Certificate Strategy
- **Certificate Domain**: `*.api.listbackup.ai`
- **Coverage**: All API subdomains (dev.api, staging.api, test.api, etc.)
- **Type**: RSA-2048 (recommended) or ECDSA P-256
- **Validation Method**: DNS validation via Route 53
- **Renewal**: Automatic (AWS managed)

### Benefits of Wildcard Approach
1. **Single Certificate**: Covers all current and future subdomains
2. **Cost Effective**: One certificate vs. multiple individual certificates
3. **Simplified Management**: Single renewal process
4. **Instant Subdomain Support**: New stages immediately have SSL
5. **Reduced Complexity**: No per-stage certificate management

## AWS Certificate Manager (ACM) Configuration

### Certificate Creation (CloudFormation)

```yaml
# Located in services/infra/domains/serverless.yml
ApiSSLCertificate:
  Type: AWS::CertificateManager::Certificate
  Properties:
    DomainName: "*.api.listbackup.ai"
    ValidationMethod: DNS
    DomainValidationOptions:
      - DomainName: "*.api.listbackup.ai"
        HostedZoneId: "Z01040453V93CTQT4QFNW"
    SubjectAlternativeNames:
      - "api.listbackup.ai"  # Include root API domain
    CertificateTransparencyLoggingPreference: ENABLED
    Tags:
      - Key: Service
        Value: listbackup-api-gateway
      - Key: Environment
        Value: all-stages
      - Key: ManagedBy
        Value: Serverless
      - Key: AutoRenewal
        Value: enabled
```

### Certificate Validation Process

#### DNS Validation Records
When the certificate is requested, ACM automatically creates CNAME records in Route 53 for validation:

```
_acme-challenge.*.api.listbackup.ai CNAME _validation.acm-validations.aws.
```

#### Validation Timeline
- **Record Creation**: Immediate (via Route 53 integration)
- **Validation Check**: 5-10 minutes
- **Certificate Issuance**: 5-15 minutes total
- **Propagation**: Additional 5-10 minutes for global availability

### Certificate Storage and Access

#### SSM Parameter Store
```yaml
# Certificate ARN stored in SSM for cross-service access
SSLCertificateArnParameter:
  Type: AWS::SSM::Parameter
  Properties:
    Name: /${self:provider.stage}/domains/api-certificate-arn
    Description: "ARN of the wildcard SSL certificate for the API gateway"
    Type: String
    Value: !Ref ApiSSLCertificate
    Tags:
      Service: listbackup-api-gateway
      Type: ssl-certificate-arn
```

#### CloudFormation Exports
```yaml
# Export for use by other stacks
Outputs:
  SSLCertificateArn:
    Description: "The ARN of the wildcard SSL certificate for *.api.listbackup.ai"
    Value: !Ref ApiSSLCertificate
    Export:
      Name: ${self:service}-${self:provider.stage}-SSLCertificateArn
```

## Automatic Renewal Strategy

### AWS Managed Renewal
- **Renewal Window**: 60 days before expiration
- **Validation Method**: Same as initial (DNS via Route 53)
- **Process**: Fully automated, no manual intervention required
- **Notification**: CloudWatch events and SNS notifications

### Renewal Monitoring
```yaml
# CloudWatch alarm for certificate expiration
CertificateExpirationAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: SSL-Certificate-Expiration-Warning
    AlarmDescription: "SSL certificate expiring soon"
    MetricName: DaysToExpiry
    Namespace: AWS/CertificateManager
    Statistic: Minimum
    Period: 86400  # 24 hours
    EvaluationPeriods: 1
    Threshold: 30  # Alert 30 days before expiration
    ComparisonOperator: LessThanThreshold
    Dimensions:
      - Name: CertificateArn
        Value: !Ref ApiSSLCertificate
    AlarmActions:
      - !Ref SSLAlertTopic
```

### SNS Notifications
```yaml
# SNS topic for SSL certificate alerts
SSLAlertTopic:
  Type: AWS::SNS::Topic
  Properties:
    TopicName: ssl-certificate-alerts
    DisplayName: "SSL Certificate Alerts"
    Subscription:
      - Protocol: email
        Endpoint: devops@listbackup.ai
```

## Security Best Practices

### Certificate Security
1. **Private Key Protection**: AWS manages private keys securely
2. **Certificate Transparency**: Enabled for public accountability
3. **Strong Cryptography**: RSA-2048 minimum, ECDSA P-256 preferred
4. **Secure Transport**: TLS 1.2 minimum, TLS 1.3 preferred

### TLS Configuration
```yaml
# API Gateway domain configuration
DomainNameConfigurations:
  - CertificateArn: !Ref ApiSSLCertificate
    EndpointType: REGIONAL
    SecurityPolicy: TLS_1_2  # Minimum TLS version
    CertificateName: '*.api.listbackup.ai'
```

### Security Headers (via API Gateway)
```yaml
# Security headers for HTTPS responses
GatewayResponseHeaders:
  Strict-Transport-Security: "max-age=31536000; includeSubDomains"
  X-Content-Type-Options: "nosniff"
  X-Frame-Options: "DENY"
  X-XSS-Protection: "1; mode=block"
  Referrer-Policy: "strict-origin-when-cross-origin"
```

## Multi-Region Certificate Strategy

### Current Setup (Single Region)
- **Region**: us-west-2
- **Endpoint Type**: Regional
- **Certificate Location**: us-west-2 ACM

### Future Multi-Region Expansion
If expanding to multiple regions:

```yaml
# Certificate per region for regional endpoints
USWest2Certificate:
  Type: AWS::CertificateManager::Certificate
  Properties:
    DomainName: "*.api.listbackup.ai"
    Region: us-west-2

USEast1Certificate:
  Type: AWS::CertificateManager::Certificate
  Properties:
    DomainName: "*.api.listbackup.ai"
    Region: us-east-1
```

### Edge-Optimized Alternative (if needed)
For edge-optimized endpoints (requires us-east-1):

```yaml
# Edge certificate must be in us-east-1
EdgeSSLCertificate:
  Type: AWS::CertificateManager::Certificate
  Properties:
    DomainName: "*.api.listbackup.ai"
    ValidationMethod: DNS
    Region: us-east-1  # Required for edge-optimized
```

## Certificate Monitoring and Alerting

### CloudWatch Metrics
```bash
# Check certificate metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/CertificateManager \
  --metric-name DaysToExpiry \
  --dimensions Name=CertificateArn,Value=arn:aws:acm:us-west-2:account:certificate/cert-id \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 86400 \
  --statistics Minimum
```

### Automated Monitoring Script
```bash
#!/bin/bash
# monitor-ssl-certificates.sh

REGION="us-west-2"
CERT_ARN=$(aws ssm get-parameter \
  --name "/main/domains/api-certificate-arn" \
  --query "Parameter.Value" \
  --output text \
  --region "$REGION")

if [[ -n "$CERT_ARN" ]]; then
    # Get certificate details
    CERT_INFO=$(aws acm describe-certificate \
      --certificate-arn "$CERT_ARN" \
      --region "$REGION" \
      --output json)
    
    STATUS=$(echo "$CERT_INFO" | jq -r '.Certificate.Status')
    EXPIRY=$(echo "$CERT_INFO" | jq -r '.Certificate.NotAfter')
    
    echo "Certificate Status: $STATUS"
    echo "Expiry Date: $EXPIRY"
    
    # Calculate days until expiry
    EXPIRY_TIMESTAMP=$(date -d "$EXPIRY" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
    
    echo "Days until expiry: $DAYS_LEFT"
    
    if [[ $DAYS_LEFT -lt 30 ]]; then
        echo "⚠️  Certificate expires in less than 30 days!"
        # Send alert (implement notification logic)
    fi
else
    echo "❌ Certificate ARN not found in SSM"
fi
```

### Certificate Validation Check
```bash
#!/bin/bash
# validate-ssl-certificate.sh

DOMAIN="dev.api.listbackup.ai"

echo "Checking SSL certificate for: $DOMAIN"

# Check certificate details
CERT_INFO=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -text)

# Extract key information
ISSUER=$(echo "$CERT_INFO" | grep "Issuer:" | sed 's/.*Issuer: //')
SUBJECT=$(echo "$CERT_INFO" | grep "Subject:" | sed 's/.*Subject: //')
VALIDITY=$(echo "$CERT_INFO" | grep -A2 "Validity")

echo "Issuer: $ISSUER"
echo "Subject: $SUBJECT"
echo "Validity: $VALIDITY"

# Check certificate chain
echo ""
echo "Certificate chain:"
echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" -showcerts 2>/dev/null | grep -E "(s:|i:)"
```

## Disaster Recovery and Backup

### Certificate Backup Strategy
1. **AWS Managed**: Certificates automatically backed up by AWS
2. **Cross-Region**: Consider duplicate certificates in multiple regions
3. **Export Capability**: For migration to other providers if needed

### Recovery Procedures
```bash
#!/bin/bash
# certificate-recovery.sh

# Re-create certificate if needed
aws acm request-certificate \
  --domain-name "*.api.listbackup.ai" \
  --subject-alternative-names "api.listbackup.ai" \
  --validation-method DNS \
  --domain-validation-options DomainName="*.api.listbackup.ai",HostedZoneId="Z01040453V93CTQT4QFNW" \
  --region us-west-2

# Update SSM parameter with new ARN
NEW_CERT_ARN="arn:aws:acm:us-west-2:account:certificate/new-cert-id"
aws ssm put-parameter \
  --name "/main/domains/api-certificate-arn" \
  --value "$NEW_CERT_ARN" \
  --overwrite \
  --region us-west-2
```

## Cost Management

### ACM Pricing
- **Public Certificates**: FREE for AWS services
- **Private Certificates**: $400/month per private CA
- **DNS Validation**: No additional cost (uses Route 53)

### Cost Optimization
1. **Single Wildcard**: Reduces management overhead
2. **Automatic Renewal**: Prevents expiration incidents
3. **Regional Deployment**: Avoids unnecessary multi-region certificates

## Compliance and Audit

### Certificate Compliance
- **TLS Standards**: Meets PCI DSS, HIPAA, SOC requirements
- **Certificate Transparency**: Publicly logged for accountability
- **Audit Trail**: CloudTrail logs all certificate operations

### Audit Commands
```bash
# List all certificates
aws acm list-certificates --region us-west-2

# Get certificate details
aws acm describe-certificate --certificate-arn "$CERT_ARN" --region us-west-2

# Check certificate transparency logs
curl -s "https://crt.sh/?q=*.api.listbackup.ai&output=json" | jq .
```

This SSL certificate management strategy provides a secure, automated, and cost-effective approach to managing SSL certificates for all stages of the ListBackup.ai v2 API Gateway deployment.