# AWS Production Access Documentation

This directory contains comprehensive guides for requesting production access for AWS communication services.

## Contents

### 📧 [SES Production Access Guide](./ses-production-access-guide.md)
Complete guide for requesting Amazon SES production access to send emails without sandbox restrictions. Includes:
- Prerequisites and setup requirements
- Step-by-step request process
- Template support request
- Post-approval best practices
- Troubleshooting tips

### 📱 [SNS SMS Production Access Guide](./sns-sms-production-access-guide.md)
Detailed guide for requesting SNS SMS spending limit increases to send text messages at scale. Covers:
- Compliance requirements by region
- Volume planning and cost estimation
- Template support request
- Regional considerations
- Monitoring and optimization

### 🚀 [Quick Reference](./quick-reference.md)
Condensed checklist and quick tips for both SES and SNS production access requests:
- Pre-request checklists
- Key information to prepare
- Common denial reasons
- Timeline expectations
- Quick tips for success

## When to Use These Guides

### SES Production Access
Use when you need to:
- Send emails to any email address (not just verified ones)
- Send more than 200 emails per day
- Send emails at rates higher than 1 per second
- Launch a production application that sends emails

### SNS SMS Production Access  
Use when you need to:
- Send SMS messages costing more than $1/month
- Launch a production application that sends SMS
- Send SMS to multiple countries
- Scale SMS operations

## Important Notes

1. **Preparation is Key**: Both services require thorough preparation and compliance measures before approval
2. **Start Conservative**: Request modest limits initially and increase over time
3. **Compliance First**: AWS prioritizes compliance - emphasize your measures
4. **Region Specific**: SES access is per-region, SNS SMS is global but has regional considerations

## Success Rate Tips

- ✅ Complete all prerequisites before requesting
- ✅ Use the provided templates as starting points
- ✅ Be specific about your use case
- ✅ Show understanding of compliance requirements
- ✅ Respond quickly to AWS support questions

## Support

If you need help with these processes:
1. Review the appropriate guide thoroughly
2. Check AWS documentation for updates
3. Consider AWS Premium Support for faster response
4. Engage AWS Partners if needed

Last Updated: 2024