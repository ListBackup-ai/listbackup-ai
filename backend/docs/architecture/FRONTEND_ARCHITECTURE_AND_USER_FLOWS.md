# ListBackup.ai v2 - Frontend Architecture and User Flows

**Generated**: 2025-06-20  
**Focus**: Complete Frontend Website Structure, User Journeys, and Page-to-Backend Connections  
**Coverage**: All user types, flows, and integration patterns  

## 🎯 Executive Summary

ListBackup.ai v2 features a sophisticated Next.js 14 frontend with hierarchical account management, multi-platform integrations, client portal capabilities, and comprehensive user flows supporting everything from individual users to enterprise conglomerates.

### Key Frontend Features
- **🏗️ Modern Architecture**: Next.js 14 App Router with TypeScript
- **👥 Multi-User Support**: Owners, team members, sub-account managers, clients
- **🔗 Platform Integrations**: 50+ supported platforms with OAuth flows
- **🏢 Enterprise Features**: Hierarchical accounts, team management, client portals
- **📱 Responsive Design**: Mobile-first with cross-platform consistency

---

## 📋 Table of Contents

1. [Complete Website Structure](#complete-website-structure)
2. [User Types and Personas](#user-types-and-personas)
3. [Detailed User Journeys](#detailed-user-journeys)
4. [Frontend-Backend API Mapping](#frontend-backend-api-mapping)
5. [Page Architecture and Routing](#page-architecture-and-routing)
6. [User Flow Diagrams](#user-flow-diagrams)
7. [Component Architecture](#component-architecture)
8. [State Management Patterns](#state-management-patterns)

---

## 🌐 Complete Website Structure

### Public Marketing Pages

```mermaid
graph TD
    subgraph "Public Site Structure"
        LANDING[Homepage /]
        FEATURES[Features /features]
        PRICING[Pricing /pricing]
        ABOUT[About /about]
        CONTACT[Contact /contact]
        DEMO[Demo /demo]
        HELP[Help /help]
        STATUS[Status /status]
        SECURITY[Security /security]
        BLOG[Blog /blog]
        CAREERS[Careers /careers]
    end
    
    subgraph "Legal Pages"
        PRIVACY[Privacy /privacy]
        TERMS[Terms /terms]
        GDPR[GDPR /gdpr]
    end
    
    subgraph "Platform Showcase"
        INTEGRATIONS[Integrations Hub /integrations]
        KEAP[Keap /integrations/keap]
        STRIPE[Stripe /integrations/stripe]
        GHL[GoHighLevel /integrations/gohighlevel]
        HUBSPOT[HubSpot /integrations/hubspot]
        SHOPIFY[Shopify /integrations/shopify]
        REQUEST[Request Integration /integrations/request]
    end
    
    LANDING --> FEATURES
    LANDING --> PRICING
    LANDING --> INTEGRATIONS
    FEATURES --> DEMO
    PRICING --> CONTACT
    INTEGRATIONS --> KEAP
    INTEGRATIONS --> STRIPE
    INTEGRATIONS --> GHL
```

### Authentication Flow Pages

```mermaid
graph LR
    subgraph "Auth Pages (/(auth)/)"
        LOGIN[Login /login]
        SIGNUP[Signup /signup]
        FORGOT[Forgot Password /forgot-password]
        RESET[Reset Password /reset-password]
    end
    
    subgraph "OAuth Flows"
        OAUTH_START[OAuth Start /oauth/start/{platform}]
        OAUTH_CALLBACK[OAuth Callback /oauth/callback]
        OAUTH_SUCCESS[Connection Success]
        OAUTH_ERROR[Connection Error]
    end
    
    LOGIN --> OAUTH_START
    SIGNUP --> OAUTH_START
    OAUTH_START --> OAUTH_CALLBACK
    OAUTH_CALLBACK --> OAUTH_SUCCESS
    OAUTH_CALLBACK --> OAUTH_ERROR
```

### Main Application Dashboard

```mermaid
graph TB
    subgraph "Core Dashboard Pages"
        DASHBOARD[Dashboard /dashboard]
        SOURCES[Sources /dashboard/sources]
        JOBS[Jobs /dashboard/jobs]
        BROWSE[Browse /dashboard/browse]
        MONITOR[Monitor /dashboard/monitor]
        ANALYTICS[Analytics /dashboard/analytics]
        BILLING[Billing /dashboard/billing]
        BACKUPS[Backups /dashboard/backups]
        NOTIFICATIONS[Notifications /dashboard/notifications]
    end
    
    subgraph "Advanced Features (Enterprise)"
        ACCOUNTS[Accounts /dashboard/accounts]
        TEAMS[Teams /dashboard/teams]
        CLIENTS[Clients /dashboard/clients]
        CONNECTIONS[Connections /dashboard/connections]
    end
    
    subgraph "Settings & Configuration"
        SETTINGS[Settings /dashboard/settings]
        ACCOUNT_SETTINGS[Account Settings /dashboard/settings/account]
        USER_SETTINGS[User Settings /dashboard/settings/user]
    end
    
    subgraph "Dynamic Routes"
        SOURCE_DETAIL[Source Detail /dashboard/sources/[sourceId]]
        SOURCE_NEW[New Source /dashboard/sources/new]
        JOB_DETAIL[Job Detail /dashboard/jobs/[jobId]]
        TEAM_DETAIL[Team Detail /dashboard/teams/[teamId]]
    end
    
    DASHBOARD --> SOURCES
    DASHBOARD --> JOBS
    DASHBOARD --> ACCOUNTS
    SOURCES --> SOURCE_DETAIL
    SOURCES --> SOURCE_NEW
    JOBS --> JOB_DETAIL
    TEAMS --> TEAM_DETAIL
```

### Client Portal (Enterprise Feature)

```mermaid
graph TD
    subgraph "Client Portal (/(portal)/)"
        PORTAL_HOME[Client Dashboard /portal]
        PORTAL_LOGIN[Client Login /portal/login]
        PORTAL_LOGOUT[Client Logout /portal/logout]
        PORTAL_ACCOUNTS[Account Access /portal/accounts]
        PORTAL_REPORTS[Reports /portal/reports]
        PORTAL_EXPORTS[Data Exports /portal/exports]
    end
    
    subgraph "Client Features"
        REPORT_DOWNLOAD[Download Reports]
        EXPORT_REQUEST[Request Data Export]
        ACCOUNT_VIEW[View Account Data]
        SUPPORT_CONTACT[Contact Support]
    end
    
    PORTAL_LOGIN --> PORTAL_HOME
    PORTAL_HOME --> PORTAL_ACCOUNTS
    PORTAL_HOME --> PORTAL_REPORTS
    PORTAL_HOME --> PORTAL_EXPORTS
    PORTAL_REPORTS --> REPORT_DOWNLOAD
    PORTAL_EXPORTS --> EXPORT_REQUEST
```

---

## 👥 User Types and Personas

### Primary User Classifications

```mermaid
graph TD
    subgraph "User Hierarchy"
        OWNER[Account Owner<br/>Full account control<br/>Billing management<br/>User invitations]
        ADMIN[Admin<br/>User management<br/>Data management<br/>No billing access]
        MANAGER[Manager<br/>Source management<br/>Job scheduling<br/>Limited user access]
        VIEWER[Viewer<br/>Read-only access<br/>Data browsing<br/>Report generation]
    end
    
    subgraph "Account Types"
        CONGLOMERATE[Conglomerate<br/>Enterprise parent<br/>Multiple subsidiaries<br/>Complex hierarchy]
        SUBSIDIARY[Subsidiary<br/>Division level<br/>Department teams<br/>Regional operations]
        DIVISION[Division<br/>Team level<br/>Functional units<br/>Project groups]
        LOCATION[Location<br/>Physical sites<br/>Franchise units<br/>Store locations]
    end
    
    subgraph "Special Access"
        CLIENT[Client Portal User<br/>External access<br/>Limited data view<br/>Read-only reports]
        API_USER[API User<br/>Programmatic access<br/>Integration workflows<br/>Automated backups]
    end
    
    OWNER --> ADMIN
    ADMIN --> MANAGER
    MANAGER --> VIEWER
    
    CONGLOMERATE --> SUBSIDIARY
    SUBSIDIARY --> DIVISION
    DIVISION --> LOCATION
```

### User Permission Matrix

| Permission | Owner | Admin | Manager | Viewer | Client |
|------------|:-----:|:-----:|:-------:|:------:|:------:|
| **Create Sub-Accounts** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Invite Users** | ✅ | ✅ | ✅* | ❌ | ❌ |
| **Manage Integrations** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **View All Data** | ✅ | ✅ | ✅ | ✅ | ✅* |
| **Manage Billing** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Delete Account** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Export Data** | ✅ | ✅ | ✅ | ✅ | ✅* |
| **Create Backup Jobs** | ✅ | ✅ | ✅ | ❌ | ❌ |

*Limited to specific accounts/data

---

## 🚀 Detailed User Journeys

### Journey 1: Complete Signup Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LP as Landing Page
    participant SP as Signup Page
    participant API as Auth API
    participant DB as Database
    participant D as Dashboard
    
    U->>LP: Visit listbackup.ai
    LP->>U: Show value proposition
    U->>LP: Click "Start Free Trial"
    LP->>SP: Navigate to /signup
    
    SP->>U: Show registration form
    U->>SP: Fill form (name, email, company, password)
    SP->>SP: Validate input
    SP->>API: POST /auth/register
    API->>DB: Create user record
    API->>DB: Create root account
    API->>DB: Link user to account
    API->>SP: Return JWT tokens
    SP->>SP: Store tokens
    SP->>D: Redirect to /dashboard
    
    D->>U: Show welcome screen
    U->>D: Complete onboarding
    D->>U: Platform integration guide
```

### Journey 2: Platform Integration Setup

```mermaid
flowchart TD
    START[User Wants to Connect Platform] --> BROWSE[Browse Platforms Page]
    BROWSE --> SELECT[Select Platform]
    SELECT --> OAUTH_CHECK{OAuth Supported?}
    
    OAUTH_CHECK -->|Yes| OAUTH_FLOW[OAuth Authorization Flow]
    OAUTH_CHECK -->|No| MANUAL_SETUP[Manual Credential Setup]
    
    OAUTH_FLOW --> OAUTH_START[Generate OAuth URL]
    OAUTH_START --> PLATFORM_AUTH[Redirect to Platform]
    PLATFORM_AUTH --> USER_CONSENT[User Grants Permissions]
    USER_CONSENT --> OAUTH_CALLBACK[OAuth Callback]
    OAUTH_CALLBACK --> TOKEN_EXCHANGE[Exchange Code for Tokens]
    TOKEN_EXCHANGE --> STORE_TOKENS[Store Encrypted Tokens]
    
    MANUAL_SETUP --> CREDENTIALS_FORM[API Key Input Form]
    CREDENTIALS_FORM --> TEST_CONNECTION[Test Connection]
    TEST_CONNECTION --> CONNECTION_SUCCESS{Test Successful?}
    CONNECTION_SUCCESS -->|Yes| STORE_CREDENTIALS[Store Credentials]
    CONNECTION_SUCCESS -->|No| SHOW_ERROR[Show Error Message]
    SHOW_ERROR --> CREDENTIALS_FORM
    
    STORE_TOKENS --> SOURCE_CONFIG[Configure Data Source]
    STORE_CREDENTIALS --> SOURCE_CONFIG
    SOURCE_CONFIG --> NAME_SOURCE[Name the Source]
    NAME_SOURCE --> SELECT_DATA[Select Data Types]
    SELECT_DATA --> SCHEDULE_BACKUP[Set Backup Schedule]
    SCHEDULE_BACKUP --> CREATE_SOURCE[Create Source Record]
    CREATE_SOURCE --> INITIAL_SYNC[Trigger Initial Sync]
    INITIAL_SYNC --> SUCCESS[Integration Complete]
```

### Journey 3: Account Hierarchy Management

```mermaid
graph TD
    subgraph "Enterprise Account Setup"
        ROOT[Create Root Account<br/>Acme Corporation]
        ROOT --> MARKETING[Marketing Division]
        ROOT --> SALES[Sales Division]
        ROOT --> TECH[Technology Division]
        
        MARKETING --> EMAIL_TEAM[Email Marketing Team]
        MARKETING --> CONTENT_TEAM[Content Marketing Team]
        
        SALES --> ENTERPRISE_SALES[Enterprise Sales Team]
        SALES --> SMB_SALES[SMB Sales Team]
        
        TECH --> ENGINEERING[Engineering Team]
        TECH --> DEVOPS[DevOps Team]
        
        EMAIL_TEAM --> US_REGION[US East Region]
        EMAIL_TEAM --> EU_REGION[EU Region]
    end
    
    subgraph "Permission Flow"
        ROOT_PERMS[Root Account Owner<br/>Full access to all]
        DIVISION_PERMS[Division Manager<br/>Access to division + children]
        TEAM_PERMS[Team Lead<br/>Access to team only]
        REGION_PERMS[Regional Manager<br/>Access to region only]
    end
    
    ROOT --> ROOT_PERMS
    MARKETING --> DIVISION_PERMS
    EMAIL_TEAM --> TEAM_PERMS
    US_REGION --> REGION_PERMS
```

### Journey 4: Team Collaboration Flow

```mermaid
sequenceDiagram
    participant Owner as Account Owner
    participant System as ListBackup System
    participant Email as Email Service
    participant NewUser as New Team Member
    participant Dashboard as Dashboard
    
    Owner->>Dashboard: Navigate to Teams
    Dashboard->>Owner: Show team management
    Owner->>Dashboard: Click "Invite Member"
    Dashboard->>Owner: Show invitation form
    Owner->>Dashboard: Enter email & role
    Dashboard->>System: Create invitation
    System->>Email: Send invitation email
    Email->>NewUser: Invitation received
    
    NewUser->>Email: Click invitation link
    Email->>System: Validate invitation token
    System->>NewUser: Show signup/login form
    NewUser->>System: Complete registration
    System->>System: Link user to account
    System->>Dashboard: Grant access permissions
    Dashboard->>NewUser: Show dashboard with role
    
    NewUser->>Dashboard: Explore accessible features
    Dashboard->>Owner: Notify member joined
```

### Journey 5: Data Backup Process

```mermaid
flowchart TD
    TRIGGER[Backup Triggered] --> TYPE{Backup Type}
    
    TYPE -->|Manual| MANUAL_START[User Clicks Sync]
    TYPE -->|Scheduled| CRON_START[Cron Job Triggered]
    TYPE -->|Webhook| WEBHOOK_START[Platform Webhook Received]
    
    MANUAL_START --> QUEUE_JOB[Add Job to Queue]
    CRON_START --> QUEUE_JOB
    WEBHOOK_START --> QUEUE_JOB
    
    QUEUE_JOB --> JOB_PROCESSING[Job Processing Started]
    JOB_PROCESSING --> FETCH_DATA[Fetch Data from Platform]
    FETCH_DATA --> VALIDATE_DATA[Validate Data Integrity]
    VALIDATE_DATA --> TRANSFORM_DATA[Transform & Normalize]
    TRANSFORM_DATA --> COMPRESS_DATA[Compress Data]
    COMPRESS_DATA --> ENCRYPT_DATA[Encrypt Data]
    ENCRYPT_DATA --> UPLOAD_S3[Upload to S3]
    UPLOAD_S3 --> UPDATE_METADATA[Update File Metadata]
    UPDATE_METADATA --> LOG_ACTIVITY[Log Backup Activity]
    LOG_ACTIVITY --> NOTIFY_USER[Notify User of Success]
    
    FETCH_DATA --> ERROR_HANDLING{Error Occurred?}
    ERROR_HANDLING -->|Yes| RETRY_LOGIC[Exponential Backoff Retry]
    ERROR_HANDLING -->|No| VALIDATE_DATA
    RETRY_LOGIC --> MAX_RETRIES{Max Retries Reached?}
    MAX_RETRIES -->|No| FETCH_DATA
    MAX_RETRIES -->|Yes| FAILURE_NOTIFICATION[Notify User of Failure]
```

---

## 🔌 Frontend-Backend API Mapping

### Authentication Pages → Auth Service

```typescript
// Login Page API Connections
const loginMutation = useMutation({
  mutationFn: async (data: LoginData) => {
    return await api.auth.login(data) // POST /auth/login
  },
  onSuccess: (response) => {
    // Store JWT tokens
    localStorage.setItem('serviceToken', response.data.accessToken)
    localStorage.setItem('refreshToken', response.data.refreshToken)
    
    // Update auth state
    setAuth(response.data.user, response.data.accessToken, response.data.refreshToken)
    
    // Redirect to dashboard
    router.push('/dashboard')
  }
})

// Signup Page API Connections
const signupMutation = useMutation({
  mutationFn: async (data: SignupData) => {
    return await api.auth.signup(data) // POST /auth/register
  },
  onSuccess: (response) => {
    // Auto-login after successful signup
    setAuth(response.data.user, response.data.accessToken, response.data.refreshToken)
    router.push('/dashboard')
  }
})
```

### Dashboard Pages → Multiple Services

```typescript
// Main Dashboard - Consolidated Data Fetching
const useDashboardData = () => {
  // Sources from Sources Service
  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: () => api.sources.list(), // GET /sources
    staleTime: 5 * 60 * 1000
  })

  // Jobs from Jobs Service  
  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(), // GET /jobs
    staleTime: 5 * 60 * 1000
  })

  // Activity from Activity Service
  const { data: activity } = useQuery({
    queryKey: ['activity'],
    queryFn: () => api.activity.list({ limit: 10 }), // GET /activity
    staleTime: 2 * 60 * 1000
  })

  // Account from Accounts Service
  const { data: account } = useQuery({
    queryKey: ['account'],
    queryFn: () => api.accounts.get(), // GET /accounts/current
    staleTime: 10 * 60 * 1000
  })

  return { sources, jobs, activity, account }
}
```

### Platform Integration → Platforms & Connections Services

```typescript
// Platform Browse Component
const PlatformsBrowser = () => {
  // Get available platforms
  const { data: platforms } = useQuery({
    queryKey: ['platforms'],
    queryFn: () => api.platforms.list(), // GET /platforms
    staleTime: 30 * 60 * 1000 // Cache for 30 minutes
  })

  // OAuth connection flow
  const connectPlatform = async (platformType: string) => {
    try {
      // Initiate OAuth flow
      const response = await api.platforms.initiateOAuth(platformType, {
        returnUrl: window.location.href
      }) // POST /platforms/{type}/oauth/start
      
      // Store state for verification
      sessionStorage.setItem('oauth_state', response.state)
      
      // Redirect to OAuth provider
      window.location.href = response.authUrl
    } catch (error) {
      toast.error('Failed to connect platform')
    }
  }

  return (
    <div className="platforms-grid">
      {platforms?.map(platform => (
        <PlatformCard 
          key={platform.id}
          platform={platform}
          onConnect={() => connectPlatform(platform.type)}
        />
      ))}
    </div>
  )
}
```

### Account Management → Accounts & Teams Services

```typescript
// Account Context Provider
const AccountContextProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState(null)
  const [userPermissions, setUserPermissions] = useState({})

  // Load user's accessible accounts
  const { data: accounts } = useQuery({
    queryKey: ['user-accounts'],
    queryFn: () => api.accounts.getUserAccounts(), // GET /accounts
    staleTime: 10 * 60 * 1000
  })

  // Switch account context
  const switchAccount = async (accountId: string) => {
    try {
      const response = await api.accounts.switchContext(accountId) // POST /accounts/switch
      setCurrentAccount(response.account)
      setUserPermissions(response.permissions)
      
      // Invalidate all queries to refetch with new context
      queryClient.invalidateQueries()
    } catch (error) {
      toast.error('Failed to switch account')
    }
  }

  return (
    <AccountContext.Provider value={{ 
      currentAccount, 
      accounts, 
      userPermissions,
      switchAccount 
    }}>
      {children}
    </AccountContext.Provider>
  )
}
```

### Real-time Features → Jobs & Activity Services

```typescript
// Job Status Monitoring
const JobStatusMonitor = ({ jobId }: { jobId: string }) => {
  // Poll job status while running
  const { data: jobStatus } = useQuery({
    queryKey: ['jobs', jobId, 'status'],
    queryFn: () => api.jobs.get(jobId), // GET /jobs/{jobId}
    refetchInterval: (data) => {
      // Poll every 2 seconds if job is running
      return data?.status === 'running' ? 2000 : false
    },
    enabled: !!jobId
  })

  // Real-time progress updates
  useEffect(() => {
    if (jobStatus?.status === 'running') {
      // Update progress bar
      setProgress(jobStatus.progress?.percentage || 0)
    } else if (jobStatus?.status === 'completed') {
      // Show success notification
      toast.success('Backup completed successfully')
    } else if (jobStatus?.status === 'failed') {
      // Show error notification
      toast.error(`Backup failed: ${jobStatus.error}`)
    }
  }, [jobStatus])

  return (
    <div className="job-progress">
      <ProgressBar value={progress} />
      <span>{jobStatus?.status}</span>
    </div>
  )
}
```

---

## 🏗️ Page Architecture and Routing

### Next.js App Router Structure

```
app/
├── (auth)/                    # Auth group with shared layout
│   ├── layout.tsx            # Centered auth layout
│   ├── login/
│   │   └── page.tsx          # Login form
│   └── signup/
│       └── page.tsx          # Registration form
├── dashboard/                 # Main app group
│   ├── layout.tsx            # Dashboard layout with sidebar
│   ├── page.tsx              # Dashboard overview
│   ├── sources/
│   │   ├── page.tsx          # Sources list
│   │   ├── [sourceId]/
│   │   │   └── page.tsx      # Source details
│   │   └── new/
│   │       └── page.tsx      # Create source wizard
│   ├── jobs/
│   │   ├── page.tsx          # Jobs list
│   │   └── [jobId]/
│   │       └── page.tsx      # Job details
│   ├── accounts/
│   │   ├── page.tsx          # Account management
│   │   └── [accountId]/
│   │       └── page.tsx      # Account details
│   ├── teams/
│   │   ├── page.tsx          # Teams list
│   │   └── [teamId]/
│   │       └── page.tsx      # Team management
│   └── settings/
│       ├── page.tsx          # General settings
│       ├── account/
│       │   └── page.tsx      # Account settings
│       └── user/
│           └── page.tsx      # User profile
├── (portal)/                 # Client portal group
│   ├── layout.tsx            # Portal layout
│   ├── login/
│   │   └── page.tsx          # Client login
│   ├── page.tsx              # Portal dashboard
│   ├── accounts/
│   │   └── page.tsx          # Account access
│   ├── reports/
│   │   └── page.tsx          # Report downloads
│   └── exports/
│       └── page.tsx          # Data exports
├── integrations/             # Platform showcase
│   ├── page.tsx              # Integrations hub
│   ├── [platform]/
│   │   └── page.tsx          # Platform details
│   └── request/
│       └── page.tsx          # Integration request
├── layout.tsx                # Root layout
├── page.tsx                  # Landing page
├── pricing/
│   └── page.tsx              # Pricing page
└── api/                      # API routes
    └── oauth/
        └── callback/
            └── route.ts      # OAuth callback handler
```

### Routing Middleware and Protection

```typescript
// middleware.ts - Route Protection
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('serviceToken')?.value

  // Public routes that don't require authentication
  const publicPaths = [
    '/', '/login', '/signup', '/pricing', '/features', 
    '/about', '/contact', '/integrations', '/privacy', '/terms'
  ]

  // Check if path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )

  // Redirect unauthenticated users from protected routes
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users from auth pages
  if ((pathname === '/login' || pathname === '/signup') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect authenticated users from landing page
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

---

## 📊 User Flow Diagrams

### Complete Onboarding Flow

```mermaid
flowchart TD
    LAND[User Lands on Homepage] --> VALUE_PROP[Review Value Proposition]
    VALUE_PROP --> INTEREST{Interested?}
    INTEREST -->|No| EXIT[Leave Site]
    INTEREST -->|Yes| EXPLORE[Explore Features/Pricing]
    
    EXPLORE --> DECISION{Ready to Sign Up?}
    DECISION -->|No| NURTURE[Newsletter/Retargeting]
    DECISION -->|Yes| SIGNUP[Click "Start Free Trial"]
    
    SIGNUP --> FORM[Fill Registration Form]
    FORM --> VALIDATE[Form Validation]
    VALIDATE --> SUBMIT[Submit Registration]
    SUBMIT --> ACCOUNT_CREATED[Account Created]
    
    ACCOUNT_CREATED --> LOGIN_AUTO[Auto-login]
    LOGIN_AUTO --> DASHBOARD[Dashboard First Visit]
    DASHBOARD --> ONBOARDING{First Time User?}
    
    ONBOARDING -->|Yes| WELCOME[Welcome Screen]
    ONBOARDING -->|No| NORMAL_DASH[Normal Dashboard]
    
    WELCOME --> PLATFORM_GUIDE[Platform Integration Guide]
    PLATFORM_GUIDE --> SELECT_PLATFORM[Select First Platform]
    SELECT_PLATFORM --> OAUTH_SETUP[OAuth Setup]
    OAUTH_SETUP --> FIRST_SOURCE[Create First Source]
    FIRST_SOURCE --> INITIAL_SYNC[Initial Data Sync]
    INITIAL_SYNC --> SUCCESS[Onboarding Complete]
    
    SUCCESS --> NORMAL_DASH
```

### Account Hierarchy Creation Flow

```mermaid
sequenceDiagram
    participant User as Account Owner
    participant UI as Dashboard UI
    participant API as Accounts API
    participant DB as Database
    participant Email as Email Service
    participant NewMgr as New Manager
    
    User->>UI: Navigate to Accounts
    UI->>API: GET /accounts (load hierarchy)
    API->>DB: Query account tree
    DB->>API: Return account structure
    API->>UI: Display hierarchy
    
    User->>UI: Click "Create Sub-Account"
    UI->>User: Show creation form
    User->>UI: Enter details (name, type, parent)
    UI->>API: POST /accounts/create
    API->>DB: Create account record
    API->>DB: Update hierarchy paths
    DB->>API: Confirm creation
    API->>UI: Return new account
    UI->>User: Show success message
    
    User->>UI: Click "Invite Manager"
    UI->>User: Show invitation form
    User->>UI: Enter email & permissions
    UI->>API: POST /teams/invite
    API->>Email: Send invitation
    API->>DB: Store invitation record
    Email->>NewMgr: Invitation email
    
    NewMgr->>Email: Click invitation link
    Email->>UI: Validate & show signup
    NewMgr->>UI: Complete registration
    UI->>API: POST /auth/register (with invite)
    API->>DB: Create user & link to account
    API->>UI: Grant access to account
    UI->>NewMgr: Show dashboard with permissions
```

### Client Portal Access Flow

```mermaid
flowchart TD
    subgraph "Agency Setup"
        AGENCY[Agency Creates Client]
        CLIENT_FORM[Fill Client Information]
        PERMISSIONS[Set Data Permissions]
        ACCOUNTS[Grant Account Access]
        SEND_INVITE[Send Portal Invitation]
    end
    
    subgraph "Client Experience"
        RECEIVE_EMAIL[Client Receives Email]
        CLICK_LINK[Click Portal Link]
        PORTAL_LOGIN[Portal Login Form]
        AUTHENTICATE[Client Authentication]
        PORTAL_DASH[Portal Dashboard]
    end
    
    subgraph "Portal Features"
        VIEW_ACCOUNTS[View Accessible Accounts]
        DOWNLOAD_REPORTS[Download Reports]
        REQUEST_EXPORTS[Request Data Exports]
        VIEW_ACTIVITY[View Activity Logs]
    end
    
    AGENCY --> CLIENT_FORM
    CLIENT_FORM --> PERMISSIONS
    PERMISSIONS --> ACCOUNTS
    ACCOUNTS --> SEND_INVITE
    
    SEND_INVITE --> RECEIVE_EMAIL
    RECEIVE_EMAIL --> CLICK_LINK
    CLICK_LINK --> PORTAL_LOGIN
    PORTAL_LOGIN --> AUTHENTICATE
    AUTHENTICATE --> PORTAL_DASH
    
    PORTAL_DASH --> VIEW_ACCOUNTS
    PORTAL_DASH --> DOWNLOAD_REPORTS
    PORTAL_DASH --> REQUEST_EXPORTS
    PORTAL_DASH --> VIEW_ACTIVITY
```

### Error Handling and Recovery Flow

```mermaid
stateDiagram-v2
    [*] --> Normal_Operation
    
    Normal_Operation --> Auth_Error: Token Expired
    Normal_Operation --> API_Error: API Failure
    Normal_Operation --> Network_Error: Connection Lost
    Normal_Operation --> Integration_Error: Platform Connection Failed
    
    Auth_Error --> Token_Refresh: Attempt Refresh
    Token_Refresh --> Normal_Operation: Success
    Token_Refresh --> Login_Required: Refresh Failed
    Login_Required --> Normal_Operation: User Logs In
    
    API_Error --> Retry_Logic: Exponential Backoff
    Retry_Logic --> Normal_Operation: API Recovered
    Retry_Logic --> Error_Display: Max Retries Reached
    Error_Display --> Normal_Operation: User Acknowledges
    
    Network_Error --> Offline_Mode: Enable Offline UI
    Offline_Mode --> Normal_Operation: Connection Restored
    
    Integration_Error --> Reconnect_Flow: Show Reconnection Options
    Reconnect_Flow --> OAuth_Flow: Re-authenticate
    Reconnect_Flow --> Manual_Setup: Enter New Credentials
    OAuth_Flow --> Normal_Operation: Integration Fixed
    Manual_Setup --> Normal_Operation: Credentials Updated
```

---

## 🧩 Component Architecture

### Shared Component Library

```mermaid
graph TB
    subgraph "UI Primitives (shadcn/ui)"
        BUTTON[Button]
        INPUT[Input]
        CARD[Card]
        DIALOG[Dialog]
        DROPDOWN[Dropdown]
        TABLE[Table]
        FORM[Form Components]
        TOAST[Toast Notifications]
    end
    
    subgraph "Feature Components"
        PLATFORM_BROWSER[Platforms Browser]
        SOURCE_WIZARD[Source Creation Wizard]
        JOB_BUILDER[Job Builder]
        ACCOUNT_SWITCHER[Account Switcher]
        TEAM_MANAGER[Team Manager]
        CLIENT_PORTAL[Client Portal]
        OAUTH_BUTTON[OAuth Button]
        DATA_BROWSER[Data Browser]
    end
    
    subgraph "Layout Components"
        DASHBOARD_LAYOUT[Dashboard Layout]
        AUTH_LAYOUT[Auth Layout]
        PORTAL_LAYOUT[Portal Layout]
        SIDEBAR[Navigation Sidebar]
        HEADER[Header with Account Switcher]
        FOOTER[Footer]
    end
    
    subgraph "Provider Components"
        AUTH_PROVIDER[Auth Provider]
        QUERY_PROVIDER[TanStack Query Provider]
        ACCOUNT_PROVIDER[Account Context Provider]
        THEME_PROVIDER[Theme Provider]
    end
    
    BUTTON --> PLATFORM_BROWSER
    CARD --> SOURCE_WIZARD
    FORM --> JOB_BUILDER
    DROPDOWN --> ACCOUNT_SWITCHER
    
    DASHBOARD_LAYOUT --> SIDEBAR
    DASHBOARD_LAYOUT --> HEADER
    AUTH_LAYOUT --> FOOTER
    
    AUTH_PROVIDER --> QUERY_PROVIDER
    QUERY_PROVIDER --> ACCOUNT_PROVIDER
    ACCOUNT_PROVIDER --> THEME_PROVIDER
```

---

## 🔄 State Management Patterns

### Zustand Auth Store

```typescript
interface AuthState {
  user: User | null
  serviceToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  refreshTokens: () => Promise<void>
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  serviceToken: null,
  refreshToken: null,
  isAuthenticated: false,

  login: (user, accessToken, refreshToken) => {
    // Store tokens
    localStorage.setItem('serviceToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    
    // Update state
    set({
      user,
      serviceToken: accessToken,
      refreshToken,
      isAuthenticated: true
    })
  },

  logout: () => {
    // Clear storage
    localStorage.removeItem('serviceToken')
    localStorage.removeItem('refreshToken')
    
    // Clear state
    set({
      user: null,
      serviceToken: null,
      refreshToken: null,
      isAuthenticated: false
    })
    
    // Redirect to login
    window.location.href = '/login'
  },

  refreshTokens: async () => {
    const refreshToken = get().refreshToken
    if (!refreshToken) throw new Error('No refresh token')

    const response = await api.auth.refresh(refreshToken)
    const { accessToken, refreshToken: newRefreshToken } = response.data

    // Update tokens
    localStorage.setItem('serviceToken', accessToken)
    localStorage.setItem('refreshToken', newRefreshToken)
    
    set({
      serviceToken: accessToken,
      refreshToken: newRefreshToken
    })
  }
}))
```

### TanStack Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error?.response?.status === 401) return false
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        // Global error handling
        if (error?.response?.status === 401) {
          useAuthStore.getState().logout()
        } else {
          toast.error(error.message || 'An error occurred')
        }
      }
    }
  }
})
```

### Account Context Management

```typescript
interface AccountContextType {
  currentAccount: Account | null
  accounts: Account[]
  userRole: string
  permissions: Permissions
  switchAccount: (accountId: string) => Promise<void>
  canCreateSubAccounts: boolean
  canInviteUsers: boolean
  canManageBilling: boolean
}

