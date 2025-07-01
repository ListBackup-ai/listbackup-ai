# DNS Configuration for AWS SES

## Overview
This document provides the complete DNS configuration required for AWS SES email sending, including SPF, DKIM, and DMARC records for listbackup.ai.

## Current DNS Status Check

To check current DNS records:
```bash
# Check current SPF record
dig TXT listbackup.ai +short

# Check specific _amazonses record
dig TXT _amazonses.listbackup.ai +short

# Check DKIM records
dig CNAME example._domainkey.listbackup.ai +short

# Check DMARC record
dig TXT _dmarc.listbackup.ai +short
```

## Required DNS Records

### 1. SPF Record (Sender Policy Framework)

**Record Type:** TXT  
**Host/Name:** @ (or blank, or listbackup.ai)  
**Value:** 
```
"v=spf1 include:amazonses.com ~all"
```

If you already have an SPF record, modify it to include Amazon SES:
```
"v=spf1 include:yourexistingprovider.com include:amazonses.com ~all"
```

**Purpose:** Authorizes Amazon SES to send emails on behalf of your domain.

### 2. Domain Verification Record

**Record Type:** TXT  
**Host/Name:** _amazonses.listbackup.ai  
**Value:** Will be provided by AWS SES (looks like a long random string)

**Example:**
```
_amazonses.listbackup.ai TXT "pmBGN/7MjnfhTKUZ06Enqq1PeGUaOkw8lGhcfwefcHU="
```

**Purpose:** Proves domain ownership to AWS SES.

### 3. DKIM Records (DomainKeys Identified Mail)

You'll need to add 3 CNAME records. AWS SES will provide the specific values.

**Record Type:** CNAME  
**Format:**
```
[token1]._domainkey.listbackup.ai CNAME [token1].dkim.amazonses.com
[token2]._domainkey.listbackup.ai CNAME [token2].dkim.amazonses.com
[token3]._domainkey.listbackup.ai CNAME [token3].dkim.amazonses.com
```

**Example:**
```
45j5kgxvmfqg5lrbeyncnokdyshqvicp._domainkey.listbackup.ai CNAME 45j5kgxvmfqg5lrbeyncnokdyshqvicp.dkim.amazonses.com
7rqwg6idpfxh7sxpzkz6wpguqqfn3mdo._domainkey.listbackup.ai CNAME 7rqwg6idpfxh7sxpzkz6wpguqqfn3mdo.dkim.amazonses.com
vxaqhxktgxdj5gacwi2nzu6aqmkpeknd._domainkey.listbackup.ai CNAME vxaqhxktgxdj5gacwi2nzu6aqmkpeknd.dkim.amazonses.com
```

**Purpose:** Cryptographically signs emails to prevent spoofing.

### 4. DMARC Record (Domain-based Message Authentication)

**Record Type:** TXT  
**Host/Name:** _dmarc.listbackup.ai  
**Value:** 
```
"v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@listbackup.ai; ruf=mailto:dmarc-forensics@listbackup.ai; fo=1; pct=100"
```

**Recommended progression:**
1. Start with `p=none` for monitoring
2. Move to `p=quarantine` after verification
3. Finally use `p=reject` for full protection

**Purpose:** Tells receiving servers how to handle emails that fail SPF/DKIM checks.

### 5. MX Records (For Receiving Email)

If you want to receive emails at @listbackup.ai addresses:

**Record Type:** MX  
**Host/Name:** @ (or blank, or listbackup.ai)  
**Priority:** 10  
**Value:** inbound-smtp.us-east-1.amazonaws.com

**Note:** This is only needed if you want to receive emails. For sending only, MX records are not required.

## DNS Configuration by Provider

### Cloudflare
1. Log in to Cloudflare dashboard
2. Select your domain
3. Go to DNS settings
4. Add records with "Proxy status" set to "DNS only" (gray cloud)

### Route 53
1. Go to Route 53 console
2. Select your hosted zone
3. Click "Create record"
4. Add each record type as specified

### GoDaddy
1. Log in to GoDaddy account
2. Go to DNS Management
3. Add records (note: omit domain name from host field)

### Namecheap
1. Go to Domain List
2. Click "Manage" next to your domain
3. Go to "Advanced DNS"
4. Add new records

## Verification Timeline

- **SPF Record:** Takes effect immediately after DNS propagation (5-10 minutes)
- **Domain Verification:** Usually verified within 1 hour
- **DKIM Records:** Can take up to 72 hours for full propagation
- **DMARC Record:** Takes effect after DNS propagation, but allow 24-48 hours for reports

## Testing Your Configuration

### 1. Test SPF Record
```bash
# Should return your SPF record
dig TXT listbackup.ai +short | grep spf
```

### 2. Test Domain Verification
```bash
# Should return the verification token
dig TXT _amazonses.listbackup.ai +short
```

### 3. Test DKIM Records
```bash
# Replace 'token' with your actual DKIM selector
dig CNAME token._domainkey.listbackup.ai +short
```

### 4. Test DMARC Record
```bash
# Should return your DMARC policy
dig TXT _dmarc.listbackup.ai +short
```

### 5. Use Online Tools
- MXToolbox: https://mxtoolbox.com/SuperTool.aspx
- Google Admin Toolbox: https://toolbox.googleapps.com/apps/checkmx/
- DMARC Analyzer: https://www.dmarcanalyzer.com/

## Common Issues and Solutions

### SPF Record Issues
**Problem:** "SPF record syntax error"  
**Solution:** Ensure quotes are properly formatted and no extra spaces

**Problem:** "Too many DNS lookups"  
**Solution:** SPF has a 10 DNS lookup limit. Consolidate includes or use ip4/ip6 entries

### DKIM Verification Failing
**Problem:** "DKIM records not found"  
**Solution:** 
- Ensure CNAME records don't have trailing dots
- Wait full 72 hours for propagation
- Verify record names match exactly what AWS provided

### Domain Verification Failing
**Problem:** "Domain verification pending"  
**Solution:**
- Ensure TXT record is at _amazonses.yourdomain.com
- Remove any quotes from the verification token in some DNS providers
- Wait up to 72 hours

## Email Authentication Best Practices

1. **Start with monitoring:** Use DMARC p=none initially
2. **Gradual enforcement:** Move from none → quarantine → reject
3. **Monitor reports:** Check DMARC reports regularly
4. **Keep records updated:** Review DNS records quarterly
5. **Test regularly:** Use email testing tools before major campaigns

## Monitoring and Maintenance

### Weekly Tasks
- Check DMARC reports for authentication failures
- Review bounce and complaint rates
- Verify all DNS records are still present

### Monthly Tasks
- Test email deliverability with major providers
- Review and update SPF record if needed
- Check for any DNS provider notifications

### Quarterly Tasks
- Full DNS audit
- Update DMARC policy if needed
- Review email authentication standards updates

## Additional Resources

- [AWS SES DNS Records Documentation](https://docs.aws.amazon.com/ses/latest/dg/dns-txt-records.html)
- [SPF Record Syntax](http://www.open-spf.org/SPF_Record_Syntax/)
- [DKIM.org](http://www.dkim.org/)
- [DMARC.org](https://dmarc.org/)
- [MXToolbox SPF/DKIM/DMARC Check](https://mxtoolbox.com/emailhealth/)

## Support Contacts

For DNS configuration issues:
- AWS Support: Create case in AWS Console
- DNS Provider Support: Check your provider's support options
- Email: admin@listbackup.ai