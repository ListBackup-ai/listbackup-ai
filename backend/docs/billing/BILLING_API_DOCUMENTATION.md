# ListBackup.ai Billing & Plan Management API Documentation

## Overview

The ListBackup.ai Billing & Plan Management System provides comprehensive subscription management, usage tracking, analytics, and enterprise billing features. This system integrates with Stripe for payment processing and AWS Cognito for user group management.

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Base URL

```
https://api.listbackup.ai/billing
```

## API Endpoints

### Subscription Management

#### Create Subscription
Create a new subscription for an account.

**Endpoint:** `POST /billing/subscriptions`
**Auth Required:** Yes

**Request Body:**
```json
{
  "planId": "plan_pro",
  "paymentMethodId": "pm_1234567890",
  "billingCycle": "monthly"
}
```

**Response:**
```json
{
  "subscriptionId": "sub_abc123",
  "status": "active",
  "clientSecret": "pi_xxx_secret_yyy"
}
```

#### Get Current Subscription
Retrieve the current subscription for the authenticated account.

**Endpoint:** `GET /billing/subscription`
**Auth Required:** Yes

**Response:**
```json
{
  "subscriptionId": "sub_abc123",
  "accountId": "acc_xyz789",
  "planId": "plan_pro",
  "status": "active",
  "currentPeriodStart": "2024-01-01T00:00:00Z",
  "currentPeriodEnd": "2024-02-01T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "plan": {
    "planId": "plan_pro",
    "name": "Pro",
    "amount": 4900,
    "features": {...},
    "limits": {...}
  }
}
```

#### Cancel Subscription
Cancel the current subscription.

**Endpoint:** `POST /billing/subscription/cancel`
**Auth Required:** Yes

**Request Body:**
```json
{
  "cancelAtPeriodEnd": true,
  "reason": "switching_service"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription will be canceled at the end of the current period",
  "cancellationDate": "2024-02-01T00:00:00Z"
}
```

### Plan Management

#### List All Plans
Get all available billing plans (public endpoint).

**Endpoint:** `GET /billing/plans`
**Auth Required:** No

**Response:**
```json
{
  "plans": [
    {
      "planId": "plan_free",
      "name": "Free",
      "description": "Perfect for trying out ListBackup",
      "amount": 0,
      "currency": "usd",
      "interval": "month",
      "features": {
        "basicBackups": true,
        "advancedBackups": false,
        ...
      },
      "limits": {
        "maxSources": 3,
        "maxStorageGB": 1,
        ...
      },
      "popular": false
    },
    ...
  ]
}
```

#### Plan Comparison & Pricing Calculator
Get detailed plan comparison with pricing calculator.

**Endpoint:** `GET /billing/plan-comparison`
**Auth Required:** No

**Query Parameters:**
- `apiCalls` (optional): Estimated API calls per month
- `storage` (optional): Estimated storage in GB
- `sources` (optional): Number of sources needed
- `members` (optional): Number of team members
- `backups` (optional): Backups per month

**Response:**
```json
{
  "plans": [
    {
      "planId": "plan_pro",
      "name": "Pro",
      "monthlyPrice": 49.00,
      "yearlyPrice": 470.40,
      "yearlySavings": 20.0,
      "popularFeatures": ["Advanced Backups", "Data Sync", "Team Management"],
      "limitBreakdowns": {
        "sources": "50",
        "storage": "100 GB",
        "apiCalls": "100000/month"
      },
      "competitorComparison": {...}
    }
  ],
  "recommendations": {
    "recommendedPlan": "plan_pro",
    "reasoning": ["Fits within usage limits", "Popular choice among similar users"],
    "confidence": 0.85,
    "alternativePlans": ["plan_starter"]
  },
  "pricingCalculator": {
    "estimatedUsage": {...},
    "basePrice": 49.00,
    "overageCharges": {
      "totalOverage": 0.00
    },
    "totalEstimatedCost": 49.00,
    "savingsOpportunities": [...]
  },
  "featureComparison": {
    "categories": [...]
  }
}
```

### Payment Methods

#### List Payment Methods
Get all payment methods for the current account.

**Endpoint:** `GET /billing/payment-methods`
**Auth Required:** Yes

**Response:**
```json
{
  "paymentMethods": [
    {
      "paymentMethodId": "pm_abc123",
      "type": "card",
      "isDefault": true,
      "card": {
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2025
      },
      "status": "active"
    }
  ]
}
```

### Invoices

#### List Invoices
Get invoice history for the current account.

