# ListBackup.ai Mobile App (Expo)

## Overview
This is the mobile application for ListBackup.ai built with Expo and React Native. It provides a native mobile experience for iOS and Android platforms.

## Tech Stack
- **Expo SDK 50+** - Development platform and build service
- **React Native** - Cross-platform mobile framework
- **TypeScript** - Type safety and better developer experience
- **Expo Router** - File-based navigation
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **Expo SecureStore** - Secure storage for tokens
- **Expo Notifications** - Push notifications
- **Expo Biometrics** - Biometric authentication
- **React Hook Form** - Form handling
- **React Native Reanimated** - Animations

## Features

### Core Features
- ✅ User authentication (login/register)
- ✅ Biometric authentication (Face ID, Touch ID, Fingerprint)
- ✅ Integration management
- ✅ Backup monitoring and status
- ✅ Data browsing and search
- ✅ Push notifications
- ✅ Offline support
- ✅ Dark/light theme support

### Mobile-Specific Features
- 📱 Native navigation patterns
- 🔔 Push notifications for backup status
- 🔒 Biometric authentication
- 📱 Haptic feedback
- 🌐 Network status monitoring
- 📊 Charts and data visualization
- 📁 File download and sharing
- 🔄 Pull-to-refresh functionality

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation
```bash
cd platforms/mobile
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on device (scan QR code)
npm start
```

### EAS Build Setup
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS Build
eas build:configure

# Build for development
eas build --profile development --platform all

# Build for production
eas build --profile production --platform all
```

## Project Structure

```
mobile/
├── app/                          # Expo Router pages
│   ├── (auth)/                  # Authentication routes
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/                  # Main app tabs
│   │   ├── dashboard/
│   │   ├── integrations/
│   │   ├── data/
│   │   ├── settings/
│   │   └── _layout.tsx
│   ├── _layout.tsx              # Root layout
│   └── +not-found.tsx           # 404 page
├── components/                   # Reusable components
│   ├── ui/                      # UI components
│   ├── forms/                   # Form components
│   ├── charts/                  # Chart components
│   └── navigation/              # Navigation components
├── hooks/                       # Custom hooks
├── services/                    # API services
├── stores/                      # Zustand stores
├── utils/                       # Utility functions
├── constants/                   # App constants
├── assets/                      # Images, fonts, etc.
├── app.json                     # Expo configuration
├── eas.json                     # EAS Build configuration
├── metro.config.js              # Metro bundler config
├── babel.config.js              # Babel configuration
└── package.json
```

## Navigation Structure

The app uses Expo Router with a tab-based navigation:

### Main Tabs
- 🏠 **Dashboard** - Overview of backups and activity
- 🔌 **Integrations** - Manage connected platforms
- 📊 **Data** - Browse and search backed up data
- ⚙️ **Settings** - Account and app settings

### Modal Screens
- Authentication screens
- Integration setup
- Data export
- Profile management

## State Management

### Zustand Stores
- `authStore` - Authentication state
- `integrationsStore` - Integration management
- `dataStore` - Data browsing and search
- `settingsStore` - App preferences
- `notificationsStore` - Notification management

## Security Features

### Authentication
- Email/password login
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- Secure token storage with Expo SecureStore
- Automatic token refresh

### Data Protection
- API requests over HTTPS only
- Certificate pinning for API calls
- Sensitive data encrypted in storage
- Screen recording prevention for sensitive screens

## Push Notifications

### Notification Types
- Backup completion notifications
- Backup failure alerts
- System maintenance notifications
- Security alerts

### Implementation
- Expo Notifications for cross-platform support
- Background notification handling
- Custom notification sounds
- Action buttons for quick responses

## Offline Support

### Cached Data
- Recent backup status
- Integration list
- User profile information
- App settings

### Sync Strategy
- Background sync when app becomes active
- Queue failed requests for retry
- Show offline indicators
- Smart data freshness management

## Performance Optimizations

### Rendering
- FlatList for large data sets
- Image optimization with Expo Image
- Lazy loading of screens
- Memoization of expensive calculations

### Bundle Size
- Tree shaking unused code
- Dynamic imports for large screens
- Optimized asset sizes
- Code splitting by feature

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Device Testing
- Test on multiple screen sizes
- Test offline functionality
- Test push notifications
- Test biometric authentication

## Deployment

### Development Builds
```bash
eas build --profile development
```

### Production Builds
```bash
eas build --profile production
```

### App Store Submission
```bash
eas submit --platform ios
eas submit --platform android
```

## Environment Variables

Create `.env` file:
```
EXPO_PUBLIC_API_URL=https://api.listbackup.ai
EXPO_PUBLIC_WEB_URL=https://listbackup.ai
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## Troubleshooting

### Common Issues
1. **Metro bundler issues** - Clear cache with `npx expo start --clear`
2. **iOS build failures** - Update Xcode and clean derived data
3. **Android build failures** - Check Java/Gradle versions
4. **Push notification issues** - Verify certificates and provisioning profiles

### Debug Tools
- Expo Dev Tools
- React Native Debugger
- Flipper integration
- Sentry error tracking