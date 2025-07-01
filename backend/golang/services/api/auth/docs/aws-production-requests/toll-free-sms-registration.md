# Toll-Free SMS Number Registration Guide

## Overview
This guide covers the process of registering a toll-free number for SMS messaging through AWS End User Messaging (formerly Amazon Pinpoint) to improve deliverability and trust for ListBackup.ai's SMS-based MFA.

## Benefits of Toll-Free Numbers

1. **Better Deliverability**: Less likely to be filtered by carriers
2. **Professional Appearance**: Consistent number across all messages  
3. **Higher Trust**: Recipients recognize toll-free format
4. **Compliance**: Easier to meet carrier requirements
5. **Analytics**: Better delivery insights and reporting

## Current SMS Limitations (Without Toll-Free)

- **Shared Short Codes**: Messages sent from shared pool
- **Inconsistent Sender**: Different numbers for each message
- **Higher Filtering**: More likely to be blocked by carriers
- **Limited Throughput**: Lower message rates

## Toll-Free Number Specifications

- **Format**: 1-8XX-XXX-XXXX (US/Canada)
- **Message Rate**: 3 messages per second
- **Character Limit**: 160 characters per segment
- **Monthly Cost**: $2.00 per number
- **Registration Fee**: $650 one-time (as of 2024)
- **Approval Time**: 2-6 weeks

## Registration Process

### Step 1: Access AWS End User Messaging Console

1. Log in to AWS Console
2. Navigate to "Amazon Pinpoint" or "AWS End User Messaging"
3. Select your region (us-east-1 recommended)
4. Go to "Phone numbers" section

### Step 2: Request Toll-Free Number

1. Click "Request phone number"
2. Select:
   - **Country**: United States
   - **Type**: Toll-Free
   - **Capabilities**: SMS (and Voice if needed)
3. Choose from available numbers
4. Click "Request"

### Step 3: Complete Carrier Registration

After obtaining the number, you must register it with carriers:

1. **Company Information**
   ```
   Company Name: ListBackup.ai
   Company Website: https://listbackup.ai
   Company Address: [Your Business Address]
   Company Type: Technology/Software
   Tax ID/EIN: [Your Tax ID]
   ```

2. **Contact Information**
   ```
   Primary Contact: [Name]
   Email: admin@listbackup.ai
   Phone: [Contact Number]
   Title: [Title]
   ```

3. **Use Case Details**
   ```
   Service Description: Email backup and archival service
   Message Type: Transactional - Multi-Factor Authentication
   Industry: Technology/Cloud Services
   
   Sample Messages:
   - "Your ListBackup.ai verification code is: 123456. Valid for 10 minutes."
   - "ListBackup.ai: Security alert - New login from [Location]. Reply STOP to opt out."
   - "Your ListBackup.ai account has been secured. If you didn't make this change, contact support."
   
   Expected Volume: 10,000-20,000 messages/month
   Target Audience: Registered users who enabled SMS MFA
   ```

4. **Opt-in Process**
   ```
   How users opt-in:
   1. User logs into ListBackup.ai account
   2. Navigates to Security Settings
   3. Selects "Enable SMS MFA"
   4. Enters phone number
   5. Confirms with checkbox: "I agree to receive SMS authentication codes"
   6. Receives confirmation code to verify number
   
   Opt-in Evidence: Screenshots of MFA setup flow
   Terms of Service URL: https://listbackup.ai/terms
   Privacy Policy URL: https://listbackup.ai/privacy
   ```

5. **Message Flow**
   ```
   Trigger: User-initiated login with MFA enabled
   Frequency: Only during authentication attempts
   Time Window: 24/7 (authentication can happen anytime)
   Message Expiry: Codes valid for 10 minutes
   ```

### Step 4: Provide Required Documentation

Carriers typically require:

1. **Screenshots of Opt-in Flow**
   - Account settings page
   - MFA enable option
   - Phone number input
   - Consent checkbox
   - Confirmation screen

2. **Terms of Service** highlighting:
   - SMS usage policy
   - User consent requirements
   - Opt-out instructions

3. **Privacy Policy** including:
   - Data collection practices
   - Phone number usage
   - Third-party sharing (none)

4. **Sample Messages** showing:
   - Clear sender identification
   - Message purpose
   - Opt-out instructions (where applicable)

### Step 5: Respond to Carrier Feedback

Carriers may request:
- Additional information
- Message modifications
- Consent flow changes
- Volume justification

Respond promptly (within 48 hours) to avoid delays.

## Post-Approval Setup

