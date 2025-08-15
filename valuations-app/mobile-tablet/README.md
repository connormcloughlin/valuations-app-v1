# Valuations Mobile Tablet App

A React Native/Expo application designed for property valuers to conduct risk assessments and property valuations in the field. The app provides offline capabilities, real-time synchronization, and a comprehensive survey system.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Expo CLI: `npm install -g @expo/cli`
- Platform-specific tools (Xcode for iOS, Android Studio for Android)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd valuations-app/mobile-tablet

# Install dependencies
npm install

# Set environment
export APP_ENV=development

# Start development server
npm start
```

### Platform Setup
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# Web
npx expo start --web
```

## 📚 Documentation

### Core Documentation
- **[Project Documentation](PROJECT_DOCUMENTATION.md)** - Comprehensive project overview, architecture, and development guidelines
- **[Development Setup](DEVELOPMENT_SETUP.md)** - Complete setup guide and development workflow
- **[Cursor Consistency Rules](CURSOR_CONSISTENCY_RULES.md)** - Code standards and consistency guidelines
- **[Migration Guide](MIGRATION_GUIDE.md)** - GlobalStyles migration and theme system

### Key Features
- **Offline-First Design**: Works without internet connectivity
- **Real-time Sync**: Synchronizes data when connection is restored
- **Dynamic UI**: Configurable survey forms and field types
- **Media Support**: Photo capture and handwriting recognition
- **Azure AD Integration**: Enterprise authentication
- **Cross-Platform**: iOS and Android support

## 🏗️ Architecture

### Technology Stack
- **React Native**: 0.79.3
- **Expo**: 53.0.11
- **TypeScript**: 5.8.3
- **React**: 19.0.0
- **Navigation**: Expo Router 5.1.0
- **Authentication**: react-native-msal 4.0.4
- **Storage**: @react-native-async-storage/async-storage 2.1.2
- **Database**: expo-sqlite 15.2.12

### Project Structure
```
valuations-app/mobile-tablet/
├── app/                          # Expo Router app directory
├── components/                   # Reusable UI components
├── services/                    # Business logic services
├── api/                         # API layer
├── utils/                       # Utility functions
├── types/                       # TypeScript type definitions
├── context/                     # React Context providers
├── constants/                   # App constants
├── assets/                      # Static assets
└── tests/                       # Test files
```

## 🛠️ Development

### Development Commands
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

### Code Standards
- **TypeScript**: Strict mode with proper type definitions
- **Styling**: Use GlobalStyles constants (see [Migration Guide](MIGRATION_GUIDE.md))
- **Components**: Follow component template from [Consistency Rules](CURSOR_CONSISTENCY_RULES.md)
- **Error Handling**: Comprehensive error handling with logging
- **Testing**: Unit, integration, and E2E tests

### Environment Configuration
Create environment files based on your development environment:
- `.env.development` - Development environment
- `.env.staging` - Staging environment  
- `.env.production` - Production environment

Set the environment variable:
```bash
export APP_ENV=development
```

## 🔧 Configuration

### App Configuration
The app uses `app.config.js` for Expo configuration with environment-specific settings:
- Azure AD authentication
- API endpoints
- Platform-specific settings
- Build configuration

### API Configuration
- Base URL configuration per environment
- Authentication token management
- Offline caching strategy
- Error handling and retry logic

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Individual components and functions
- **Integration Tests**: API integration and data flow
- **E2E Tests**: Complete user workflows
- **Performance Tests**: App performance and memory usage

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- ComponentName.test.tsx

# Run tests in watch mode
npm test -- --watch
```

## 🚀 Deployment

### Build Configuration
```bash
# Development build
eas build --profile development --platform all

# Production build
eas build --profile production --platform all
```

### Environment Management
- **Development**: Local development with hot reload
- **Staging**: Test builds for QA
- **Production**: Optimized builds for app stores

## 🔍 Troubleshooting

### Common Issues
- **Build Issues**: Clear cache with `npx expo start --clear`
- **Dependency Issues**: Clean install with `rm -rf node_modules && npm install`
- **Platform Issues**: Platform-specific troubleshooting in [Development Setup](DEVELOPMENT_SETUP.md)

### Debugging Tools
- **React Native Debugger**: Component debugging
- **Flipper**: Network and performance debugging
- **Expo Dev Tools**: Development debugging
- **Platform Tools**: Xcode (iOS), Android Studio (Android)

## 📖 Additional Resources

### Documentation
- **[Project Documentation](PROJECT_DOCUMENTATION.md)** - Complete project overview
- **[Development Setup](DEVELOPMENT_SETUP.md)** - Setup and workflow guide
- **[Cursor Consistency Rules](CURSOR_CONSISTENCY_RULES.md)** - Code standards
- **[Migration Guide](MIGRATION_GUIDE.md)** - Theme system migration

### External Resources
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

### Team Support
- **Code Reviews**: Submit pull requests for review
- **Architecture Questions**: Contact the development team
- **Bug Reports**: Create issues in the repository

## 🤝 Contributing

1. Follow the [Cursor Consistency Rules](CURSOR_CONSISTENCY_RULES.md)
2. Use the development workflow from [Development Setup](DEVELOPMENT_SETUP.md)
3. Write tests for new functionality
4. Update documentation as needed
5. Submit pull requests for review

## 📄 License

This project is proprietary software. All rights reserved.

---

## Quick Reference

### Environment Variables
```bash
export APP_ENV=development  # development, staging, production
```

### Common Commands
```bash
npm start                    # Start development server
npm run android             # Run on Android
npm run ios                 # Run on iOS
npm test                    # Run tests
npm run lint               # Lint code
npm run type-check         # Type checking
```

### File Locations
- **Components**: `components/`
- **Screens**: `app/`
- **Services**: `services/`
- **API**: `api/`
- **Types**: `types/`
- **Utils**: `utils/`
- **Styles**: `app/GlobalStyles.ts`

For detailed information, refer to the [Project Documentation](PROJECT_DOCUMENTATION.md) and [Development Setup](DEVELOPMENT_SETUP.md) guides.
