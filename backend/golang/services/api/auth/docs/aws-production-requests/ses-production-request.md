# AWS SES Production Access Request

## Overview
This document outlines the process and requirements for requesting production access for AWS Simple Email Service (SES) to exit the sandbox mode for listbackup.ai.

## Current Status
- **Account**: Currently in SES Sandbox mode
- **Limitations**: Can only send emails to verified email addresses
- **Daily Sending Quota**: 200 emails/day
- **Maximum Send Rate**: 1 email/second

## Production Access Requirements

### 1. Use Case Description
**Service Name**: ListBackup.ai  
**Purpose**: Automated email backup and archival service  
**Email Types**:
- Transactional emails (account verification, password resets, MFA codes)
- Service notifications (backup completed, storage warnings)
- Account alerts (security notifications, billing updates)

### 2. Email Volume Estimates
- **Expected Daily Volume**: 5,000-10,000 emails initially
- **Peak Hour Volume**: 500-1,000 emails
- **Growth Projection**: 50,000 emails/day within 6 months

### 3. Bounce and Complaint Handling
- **Bounce Processing**: Automated handling via SNS webhooks
- **Complaint Management**: Immediate unsubscribe functionality
- **Suppression List**: Maintained in DynamoDB
- **Monitoring**: CloudWatch alarms for bounce/complaint rates

### 4. Email Content Quality
- **Double Opt-in**: Required for all marketing communications
- **Unsubscribe Links**: Present in all emails
- **Physical Address**: Included in email footer
- **Clear From Address**: noreply@listbackup.ai
- **SPF/DKIM/DMARC**: Fully configured

## Steps to Request Production Access

### Step 1: Prepare Your AWS Account
1. Verify your domain in SES
2. Set up DKIM authentication
3. Configure SPF records
4. Implement bounce and complaint handling

### Step 2: Submit Production Access Request
1. Go to AWS Support Center
2. Create a new case
3. Select "Service limit increase"
4. Choose "SES Sending Limits"
5. Fill out the request form with the following:

```
Region: us-east-1
Limit Type: Desired Daily Sending Quota
New limit value: 50000
Use case description: [Copy from section above]
Website URL: https://listbackup.ai
Type of email: Transactional
Describe how you will comply with AWS Service Terms: [Detail compliance measures]
Describe your process to handle bounces and complaints: [Copy from section above]
```

### Step 3: Additional Information to Include
- **Email Authentication**: Mention DKIM, SPF, and DMARC configuration
- **List Management**: Describe opt-in process and unsubscribe handling
- **Content Review**: Explain email template approval process
- **Monitoring**: Detail CloudWatch monitoring and alerting setup

### Step 4: Response Time
- AWS typically responds within 24-48 hours
- May request additional information
- Be prepared to provide email samples

## Pre-Production Checklist
- [ ] Domain verified in SES
- [ ] DKIM records added and verified
- [ ] SPF record includes Amazon SES
- [ ] Bounce handling endpoint configured
- [ ] Complaint handling endpoint configured
- [ ] Suppression list database created
- [ ] Email templates reviewed for compliance
- [ ] Monitoring dashboards configured
- [ ] Test emails sent successfully

## Post-Approval Actions
1. Update sending rate limits in application
2. Enable production email endpoints
3. Monitor initial sending metrics closely
4. Set up reputation dashboard
5. Configure sending rate alarms

## Support Case Template

```
Subject: SES Production Access Request for ListBackup.ai

Hello AWS Support,

We would like to request production access for Amazon SES to support our email backup service, ListBackup.ai.

Use Case:
ListBackup.ai is an automated email backup and archival service that needs to send transactional emails including account verification, password resets, MFA codes, and service notifications.

Email Volume:
- Current: 200 emails/day (sandbox limit)
- Required: 50,000 emails/day
- Expected initial volume: 5,000-10,000 emails/day

Compliance Measures:
1. All recipients explicitly opt-in to our service
2. Unsubscribe links in every email
3. Automated bounce and complaint handling via SNS
4. Suppression list maintained in DynamoDB
5. DKIM, SPF, and DMARC fully configured
6. CloudWatch monitoring for bounce/complaint rates

We have thoroughly tested our email infrastructure in sandbox mode and are ready to serve our growing customer base.

Thank you for your consideration.

Best regards,
ListBackup.ai Team
```

## Contact Information
- **Technical Contact**: [Your Name]
- **Email**: admin@listbackup.ai
- **Company**: ListBackup.ai
- **Website**: https://listbackup.ai

## Notes
- Keep bounce rate below 5%
- Keep complaint rate below 0.1%
- Monitor reputation metrics daily
- Review AWS best practices regularly