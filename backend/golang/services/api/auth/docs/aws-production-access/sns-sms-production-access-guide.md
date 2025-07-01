# AWS SNS SMS Production Access Guide

## Overview
Amazon Simple Notification Service (SNS) allows sending SMS messages, but new accounts start with a default spending limit of $1.00 USD per month. This sandbox limitation prevents production use. To send SMS at scale, you need to request a spending limit increase.

## Prerequisites Before Requesting Production Access

### 1. Account Setup
- Active AWS account in good standing
- Completed payment method verification
- No outstanding billing issues
- Have used SNS for at least a few test messages

### 2. SMS Infrastructure
- Tested SMS sending in sandbox mode
- Implemented proper error handling
- Set up CloudWatch logs for SMS
- Configured SMS preferences (default sender ID, message type)

### 3. Compliance Requirements
- Understand SMS regulations in target countries
- Have opt-in/opt-out mechanisms ready
- Prepare message templates
- Document consent collection process

### 4. Business Documentation
- Company information and website
- Use case documentation
- Expected message volumes
- Target countries/regions

## Step-by-Step Request Process

### Step 1: Review Current Limits
1. Log in to AWS Management Console
2. Navigate to SNS service
3. Go to "Text messaging (SMS)" in left menu
4. Click on "Text messaging preferences"
5. Note your current "Account spend limit"

### Step 2: Prepare Your Application
Before requesting increase:
- Test SMS functionality with sandbox limit
- Implement opt-out handling (STOP, UNSUBSCRIBE)
- Set up delivery status logging
- Configure appropriate message types (Transactional/Promotional)

### Step 3: Open Support Case
1. Go to AWS Support Center: https://console.aws.amazon.com/support/
2. Click "Create case"
3. Choose "Service limit increase"
4. Select Service: "Simple Notification Service (SNS)"
5. Limit type: "SMS Account Spend Limit"

### Step 4: Fill Out the Request Form

#### Case Classification
- **Service**: Simple Notification Service (SNS)
- **Category**: SMS
- **Severity**: Based on urgency

#### Request Details
- **Region**: Select primary region (SMS is global service)
- **Resource Type**: SMS spending limit
- **Current limit**: $1.00 (default)
- **Requested limit**: Start conservatively (e.g., $100-$500/month)

### Step 5: Provide Detailed Information
Include comprehensive details in your request:

## Template Support Request Message

```
Subject: SNS SMS Spending Limit Increase Request - [Your Company Name]

Dear AWS Support Team,

I am requesting an SMS spending limit increase for Amazon SNS for [COMPANY NAME].

**Current Limit**: $1.00 USD/month
**Requested Limit**: $[AMOUNT] USD/month

**Company Information:**
- Company Name: [Your Company Name]
- Website: [Your Website URL]
- Industry: [Your Industry]
- AWS Account ID: [Your Account ID]

**SMS Use Case:**
We need to send SMS messages for [brief description of use case]. Our service provides [description of your service and value proposition].

**Message Types:**
1. **[Type 1]**: [Description]
   - Example: [Sample message]
   - Frequency: [How often sent]
   
2. **[Type 2]**: [Description]
   - Example: [Sample message]
   - Frequency: [How often sent]

**Volume Projections:**
- Month 1: [X] messages/month ($[Y] estimated)
- Month 2: [X] messages/month ($[Y] estimated)
- Month 3: [X] messages/month ($[Y] estimated)
- Steady state: [X] messages/month ($[Y] estimated)

**Target Regions:**
- Primary: [Country/Region] - [X]% of volume
- Secondary: [Country/Region] - [X]% of volume
- [Add all target regions]

**Recipient Acquisition:**
- How users opt-in: [Detailed description]
- Consent mechanism: [Web form/App/API/etc.]
- Double opt-in: [Yes/No - if yes, describe process]
- Age verification: [If applicable]

**Compliance Measures:**

1. **Opt-Out Handling**:
   - Automatic processing of STOP, UNSUBSCRIBE, CANCEL keywords
   - Immediate removal from sending lists
   - Confirmation message sent
   - Suppression list maintained

2. **Opt-In Process**:
   - [Describe your opt-in flow]
   - Consent storage: [How you store consent records]
   - Audit trail: [How you track consent]

3. **Message Content**:
   - No promotional content without explicit consent
   - Clear sender identification in each message
   - Purpose clearly stated
   - No misleading content

4. **Regional Compliance**:
   - TCPA compliance (USA): [Your measures]
   - GDPR compliance (EU): [Your measures]
   - CASL compliance (Canada): [Your measures]
   - [Other regional compliance measures]

**Technical Implementation:**

1. **Error Handling**:
   - Exponential backoff for retries
   - Dead letter queue for failed messages
   - Monitoring of delivery status

2. **Rate Limiting**:
   - Maximum [X] messages per second
   - Queue-based architecture to prevent bursts
   - Respects AWS API limits

3. **Monitoring**:
   - CloudWatch alarms for failures
   - Daily delivery reports
   - Cost monitoring alerts
   - Opt-out rate tracking

**Message Templates:**
[Provide 2-3 example messages]

Template 1 - [Type]:
"[Your example message with {variables}]"

Template 2 - [Type]:
"[Your example message with {variables}]"

**Sender ID/Origination Numbers:**
- Default Sender ID: [If applicable]
- Short codes: [List if you have any]
- Long codes: [List if you have any]
- Toll-free numbers: [List if you have any]

**Previous SMS Experience:**
[If applicable, describe previous SMS sending experience with other providers]
- Previous provider: [Name]
- Monthly volume: [X messages]
- Delivery rates: [X%]
- Opt-out rates: [X%]

**Cost Controls:**
- Daily spending alerts at $[X]
- Automatic suspension at $[X] unexpected spend
- Monthly budget reviews
- Segregated SMS budget from other AWS services

**Customer Support:**
- Support email: [Email]
- Support phone: [Phone]
- Hours: [Business hours]
- Response time: [SLA]

**Additional Safeguards:**
- No marketing to users who didn't explicitly opt-in for marketing
- Regular list cleaning (remove inactive numbers)
- Delivery time restrictions (no messages between [hours])
- Frequency capping ([X] messages per user per [timeframe])

We confirm that we will:
- Comply with all AWS Acceptable Use Policies
- Follow all applicable SMS regulations
- Maintain opt-out rates below 1%
- Only send to recipients who have explicitly consented
- Monitor and respond to all compliance issues immediately
- Provide message logs if requested by AWS

Thank you for considering our request. We're happy to provide any additional information needed.

Best regards,
[Your Name]
[Your Title]
[Contact Email]
[Contact Phone]
```