const AccountContext = createContext<AccountContextType | null>(null)

export const useAccountContext = () => {
  const context = useContext(AccountContext)
  if (!context) {
    throw new Error('useAccountContext must be used within AccountProvider')
  }
  return context
}
```

---

## 📈 Performance and Optimization

### Loading State Management

```mermaid
graph LR
    subgraph "Loading States"
        INITIAL[Initial Load]
        SKELETON[Skeleton Components]
        PROGRESSIVE[Progressive Loading]
        LAZY[Lazy Loading]
        PREFETCH[Prefetching]
    end
    
    subgraph "Data Management"
        CACHE[Query Caching]
        INVALIDATION[Cache Invalidation]
        OPTIMISTIC[Optimistic Updates]
        BACKGROUND[Background Refetch]
    end
    
    subgraph "User Experience"
        INSTANT[Instant Navigation]
        SMOOTH[Smooth Transitions]
        FEEDBACK[User Feedback]
        OFFLINE[Offline Support]
    end
    
    INITIAL --> SKELETON
    SKELETON --> PROGRESSIVE
    PROGRESSIVE --> LAZY
    LAZY --> PREFETCH
    
    CACHE --> INVALIDATION
    INVALIDATION --> OPTIMISTIC
    OPTIMISTIC --> BACKGROUND
    
    INSTANT --> SMOOTH
    SMOOTH --> FEEDBACK
    FEEDBACK --> OFFLINE
```

### Code Splitting and Lazy Loading

```typescript
// Dynamic imports for large components
const PlatformsBrowser = lazy(() => import('./components/platforms/platforms-browser'))
const AccountManager = lazy(() => import('./components/account/account-manager'))
const ClientPortal = lazy(() => import('./components/portal/client-portal'))

// Route-based code splitting with loading states
const Dashboard = lazy(() => 
  import('./pages/dashboard').then(module => ({
    default: module.DashboardPage
  }))
)

// Wrap with Suspense for loading states
<Suspense fallback={<DashboardSkeleton />}>
  <Dashboard />
</Suspense>
```

This comprehensive frontend architecture documentation provides a complete understanding of how users interact with the ListBackup.ai v2 platform, from initial discovery through advanced enterprise features. The hierarchical account system, multi-platform integrations, and sophisticated user flows support complex organizational structures while maintaining an intuitive user experience.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "12", "content": "Update main architecture documentation with detailed frontend analysis", "status": "completed", "priority": "high"}]