### 1. Configure in AWS SNS

```python
import boto3

sns = boto3.client('sns', region_name='us-east-1')

# Send SMS using toll-free number
response = sns.publish(
    PhoneNumber='+1234567890',
    Message='Your ListBackup.ai code: 123456',
    MessageAttributes={
        'AWS.SNS.SMS.OriginationNumber': {
            'DataType': 'String',
            'StringValue': '+18001234567'  # Your toll-free number
        },
        'AWS.SNS.SMS.SMSType': {
            'DataType': 'String',
            'StringValue': 'Transactional'
        }
    }
)
```

### 2. Update Application Configuration

```yaml
# config.yaml
sms:
  enabled: true
  provider: aws_sns
  origination_number: "+18001234567"
  message_type: "Transactional"
  default_sender_id: "ListBackup"
```

### 3. Implement Message Templates

```go
const (
    SMSTemplateVerification = "Your ListBackup.ai verification code is: %s. Valid for 10 minutes."
    SMSTemplateAlert        = "ListBackup.ai: Security alert - %s. Reply STOP to opt out."
    SMSTemplateConfirm      = "ListBackup.ai: Your account has been secured. Code: %s"
)
```

## Monitoring and Compliance

### Daily Monitoring
- Delivery success rate (target: >95%)
- Opt-out rate (should be <1%)
- Bounce rate (should be <5%)
- Carrier filtering reports

### Weekly Tasks
- Review CloudWatch metrics
- Check for carrier violations
- Monitor spending against budget
- Review opt-out list

### Monthly Tasks
- Delivery report analysis
- Cost optimization review
- Compliance audit
- Update message templates if needed

## Best Practices

### Message Content
1. **Always include**: Service name (ListBackup.ai)
2. **Keep short**: Under 160 characters
3. **Clear purpose**: State why they're receiving the message
4. **Time-sensitive**: Include expiration time for codes
5. **Professional tone**: No marketing language

### Compliance
1. **Honor opt-outs**: Process STOP immediately
2. **Respect quiet hours**: Consider timezone (optional for auth)
3. **Maintain records**: Keep opt-in evidence
4. **Regular audits**: Review compliance quarterly

### Technical Implementation
1. **Retry logic**: Implement exponential backoff
2. **Fallback options**: Email-based MFA if SMS fails
3. **Rate limiting**: Prevent SMS bombing
4. **Monitoring**: Alert on high failure rates

## Cost Analysis

### Monthly Costs
```
Toll-Free Number Rental: $2.00
SMS Messages (20,000 @ $0.00645): $129.00
Total Monthly: ~$131.00

One-time Registration: $650.00
```

### ROI Considerations
- Improved delivery rates (30-40% better)
- Reduced support tickets
- Higher user trust
- Better security adoption

## Alternative Options

### 1. 10DLC (10-Digit Long Code)
- **Pros**: Lower cost, local presence
- **Cons**: Requires campaign registration, lower throughput
- **Best for**: Marketing messages

### 2. Short Codes
- **Pros**: Highest throughput, best delivery
- **Cons**: Expensive ($500-1000/month), long approval
- **Best for**: High-volume senders

### 3. International Numbers
- **Pros**: Global reach
- **Cons**: Complex compliance, variable costs
- **Best for**: International services

## Troubleshooting

### Registration Rejected
**Common reasons:**
- Incomplete opt-in documentation
- Vague use case description
- Missing required screenshots
- Non-compliant message content

**Solution:** Address feedback specifically and resubmit

### Poor Delivery Rates
**Check:**
- Message content for spam triggers
- Sending patterns for anomalies
- Carrier-specific blocking
- Number reputation

### High Opt-Out Rate
**Review:**
- Message frequency
- Content clarity
- User expectations
- Opt-in process

## Timeline

1. **Week 1**: Request number, prepare documentation
2. **Week 2**: Submit registration, respond to feedback
3. **Week 3-6**: Carrier review period
4. **Week 7**: Approval and configuration
5. **Week 8**: Testing and rollout

## Support Resources

- **AWS Support**: For technical issues
- **Carrier Relations**: Through AWS End User Messaging console
- **Documentation**: https://docs.aws.amazon.com/sns/latest/dg/sms_preferences.html
- **Best Practices**: https://docs.aws.amazon.com/sns/latest/dg/sms_best_practices.html

## Conclusion

Toll-free registration is a one-time investment that significantly improves SMS delivery and user trust. While the process takes several weeks, the benefits in terms of reliability and professionalism make it worthwhile for production MFA systems.