## Expected Timeline

### Response Times
- **Initial Response**: 12-24 hours
- **Information Gathering**: 1-3 business days
- **Final Decision**: 2-5 business days
- **Complex/High-Value Requests**: Up to 10 business days

### Review Process
1. **Initial Review**: Basic qualification check
2. **Compliance Review**: Detailed compliance assessment
3. **Risk Assessment**: Based on use case and volume
4. **Decision**: Approval, partial approval, or denial

## Common Approval Amounts

### First-Time Increases
- **Low Risk** (Transactional): $100-$500/month
- **Medium Risk** (Mixed use): $50-$200/month
- **Higher Risk** (Marketing): $25-$100/month

### Factors Affecting Approval
- Use case clarity
- Compliance measures
- Target regions (some have stricter regulations)
- Previous AWS account history

## Post-Approval Best Practices

### 1. Gradual Ramp-Up
- Start with 10-20% of approved limit
- Increase by 25% weekly if metrics are good
- Monitor delivery rates closely

### 2. Maintain Good Metrics
- **Opt-out rate**: Keep below 1%
- **Delivery rate**: Maintain above 95%
- **Complaint rate**: Keep minimal
- **Response rate**: Track if applicable

### 3. Regular Monitoring
- Set up CloudWatch dashboards
- Daily SMS delivery reports
- Cost anomaly detection
- Opt-out trend analysis

### 4. Compliance Maintenance
- Regular audit of opt-in records
- Update opt-out lists daily
- Review message content regularly
- Stay updated on regulations

## Requesting Further Increases

### When to Request More
- Using 70-80% of current limit consistently
- Good metrics for 30+ days
- Business growth justification
- No compliance issues

### How to Request
1. Submit new support case
2. Reference previous case number
3. Provide usage statistics
4. Show good performance metrics
5. Justify the increase need

## Regional Considerations

### High-Regulation Regions
- **United States**: TCPA compliance critical
- **Canada**: CASL requirements strict
- **European Union**: GDPR compliance mandatory
- **India**: DLT registration required
- **Singapore**: PDPA compliance needed

### Documentation by Region
Some regions require additional documentation:
- **India**: Sender ID and template registration
- **UAE**: Requires special approval
- **China**: Generally not supported
- **Saudi Arabia**: Sender ID registration

## Troubleshooting

### If Your Request is Denied

1. **Common Reasons**:
   - Insufficient compliance measures
   - Vague use case description
   - High-risk message types
   - Poor opt-in process
   - Target region restrictions

2. **Next Steps**:
   - Address all feedback points
   - Strengthen compliance measures
   - Provide additional documentation
   - Consider starting with lower limit
   - Wait 30 days before resubmitting

### Getting Help
- AWS SNS Documentation: https://docs.aws.amazon.com/sns/
- AWS Support Forums
- Premium Support (for faster response)
- AWS Partner Network consultants

## Cost Optimization

### Reduce SMS Costs
1. **Message Optimization**:
   - Keep messages concise
   - Use URL shorteners
   - Avoid Unicode if possible
   - Batch similar messages

2. **Regional Routing**:
   - Use appropriate origination IDs
   - Consider toll-free for USA
   - Use short codes for high volume

3. **Smart Sending**:
   - Remove invalid numbers
   - Don't retry permanent failures
   - Use appropriate message type
   - Time sends for better rates

## Important Compliance Notes

### Universal Requirements
1. **Clear Opt-In**: Never send without explicit consent
2. **Easy Opt-Out**: Honor immediately
3. **Sender Identity**: Always clear who's sending
4. **Message Purpose**: Clear and honest
5. **Frequency**: Respect user preferences

### Record Keeping
- Maintain opt-in records for 3+ years
- Log all opt-outs permanently
- Track delivery attempts
- Document compliance processes

### Do NOT
- Buy phone number lists
- Send to random numbers
- Ignore opt-out requests
- Send misleading content
- Exceed rate limits
- Share origination IDs

## SMS Best Practices

### Message Content
- Start with company name
- State purpose clearly
- Include opt-out instructions
- Keep under 160 characters
- Avoid spam trigger words

### Timing
- Respect time zones
- Avoid late night/early morning
- Consider business hours
- Respect local holidays
- Implement quiet hours

### Success Metrics
- **Good Opt-out Rate**: < 1%
- **Good Delivery Rate**: > 95%
- **Good Response Rate**: Varies by use case
- **Cost per Message**: Monitor trends

Remember: AWS takes SMS compliance very seriously. A well-prepared, compliant request with clear use cases and strong safeguards has the best chance of approval.