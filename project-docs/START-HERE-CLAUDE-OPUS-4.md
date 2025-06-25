# 🚀 START HERE - Claude Code Opus 4 Project Guide

## Welcome to ListBackup.ai v2 Development

You are Claude Code Opus 4, and you're about to work on **ListBackup.ai v2** - a sophisticated AI-powered data backup and integration platform. This is a **frontend modernization project** where we're creating a cutting-edge React 19 application that connects to an existing production-ready backend.

## 📁 Essential Documentation

### **MUST READ FIRST:**
1. **[Project Context](./development/project-context.md)** - Complete project overview, current architecture, and development strategy
2. **[DynamoDB Architecture](./development/dynamodb-architecture.md)** - Database structure and patterns used throughout the system
3. **[Claude 4 Opus Frontend Prompt](./prompts/claude-4-opus-frontend-prompt.md)** - Your comprehensive development instructions

## 🎯 Project Mission

**What You're Building:**
A modern, React 19-based frontend using **Shadcn/UI + Tailwind CSS** that connects to an existing sophisticated AWS Lambda + DynamoDB backend.

**Key Insight:** 
The current v1 frontend is already **enterprise-grade and feature-complete**. Your job is to **modernize and enhance**, not rebuild from scratch.

## 🔗 Quick Context Links

### Current Architecture (DO NOT MODIFY)
- **Backend**: `../listbackup.ai/project/backend/` - AWS Lambda + Serverless Framework + DynamoDB
- **Frontend v1**: `../listbackup.ai/project/frontend/typescript-app/` - React 18 + MUI (production-ready)
- **Your Workspace**: `/Users/nickkulavic/Projects/listbackup-ai-v2/` - Your v2 development area

### Tech Stack You're Using
```json
{
  "framework": "Next.js 15 + React 19",
  "ui": "Shadcn/UI + Tailwind CSS",
  "state": "TanStack Query v5 + Zustand",
  "validation": "React Hook Form + Zod",
  "animation": "Framer Motion",
  "charts": "Recharts",
  "backend": "Existing AWS APIs (DO NOT CHANGE)"
}
```

## 🚨 Critical Guidelines

### ✅ DO THIS:
- **Use the comprehensive prompt** in `docs/prompts/claude-4-opus-frontend-prompt.md`
- **Connect to existing APIs** - all endpoints are documented and working
- **Focus on UX modernization** - make it beautiful and performant
- **Implement mobile-first design** - responsive across all devices
- **Use DynamoDB-first approach** - existing data architecture is solid

### ❌ DON'T DO THIS:
- **Don't modify backend APIs** - they're production-ready and stable
- **Don't rebuild everything** - the v1 architecture is sophisticated
- **Don't make chat the primary feature** - it should be contextual AI assistant
- **Don't use PostgreSQL** - the system is 100% DynamoDB-based

## 🎪 AI Strategy

**Google-First Approach:**
- **Gemini 2.0 Flash** for AI features (existing integration)
- **@google/generative-ai** already implemented in backend
- **Free tier optimization** - leveraging Google's generous limits
- **Contextual AI assistant** throughout the interface

## 📊 Success Metrics

Your v2 frontend should achieve:
- **Modern, professional design** that elevates the platform
- **Mobile-responsive** across all screen sizes
- **Fast performance** (Lighthouse score > 90)
- **Seamless API integration** with existing backend
- **Enhanced user experience** while maintaining all v1 functionality

## 🚀 Getting Started

1. **Read the full prompt**: `docs/prompts/claude-4-opus-frontend-prompt.md`
2. **Set up Next.js 15 project** with TypeScript configuration
3. **Install Shadcn/UI + Tailwind** for modern component library
4. **Create authentication flow** connecting to existing `/auth/` endpoints
5. **Build dashboard layout** with data visualization
6. **Implement responsive design** with mobile-first approach

## 🔧 Development Environment

- **Working Directory**: `/Users/nickkulavic/Projects/listbackup-ai-v2/`
- **Node.js**: Latest LTS version
- **Package Manager**: npm or yarn (your choice)
- **Development Server**: Next.js dev server
- **Backend APIs**: Existing AWS Lambda endpoints (see prompt for full list)

## 💡 Key Features to Implement

1. **Authentication System** - JWT-based with existing backend
2. **Dashboard Interface** - Modern cards with data visualization
3. **Data Management** - Backup job creation and monitoring
4. **AI Assistant Integration** - Contextual help throughout app
5. **Settings & Configuration** - Account, billing, integrations

## 📱 Design Inspiration

Create a modern SaaS platform that feels like:
- **Vercel Dashboard**: Clean, performance-focused
- **Linear**: Sleek with excellent animations  
- **Stripe Dashboard**: Professional, data-heavy
- **Notion**: Intuitive with contextual AI

## 🎯 Your Next Action

**Start by reading the full prompt** in `docs/prompts/claude-4-opus-frontend-prompt.md` - it contains everything you need to build an exceptional v2 frontend that showcases the platform's capabilities while leveraging the robust existing backend architecture.

You have the knowledge, the tools, and the context. **Let's build something amazing!** 🚀 