# Stripe Billing System Architecture

## Overview
ListBackup.ai v2 implements a comprehensive Stripe-powered billing system supporting hierarchical account management, multiple subscription tiers, and modern self-service billing experiences.

## Billing Architecture

### Hierarchical Billing Model
```
PepsiCo (Master Account - Pays for all)
├── Pepsi Division (Inherited billing)
│   ├── North America (Usage tracked separately)
│   └── Europe (Usage tracked separately)
├── Gatorade Division (Optional separate billing)
└── Lay's Division (Usage limits enforced)
```

### Billing Inheritance Rules
1. **Master Account Billing**: Parent account pays for all sub-accounts by default
2. **Separate Billing**: Sub-accounts can have independent Stripe customers
3. **Usage Aggregation**: Roll-up reporting for parent account visibility
4. **Limit Enforcement**: Sub-account limits enforced at parent level

## Subscription Plans

### Plan Tiers
```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
    currency: 'usd';
  };
  limits: {
    storage: number; // GB
    sources: number;
    jobs: number;
    apiCalls: number;
    subAccounts: number;
    users: number;
  };
  features: {
    whiteLabel: boolean;
    customBranding: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    sla: string;
    retentionDays: number;
    exportFormats: string[];
    integrations: string[];
  };
  stripeProductId: string;
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
}
```

### Proposed Plan Structure
```yaml
Free:
  price: $0/month
  limits:
    storage: 1GB
    sources: 2
    jobs: 10
    subAccounts: 0
    users: 1
  features:
    whiteLabel: false
    retentionDays: 30
    exportFormats: [json]

Starter:
  price: $29/month, $290/year
  limits:
    storage: 25GB
    sources: 5
    jobs: 100
    subAccounts: 3
    users: 5
  features:
    whiteLabel: true
    retentionDays: 90
    exportFormats: [json, csv]

Professional:
  price: $99/month, $990/year
  limits:
    storage: 100GB
    sources: 20
    jobs: 500
    subAccounts: 10
    users: 25
  features:
    whiteLabel: true
    advancedAnalytics: true
    retentionDays: 365
    exportFormats: [json, csv, xml, parquet]

Enterprise:
  price: $299/month, $2990/year
  limits:
    storage: 1TB
    sources: 100
    jobs: 2000
    subAccounts: 50
    users: 100
  features:
    whiteLabel: true
    customBranding: true
    advancedAnalytics: true
    prioritySupport: true
    sla: "99.9%"
    retentionDays: 2555 # 7 years
```

## Database Schema Updates

### Enhanced Account Model
```typescript
interface Account {
  // ... existing fields
  
  billing: {
    // Stripe Integration
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    
    // Billing Configuration
    billingEmail?: string; // Separate billing contact
    billingContact?: {
      name: string;
      email: string;
      phone?: string;
      company?: string;
    };
    
    // Subscription Details
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'inherited';
    billingCycle: 'monthly' | 'yearly';
    
    // Billing Dates
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    canceledAt?: string;
    
    // Hierarchical Billing
    inheritsFromParent: boolean;
    parentPaysBilling: boolean;
    
    // Payment Method
    defaultPaymentMethod?: {
      id: string;
      type: 'card';
      card: {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
      };
    };
    
    // Billing History
    invoices?: {
      id: string;
      amount: number;
      status: string;
      paidAt?: string;
      dueDate: string;
      invoiceUrl: string;
    }[];
  };
  
  // Usage Tracking for Billing
  currentUsage: {
    storage: { used: number; overage: number };
    sources: { used: number; overage: number };
    jobs: { used: number; overage: number };
    apiCalls: { used: number; overage: number };
    users: { used: number; overage: number };
    subAccounts: { used: number; overage: number };
  };
}
```

### Billing Events Table
```typescript
interface BillingEvent {
  eventId: string;
  accountId: string;
  type: 'subscription_created' | 'subscription_updated' | 'subscription_canceled' | 
        'invoice_payment_succeeded' | 'invoice_payment_failed' | 'usage_updated' |
        'plan_changed' | 'billing_contact_updated';
  stripeEventId?: string;
  data: Record<string, any>;
  processedAt: string;
  createdAt: string;
}
```

## Stripe Integration

### Customer Management
```typescript
// Backend: src/handlers/billing/customer.js
class StripeCustomerService {
  async createCustomer(account: Account): Promise<string> {
    const customer = await stripe.customers.create({
      email: account.billing.billingEmail || account.email,
      name: account.name,
      description: `ListBackup.ai - ${account.name}`,
      metadata: {
        accountId: account.accountId,
        parentAccountId: account.parentAccountId,
        environment: process.env.STAGE
      }
    });
    return customer.id;
  }

  async updateBillingContact(customerId: string, billingContact: BillingContact) {
    await stripe.customers.update(customerId, {
      email: billingContact.email,
      name: billingContact.name,
      phone: billingContact.phone
    });
  }
}
```

### Subscription Management
```typescript
class SubscriptionService {
  async createSubscription(accountId: string, priceId: string): Promise<Subscription> {
    // Create subscription with trial or immediate payment
    const subscription = await stripe.subscriptions.create({
      customer: account.billing.stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { accountId }
    });
    
    return subscription;
  }

  async updateSubscription(subscriptionId: string, newPriceId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations'
    });
  }
}
```

### Usage-Based Billing (Future)
```typescript
interface UsageReporting {
  reportUsage(accountId: string, metricName: string, quantity: number): Promise<void>;
  getUsageForPeriod(accountId: string, periodStart: Date, periodEnd: Date): Promise<UsageData>;
  createUsageRecord(subscriptionItemId: string, quantity: number, timestamp: Date): Promise<void>;
}
```

