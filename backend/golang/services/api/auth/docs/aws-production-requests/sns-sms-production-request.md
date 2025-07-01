# AWS SNS SMS Production Access Request

## Overview
This document outlines the process for requesting increased SMS spending limits for AWS Simple Notification Service (SNS) to support SMS-based multi-factor authentication (MFA) for ListBackup.ai.

## Current Status
- **Account SMS Spending Limit**: $1.00/month (default)
- **SMS Type**: Transactional
- **Region**: us-east-1
- **Origination Number**: Not yet configured

## Production Requirements

### 1. Use Case Description
**Service Name**: ListBackup.ai  
**Purpose**: SMS-based Multi-Factor Authentication (MFA)  
**SMS Types**:
- MFA verification codes (6-digit OTP)
- Account security alerts
- Critical service notifications

### 2. SMS Volume Estimates
- **Expected Monthly Volume**: 10,000-20,000 messages
- **Average Message Cost**: $0.00645 (US destinations)
- **Expected Monthly Spend**: $65-$130
- **Requested Spending Limit**: $500/month

### 3. Message Content Examples
```
Your ListBackup.ai verification code is: 123456. Valid for 10 minutes.

Security Alert: New login to your ListBackup.ai account from [Location]. If this wasn't you, please secure your account immediately.

Your ListBackup.ai backup is complete. 1,234 emails archived successfully.
```

### 4. Compliance and Best Practices
- **Opt-in Process**: Explicit user consent during MFA setup
- **Opt-out Handling**: STOP keyword processing
- **Message Format**: Clear sender identification
- **Time Restrictions**: No messages between 9 PM - 8 AM local time
- **Content Guidelines**: Transactional only, no marketing

## Steps to Request Increased SMS Spending Limit

### Step 1: Prepare Your Account
1. Configure SNS for SMS messaging
2. Set default SMS type to "Transactional"
3. Test SMS sending with current limit
4. Document message templates

### Step 2: Submit Support Request
1. Go to AWS Support Center
2. Create a new case
3. Select "Service limit increase"
4. Choose "SNS Text Messaging"
5. Fill out the request form:

```
Region: us-east-1
Resource Type: General Text Messaging
New limit value: $500/month
Use case description: Multi-factor authentication for ListBackup.ai
Expected volume: 10,000-20,000 messages/month
Message type: Transactional (OTP codes and security alerts)
```

### Step 3: Provide Additional Information
Include in your request:
- Detailed use case explanation
- Sample message templates
- Opt-in/opt-out process
- Compliance measures
- Expected growth trajectory

### Step 4: Toll-Free Number Registration (Recommended)
For better deliverability and trust:
1. Register a toll-free number through AWS Pinpoint
2. Complete carrier registration
3. Associate with SNS for SMS origination

## Support Case Template

```
Subject: SNS SMS Spending Limit Increase Request for ListBackup.ai

Hello AWS Support,

We would like to request an increase in our SMS spending limit for Amazon SNS to support multi-factor authentication for our service, ListBackup.ai.

Current Limit: $1.00/month
Requested Limit: $500.00/month

Use Case:
ListBackup.ai requires SMS capabilities for:
1. Multi-factor authentication (6-digit OTP codes)
2. Critical security alerts
3. Account verification

Message Volume:
- Expected: 10,000-20,000 messages/month
- Growth projection: 50,000 messages/month within 6 months
- All messages are transactional in nature

Sample Messages:
"Your ListBackup.ai verification code is: 123456. Valid for 10 minutes."
"Security Alert: New login detected from [Location]. Secure your account if this wasn't you."

Compliance:
- Explicit opt-in during MFA setup
- STOP keyword honored immediately
- No marketing messages
- Clear sender identification
- Time-based sending restrictions

We have tested our SMS implementation within the current limits and are ready to scale.

Thank you for your consideration.

Best regards,
ListBackup.ai Team
```

## Pre-Request Checklist
- [ ] SNS configured for SMS
- [ ] Default SMS type set to "Transactional"
- [ ] SMS sending tested successfully
- [ ] Message templates documented
- [ ] Opt-in flow implemented
- [ ] STOP keyword handling configured
- [ ] CloudWatch monitoring enabled
- [ ] Budget alerts configured

## Post-Approval Actions
1. Update application SMS limits
2. Configure spending alarms
3. Monitor delivery rates
4. Track opt-out rates
5. Review carrier feedback

## Toll-Free Number Benefits
- **Better Deliverability**: Reduced filtering by carriers
- **Trust**: Recipients see legitimate number
- **Compliance**: Easier carrier registration
- **Consistency**: Same number across all messages

## Toll-Free Number Registration Process
1. **Request Number**: Via AWS Pinpoint console
2. **Complete Registration**: 
   - Business information
   - Use case description
   - Sample messages
   - Expected volume
3. **Carrier Review**: 2-6 weeks
4. **Activation**: Configure in SNS

## Cost Considerations
- **SMS to US**: $0.00645 per message
- **SMS to Canada**: $0.00750 per message
- **Toll-Free Number**: $2.00/month
- **Registration Fee**: One-time $650

## Monitoring and Alerts
Set up CloudWatch alarms for:
- Daily spending threshold (80% of limit)
- High failure rate (>5%)
- Opt-out rate (>2%)
- Delivery delays

## Best Practices
1. Keep messages under 160 characters
2. Include clear sender identification
3. Provide value in every message
4. Test with multiple carriers
5. Monitor delivery reports
6. Respect timezone differences
7. Implement retry logic with backoff

## Alternative: AWS Pinpoint
Consider using AWS Pinpoint for:
- Advanced analytics
- A/B testing capabilities
- Multi-channel campaigns
- Better deliverability insights

## Contact Information
- **Technical Contact**: [Your Name]
- **Email**: admin@listbackup.ai
- **Company**: ListBackup.ai
- **Website**: https://listbackup.ai

## Notes
- Monitor carrier reports closely
- Maintain opt-out rate below 1%
- Review SMS best practices quarterly
- Consider international expansion needs