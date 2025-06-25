# Claude 4 Opus Frontend Development Prompt

## 🚀 Claude 4 Opus Frontend Prompt

```
I'm building ListBackup.ai v2 - a modern frontend for an AI-powered data backup and integration platform. Create a production-ready React 19 application using modern best practices.

**Project Context:**
This is a frontend modernization project. The existing backend is sophisticated and production-ready (AWS Lambda + DynamoDB + Serverless Framework with Google AI integration). I need a modern frontend that connects to existing APIs while showcasing a contemporary UX.

**Tech Stack Requirements:**
- **React 19** + TypeScript + **Next.js 15** (App Router)
- **Shadcn/UI** + **Tailwind CSS** for modern components
- **TanStack Query v5** for API state management
- **Zustand** for global state management
- **React Hook Form** with Zod validation
- **Framer Motion** for animations
- **Recharts** for data visualization

**Key Features to Implement:**

1. **Authentication System**
   - JWT-based login/logout with token refresh
   - Protected routes with role-based access
   - Clean login/signup forms using Shadcn/UI

2. **Dashboard Interface**
   - Modern grid layout with cards for key metrics
   - Data visualization for backup status, storage usage
   - Real-time updates using TanStack Query
   - Mobile-responsive design

3. **Data Management Interface**
   - Intuitive data source connections (Google Drive, Dropbox, etc.)
   - Backup job creation and scheduling
   - Data preview and filtering capabilities
   - Progress tracking and status indicators

4. **AI Assistant Integration**
   - Context-aware chat interface (not primary feature)
   - Embedded throughout the app for help/guidance
   - Integration with existing Gemini 2.0 Flash backend
   - Smart suggestions for backup strategies

5. **Settings & Configuration**
   - Account management and billing
   - Integration configurations
   - Notification preferences
   - Dark/light theme toggle

**Existing API Integration:**
Connect to these existing endpoints:
- Authentication: `/auth/login`, `/auth/refresh`
- Chat: `/chat/conversations`, `/chat/messages` (streaming)
- Jobs: `/jobs/list`, `/jobs/create`, `/jobs/status`
- Analytics: `/analytics/dashboard`, `/analytics/usage`
- Integrations: `/integrations/oauth`, `/integrations/list`

**API Client Configuration:**
```typescript
// Use existing patterns from v1
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('serviceToken')}`,
    'Content-Type': 'application/json'
  }
})
```

**Design Requirements:**
- **Modern, clean aesthetic** with subtle animations
- **Mobile-first responsive design**
- **Accessibility compliance** (WCAG 2.1 AA)
- **Fast loading** with proper image optimization
- **Professional color scheme** suitable for business users
- **Consistent spacing** and typography using Tailwind

**File Structure:**
```
app/
├── (auth)/
│   ├── login/
│   └── signup/
├── dashboard/
├── data/
├── integrations/
├── settings/
└── globals.css

components/
├── ui/ (Shadcn/UI components)
├── layout/
├── forms/
├── charts/
└── common/

lib/
├── api/
├── auth/
├── utils/
└── stores/

types/
└── api.ts
```

**State Management Strategy:**
- **TanStack Query** for server state (API calls, caching, sync)
- **Zustand** for client state (UI state, user preferences)
- **React Hook Form** for form state management
- **Local Storage** for persistence (auth tokens, theme preferences)

**Performance Requirements:**
- Initial page load < 2 seconds
- Lighthouse score > 90
- Bundle size optimization
- Image optimization with Next.js
- Code splitting by routes

**Development Guidelines:**
1. Use TypeScript strictly - no `any` types
2. Implement proper error boundaries
3. Add loading states for all async operations
4. Use React Suspense for code splitting
5. Implement proper SEO with Next.js metadata
6. Add comprehensive error handling
7. Use React 19 features (useOptimistic, useActionState)

**Integration Points:**
- Existing DynamoDB tables via API endpoints
- Google OAuth integration (existing)
- Stripe billing integration (existing)
- File upload to S3 (existing)
- Real-time chat streaming (existing WebSocket)

**Security Considerations:**
- Implement CSP headers
- Sanitize all user inputs
- Use HTTPS only
- Implement rate limiting on forms
- Secure token storage and handling

**Testing Strategy:**
- Unit tests with Jest + React Testing Library
- Integration tests for API connections
- E2E tests with Playwright
- Visual regression testing

**Immediate Priorities:**
1. Set up Next.js 15 project with TypeScript
2. Install and configure Shadcn/UI + Tailwind
3. Create authentication flow
4. Build dashboard layout
5. Implement API client with existing endpoints
6. Add responsive design and animations

**Success Criteria:**
- Modern, professional interface that showcases the platform's capabilities
- Seamless integration with existing backend APIs
- Mobile-responsive design that works on all devices
- Fast, performant application with excellent UX
- Maintainable, well-structured codebase

Focus on creating a polished, production-ready frontend that elevates the existing robust backend architecture while providing an exceptional user experience.
```

## Additional Context

### Existing Backend APIs
The current backend has these established endpoints that should be used:

#### Authentication Endpoints
- `POST /auth/login` - User login with email/password
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user profile

#### Chat Endpoints
- `GET /chat/conversations` - List user conversations
- `POST /chat/conversations` - Create new conversation
- `GET /chat/conversations/{id}/messages` - Get conversation messages
- `POST /chat/conversations/{id}/messages` - Send message (streaming response)

#### Jobs Endpoints
- `GET /jobs` - List backup jobs
- `POST /jobs` - Create new backup job
- `GET /jobs/{id}` - Get job details
- `PUT /jobs/{id}` - Update job configuration
- `GET /jobs/{id}/runs` - Get job execution history

#### Analytics Endpoints
- `GET /analytics/dashboard` - Dashboard metrics
- `GET /analytics/usage` - Usage statistics
- `GET /analytics/reports` - Generate reports

#### Integration Endpoints
- `GET /integrations` - List available integrations
- `POST /integrations/oauth/{provider}` - OAuth flow initiation
- `GET /integrations/oauth/callback` - OAuth callback handler
- `DELETE /integrations/{id}` - Remove integration

### Design Inspiration
The frontend should feel like a modern SaaS platform similar to:
- **Vercel Dashboard**: Clean, modern, performance-focused
- **Linear**: Sleek interface with excellent animations
- **Stripe Dashboard**: Professional, data-heavy interface
- **Notion**: Intuitive navigation and contextual AI assistance

### AI Integration Strategy
Unlike the current v1 where chat is prominent, v2 should integrate AI contextually:
- **Smart suggestions** when creating backup jobs
- **Contextual help** throughout the interface
- **Data insights** in analytics sections
- **Predictive alerts** for backup issues
- **Chat assistant** accessible but not central feature 