# Development Setup Guide - Valuations Mobile Tablet App

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Project Setup](#project-setup)
4. [Development Workflow](#development-workflow)
5. [Common Development Tasks](#common-development-tasks)
6. [Debugging](#debugging)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **Git**: Latest version
- **Expo CLI**: `npm install -g @expo/cli`

### Platform-Specific Requirements

#### iOS Development
- **macOS**: Required for iOS development
- **Xcode**: Latest version from App Store
- **iOS Simulator**: Included with Xcode
- **CocoaPods**: `sudo gem install cocoapods`

#### Android Development
- **Android Studio**: Latest version
- **Android SDK**: API level 33 or higher
- **Android Emulator**: Set up through Android Studio
- **Java Development Kit (JDK)**: Version 11 or higher

### Recommended Tools
- **VS Code**: Primary code editor
- **React Native Debugger**: For debugging
- **Flipper**: For network and performance debugging
- **Postman**: For API testing

## Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd valuations-app/mobile-tablet
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create environment files based on your development environment:

#### Development Environment
```bash
# .env.development
API_BASE_URL=http://localhost:3000
AZURE_MOBILE_CLIENT_ID=your-dev-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_API_CLIENT_ID=your-api-client-id
AZURE_REDIRECT_URI=exp://localhost:8081
API_TIMEOUT=30000
```

#### Staging Environment
```bash
# .env.staging
API_BASE_URL=https://staging-api.example.com
AZURE_MOBILE_CLIENT_ID=your-staging-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_API_CLIENT_ID=your-api-client-id
AZURE_REDIRECT_URI=exp://staging.example.com
API_TIMEOUT=30000
```

#### Production Environment
```bash
# .env.production
API_BASE_URL=https://api.example.com
AZURE_MOBILE_CLIENT_ID=your-prod-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_API_CLIENT_ID=your-api-client-id
AZURE_REDIRECT_URI=exp://production.example.com
API_TIMEOUT=30000
```

### 4. Set Environment Variable
```bash
# For development
export APP_ENV=development

# For staging
export APP_ENV=staging

# For production
export APP_ENV=production
```

## Project Setup

### 1. Initialize Expo Project
```bash
# Start the development server
npm start

# Or use Expo CLI
npx expo start
```

### 2. Platform Setup

#### iOS Setup
```bash
# Install iOS dependencies
npx expo run:ios

# Or open in iOS Simulator
npx expo start --ios
```

#### Android Setup
```bash
# Install Android dependencies
npx expo run:android

# Or open in Android Emulator
npx expo start --android
```

### 3. Development Build
```bash
# Create development build
eas build --profile development --platform all

# Or platform-specific
eas build --profile development --platform ios
eas build --profile development --platform android
```

## Development Workflow

### 1. Starting Development
```bash
# Start development server
npm start

# Clear cache if needed
npx expo start --clear

# Start with specific environment
APP_ENV=development npm start
```

### 2. Code Organization
Follow the established project structure:
- **Components**: Place in `components/` directory
- **Screens**: Place in `app/` directory
- **Services**: Place in `services/` directory
- **Utilities**: Place in `utils/` directory
- **Types**: Place in `types/` directory

### 3. Development Commands
```bash
# Start development server
npm start

# Run on specific platform
npm run android
npm run ios

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### 4. Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
# Merge after review
```

## Common Development Tasks

### 1. Creating a New Component
```bash
# Create component file
touch components/YourComponent.tsx

# Use the component template from CURSOR_CONSISTENCY_RULES.md
```

### 2. Creating a New Screen
```bash
# Create screen file in app directory
touch app/your-screen.tsx

# Add to navigation if needed
```

### 3. Adding New API Endpoints
```bash
# Add to api/index.ts
# Create specific API file if needed
touch api/yourApi.ts
```

### 4. Adding New Types
```bash
# Add to existing type files or create new
touch types/yourTypes.ts
```

### 5. Database Changes
```bash
# Update schema in utils/db.ts
# Run migration if needed
```

### 6. Styling Changes
```bash
# Use GlobalStyles constants
# Add new styles to GlobalStyles.ts if needed
```

## Debugging

### 1. React Native Debugger
```bash
# Install React Native Debugger
# Open React Native Debugger
# Enable debugging in app
```

### 2. Console Logging
```typescript
import { logger } from '../utils/logger';

// Use structured logging
logger.info('User action', { action: 'button_press', screen: 'home' });
logger.error('API error', { error: error.message, endpoint: '/api/data' });
logger.debug('Component state', { state: componentState });
```

### 3. Network Debugging
```bash
# Use Flipper for network debugging
# Monitor API calls and responses
# Check offline/online behavior
```

### 4. Performance Debugging
```bash
# Use React DevTools Profiler
# Monitor component re-renders
# Check memory usage
```

### 5. Platform-Specific Debugging

#### iOS Debugging
```bash
# Use Xcode for iOS debugging
# Check console logs in Xcode
# Use iOS Simulator debugging tools
```

#### Android Debugging
```bash
# Use Android Studio for Android debugging
# Check logcat for logs
# Use Android Emulator debugging tools
```

## Testing

### 1. Unit Testing
```bash
# Run unit tests
npm test

# Run specific test file
npm test -- ComponentName.test.tsx

# Run tests in watch mode
npm test -- --watch
```

### 2. Integration Testing
```bash
# Run integration tests
npm run test:integration

# Test API integration
npm run test:api
```

### 3. E2E Testing
```bash
# Run E2E tests
npm run test:e2e

# Test complete user workflows
```

### 4. Performance Testing
```bash
# Run performance tests
npm run test:performance

# Check bundle size
npm run analyze
```

## Troubleshooting

### Common Issues

#### Build Issues
```bash
# Clear all caches
npx expo start --clear
rm -rf node_modules
npm install

# Reset Metro cache
npx expo start --reset-cache
```

#### Dependency Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Update dependencies
npm update
```

#### Platform-Specific Issues

##### iOS Issues
```bash
# Clean iOS build
cd ios
rm -rf build
pod install
cd ..

# Reset iOS Simulator
xcrun simctl erase all
```

##### Android Issues
```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Reset Android Emulator
# Wipe data in Android Studio
```

#### Network Issues
```bash
# Check API endpoints
# Verify environment variables
# Test network connectivity
```

#### Authentication Issues
```bash
# Check Azure AD configuration
# Verify client IDs and redirect URIs
# Test authentication flow
```

### Performance Issues

#### Memory Leaks
```bash
# Check for unmounted component subscriptions
# Monitor memory usage
# Use React DevTools Profiler
```

#### Slow Performance
```bash
# Optimize component re-renders
# Check bundle size
# Monitor API response times
```

### Debugging Tools

#### Development Tools
- **Expo DevTools**: Built-in debugging tools
- **React Native Debugger**: Component debugging
- **Flipper**: Network and performance debugging
- **React DevTools**: Component inspection

#### Platform Tools
- **Xcode**: iOS debugging and profiling
- **Android Studio**: Android debugging and profiling
- **Chrome DevTools**: Web debugging

### Getting Help

#### Documentation
- **Project Documentation**: `PROJECT_DOCUMENTATION.md`
- **Consistency Rules**: `CURSOR_CONSISTENCY_RULES.md`
- **Migration Guide**: `MIGRATION_GUIDE.md`

#### Resources
- **Expo Documentation**: https://docs.expo.dev/
- **React Native Documentation**: https://reactnative.dev/
- **TypeScript Documentation**: https://www.typescriptlang.org/

#### Team Support
- **Code Reviews**: Submit pull requests for review
- **Architecture Questions**: Contact the development team
- **Bug Reports**: Create issues in the repository

---

## Quick Reference

### Environment Variables
```bash
# Set environment
export APP_ENV=development

# Start with environment
APP_ENV=development npm start
```

### Common Commands
```bash
# Development
npm start                    # Start development server
npm run android             # Run on Android
npm run ios                 # Run on iOS

# Testing
npm test                    # Run tests
npm run lint               # Lint code
npm run type-check         # Type checking

# Building
eas build --profile development --platform all
```

### File Locations
- **Components**: `components/`
- **Screens**: `app/`
- **Services**: `services/`
- **API**: `api/`
- **Types**: `types/`
- **Utils**: `utils/`
- **Styles**: `app/GlobalStyles.ts`

### Development Tips
1. **Use TypeScript**: Always use proper types
2. **Follow Consistency Rules**: Refer to `CURSOR_CONSISTENCY_RULES.md`
3. **Test Regularly**: Run tests frequently
4. **Monitor Performance**: Check for performance issues
5. **Document Changes**: Update documentation as needed

This setup guide should help you get started with development on the Valuations Mobile Tablet App. For additional questions or issues, refer to the troubleshooting section or contact the development team.
