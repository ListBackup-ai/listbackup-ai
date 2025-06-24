# UI Wireframes - ListBackup.ai v2

## Account Management Interface

### 1. Account Switcher Component
```
┌─────────────────────────────────────────┐
│ [▼] PepsiCo (Parent Account)            │
├─────────────────────────────────────────┤
│   ├── Pepsi Division                    │
│   │   ├── North America                 │
│   │   └── Europe                        │
│   ├── Gatorade Division                 │
│   │   ├── Sports                        │
│   │   └── Wellness                      │
│   └── Lay's Division                    │
│       ├── Traditional                   │
│       └── Healthy Options               │
├─────────────────────────────────────────┤
│ [+ Create Sub-Account]                  │
└─────────────────────────────────────────┘
```

### 2. Account Settings Page
```
┌─────────────────────────────────────────────────────────────────┐
│ Account Settings                                                │
├─────────────────────────────────────────────────────────────────┤
│ Tabs: [Account Info] [Hierarchy] [Users & Roles] [Billing]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Account Information                                             │
│ ┌─────────────────┐ ┌─────────────────┐                       │
│ │ Account Name    │ │ Company         │                       │
│ │ [PepsiCo      ] │ │ [PepsiCo Inc. ] │                       │
│ └─────────────────┘ └─────────────────┘                       │
│                                                                 │
│ Hierarchy Settings                                              │
│ ☑ Allow Sub-Accounts                                           │
│ Max Sub-Accounts: [10      ] [∞ Unlimited]                     │
│                                                                 │
│ White-Label Settings                                            │
│ ☑ Enable White Labeling                                        │
│ Logo: [Choose File] [preview.png]                              │
│ Brand Name: [PepsiCo Portal]                                   │
│                                                                 │
│                           [Cancel] [Save Changes]              │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Account Hierarchy View
```
┌─────────────────────────────────────────────────────────────────┐
│ Account Hierarchy                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ PepsiCo (Root Account)                     [Add Sub-Account]    │
│ ├─ 📊 Usage: 2.3GB / 100GB                                     │
│ ├─ 👥 Users: 5                                                 │
│ ├─ 🔗 Sources: 12                                              │
│ │                                                               │
│ ├── Pepsi Division                         [⚙️] [👥] [📊]       │
│ │   ├─ 📊 Usage: 850MB / 20GB                                  │
│ │   ├─ 👥 Users: 3                                             │
│ │   ├─ 🔗 Sources: 5                                           │
│ │   │                                                           │
│ │   ├── North America                     [⚙️] [👥] [📊]       │
│ │   │   ├─ 📊 Usage: 420MB / 10GB                              │
│ │   │   ├─ 👥 Users: 2                                         │
│ │   │   └─ 🔗 Sources: 3                                       │
│ │   │                                                           │
│ │   └── Europe                           [⚙️] [👥] [📊]       │
│ │       ├─ 📊 Usage: 320MB / 10GB                              │
│ │       ├─ 👥 Users: 2                                         │
│ │       └─ 🔗 Sources: 2                                       │
│ │                                                               │
│ └── Gatorade Division                     [⚙️] [👥] [📊]       │
│     ├─ 📊 Usage: 1.2GB / 30GB                                  │
│     ├─ 👥 Users: 4                                             │
│     └─ 🔗 Sources: 7                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4. User Invitation Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ Invite User to Account                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Email Address                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ john.doe@example.com                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Role                                                            │
│ ○ Owner    ● Manager    ○ Viewer                               │
│                                                                 │
│ Permissions                                                     │
│ ☑ Can invite users                                             │
│ ☑ Can manage integrations                                      │
│ ☐ Can create sub-accounts                                      │
│ ☑ Can view all data                                            │
│                                                                 │
│ Message (Optional)                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Welcome to our PepsiCo data management platform...         │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                 [Cancel] [Send Invitation]     │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Pending Invitations List
```
┌─────────────────────────────────────────────────────────────────┐
│ Pending Invitations                          [+ Invite User]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📧 jane.smith@pepsi.com              Manager    [Resend] [❌] │ │
│ │    Invited by: admin@pepsi.com                              │ │
│ │    Code: 847392  •  Expires: Dec 15, 2024                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📧 mike.johnson@gatorade.com         Viewer     [Resend] [❌] │ │
│ │    Invited by: manager@pepsi.com                            │ │
│ │    Code: 395847  •  Expires: Dec 18, 2024                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📧 sarah.wilson@lays.com             Manager    [Resend] [❌] │ │
│ │    Invited by: admin@pepsi.com                              │ │
│ │    Code: 162938  •  Expires: Dec 20, 2024                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Accept Invitation Page
```
┌─────────────────────────────────────────────────────────────────┐
│                    🎉 You're Invited!                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│             Welcome to PepsiCo Data Portal                     │
│                                                                 │
│ You've been invited by admin@pepsi.com to join the            │
│ "PepsiCo" account as a Manager.                               │
│                                                                 │
│ Invitation Code                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [8][4][7][3][9][2]                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Your Role: Manager                                              │
│ Your Permissions:                                               │
│ • ✓ Can invite users                                           │
│ • ✓ Can manage integrations                                    │
│ • ✗ Cannot create sub-accounts                                 │
│ • ✓ Can view all data                                          │
│                                                                 │
│                    [Decline] [Accept Invitation]              │
│                                                                 │
│ This invitation expires on December 20, 2024                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Source Management