**Endpoint:** `GET /billing/invoices`
**Auth Required:** Yes

**Response:**
```json
{
  "invoices": [
    {
      "invoiceId": "inv_abc123",
      "number": "LB-001",
      "status": "paid",
      "amountDue": 4900,
      "amountPaid": 4900,
      "currency": "usd",
      "periodStart": "2024-01-01T00:00:00Z",
      "periodEnd": "2024-02-01T00:00:00Z",
      "paidAt": "2024-01-01T12:00:00Z",
      "invoicePdf": "https://invoice.stripe.com/xxx"
    }
  ]
}
```

### Usage Tracking

#### Get Usage Analytics
Get detailed usage analytics for the current billing period.

**Endpoint:** `GET /billing/usage`
**Auth Required:** Yes

**Query Parameters:**
- `period` (optional): Billing period in YYYY-MM format

**Response:**
```json
{
  "billingPeriod": "2024-01",
  "usage": [
    {
      "recordId": "usage_abc123",
      "metricType": "api_calls",
      "quantity": 15000,
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ],
  "summary": {
    "apiCallsTotal": 45000,
    "storageGbTotal": 25,
    "backupsTotal": 120,
    "sourcesTotal": 8
  },
  "planLimits": {
    "maxAPICallsPerMonth": 100000,
    "maxStorageGB": 100,
    "maxBackupsPerMonth": 500,
    "maxSources": 50
  }
}
```

### Analytics & Reporting (Enterprise)

#### Billing Analytics
Get comprehensive billing and revenue analytics.

**Endpoint:** `GET /billing/analytics`
**Auth Required:** Yes (Enterprise plan required)

**Query Parameters:**
- `period` (optional): Analysis period - "week", "month", "quarter", "year"

**Response:**
```json
{
  "period": "month",
  "revenueAnalytics": {
    "totalRevenue": 125000,
    "monthlyRevenue": 45000,
    "averageRevenuePerUser": 2900,
    "revenueGrowth": 15.5,
    "churnRate": 2.3
  },
  "usageAnalytics": {
    "totalApiCallsPerMonth": 150000,
    "totalStorageGb": 2500,
    "averageUsagePerAccount": 8500.5,
    "topUsageAccounts": [...]
  },
  "planAnalytics": {
    "planDistribution": [
      {
        "planId": "plan_pro",
        "planName": "Pro",
        "count": 25,
        "revenue": 122500,
        "percent": 12.5
      }
    ],
    "conversionRates": [...],
    "upgradeDowngradeRate": 12.5
  },
  "trendAnalytics": [...]
}
```

### Enterprise Billing

#### Enterprise Requests
Submit enterprise billing requests for custom plans, quotes, or NET terms.

**Endpoint:** `POST /billing/enterprise`
**Auth Required:** Yes

**Request Body:**
```json
{
  "type": "custom_plan",
  "companyInfo": {
    "name": "Acme Corporation",
    "industry": "Technology",
    "size": "201-1000",
    "country": "United States",
    "complianceNeeds": ["SOC2", "GDPR"]
  },
  "requirements": {
    "estimatedUsers": 500,
    "estimatedSources": 200,
    "estimatedStorageGb": 1000,
    "estimatedApiCallsPerMonth": 1000000,
    "requiredFeatures": ["white_label", "sso", "custom_reporting"],
    "preferredBillingCycle": "yearly",
    "budgetRange": "10000-50000",
    "specialRequirements": ["custom_integration", "dedicated_support"]
  },
  "contactInfo": {
    "name": "John Smith",
    "email": "john@acme.com",
    "phone": "+1-555-0123",
    "title": "CTO",
    "timezone": "America/New_York",
    "urgency": "medium"
  }
}
```

**Response:**
```json
{
  "requestId": "custom_plan_1640995200",
  "status": "received",
  "estimatedQuote": {
    "basePrice": 299.0,
    "customizationFee": 7500.0,
    "setupFee": 2500.0,
    "monthlyTotal": 299.0,
    "yearlyTotal": 3588.0,
    "discounts": [
      {
        "type": "yearly",
        "description": "Annual billing discount",
        "percentage": 20.0,
        "amount": 717.6
      }
    ],
    "paymentTerms": {
      "netTerms": 30,
      "paymentMethods": ["wire", "ach", "check"],
      "requiresPo": true
    },
    "validUntil": "2024-02-01T00:00:00Z"
  },
  "nextSteps": [
    {
      "step": "Requirements Review",
      "description": "Our solutions engineer will review your requirements",
      "timeline": "1-2 business days",
      "owner": "sales"
    }
  ],
  "contactExpectation": "Our enterprise team will contact you within 24 hours"
}
```

