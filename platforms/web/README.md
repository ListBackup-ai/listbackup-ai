# ListBackup.ai v2

A modern AI-powered data backup and integration platform built with Next.js and AWS.

## 🟢 Status: FULLY FUNCTIONAL

The application is now complete and fully operational with frontend and backend integration.

## Quick Start

```bash
# Start the development server
npm run dev

# Access the application
open http://localhost:3002
```

## Features

✅ **User Authentication** - Registration, login, JWT tokens  
✅ **Dashboard** - Real-time system overview with charts  
✅ **Sources Management** - Connect and manage data sources  
✅ **Jobs Management** - Schedule and monitor backup jobs  
✅ **Data Browser** - Search and download backed up files  
✅ **Activity Monitor** - Real-time system activity tracking  
✅ **Responsive UI** - Modern design with animations

## Architecture

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Backend**: AWS Lambda + API Gateway + DynamoDB
- **Authentication**: AWS Cognito + JWT
- **UI**: Tailwind CSS + shadcn/ui + Recharts
- **State**: Zustand + React Query

## Development

### Environment Setup
```bash
npm install
npm run dev
```

### Environment Variables
```bash
NEXT_PUBLIC_AUTH_API_URL=https://khed5wtd5l.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_API_URL=https://ylbldgn2k1.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_API_STAGE=dev
```

### Backend Deployment
```bash
cd backend/nodejs
serverless deploy --config serverless-api.yml --stage dev
serverless deploy --config serverless-auth.yml --stage dev
```

## Pages

- **Home**: `/` - Landing page
- **Auth**: `/login`, `/signup` - Authentication
- **Dashboard**: `/dashboard` - Main overview
- **Sources**: `/dashboard/sources` - Data source management
- **Jobs**: `/dashboard/jobs` - Backup job management
- **Browse**: `/dashboard/browse` - File browser and search
- **Monitor**: `/dashboard/monitor` - Activity monitoring

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh

### Core Features
- `GET /sources` - List data sources
- `GET /jobs` - List backup jobs
- `GET /data/files` - List files
- `GET /activity` - Get activity
- `GET /account/usage` - Usage statistics

## Documentation

- `DEVELOPMENT_LOG.md` - Detailed development history
- `PROJECT-STRUCTURE.md` - Architecture overview
- Backend docs in `/backend/nodejs/`

---

**Last Updated**: June 8, 2025  
**Status**: Production ready for main environment