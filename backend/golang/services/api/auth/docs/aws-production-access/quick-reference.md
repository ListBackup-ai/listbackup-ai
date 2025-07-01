# AWS Production Access Quick Reference

## Overview
This quick reference guide provides a summary of requesting production access for AWS SES (email) and SNS (SMS) services.

## SES Production Access

### Pre-Request Checklist
- [ ] Domain verified in SES
- [ ] DKIM enabled
- [ ] SPF record configured  
- [ ] DMARC policy set
- [ ] Bounce handling configured (SNS topic or email)
- [ ] Complaint handling configured (SNS topic or email)
- [ ] Unsubscribe mechanism implemented
- [ ] Privacy Policy URL ready
- [ ] Terms of Service URL ready

### Key Information to Prepare
1. **Use Case**: Clear description of email types
2. **Volume**: Expected daily/monthly email volume
3. **Recipients**: How they opt-in
4. **Content**: Example email templates
5. **Compliance**: Unsubscribe and bounce handling details

### Request Process
1. Go to AWS Support Center
2. Create case → Service limit increase → SES
3. Select "SES Sending Limits"
4. Request "Desired Daily Sending Quota"
5. Fill detailed use case information
6. Submit and wait 24-72 hours

### Success Tips
- Start with conservative limits (50,000 emails/day)
- Provide detailed use case
- Emphasize compliance measures
- Include all technical setup details

## SNS SMS Production Access

### Pre-Request Checklist
- [ ] Tested SMS in sandbox ($1 limit)
- [ ] Opt-out keyword handling ready (STOP, UNSUBSCRIBE)
- [ ] SMS preferences configured
- [ ] CloudWatch logs enabled
- [ ] Compliance documentation prepared
- [ ] Message templates ready
- [ ] Target countries identified

### Key Information to Prepare
1. **Monthly Budget**: Requested spending limit
2. **Use Case**: Types of SMS messages
3. **Volume**: Messages per month with cost estimates
4. **Regions**: Target countries
5. **Compliance**: Opt-in/opt-out processes

### Request Process
1. Go to AWS Support Center
2. Create case → Service limit increase → SNS
3. Select "SMS Account Spend Limit"
4. Request new monthly limit ($100-500 initially)
5. Provide detailed compliance information
6. Submit and wait 2-5 business days

### Success Tips
- Start with $100-500/month limit
- Emphasize opt-in consent process
- Detail opt-out handling
- Show understanding of regional regulations

## Common Denial Reasons

### SES Denials
- No email authentication (SPF/DKIM/DMARC)
- Missing bounce/complaint handling
- Vague use case
- No unsubscribe mechanism
- Unclear opt-in process

### SNS SMS Denials  
- Weak opt-in/consent process
- No opt-out handling plan
- Vague use case description
- High-risk regions without compliance details
- Unrealistic volume projections

## Timeline Expectations

| Service | Initial Response | Full Review | Decision |
|---------|-----------------|-------------|----------|
| SES | 24-48 hours | 1-3 days | 1-3 days |
| SNS SMS | 12-24 hours | 1-3 days | 2-5 days |

## Post-Approval

### SES
- Start slowly and ramp up over 2-4 weeks
- Monitor bounce rate (keep < 5%)
- Monitor complaint rate (keep < 0.1%)
- Check reputation dashboard daily

### SNS SMS
- Use 10-20% of limit initially
- Monitor opt-out rate (keep < 1%)
- Track delivery rates (maintain > 95%)
- Review costs daily

## Support Case Templates

### SES Template Structure
1. Company information
2. Use case description
3. Email types and examples
4. Volume expectations
5. Recipient management
6. Compliance measures
7. Infrastructure setup
8. Policy URLs

### SNS SMS Template Structure
1. Company information
2. Current/requested limits
3. SMS use case
4. Message types and examples
5. Volume projections with costs
6. Target regions
7. Compliance measures
8. Technical implementation

## Quick Tips

### For Both Services
- Be honest and detailed
- Start with conservative limits
- Emphasize compliance
- Provide real examples
- Show technical preparedness

### Follow-Up
- Respond quickly to AWS questions
- Provide any additional info requested
- Address all concerns thoroughly
- Be patient with the process

## Useful Links

### Documentation
- [SES Documentation](https://docs.aws.amazon.com/ses/)
- [SNS Documentation](https://docs.aws.amazon.com/sns/)
- [AWS Support Center](https://console.aws.amazon.com/support/)

### Compliance Resources
- [CAN-SPAM Act](https://www.ftc.gov/tips-advice/business-center/guidance/can-spam-act-compliance-guide-business)
- [TCPA Compliance](https://www.fcc.gov/general/telemarketing-and-robocalls)
- [GDPR Guidelines](https://gdpr.eu/)

## Emergency Contacts
- AWS Support: Available through Support Center
- Account Team: If you have AWS account manager
- Forums: https://forums.aws.amazon.com/

Remember: Preparation and compliance focus are key to approval!