# Phase 3: Route 53 DNS Configuration for API Gateway Custom Domains

## Overview

This document details the Route 53 DNS configuration requirements for the ListBackup.ai v2 API Gateway custom domain strategy, supporting multi-stage deployments with automatic DNS management.

## DNS Architecture

### Hosted Zone Configuration
- **Primary Domain**: `listbackup.ai`
- **Hosted Zone ID**: `Z01040453V93CTQT4QFNW`
- **Zone Type**: Public hosted zone
- **DNS Provider**: AWS Route 53

### Domain Structure
```
listbackup.ai (root domain)
├── api.listbackup.ai (main/production)
├── main.api.listbackup.ai (explicit main stage)
├── dev.api.listbackup.ai (development)
├── staging.api.listbackup.ai (staging)
└── test.api.listbackup.ai (testing)
```

## DNS Record Configuration

### A Record (Alias) Configuration

Each API domain uses an A record with alias target pointing to the API Gateway Regional Domain Name:

```yaml
Type: AWS::Route53::RecordSet
Properties:
  HostedZoneId: Z01040453V93CTQT4QFNW
  Name: ${DOMAIN_NAME}  # e.g., dev.api.listbackup.ai
  Type: A
  AliasTarget:
    DNSName: ${ApiGatewayRegionalDomainName}
    HostedZoneId: ${ApiGatewayRegionalHostedZoneId}
    EvaluateTargetHealth: false
```

### DNS Record Management Strategy

#### 1. Automated Record Creation
- **Method**: Serverless Domain Manager plugin with `createRoute53Record: true`
- **Automation**: Records created/updated during domain setup
- **Cleanup**: Records removed during domain deletion

#### 2. Manual Record Management (Alternative)
```bash
# Create A record for custom domain
aws route53 change-resource-record-sets \
  --hosted-zone-id Z01040453V93CTQT4QFNW \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "dev.api.listbackup.ai",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2OJLYMUO9EFXC",
          "DNSName": "d-abc123.execute-api.us-west-2.amazonaws.com",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

## Stage-Specific DNS Patterns

### Production Domain (main stage)
- **Primary**: `api.listbackup.ai`
- **Alternate**: `main.api.listbackup.ai`
- **Strategy**: Both domains point to same API Gateway
- **Usage**: `api.listbackup.ai` for public consumption, `main.api.listbackup.ai` for consistency

### Development Stages
- **Pattern**: `{stage}.api.listbackup.ai`
- **Examples**: 
  - `dev.api.listbackup.ai`
  - `staging.api.listbackup.ai`
  - `test.api.listbackup.ai`
  - `feature-branch.api.listbackup.ai`

### Dynamic Branch Domains
For feature branches and temporary environments:
- **Pattern**: `{branch-name}.api.listbackup.ai`
- **Lifecycle**: Created with deployment, cleaned up after merge/deletion
- **Automation**: CI/CD pipeline manages creation and cleanup

## DNS Propagation and Timing

### Propagation Timeframes
- **Route 53 Changes**: 30-60 seconds globally
- **Local DNS Cache**: 5-15 minutes (varies by provider)
- **CDN/Proxy Services**: Up to 24 hours (if using CloudFlare, etc.)
- **Browser Cache**: Based on TTL settings

### TTL Configuration
```yaml
# Recommended TTL values
Development/Testing: 300 seconds (5 minutes)
Staging: 900 seconds (15 minutes)
Production: 3600 seconds (1 hour)
```

### DNS Validation Commands
```bash
# Check DNS propagation
nslookup dev.api.listbackup.ai

# Check from different DNS servers
nslookup dev.api.listbackup.ai 8.8.8.8
nslookup dev.api.listbackup.ai 1.1.1.1

# Detailed DNS information
dig dev.api.listbackup.ai

# Check specific record type
dig A dev.api.listbackup.ai
```

## Health Checks and Monitoring

### Route 53 Health Checks
```yaml
# Health check configuration
HealthCheck:
  Type: AWS::Route53::HealthCheck
  Properties:
    Type: HTTPS
    ResourcePath: /system/health
    FullyQualifiedDomainName: dev.api.listbackup.ai
    Port: 443
    RequestInterval: 30
    FailureThreshold: 3
    Tags:
      - Key: Name
        Value: API-Gateway-Dev-Health
      - Key: Stage
        Value: dev
```

### CloudWatch Alarms for DNS
```yaml
# DNS query alarm
DNSQueryAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmDescription: "High DNS query count for API domain"
    MetricName: QueryCount
    Namespace: AWS/Route53
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 2
    Threshold: 1000
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: HostedZoneId
        Value: Z01040453V93CTQT4QFNW
```

## DNS Security Configuration

### DNSSEC (if enabled)
```bash
# Check DNSSEC status
dig +dnssec api.listbackup.ai

# Enable DNSSEC for hosted zone
aws route53 enable-hosted-zone-dnssec \
  --hosted-zone-id Z01040453V93CTQT4QFNW
```

### DNS Firewall Rules
```yaml
# Route 53 Resolver DNS Firewall
DNSFirewallRuleGroup:
  Type: AWS::Route53Resolver::FirewallRuleGroup
  Properties:
    Name: ListBackupAPIDNSFirewall
    Tags:
      - Key: Service
        Value: listbackup-api
