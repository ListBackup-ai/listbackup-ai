# ListBackup.ai v2 Project Context

## Project Overview
ListBackup.ai is a sophisticated AI-powered data backup and integration platform. This is a **pre-launch modernization project** where we're creating v2 alongside the existing production-ready v1 system.

## Current Architecture Analysis

### Existing Frontend (Sophisticated)
The current frontend at `../listbackup.ai/project/frontend/typescript-app/` is **already enterprise-grade**:
- React 18 + TypeScript + Vite + Material-UI (MUI)
- Professional dashboard layout with drawer navigation, breadcrumbs
- Advanced data visualization components (DataLake.tsx with search, filters, preview)
- Sophisticated authentication with route guards and JWT
- Real-time chat integration with streaming responses
- Complex job management and backup workflow systems
- Well-organized component structure with lazy loading

### Existing Backend (Production-Ready)
The current backend at `../listbackup.ai/project/backend/` is **robust and feature-complete**:
- AWS Lambda + Serverless Framework with multiple services
- JWT authentication with AWS Cognito integration
- Google AI (Gemini 2.0 Flash) integration for chat streaming
- **DynamoDB for all data storage** (conversations, messages, jobs, users, analytics)
- OAuth integration flows for multiple platforms
- Complex job management system for data backups
- File handling and data export capabilities via S3

## Key Technical Decisions

### AI Strategy
- **Google-first approach**: Leveraging Gemini 2.0 Flash for free tier optimization
- **Multi-model support**: Gemini 2.0 Flash, Flash Lite, Pro Vision
- **Existing integration**: `@google/generative-ai` already implemented
- **Chat integration**: Currently advanced streaming chat with MCP server

### Development Strategy
- **Frontend-first approach**: Build modern UI that connects to existing APIs
- **Incremental enhancement**: Don't rebuild - improve what exists
- **AWS-native deployment**: 100% AWS infrastructure preference
- **GitHub migration**: Moving from Bitbucket for Claude Code integration

### Tech Stack Preferences
- **Frontend**: React 19 + Next.js 15 + Shadcn/UI + Tailwind CSS
- **State Management**: TanStack Query v5 + Zustand
- **Backend**: Keep existing Node.js/TypeScript APIs, add Python for AI services
- **Database**: **DynamoDB-first approach** + ElastiCache Redis for caching
- **Storage**: S3 for files, backups, and static assets
- **Deployment**: AWS Amplify (frontend), Lambda (backend)

## Important Context for Development

### What NOT to do
- **Don't rebuild from scratch** - the current architecture is sophisticated and production-ready
- **Don't replace MUI entirely** - it's well-implemented and enterprise-grade
- **Don't change core backend APIs** - they're stable and feature-complete
- **Don't focus on chat as primary feature** - it should be contextual AI assistant

### What TO focus on
- **Visual modernization** of existing components
- **Enhanced mobile responsiveness**
- **Better data visualization** and analytics
- **Improved user onboarding** experience
- **Contextual AI integration** throughout the platform

### Current Pain Points
- **Chat prominence**: Currently too central, should be contextual assistant
- **Mobile experience**: Could be enhanced for better responsiveness
- **Visual design**: Could benefit from modern refresh while keeping functionality
- **Repository**: Still on Bitbucket, needs GitHub migration for Claude Code

## Development Recommendations

### Immediate Priorities
1. **Repository setup**: GitHub migration for Claude Code integration
2. **Visual refresh**: Modernize existing MUI components with contemporary design
3. **Mobile optimization**: Enhance responsive design
4. **AI integration**: Make chat more contextual, less central

### Long-term Vision
- **Hybrid UI approach**: Shadcn/UI components alongside existing MUI
- **Enhanced analytics**: Better data visualization and insights
- **Improved workflows**: Streamlined backup job creation and management
- **Advanced integrations**: More OAuth providers and data sources

## File References
- Current frontend: `../listbackup.ai/project/frontend/typescript-app/`
- Current backend: `../listbackup.ai/project/backend/`
- V2 development: This directory (`/Users/nickkulavic/Projects/listbackup-ai-v2/`)

## Success Criteria
- Maintain all existing functionality while improving UX
- Leverage existing robust backend architecture
- Create modern, mobile-responsive interface
- Position AI as helpful assistant, not primary feature
- Enable smooth migration path from v1 to v2 