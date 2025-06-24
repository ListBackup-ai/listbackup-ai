# Billing System Wireframes

## Billing Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ Billing & Subscription                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Current Plan: Professional                    [Manage Billing] │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💎 Professional Plan                    $99/month         │ │
│ │ Next billing: January 15, 2025                            │ │
│ │ ───────────────────────────────────────────────────────── │ │
│ │ Storage: ████████░░ 67.2GB / 100GB                        │ │
│ │ Sources: ███░░░░░░░ 12 / 20                               │ │
│ │ Users:   ██░░░░░░░░ 8 / 25                                │ │
│ │ Jobs:    ████░░░░░░ 203 / 500                             │ │
│ │                                         [View Usage]      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Billing Contact                                    [Edit]       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📧 billing@pepsi.com                                       │ │
│ │ 👤 Sarah Johnson (Finance Manager)                         │ │
│ │ 📞 +1 (555) 123-4567                                       │ │
│ │ 🏢 PepsiCo Inc.                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Payment Method                            [Update] [Add New]    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💳 •••• •••• •••• 4242   Visa          Default             │ │
│ │    Expires 12/2027                                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Recent Invoices                                  [View All]     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Dec 15, 2024    $99.00    Paid ✓           [Download PDF] │ │
│ │ Nov 15, 2024    $99.00    Paid ✓           [Download PDF] │ │
│ │ Oct 15, 2024    $99.00    Paid ✓           [Download PDF] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Actions                                                         │
│ [Change Plan] [Billing Portal] [Cancel Subscription]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Plan Selection Page
```
┌─────────────────────────────────────────────────────────────────┐
│ Choose Your Plan                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Monthly ○ ● Yearly (Save 17%)                                  │
│                                                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                       │
│ │ Free  │ │Starter│ │  Pro  │ │ Ent.  │                       │
│ │       │ │       │ │ ★CURR │ │       │                       │
│ │  $0   │ │ $24   │ │ $82   │ │ $249  │                       │
│ │ /mo   │ │ /mo   │ │ /mo   │ │ /mo   │                       │
│ │       │ │       │ │       │ │       │                       │
│ │ 1GB   │ │ 25GB  │ │100GB  │ │ 1TB   │                       │
│ │ 2 Src │ │ 5 Src │ │20 Src │ │100Src │                       │
│ │ 1 User│ │ 5 User│ │25 User│ │100User│                       │
│ │ 0 Sub │ │ 3 Sub │ │10 Sub │ │50 Sub │                       │
│ │       │ │       │ │       │ │       │                       │
│ │✗ White│ │✓ White│ │✓ White│ │✓ White│                       │
│ │✗ Brand│ │✗ Brand│ │✓ Brand│ │✓ Brand│                       │
│ │✗ Analy│ │✗ Analy│ │✓ Analy│ │✓ Analy│                       │
│ │✗ SLA  │ │✗ SLA  │ │✗ SLA  │ │✓ 99.9%│                       │
│ │       │ │       │ │       │ │       │                       │
│ │[FREE] │ │[SELECT│ │CURRENT│ │[SELECT│                       │
│ │       │ │       │ │       │ │       │                       │
│ └───────┘ └───────┘ └───────┘ └───────┘                       │
│                                                                 │
│ ⚡ Instant upgrades • 💳 Secure payments • 🔄 Cancel anytime   │
│                                                                 │
│ Plan Comparison                                    [Show All] │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Feature           Free  Starter  Pro    Enterprise         │ │
│ │ Storage           1GB   25GB     100GB  1TB                │ │
│ │ Data Sources      2     5        20     100                │ │
│ │ Team Members      1     5        25     100                │ │
│ │ Sub-Accounts      0     3        10     50                 │ │
│ │ Data Retention    30d   90d      1yr    7yr                │ │
│ │ White Labeling    ✗     ✓        ✓      ✓                  │ │
│ │ Custom Branding   ✗     ✗        ✓      ✓                  │ │
│ │ Analytics         ✗     ✗        ✓      ✓                  │ │
│ │ Priority Support  ✗     ✗        ✗      ✓                  │ │
│ │ SLA               ✗     ✗        ✗      99.9%              │ │
│ │ Export Formats    JSON  JSON+CSV XML+All XML+All           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Billing Contact Form
```
┌─────────────────────────────────────────────────────────────────┐
│ Billing Contact Information                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ This contact will receive all billing notifications and        │
│ invoices. They may differ from your account contact.           │
│                                                                 │
│ Contact Name                                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Sarah Johnson                                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Billing Email *                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ billing@pepsi.com                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ This email will receive billing notifications and invoices     │
│                                                                 │
│ Phone Number                                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ +1 (555) 123-4567                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Company/Organization                                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ PepsiCo Inc.                                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Notification Preferences                                        │
│ ☑ Email invoices to billing contact                           │
│ ☑ Send payment confirmations                                   │
│ ☑ Alert when payment fails                                     │
│ ☑ Notify about plan changes                                    │
│ ☑ Usage warnings (80%, 90%, 100% of limits)                   │
│                                                                 │
│                                 [Cancel] [Save Changes]        │
└─────────────────────────────────────────────────────────────────┘
```

## Usage Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ Usage & Limits                                   December 2024  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Current Period: Dec 15 - Jan 15, 2025                          │
│                                                                 │
│ Storage Usage                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ████████████████████████████████████████████████████░░░░░░ │ │
│ │ 67.2 GB / 100 GB (67%)                        ⚠️ Warning   │ │
│ │                                                             │ │
│ │ By Source:                                                  │ │
│ │ • Keap Production     ████████████████░░░░░░░░ 28.5 GB     │ │
│ │ • Stripe Live         ████████░░░░░░░░░░░░░░░░ 15.2 GB     │ │
│ │ • GoHighLevel         ██████░░░░░░░░░░░░░░░░░░ 12.8 GB     │ │
│ │ • ActiveCampaign      ████░░░░░░░░░░░░░░░░░░░░ 8.4 GB      │ │
│ │ • Other Sources       ██░░░░░░░░░░░░░░░░░░░░░░ 2.3 GB      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Data Sources                                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ██████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ 12 / 20 sources (60%)                           ✅ Healthy │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Team Members                                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ 8 / 25 users (32%)                              ✅ Healthy │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Backup Jobs (This Month)                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ████████████████████████████████████████░░░░░░░░░░░░░░░░░░ │ │
│ │ 203 / 500 jobs (41%)                            ✅ Healthy │ │
│ │                                                             │ │
│ │ Success Rate: 98.5% (200 successful, 3 failed)             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ API Calls (This Month)                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ██████████████████████████████████████████████░░░░░░░░░░░░ │ │
│ │ 8,247 / 10,000 calls (82%)                     ⚠️ Warning  │ │
│ │ Resets: January 15, 2025                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Sub-Accounts                                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ 3 / 10 sub-accounts (30%)                       ✅ Healthy │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Upgrade Plan] [Usage History] [Set Alerts]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Invoice History
```
┌─────────────────────────────────────────────────────────────────┐
│ Invoice History                                       🔍 Search │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Filter: [All Time ▼] [All Status ▼] [All Plans ▼]             │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Invoice #INV-2024-001                           Dec 15, 2024│ │
│ │ Professional Plan - Monthly                                 │ │
│ │ $99.00                                          ✅ Paid     │ │
│ │ [📄 View] [⬇️ Download PDF] [📧 Resend Email]               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Invoice #INV-2024-002                           Nov 15, 2024│ │
│ │ Professional Plan - Monthly                                 │ │
│ │ $99.00                                          ✅ Paid     │ │
│ │ [📄 View] [⬇️ Download PDF] [📧 Resend Email]               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Invoice #INV-2024-003                           Oct 15, 2024│ │
│ │ Starter → Professional (Prorated)                          │ │
│ │ $156.33                                         ✅ Paid     │ │
│ │ [📄 View] [⬇️ Download PDF] [📧 Resend Email]               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Invoice #INV-2024-004                           Oct 1, 2024 │ │
│ │ Starter Plan - Monthly                                      │ │
│ │ $29.00                                          ❌ Failed   │ │
│ │ [📄 View] [🔄 Retry Payment] [📧 Resend Email]              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Total Paid (2024): $2,387.33                                   │
│ Outstanding: $0.00                                              │
│                                                                 │
│ [📊 View Reports] [📤 Export All] [⚙️ Auto-pay Settings]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Hierarchical Billing Overview
```
┌─────────────────────────────────────────────────────────────────┐
│ Multi-Account Billing Overview                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Master Account: PepsiCo                         [Billing Only] │
│                                                                 │
│ 📊 PepsiCo (Master Account)                    $299/month      │ │
│ ├─ 📊 Usage: 847GB / 1TB                                       │ │
│ ├─ 👥 Total Users: 89 / 100                                    │ │
│ ├─ 🔗 Total Sources: 78 / 100                                  │ │
│ └─ 📁 Sub-Accounts: 3 / 50                                     │ │
│                                                                 │
│ ├── Pepsi Division                          Inherited Billing  │ │
│ │   ├─ 📊 Usage: 285GB                                          │ │
│ │   ├─ 👥 Users: 25                                             │ │
│ │   ├─ 🔗 Sources: 22                                           │ │
│ │   │                                                           │ │
│ │   ├── North America                    Inherited Billing     │ │
│ │   │   ├─ 📊 Usage: 142GB                                     │ │
│ │   │   ├─ 👥 Users: 12                                        │ │
│ │   │   └─ 🔗 Sources: 8                                       │ │
│ │   │                                                           │ │
│ │   └── Europe                          Inherited Billing     │ │
│ │       ├─ 📊 Usage: 98GB                                      │ │
│ │       ├─ 👥 Users: 8                                         │ │
│ │       └─ 🔗 Sources: 6                                       │ │
│ │                                                               │ │
│ ├── Gatorade Division                    📄 Separate Billing   │ │
│ │   ├─ 📊 Plan: Professional ($99/month)                       │ │
│ │   ├─ 📊 Usage: 67GB / 100GB                                  │ │
│ │   ├─ 👥 Users: 15 / 25                                       │ │
│ │   └─ 🔗 Sources: 12 / 20                  [Manage Billing]   │ │
│ │                                                               │ │
│ └── Lay's Division                        Inherited Billing   │ │
│     ├─ 📊 Usage: 495GB                                         │ │
│     ├─ 👥 Users: 49                                            │ │
│     └─ 🔗 Sources: 38                                          │ │
│                                                                 │
│ Monthly Total: $398 ($299 + $99)                               │ │
│ Next Billing: January 15, 2025                                 │ │
│                                                                 │
│ Actions:                                                        │ │
│ [📊 Consolidated Invoice] [📈 Usage Report] [⚙️ Billing Rules] │ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Payment Method Management
```
┌─────────────────────────────────────────────────────────────────┐
│ Payment Methods                                      [+ Add New] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Default Payment Method                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💳 Visa ending in 4242                           🌟 Default │ │
│ │    Expires 12/2027                                          │ │
│ │    Added: March 15, 2024                                    │ │
│ │                                                             │ │
│ │ [Set as Default] [Update] [Remove]                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Other Payment Methods                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💳 Mastercard ending in 8888                               │ │
│ │    Expires 08/2026                                          │ │
│ │    Added: January 10, 2024                                  │ │
│ │                                                             │ │
│ │ [Set as Default] [Update] [Remove]                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🏦 Bank Account ending in 1234 (ACH)                       │ │
│ │    Wells Fargo Bank                                         │ │
│ │    Added: February 5, 2024                                  │ │
│ │                                                             │ │
│ │ [Set as Default] [Verify] [Remove]                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Auto-Pay Settings                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ☑ Automatically charge default payment method              │ │
│ │ ☑ Retry failed payments after 3 days                       │ │
│ │ ☑ Send email notifications for payment issues              │ │
│ │ ☐ Require manual approval for charges over $500            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Backup Payment Method                                           │
│ If the default payment method fails, use:                      │
│ [Mastercard ending in 8888 ▼]                                 │
│                                                                 │
│ [Save Settings] [Open Stripe Portal]                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Plan Upgrade Confirmation
```
┌─────────────────────────────────────────────────────────────────┐
│ Confirm Plan Change                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ You're upgrading from Professional to Enterprise               │
│                                                                 │
│ Current Plan: Professional                                      │
│ • $99/month (billed monthly)                                   │
│ • 100GB storage, 25 users, 20 sources                          │
│                                                                 │
│ ⬇️                                                              │
│                                                                 │
│ New Plan: Enterprise                                            │
│ • $299/month (billed monthly)                                  │
│ • 1TB storage, 100 users, 100 sources                          │
│ • Priority support, 99.9% SLA                                  │
│                                                                 │
│ Billing Summary                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Professional Plan (Dec 15 - Jan 15)         $99.00         │ │
│ │ Credit for unused portion (15 days)        -$49.50         │ │
│ │ Enterprise Plan (Jan 1 - Jan 15)           +$149.50        │ │
│ │ ─────────────────────────────────────────────────────────  │ │
│ │ Prorated charge today:                      $100.00        │ │
│ │ Next full billing (Jan 15):                $299.00        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Payment Method: Visa ending in 4242                            │
│                                                                 │
│ ✅ Benefits of upgrading:                                      │
│ • 10x more storage (1TB vs 100GB)                              │
│ • 4x more users (100 vs 25)                                    │
│ • 5x more sources (100 vs 20)                                  │
│ • Priority support with 4-hour response time                   │
│ • 99.9% uptime SLA                                             │
│ • Advanced analytics and reporting                              │
│ • Custom branding options                                       │
│                                                                 │
│ ⚠️ Your new limits will be available immediately after upgrade │
│                                                                 │
│                             [Cancel] [Confirm Upgrade $100]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

These wireframes provide a comprehensive view of the modern billing system that integrates seamlessly with the hierarchical account structure, focusing on:

1. **Professional Billing Dashboard** - Clean, informative overview
2. **Flexible Plan Selection** - Clear comparison and pricing
3. **Billing Contact Management** - Separate from account contacts
4. **Detailed Usage Tracking** - Real-time limits and warnings
5. **Complete Invoice History** - Professional invoice management
6. **Hierarchical Billing** - Multi-account billing overview
7. **Payment Method Security** - Stripe-powered payment management
8. **Transparent Upgrades** - Clear upgrade pricing and benefits

The design emphasizes transparency, professional presentation, and ease of use while supporting complex hierarchical billing scenarios.