## Frontend Billing Components

### Billing Dashboard
```typescript
// components/billing/billing-dashboard.tsx
interface BillingDashboardProps {
  account: Account;
}

export function BillingDashboard({ account }: BillingDashboardProps) {
  return (
    <div className="space-y-6">
      <CurrentPlanCard plan={account.billing.plan} usage={account.currentUsage} />
      <BillingContactCard contact={account.billing.billingContact} />
      <PaymentMethodCard paymentMethod={account.billing.defaultPaymentMethod} />
      <UsageOverviewCard usage={account.currentUsage} limits={account.limits} />
      <InvoiceHistoryCard invoices={account.billing.invoices} />
      <PlanComparisonCard currentPlan={account.billing.plan} />
    </div>
  );
}
```

### Plan Selection Component
```typescript
// components/billing/plan-selector.tsx
export function PlanSelector({ currentPlan, onPlanSelect }: PlanSelectorProps) {
  const plans = useBillingPlans();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map(plan => (
        <PlanCard 
          key={plan.id}
          plan={plan}
          current={plan.id === currentPlan}
          onSelect={() => onPlanSelect(plan.id)}
        />
      ))}
    </div>
  );
}
```

### Billing Contact Management
```typescript
// components/billing/billing-contact-form.tsx
export function BillingContactForm({ account, onUpdate }: BillingContactFormProps) {
  const [billingContact, setBillingContact] = useState(account.billing.billingContact);
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Billing Contact Name"
          value={billingContact.name}
          onChange={(e) => setBillingContact({...billingContact, name: e.target.value})}
        />
        <Input
          label="Billing Email"
          type="email"
          value={billingContact.email}
          onChange={(e) => setBillingContact({...billingContact, email: e.target.value})}
          description="This email will receive all billing notifications"
        />
        <Input
          label="Phone (Optional)"
          value={billingContact.phone}
          onChange={(e) => setBillingContact({...billingContact, phone: e.target.value})}
        />
        <Input
          label="Company (Optional)"
          value={billingContact.company}
          onChange={(e) => setBillingContact({...billingContact, company: e.target.value})}
        />
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update Billing Contact</Button>
      </div>
    </form>
  );
}
```

## API Endpoints

### Billing Management
```yaml
# Subscription Management
POST /billing/subscriptions
PUT /billing/subscriptions/{subscriptionId}
DELETE /billing/subscriptions/{subscriptionId}
GET /billing/subscriptions/current

# Customer Portal
POST /billing/portal-session
GET /billing/invoices
GET /billing/invoices/{invoiceId}/download

# Plan Management
GET /billing/plans
POST /billing/plans/preview
POST /billing/plans/upgrade
POST /billing/plans/downgrade

# Payment Methods
GET /billing/payment-methods
POST /billing/payment-methods
PUT /billing/payment-methods/{pmId}/default
DELETE /billing/payment-methods/{pmId}

# Billing Contacts
PUT /billing/contact
GET /billing/contact

# Usage and Limits
GET /billing/usage
GET /billing/usage/history
POST /billing/usage/report

# Hierarchical Billing
GET /billing/hierarchy/usage
POST /billing/hierarchy/transfer
PUT /billing/hierarchy/inherit
```

## Webhook Handling

### Stripe Webhook Events
```typescript
// Backend: src/handlers/billing/webhooks.js
const handleStripeWebhook = async (event) => {
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'customer.updated':
      await handleCustomerUpdated(event.data.object);
      break;
  }
};
```

## Billing Notifications

### Email Templates
```typescript
interface BillingEmailTemplate {
  type: 'payment_succeeded' | 'payment_failed' | 'subscription_updated' | 
        'usage_warning' | 'plan_upgraded' | 'billing_contact_changed';
  to: string[]; // [billing.billingEmail, account.email]
  subject: string;
  template: string;
  data: Record<string, any>;
}
```

### Notification Triggers
- Payment succeeded/failed
- Subscription created/updated/canceled
- Usage approaching limits (80%, 90%, 100%)
- Plan changes
- Billing contact updates
- Invoice generation

## Security Considerations

### Data Protection
- PCI compliance through Stripe
- No card details stored locally
- Encrypted billing contact information
- Audit trail for all billing changes

### Access Control
- Billing management requires Owner role
- Billing contact can be separate from account owner
- Sub-account billing inheritance rules
- Webhook signature verification

## Implementation Priority

### Phase 1: Core Billing (Week 1)
- [ ] Stripe customer creation/management
- [ ] Basic subscription management
- [ ] Plan selection and upgrades
- [ ] Billing contact management

### Phase 2: Customer Portal (Week 2)
- [ ] Stripe Customer Portal integration
- [ ] Invoice history and downloads
- [ ] Payment method management
- [ ] Usage tracking and display

### Phase 3: Hierarchical Billing (Week 3)
- [ ] Parent account billing inheritance
- [ ] Sub-account usage aggregation
- [ ] Billing transfer between accounts
- [ ] Multi-account invoice consolidation

### Phase 4: Advanced Features (Week 4)
- [ ] Usage-based billing components
- [ ] Advanced analytics and reporting
- [ ] Automated billing notifications
- [ ] Enterprise billing features

## Success Metrics

### Technical Metrics
- Webhook processing latency < 1 second
- Payment success rate > 98%
- Billing data accuracy 100%
- Customer portal load time < 2 seconds

### Business Metrics
- Subscription conversion rate
- Plan upgrade frequency
- Payment method success rate
- Customer billing satisfaction score

This comprehensive billing system positions ListBackup.ai as a professional, enterprise-ready platform with modern billing capabilities that scale with hierarchical account structures.