# AWS SES Production Access Guide

## Overview
Amazon Simple Email Service (SES) places all new accounts in a sandbox environment by default. In the sandbox, you can only send emails to verified email addresses and domains. To send emails to any recipient, you need to request production access.

## Prerequisites Before Requesting Production Access

### 1. Account Setup
- Ensure your AWS account is active and in good standing
- Complete AWS account verification (phone and payment method)
- Have been using SES in sandbox mode for at least 24 hours

### 2. Email Infrastructure
- Configure and verify at least one domain or email address
- Set up DKIM (DomainKeys Identified Mail) for your verified domain
- Configure SPF (Sender Policy Framework) records
- Implement DMARC policy for your domain
- Set up bounce and complaint handling (SNS topics or email endpoints)

### 3. Application Readiness
- Have a working application that sends emails through SES
- Implement proper error handling and retry logic
- Have monitoring and logging in place
- Implement rate limiting to respect SES sending quotas

### 4. Compliance Documentation
- Privacy policy URL
- Terms of service URL
- Unsubscribe mechanism implementation
- Email list management practices documentation

## Step-by-Step Request Process

### Step 1: Access the SES Console
1. Log in to the AWS Management Console
2. Navigate to Amazon SES service
3. Select the AWS region where you want production access

### Step 2: Open Support Case
1. Click on "Account dashboard" in the left navigation
2. Look for the "Sending statistics" section
3. Click on "Request production access" or "Edit your account details"
4. This will redirect you to AWS Support Center

### Alternative: Direct Support Center Access
1. Go to AWS Support Center: https://console.aws.amazon.com/support/
2. Click "Create case"
3. Choose "Service limit increase"
4. Select "Simple Email Service (SES)" as the service

### Step 3: Fill Out the Request Form

#### Case Details
- **Limit type**: Select "SES Sending Limits"
- **Region**: Choose your desired AWS region
- **Limit**: Select "Desired Daily Sending Quota"
- **New limit value**: Start conservatively (e.g., 50,000 emails/day)

#### Request Information
Fill in the following sections:

**1. Mail Type**
- Transactional
- Marketing
- Other (specify)

**2. Website URL**
- Provide your application or company website

**3. Use Case Description**
- Detailed explanation of how you'll use SES
- Types of emails you'll send
- Target audience
- Expected email volume

**4. Additional Contacts**
- How recipients signed up for your emails
- How you handle bounces and complaints
- Unsubscribe process

### Step 4: Submit Supporting Information
Include the following in your case description:
- Email authentication setup (SPF, DKIM, DMARC)
- Bounce and complaint handling procedures
- List management practices
- Content examples (if applicable)
- Previous sending history (if any)

## Template Support Request Message

```
Subject: SES Production Access Request - [Your Company Name]

Dear AWS Support Team,

I am requesting production access for Amazon SES in the [REGION] region for [COMPANY NAME].

**Company Information:**
- Company Name: [Your Company Name]
- Website: [Your Website URL]
- Industry: [Your Industry]

**Use Case Description:**
We need SES production access to send [transactional/marketing/notification] emails to our [customers/users]. Our platform [brief description of your service].

**Email Types:**
1. [Email Type 1]: [Description]
2. [Email Type 2]: [Description]
3. [Email Type 3]: [Description]

**Volume Expectations:**
- Initial daily volume: [X] emails/day
- Expected growth: [X] emails/day within [timeframe]
- Peak sending rate: [X] emails/second

**Recipient Management:**
- How recipients opt-in: [Description of opt-in process]
- Email list source: [How you collect email addresses]
- List hygiene practices: [How you maintain list quality]

**Compliance Measures:**
1. **Bounce Handling**: We have configured SNS topics to handle bounces automatically. Hard bounces are immediately removed from our sending list.

2. **Complaint Handling**: Complaint notifications are processed via SNS, and complainants are immediately unsubscribed.

3. **Unsubscribe Process**: All emails include a one-click unsubscribe link in the footer. Unsubscribe requests are processed immediately.

4. **Email Authentication**:
   - SPF: Configured for domain [domain.com]
   - DKIM: Enabled with selector [selector]
   - DMARC: Policy set to [policy]

**Infrastructure Setup:**
- Sending application: [Technology stack]
- Error handling: [Retry logic and backoff strategy]
- Monitoring: [Monitoring tools and alerts]
- Rate limiting: Implemented to respect SES quotas

**Policy URLs:**
- Privacy Policy: [URL]
- Terms of Service: [URL]
- Anti-Spam Policy: [URL]

**Previous Sending History:**
[If applicable, mention any previous email sending history with other providers]

**Additional Information:**
[Any other relevant information]

We confirm that we will:
- Only send to recipients who have explicitly opted in
- Honor all unsubscribe requests immediately
- Monitor bounce and complaint rates
- Comply with AWS Acceptable Use Policy and SES Terms of Service
- Maintain bounce and complaint rates below AWS thresholds

Thank you for considering our request.

Best regards,
[Your Name]
[Your Title]
[Contact Information]
```

## Expected Timeline

### Response Time
- **Initial Response**: 24-48 hours
- **Full Review**: 1-3 business days
- **Complex Cases**: Up to 5 business days

### What to Expect
1. **Auto-acknowledgment**: Immediate confirmation email with ticket number
2. **Initial Review**: AWS team may ask for additional information
3. **Decision**: Approval, conditional approval, or denial with feedback
4. **Post-Approval**: Gradual quota increases based on sending reputation

## Common Reasons for Denial

1. **Insufficient Information**: Vague use case descriptions
2. **Poor Email Practices**: No bounce/complaint handling
3. **Compliance Issues**: Missing unsubscribe mechanism
4. **Authentication Problems**: No SPF/DKIM/DMARC setup
5. **Suspicious Use Case**: Unclear recipient consent process

## Post-Approval Best Practices

### Gradual Ramp-Up
- Start with lower volumes
- Gradually increase over 2-4 weeks
- Monitor metrics closely

### Maintain Good Reputation
- Keep bounce rate < 5%
- Keep complaint rate < 0.1%
- Monitor SES reputation dashboard
- Respond to feedback loops quickly

### Regular Monitoring
- Check SES sending statistics daily
- Set up CloudWatch alarms for bounces/complaints
- Review suppression list regularly
- Monitor delivery rates

## Quota Increase Requests

Once in production, you can request quota increases:
1. Maintain good sending reputation for 2-4 weeks
2. Submit new support case for quota increase
3. Provide sending statistics and growth projections
4. Justify the need for higher quotas

## Troubleshooting

### If Your Request is Denied
1. Carefully read the denial reason
2. Address all concerns mentioned
3. Improve your infrastructure/processes
4. Wait at least 24 hours before resubmitting
5. Provide detailed responses to all concerns

### Getting Help
- AWS SES Documentation: https://docs.aws.amazon.com/ses/
- AWS Support Forums
- AWS Premium Support (if available)

## Regional Considerations

- Production access is region-specific
- You need separate requests for each region
- Start with one region and expand later
- Consider latency and compliance requirements

## Important Notes

1. **Sandbox Limitations**: 
   - 200 emails per day
   - 1 email per second
   - Only to verified addresses

2. **Initial Production Limits**:
   - Typically 50,000 emails/day
   - 14 emails/second
   - Can be increased over time

3. **Compliance Requirements**:
   - CAN-SPAM Act (US)
   - GDPR (EU)
   - CASL (Canada)
   - Local regulations

Remember: AWS takes email deliverability seriously. Be honest, thorough, and professional in your request to maximize approval chances.