```

## Multi-Environment DNS Management

### Environment-Specific Configuration

#### Development Environment
```yaml
# Development DNS configuration
dev:
  domain: dev.api.listbackup.ai
  ttl: 300
  healthCheck: true
  monitoring: basic
```

#### Staging Environment
```yaml
# Staging DNS configuration
staging:
  domain: staging.api.listbackup.ai
  ttl: 900
  healthCheck: true
  monitoring: enhanced
  backup: true
```

#### Production Environment
```yaml
# Production DNS configuration
main:
  domains:
    - api.listbackup.ai
    - main.api.listbackup.ai
  ttl: 3600
  healthCheck: true
  monitoring: comprehensive
  backup: true
  failover: enabled
```

### Failover Configuration (Future Enhancement)
```yaml
# Primary-Secondary failover setup
PrimaryRecord:
  Type: AWS::Route53::RecordSet
  Properties:
    Name: api.listbackup.ai
    Type: A
    SetIdentifier: Primary
    Failover: PRIMARY
    AliasTarget:
      DNSName: ${PrimaryApiGateway}
      HostedZoneId: ${PrimaryHostedZoneId}
    HealthCheckId: !Ref PrimaryHealthCheck

SecondaryRecord:
  Type: AWS::Route53::RecordSet
  Properties:
    Name: api.listbackup.ai
    Type: A
    SetIdentifier: Secondary
    Failover: SECONDARY
    AliasTarget:
      DNSName: ${SecondaryApiGateway}
      HostedZoneId: ${SecondaryHostedZoneId}
```

## DNS Management Scripts

### 1. DNS Status Check Script
```bash
#!/bin/bash
# check-dns-status.sh

DOMAINS=("api.listbackup.ai" "dev.api.listbackup.ai" "staging.api.listbackup.ai")

for domain in "${DOMAINS[@]}"; do
    echo "Checking DNS for: $domain"
    
    # Check A record
    A_RECORD=$(dig +short A "$domain")
    if [[ -n "$A_RECORD" ]]; then
        echo "  A Record: $A_RECORD"
    else
        echo "  A Record: NOT FOUND"
    fi
    
    # Check response time
    RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "https://$domain/system/health")
    echo "  Response Time: ${RESPONSE_TIME}s"
    
    echo ""
done
```

### 2. DNS Record Cleanup Script
```bash
#!/bin/bash
# cleanup-dns-records.sh

HOSTED_ZONE_ID="Z01040453V93CTQT4QFNW"
DOMAIN_PATTERN="*.api.listbackup.ai"

# List all records matching pattern
aws route53 list-resource-record-sets \
  --hosted-zone-id "$HOSTED_ZONE_ID" \
  --query "ResourceRecordSets[?contains(Name, 'api.listbackup.ai')]" \
  --output table

echo "Review the records above and manually delete unused ones."
```

### 3. DNS Performance Test
```bash
#!/bin/bash
# test-dns-performance.sh

DOMAIN="dev.api.listbackup.ai"
DNS_SERVERS=("8.8.8.8" "1.1.1.1" "208.67.222.222")

for server in "${DNS_SERVERS[@]}"; do
    echo "Testing DNS server: $server"
    time nslookup "$DOMAIN" "$server" >/dev/null 2>&1
    echo ""
done
```

## Troubleshooting DNS Issues

### Common DNS Problems

1. **DNS Not Resolving**
   ```bash
   # Check Route 53 record exists
   aws route53 list-resource-record-sets \
     --hosted-zone-id Z01040453V93CTQT4QFNW \
     --query "ResourceRecordSets[?Name=='dev.api.listbackup.ai.']"
   ```

2. **Wrong IP Resolution**
   ```bash
   # Clear local DNS cache
   sudo dscacheutil -flushcache  # macOS
   sudo systemctl restart systemd-resolved  # Linux
   ipconfig /flushdns  # Windows
   ```

3. **Slow DNS Response**
   ```bash
   # Test DNS performance
   dig +trace dev.api.listbackup.ai
   ```

### DNS Debugging Tools

1. **Online Tools**
   - `whatsmydns.net` - Global DNS propagation check
   - `dnschecker.org` - Multi-location DNS testing
   - `mxtoolbox.com` - Comprehensive DNS analysis

2. **Command Line Tools**
   ```bash
   # Comprehensive DNS check
   dig +short +trace +stats dev.api.listbackup.ai
   
   # Check specific DNS server
   nslookup dev.api.listbackup.ai 8.8.8.8
   
   # DNS resolution timing
   time dig dev.api.listbackup.ai
   ```

## Cost Optimization

### Route 53 Pricing (as of 2024)
- **Hosted Zone**: $0.50/month per zone
- **Standard Queries**: $0.40 per million queries
- **Health Checks**: $0.50/month per health check
- **Domain Registration**: Varies by TLD

### Cost Optimization Strategies
1. **Minimize Health Checks**: Only for critical domains
2. **Optimize TTL Values**: Longer TTL = fewer queries
3. **Consolidate Domains**: Use path-based routing where possible
4. **Clean Up Unused Records**: Regular maintenance

This DNS configuration provides a robust, scalable, and cost-effective solution for managing custom domains across all stages of the ListBackup.ai v2 API Gateway deployment.