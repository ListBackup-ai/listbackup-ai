# AWS Production Access Documentation

This directory contains comprehensive documentation and tools for requesting and configuring AWS production access for ListBackup.ai's authentication service.

## Documentation Files

### 1. [SES Production Request](./ses-production-request.md)
- Complete guide for requesting AWS SES production access
- Includes support case template
- Pre and post-approval checklists
- Expected email volumes and use cases

### 2. [SNS SMS Production Request](./sns-sms-production-request.md)
- Guide for increasing SMS spending limits
- SMS volume estimates and pricing
- Support case template for SNS
- Best practices for SMS messaging

### 3. [Toll-Free SMS Registration](./toll-free-sms-registration.md)
- Comprehensive toll-free number registration process
- Carrier registration requirements
- Documentation requirements
- Timeline and cost analysis

### 4. [DNS Configuration](./dns-configuration.md)
- Complete DNS setup guide for email authentication
- SPF, DKIM, and DMARC record configurations
- Provider-specific instructions
- Troubleshooting common issues

## Scripts and Tools

### Email Verification Tools
Located in `/scripts/aws/`:

1. **verify-ses-emails.sh** - Bash script for email verification
   ```bash
   ./scripts/aws/verify-ses-emails.sh
   ```

2. **verify-ses-emails.go** - Go implementation
   ```bash
   go run scripts/aws/verify-ses-emails.go
   ```

### DNS Monitoring Tools

1. **check-dns-records.sh** - Verify DNS configuration
   ```bash
   ./scripts/aws/check-dns-records.sh listbackup.ai
   ```

2. **monitor-dkim-status.sh** - Monitor DKIM verification progress
   ```bash
   ./scripts/aws/monitor-dkim-status.sh listbackup.ai
   ```

## Quick Start Guide

### Phase 1: Initial Setup (Week 1)
1. **Verify Domain and Emails**
   ```bash
   ./scripts/aws/verify-ses-emails.sh
   ```

2. **Check DNS Configuration**
   ```bash
   ./scripts/aws/check-dns-records.sh
   ```

3. **Add Required DNS Records**
   - SPF: `v=spf1 include:amazonses.com ~all`
   - Domain verification TXT record
   - DKIM CNAME records (3 records)
   - DMARC policy record

### Phase 2: Production Requests (Week 2)
1. **Submit SES Production Request**
   - Use template in [ses-production-request.md](./ses-production-request.md)
   - Request 50,000 emails/day limit

2. **Submit SNS SMS Limit Increase**
   - Use template in [sns-sms-production-request.md](./sns-sms-production-request.md)
   - Request $500/month spending limit

3. **Start Toll-Free Registration** (Optional but recommended)
   - Follow guide in [toll-free-sms-registration.md](./toll-free-sms-registration.md)
   - 2-6 week approval process

### Phase 3: Monitoring (Ongoing)
1. **Monitor DKIM Verification**
   ```bash
   ./scripts/aws/monitor-dkim-status.sh
   ```

2. **Regular DNS Checks**
   ```bash
   # Weekly check
   ./scripts/aws/check-dns-records.sh
   ```

## Timeline Overview

| Week | Tasks |
|------|-------|
| 1 | Domain/email verification, DNS setup |
| 2 | Submit production requests, start monitoring |
| 3-4 | AWS approval period, DNS propagation |
| 5-8 | Toll-free number approval (if requested) |
| 9+ | Production ready, ongoing monitoring |

## Key Metrics to Monitor

### Email (SES)
- Bounce rate: < 5%
- Complaint rate: < 0.1%
- Reputation: Monitor dashboard daily

### SMS (SNS)
- Delivery rate: > 95%
- Opt-out rate: < 1%
- Monthly spend: Track against $500 limit

## Cost Estimates

### Monthly Operational Costs
- **Email (20K/month)**: ~$2.00
- **SMS (20K/month)**: ~$130.00
- **Toll-free number**: $2.00
- **Total**: ~$134.00/month

### One-Time Costs
- **Toll-free registration**: $650.00

## Support Contacts

- **AWS Support**: Via AWS Console
- **Internal**: admin@listbackup.ai
- **Documentation**: This directory

## Compliance Notes

1. **Email**: Must maintain CAN-SPAM compliance
2. **SMS**: TCPA compliance required
3. **Data**: GDPR considerations for EU users
4. **Records**: Maintain opt-in evidence

## Next Steps After Approval

1. Update application configuration with production limits
2. Enable production endpoints
3. Configure monitoring dashboards
4. Set up alerting for violations
5. Document procedures for team

---

Last Updated: 2025-07-01
For questions or updates, contact the engineering team.