### Webhooks

#### Stripe Webhook Handler
Internal endpoint for processing Stripe webhook events.

**Endpoint:** `POST /billing/stripe/webhook`
**Auth Required:** No (Stripe signature verification)

This endpoint automatically handles:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error code or message",
  "message": "Human-readable error description"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (resource already exists)
- `500` - Internal Server Error

## Rate Limiting

- **Public endpoints**: 100 requests per minute per IP
- **Authenticated endpoints**: 1000 requests per minute per account
- **Analytics endpoints**: 60 requests per minute per account

## Data Types

### Plan Features
```typescript
interface PlanFeatures {
  basicBackups: boolean;
  advancedBackups: boolean;
  dataSync: boolean;
  dataMigration: boolean;
  customRetention: boolean;
  hierarchicalAccounts: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  teamManagement: boolean;
  customDomains: boolean;
  advancedReporting: boolean;
  externalStorage: boolean;
  complianceReports: boolean;
  auditTrails: boolean;
}
```

### Plan Limits
```typescript
interface PlanLimits {
  maxSources: number;           // -1 for unlimited
  maxAccounts: number;          // -1 for unlimited  
  maxTeamMembers: number;       // -1 for unlimited
  maxStorageGB: number;
  maxAPICallsPerMonth: number;  // -1 for unlimited
  maxBackupsPerMonth: number;   // -1 for unlimited
  maxRetentionDays: number;
  maxSyncFrequency: number;     // in minutes
}
```

## SDK and Integration Examples

### JavaScript/Node.js Example

```javascript
// Create subscription
const subscription = await fetch('/billing/subscriptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    planId: 'plan_pro',
    paymentMethodId: 'pm_1234567890',
    billingCycle: 'monthly'
  })
});

// Get usage analytics
const usage = await fetch('/billing/usage?period=2024-01', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### cURL Examples

```bash
# List all plans
curl -X GET https://api.listbackup.ai/billing/plans

# Create subscription
curl -X POST https://api.listbackup.ai/billing/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan_pro",
    "paymentMethodId": "pm_1234567890",
    "billingCycle": "monthly"
  }'

# Get usage analytics
curl -X GET "https://api.listbackup.ai/billing/usage?period=2024-01" \
  -H "Authorization: Bearer $TOKEN"
```

## Deployment and Configuration

### Environment Variables

The billing system requires the following environment variables:

```bash
DYNAMODB_TABLE=listbackup-billing-prod
COGNITO_USER_POOL_ID=us-east-1_abc123def
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
USAGE_TRACKING_ENABLED=true
```

### Stripe Configuration

1. Create webhook endpoint in Stripe Dashboard
2. Configure webhook URL: `https://api.listbackup.ai/billing/stripe/webhook`
3. Select events: `customer.subscription.*`, `invoice.*`
4. Update webhook secret in environment variables

### Cognito Groups

The system automatically creates the following Cognito groups:
- `free_plan` (precedence: 40)
- `starter_plan` (precedence: 30)
- `pro_plan` (precedence: 20)
- `enterprise_plan` (precedence: 10)

## Security Considerations

1. **Payment Data**: No payment data is stored locally; all handled by Stripe
2. **Webhook Verification**: All webhooks are verified with Stripe signatures
3. **Access Control**: Plan-based feature access via Cognito groups
4. **Data Encryption**: All sensitive data encrypted in transit and at rest
5. **Audit Trails**: Complete billing event logging for compliance

## Monitoring and Alerts

Key metrics to monitor:
- Subscription creation/cancellation rates
- Payment success/failure rates
- Usage limit breaches
- Webhook processing errors
- API response times

Recommended alerts:
- Payment failure rate > 5%
- Webhook processing delay > 30 seconds
- Usage overage for accounts
- Subscription churn rate changes

## Support and Troubleshooting

### Common Issues

1. **Subscription Creation Fails**
   - Check Stripe API keys and webhook configuration
   - Verify payment method is valid
   - Check Cognito group assignments

2. **Usage Tracking Not Working**
   - Verify `USAGE_TRACKING_ENABLED=true`
   - Check DynamoDB table permissions
   - Review middleware integration

3. **Plan Limits Not Enforced**
   - Check Cognito group membership
   - Verify billing service integration
   - Review feature flag implementation

For additional support, contact the engineering team or check the system logs for detailed error information.