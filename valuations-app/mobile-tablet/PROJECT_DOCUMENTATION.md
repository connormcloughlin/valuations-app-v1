# Valuations Mobile Tablet App - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Technology Stack](#technology-stack)
5. [Development Guidelines](#development-guidelines)
6. [Code Conventions](#code-conventions)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Offline Support](#offline-support)
10. [Testing Strategy](#testing-strategy)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

## Project Overview

The Valuations Mobile Tablet App is a React Native/Expo application designed for property valuers to conduct risk assessments and property valuations in the field. The app provides offline capabilities, real-time synchronization, and a comprehensive survey system.

### Key Features
- **Offline-First Design**: Works without internet connectivity
- **Real-time Sync**: Synchronizes data when connection is restored
- **Dynamic UI**: Configurable survey forms and field types
- **Media Support**: Photo capture and handwriting recognition
- **Azure AD Integration**: Enterprise authentication
- **Cross-Platform**: iOS and Android support

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer      │    │  Business Logic │    │   Data Layer    │
│   (Components)  │◄──►│   (Services)    │◄──►│   (API/Storage) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Navigation    │    │   State Mgmt    │    │   Offline Cache │
│   (Expo Router) │    │   (Context)     │    │   (AsyncStorage)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Design Patterns
- **Component-Based Architecture**: Reusable UI components
- **Service Layer Pattern**: Business logic separation
- **Repository Pattern**: Data access abstraction
- **Observer Pattern**: State management with Context API
- **Strategy Pattern**: Dynamic field rendering

## Project Structure

```
valuations-app/mobile-tablet/
├── app/                          # Expo Router app directory
│   ├── _layout.tsx              # Root layout
│   ├── (tabs)/                  # Tab-based navigation
│   │   ├── _layout.tsx          # Tab layout
│   │   ├── index.tsx            # Dashboard
│   │   ├── appointments/        # Appointment screens
│   │   ├── valuations.tsx       # Valuations screen
│   │   ├── explore.tsx          # Explore screen
│   │   └── profile.tsx          # Profile screen
│   ├── survey/                  # Survey functionality
│   │   ├── [id].tsx            # Dynamic survey routes
│   │   ├── items/              # Survey items
│   │   └── summary/            # Survey summaries
│   ├── auth.tsx                # Authentication
│   ├── login.tsx               # Login screen
│   ├── sync.tsx                # Sync management
│   └── GlobalStyles.ts         # Global styling system
├── components/                  # Reusable UI components
│   ├── layout/                 # Layout components
│   ├── dashboard/              # Dashboard components
│   ├── sync/                   # Sync components
│   └── ui/                     # UI primitives
├── services/                   # Business logic services
│   ├── azureAdService.ts       # Azure AD authentication
│   ├── configurationService.ts # App configuration
│   ├── mediaService.ts         # Media handling
│   ├── prefetchService.ts      # Data prefetching
│   ├── riskAssessmentSyncService.ts # Risk assessment sync
│   ├── storageService.js       # Local storage
│   ├── syncService.js          # Data synchronization
│   ├── validationService.ts    # Form validation
│   └── networkService.js       # Network utilities
├── api/                        # API layer
│   ├── index.ts               # Main API client
│   ├── client.js              # HTTP client
│   ├── auth.js                # Authentication API
│   ├── appointments.js        # Appointments API
│   ├── riskTemplates.js       # Risk templates API
│   ├── surveys.js             # Surveys API
│   └── offline.js             # Offline utilities
├── utils/                      # Utility functions
│   ├── db.ts                  # Database utilities
│   ├── logger.ts              # Logging utilities
│   ├── connectionUtils.ts     # Network connectivity
│   ├── asyncStorageManager.ts # AsyncStorage wrapper
│   ├── apiRequestManager.ts   # API request management
│   └── i18n.ts               # Internationalization
├── types/                      # TypeScript type definitions
│   ├── api.ts                # API types
│   └── dynamicUI.ts          # Dynamic UI types
├── constants/                  # App constants
│   ├── apiConfig.ts          # API configuration
│   └── Colors.ts             # Color definitions
├── context/                   # React Context providers
│   ├── AuthContext.tsx       # Authentication context
│   └── DashboardContext.tsx  # Dashboard context
├── hooks/                     # Custom React hooks
├── assets/                    # Static assets
├── config/                    # Configuration files
├── scripts/                   # Build and utility scripts
└── tests/                     # Test files
```

## Technology Stack

### Core Technologies
- **React Native**: 0.79.3
- **Expo**: 53.0.11
- **TypeScript**: 5.8.3
- **React**: 19.0.0

### Key Dependencies
- **Navigation**: Expo Router 5.1.0
- **Authentication**: react-native-msal 4.0.4
- **Storage**: @react-native-async-storage/async-storage 2.1.2
- **Network**: @react-native-community/netinfo 11.4.1
- **UI**: react-native-paper 5.9.1
- **Database**: expo-sqlite 15.2.12
- **Media**: expo-image-picker 16.1.4
- **HTTP**: axios 1.4.0

### Development Tools
- **Metro**: 0.82.0 (Bundler)
- **Babel**: 7.20.0 (Transpiler)
- **TypeScript**: 5.8.3 (Type checking)

## Development Guidelines

### Code Organization Principles
1. **Separation of Concerns**: UI, business logic, and data access are separated
2. **Single Responsibility**: Each component/service has one clear purpose
3. **DRY (Don't Repeat Yourself)**: Reuse code through components and utilities
4. **KISS (Keep It Simple, Stupid)**: Prefer simple solutions over complex ones

### File Naming Conventions
- **Components**: PascalCase (e.g., `SurveyHeader.tsx`)
- **Services**: camelCase (e.g., `azureAdService.ts`)
- **Utilities**: camelCase (e.g., `connectionUtils.ts`)
- **Types**: camelCase (e.g., `api.ts`)
- **Constants**: camelCase (e.g., `apiConfig.ts`)
- **Screens**: kebab-case for routes (e.g., `[id].tsx`)

### Import Organization
```typescript
// 1. React and React Native imports
import React from 'react';
import { View, Text } from 'react-native';

// 2. Third-party library imports
import { useRouter } from 'expo-router';

// 3. Local imports (alphabetical)
import { colors, spacing } from '../GlobalStyles';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api';

// 4. Type imports
import type { SurveyData } from '../types/api';
```

## Code Conventions

### TypeScript Guidelines
- **Strict Mode**: Always use strict TypeScript configuration
- **Type Definitions**: Define interfaces for all data structures
- **Generic Types**: Use generics for reusable components
- **Union Types**: Use union types for variant data
- **Optional Properties**: Use `?` for optional properties

### Component Guidelines
```typescript
// Component structure
interface ComponentProps {
  requiredProp: string;
  optionalProp?: number;
  onAction?: (data: any) => void;
}

export const Component: React.FC<ComponentProps> = ({
  requiredProp,
  optionalProp,
  onAction,
}) => {
  // 1. Hooks
  const [state, setState] = useState();
  
  // 2. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 3. Event handlers
  const handleAction = () => {
    // Handler logic
  };
  
  // 4. Render
  return (
    <View style={styles.container}>
      {/* Component content */}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    // Use GlobalStyles constants
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
});
```

### Error Handling
```typescript
// API error handling
try {
  const response = await apiClient.getData();
  if (response.success) {
    // Handle success
  } else {
    // Handle API error
    console.error('API Error:', response.message);
  }
} catch (error) {
  // Handle network/system error
  console.error('Network Error:', error);
}
```

### Logging Guidelines
```typescript
// Use structured logging
import { logger } from '../utils/logger';

logger.info('User action', { action: 'survey_start', surveyId });
logger.error('API error', { error: error.message, endpoint: '/api/surveys' });
logger.debug('Component state', { state: componentState });
```

## State Management

### Context API Usage
- **AuthContext**: Authentication state and user data
- **DashboardContext**: Dashboard-specific state
- **SyncContext**: Synchronization state and progress

### Local State Guidelines
- Use `useState` for component-specific state
- Use `useReducer` for complex state logic
- Use `useCallback` for memoized functions
- Use `useMemo` for expensive computations

### State Persistence
- **AsyncStorage**: For user preferences and cached data
- **SQLite**: For structured offline data
- **Context**: For session state

## API Integration

### API Client Structure
```typescript
// API client interface
interface ApiClient {
  // Authentication
  setAuthToken: (token: string) => void;
  login: (username: string, password: string) => Promise<ApiResponse<any>>;
  
  // Data operations
  getData: () => Promise<ApiResponse<T>>;
  postData: (data: T) => Promise<ApiResponse<T>>;
  updateData: (id: string, data: Partial<T>) => Promise<ApiResponse<T>>;
  deleteData: (id: string) => Promise<ApiResponse<void>>;
}
```

### Response Handling
```typescript
// Standard API response structure
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  status?: number;
  fromCache?: boolean;
  pagination?: PaginationInfo;
}
```

### Offline Support
- **Cache-First Strategy**: Serve cached data when offline
- **Background Sync**: Sync when connection is restored
- **Conflict Resolution**: Handle data conflicts gracefully
- **Progress Tracking**: Show sync progress to users

## Offline Support

### Offline Architecture
1. **Network Detection**: Monitor connectivity status
2. **Data Caching**: Cache API responses locally
3. **Offline Operations**: Queue operations for later sync
4. **Conflict Resolution**: Handle data conflicts on sync

### Caching Strategy
```typescript
// Cache structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  version: string;
}
```

### Sync Process
1. **Queue Operations**: Store offline operations
2. **Batch Processing**: Process operations in batches
3. **Conflict Detection**: Identify and resolve conflicts
4. **Progress Reporting**: Update UI with sync progress

## Testing Strategy

### Testing Levels
1. **Unit Tests**: Individual components and functions
2. **Integration Tests**: API integration and data flow
3. **E2E Tests**: Complete user workflows
4. **Performance Tests**: App performance and memory usage

### Test File Organization
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

### Testing Guidelines
- **Test Coverage**: Aim for 80%+ coverage
- **Mock External Dependencies**: Mock API calls and storage
- **Test Error Scenarios**: Test error handling and edge cases
- **Performance Testing**: Test memory usage and performance

## Deployment

### Build Configuration
- **Development**: Local development with hot reload
- **Staging**: Test builds for QA
- **Production**: Optimized builds for app stores

### Environment Management
```typescript
// Environment configuration
const environments = {
  development: {
    apiBaseUrl: 'http://localhost:3000',
    logLevel: 'debug',
  },
  staging: {
    apiBaseUrl: 'https://staging-api.example.com',
    logLevel: 'info',
  },
  production: {
    apiBaseUrl: 'https://api.example.com',
    logLevel: 'error',
  },
};
```

### Release Process
1. **Version Bumping**: Update version numbers
2. **Build Generation**: Create platform-specific builds
3. **Testing**: Run automated and manual tests
4. **Deployment**: Deploy to app stores

## Troubleshooting

### Common Issues

#### Build Issues
- **Metro Cache**: Clear metro cache with `npx expo start --clear`
- **Dependencies**: Reinstall dependencies with `npm install`
- **TypeScript Errors**: Check type definitions and imports

#### Runtime Issues
- **Memory Leaks**: Check for unmounted component subscriptions
- **Performance**: Monitor component re-renders and memory usage
- **Network Issues**: Check API endpoints and authentication

#### Debugging Tools
- **React Native Debugger**: For component debugging
- **Flipper**: For network and performance debugging
- **Expo Dev Tools**: For development debugging

### Performance Optimization
1. **Component Optimization**: Use React.memo and useMemo
2. **Image Optimization**: Compress and cache images
3. **Bundle Optimization**: Reduce bundle size
4. **Memory Management**: Clean up resources properly

### Security Considerations
1. **Authentication**: Secure token storage and refresh
2. **Data Encryption**: Encrypt sensitive data
3. **Network Security**: Use HTTPS for all API calls
4. **Input Validation**: Validate all user inputs

---

## Quick Reference

### Common Commands
```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Build for production
eas build --platform all

# Clear cache
npx expo start --clear
```

### File Templates
- **Component**: Use component template with props interface
- **Service**: Use service template with error handling
- **Screen**: Use screen template with navigation
- **Test**: Use test template with proper mocking

### Code Snippets
- **API Call**: Use apiClient pattern with error handling
- **Navigation**: Use Expo Router navigation
- **Styling**: Use GlobalStyles constants
- **State Management**: Use Context API for global state

This documentation should be updated as the project evolves. For questions or clarifications, refer to the codebase or contact the development team.