### 7. Sources with Multiple Instances
```
┌─────────────────────────────────────────────────────────────────┐
│ Data Sources                                  [+ Add Source]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🔗 Keap (3 instances)                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Production Account                        🟢 Active  [⚙️]    │ │
│ │ Last Sync: 2 mins ago  •  12,453 contacts               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Staging Environment                       🟡 Syncing [⚙️]    │ │
│ │ Last Sync: 15 mins ago  •  8,721 contacts               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Test Account                              🔴 Error   [⚙️]    │ │
│ │ Last Sync: 2 hours ago  •  Authentication failed        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ 💰 Stripe (2 instances)                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Live Environment                          🟢 Active  [⚙️]    │ │
│ │ Last Sync: 5 mins ago  •  3,247 transactions            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Test Environment                          🟢 Active  [⚙️]    │ │
│ │ Last Sync: 8 mins ago  •  892 transactions              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8. Source Configuration Dialog
```
┌─────────────────────────────────────────────────────────────────┐
│ Add Keap Instance                                     [❌]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Instance Name                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Production Account                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Description (Optional)                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Main production Keap account for customer data             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Authentication                                                  │
│ API Token                                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ KeapAK-************************1f6c25ed799                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Sync Settings                                                   │
│ Frequency: [Every 15 minutes ▼]                                │
│ ☑ Contacts  ☑ Companies  ☑ Orders  ☐ Notes                    │
│                                                                 │
│ [Test Connection]                            [Cancel] [Save]    │
│                                                                 │
│ ✅ Connection successful! Found 12,453 contacts.               │
└─────────────────────────────────────────────────────────────────┘
```

## Navigation & Context

### 9. Main Navigation with Account Context
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏠 ListBackup.ai                            [PepsiCo ▼] [👤]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [📊 Dashboard] [🔗 Sources] [💾 Backups] [📁 Browse] [👥 Users] │
│                                                                 │
│ Current Account: PepsiCo > Pepsi Division > North America      │
│ Role: Manager  •  Permissions: Manage Sources, View Data       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10. Account Breadcrumb Navigation
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏠 PepsiCo > Pepsi Division > North America      [Switch Account] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Quick Actions for North America:                                │
│ [View Parent: Pepsi Division] [Create Sub-Account] [Invite User]│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Mobile Responsive Design

### 11. Mobile Account Switcher
```
┌─────────────────────┐
│ ≡ ListBackup.ai  👤 │
├─────────────────────┤
│                     │
│ Current Account:    │
│ PepsiCo > Pepsi     │
│ Division > North    │
│ America             │
│                     │
│ [Switch Account]    │
│                     │
│ Role: Manager       │
│ Permissions:        │
│ • Manage Sources    │
│ • View Data         │
│                     │
├─────────────────────┤
│ [📊] [🔗] [💾] [📁] │
│ Dash  Src Back Brws │
└─────────────────────┘
```

### 12. Mobile Hierarchy View
```
┌─────────────────────┐
│ Account Hierarchy   │
├─────────────────────┤
│                     │
│ PepsiCo (Root)      │
│ ├ Users: 5          │
│ ├ Usage: 2.3GB      │
│ └ Sources: 12       │
│   [Manage] [➕]     │
│                     │
│ Pepsi Division      │
│ ├ Users: 3          │
│ ├ Usage: 850MB      │
│ └ Sources: 5        │
│   [View] [⚙️]       │
│                     │
│ North America       │
│ ├ Users: 2          │
│ ├ Usage: 420MB      │
│ └ Sources: 3        │
│   [View] [⚙️]       │
│                     │
│ Europe              │
│ ├ Users: 2          │
│ ├ Usage: 320MB      │
│ └ Sources: 2        │
│   [View] [⚙️]       │
│                     │
└─────────────────────┘
```

## Key Design Principles

1. **Visual Hierarchy**: Clear indentation and icons for account levels
2. **Context Awareness**: Always show current account and user role
3. **Quick Actions**: Easy access to common tasks from any view
4. **Status Indicators**: Color-coded status for accounts and sources
5. **Progressive Disclosure**: Show essential info first, details on demand
6. **Mobile First**: Responsive design that works on all devices
7. **Accessibility**: Clear labels, proper contrast, keyboard navigation