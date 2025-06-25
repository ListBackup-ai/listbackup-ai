# Multi-Platform Architecture TODO List

## 🎯 High Priority Tasks

### 1. Restructure Web Platform
- [ ] Move `/listbackup-ai-v2/*` to `/platforms/web/`
- [ ] Update all import paths to use shared code
- [ ] Remove duplicate types and use `/shared/types`
- [ ] Integrate shared API client instead of local one

### 2. Update Shared API Client
- [ ] Add React Native/Expo support with SecureStore
- [ ] Add proper TypeScript types from shared types
- [ ] Implement refresh token logic
- [ ] Add platform-specific error handling

### 3. Complete Mobile Authentication
- [ ] Update mobile app to use shared API client
- [ ] Fix authentication flow to match v2 backend
- [ ] Implement proper JWT token handling
- [ ] Add biometric authentication persistence

## 📱 Platform-Specific Tasks

### iOS Platform (Swift) - PRIMARY MOBILE FOCUS 🎯
- [ ] Create API bridge to use shared client
- [ ] Implement core SwiftUI views:
  - [ ] Login/Registration screens
  - [ ] Dashboard with stats
  - [ ] Integration list and management
  - [ ] Data browsing interface
  - [ ] Settings and profile
- [ ] Add Face ID/Touch ID authentication
- [ ] Implement Core Data for offline storage
- [ ] Add push notifications (APNS)
- [ ] iOS-specific features:
  - [ ] Widgets for backup status
  - [ ] Siri shortcuts
  - [ ] Share extensions
  - [ ] Background refresh
- [ ] App Store assets and metadata

### Web Platform (Next.js)
- [ ] Migrate to `/platforms/web/`
- [ ] Update environment variables for multi-platform
- [ ] Implement WebSocket for real-time updates
- [ ] Add PWA capabilities

### Mobile Platform (Expo) - SECONDARY
- [ ] Put on hold until iOS native is complete
- [ ] Consider as rapid prototyping platform
- [ ] May use for Android if native Android delayed

### Android Platform (Kotlin) - FUTURE
- [ ] Delayed until iOS is production-ready
- [ ] Will follow iOS patterns and learnings

## 🔧 Infrastructure Tasks

### Backend Integration
- [ ] Test v2 backend with all platforms
- [ ] Implement WebSocket support for real-time updates
- [ ] Add push notification service (FCM/APNS)
- [ ] Create platform-specific API endpoints if needed

### Shared Code Enhancement
- [ ] Move more business logic to `/shared/utils`
- [ ] Create shared validation schemas
- [ ] Add shared error handling utilities
- [ ] Create platform-agnostic data models

### Development Tools
- [ ] Create unified build script for all platforms
- [ ] Set up GitHub Actions for CI/CD
- [ ] Create platform-specific environment configs
- [ ] Add automated testing for shared code

## 📊 Architecture Improvements

### Data Flow
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web (Next.js) │     │  Mobile (Expo)  │     │  iOS (Swift)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
         └───────────┬───────────┴─────────────┬──────────┘
                     │                         │
              ┌──────▼──────────────────┬──────▼─────┐
              │    Shared API Client    │            │
              │    Shared Types         │  Platform  │
              │    Shared Utils         │  Bridges   │
              └─────────┬───────────────┴────────────┘
                        │
                 ┌──────▼──────┐
                 │ API Gateway │
                 │   (JWT)     │
                 └──────┬──────┘
                        │
         ┌──────────────┴──────────────┐
         │    12 Backend Services      │
         │  (Serverless Functions)     │
         └─────────────────────────────┘
```

### Authentication Flow
1. All platforms use Cognito JWT tokens
2. Tokens stored in platform-specific secure storage
3. Shared refresh token logic
4. Biometric authentication as secondary factor

### Real-time Updates
1. EventBridge → API Gateway WebSocket
2. Platform-specific push notifications
3. Background sync for mobile platforms
4. Optimistic UI updates

## 🚀 Deployment Strategy - iOS First

### Phase 1: Foundation (Week 1)
- Restructure directories
- Update shared code
- Test v2 backend
- Prepare iOS development environment

### Phase 2: iOS Core Development (Week 2-3)
- Implement authentication with shared API
- Build core UI screens in SwiftUI
- Add Face ID/Touch ID support
- Implement offline storage with Core Data

### Phase 3: iOS Features (Week 4-5)
- Push notifications (APNS)
- Background sync
- Data visualization
- File downloads and sharing

### Phase 4: iOS Polish & Web Migration (Week 6)
- iOS widgets and extensions
- App Store preparation
- Migrate web to new structure
- Update web imports

### Phase 5: Testing & Launch (Week 7-8)
- iOS TestFlight beta
- Web platform deployment
- End-to-end testing
- Performance optimization

### Phase 6: Android Planning (Week 9+)
- Evaluate Expo vs Native Kotlin
- Begin Android development
- Apply iOS learnings

## 📝 Notes

### API Endpoints
- Dev: https://knitting-par-frankfurt-adjust.trycloudflare.com
- Prod: https://api.listbackup.ai

### Key Decisions
- Use shared API client for consistency
- Platform-specific UI, shared business logic
- Offline-first approach for mobile
- Real-time sync where possible

### Testing Strategy
- Unit tests for shared code
- Integration tests for API
- Platform-specific UI tests
- End-to-end user flow tests