# Cursor Consistency Rules - Valuations Mobile Tablet App

## Overview
This document defines consistency rules for Cursor to maintain code quality, architectural patterns, and development standards across the Valuations Mobile Tablet App project.

## Code Style and Formatting

### TypeScript/JavaScript Rules
- **Strict TypeScript**: Always use strict mode with proper type definitions
- **Interface Naming**: Use PascalCase for interfaces (e.g., `ComponentProps`, `ApiResponse`)
- **Type Imports**: Use `import type` for type-only imports
- **Optional Properties**: Use `?` for optional properties, never `| undefined`
- **Generic Types**: Use descriptive generic names (e.g., `T`, `K`, `V` for simple cases)

### File Naming Conventions
- **Components**: PascalCase (e.g., `SurveyHeader.tsx`, `DynamicFieldRenderer.tsx`)
- **Services**: camelCase (e.g., `azureAdService.ts`, `configurationService.ts`)
- **Utilities**: camelCase (e.g., `connectionUtils.ts`, `asyncStorageManager.ts`)
- **Types**: camelCase (e.g., `api.ts`, `dynamicUI.ts`)
- **Constants**: camelCase (e.g., `apiConfig.ts`, `Colors.ts`)
- **Screens**: kebab-case for routes (e.g., `[id].tsx`, `login.tsx`)

### Import Organization
```typescript
// 1. React and React Native imports (alphabetical)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party library imports (alphabetical)
import { useRouter } from 'expo-router';
import { Button } from 'react-native-paper';

// 3. Local imports (alphabetical by path)
import { colors, spacing, textStyles } from '../../GlobalStyles';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';

// 4. Type imports (at the end)
import type { SurveyData } from '../../types/api';
```

## Component Structure

### Component Template
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, textStyles } from '../GlobalStyles';

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
  // 1. Hooks (useState, useEffect, custom hooks)
  const [state, setState] = useState();
  
  // 2. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 3. Event handlers (alphabetical)
  const handleAction = () => {
    // Handler logic
  };
  
  const handlePress = () => {
    // Handler logic
  };
  
  // 4. Render
  return (
    <View style={styles.container}>
      <Text style={textStyles.bodyMedium}>{requiredProp}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
});
```

### Component Guidelines
- **Props Interface**: Always define props interface with proper types
- **Default Props**: Use destructuring with default values for optional props
- **Event Handlers**: Use `handle` prefix for event handlers
- **Styles**: Use GlobalStyles constants, define local styles at bottom
- **Export**: Use named exports for components

## Styling Rules

### GlobalStyles Usage
- **Colors**: Always use `colors.*` constants, never hardcoded hex values
- **Spacing**: Use `spacing.*` constants for margins, padding, gaps
- **Typography**: Use `textStyles.*` for text styling
- **Border Radius**: Use `borderRadius.*` constants
- **Shadows**: Use `shadows.*` constants

### StyleSheet Guidelines
```typescript
// ✅ Correct - Using GlobalStyles
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  title: textStyles.h1,
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});

// ❌ Incorrect - Hardcoded values
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f6fa',
    padding: 16,
    borderRadius: 8,
  },
});
```

## State Management

### Context API Rules
- **Context Naming**: Use `Context` suffix (e.g., `AuthContext`, `DashboardContext`)
- **Provider Naming**: Use `Provider` suffix (e.g., `AuthProvider`, `DashboardProvider`)
- **Hook Naming**: Use `use` prefix (e.g., `useAuth`, `useDashboard`)

### State Guidelines
```typescript
// ✅ Correct - Proper state management
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// ❌ Incorrect - Avoid any type
const [data, setData] = useState([]);
const [loading, setLoading] = useState();
```

## API Integration

### API Client Rules
- **Response Handling**: Always check `response.success` before using data
- **Error Handling**: Use try-catch with proper error logging
- **Type Safety**: Define proper types for API responses
- **Offline Support**: Always handle offline scenarios

### API Call Template
```typescript
// ✅ Correct - Proper API handling
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await apiClient.getData();
    
    if (response.success) {
      setData(response.data);
    } else {
      setError(response.message || 'Failed to fetch data');
    }
  } catch (error) {
    console.error('API Error:', error);
    setError('Network error occurred');
  } finally {
    setLoading(false);
  }
};
```

## Error Handling

### Error Handling Rules
- **User-Friendly Messages**: Provide clear, actionable error messages
- **Logging**: Use structured logging with context
- **Error Boundaries**: Implement error boundaries for critical components
- **Offline Handling**: Gracefully handle offline scenarios

### Error Handling Template
```typescript
// ✅ Correct - Comprehensive error handling
try {
  const response = await apiClient.getData();
  if (response.success) {
    // Handle success
  } else {
    logger.error('API Error', { 
      message: response.message, 
      endpoint: '/api/data' 
    });
    // Handle API error
  }
} catch (error) {
  logger.error('Network Error', { 
    error: error.message, 
    stack: error.stack 
  });
  // Handle network error
}
```

## Performance Rules

### Component Optimization
- **React.memo**: Use for components that receive stable props
- **useCallback**: Use for functions passed as props
- **useMemo**: Use for expensive computations
- **Avoid Inline Objects**: Don't create objects/arrays in render

### Performance Guidelines
```typescript
// ✅ Correct - Optimized component
const MemoizedComponent = React.memo<ComponentProps>(({ data, onAction }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({ ...item, processed: true }));
  }, [data]);
  
  const handleAction = useCallback(() => {
    onAction(processedData);
  }, [onAction, processedData]);
  
  return <View>{/* Component content */}</View>;
});

// ❌ Incorrect - Unoptimized component
const Component = ({ data, onAction }) => {
  const processedData = data.map(item => ({ ...item, processed: true }));
  
  return <View>{/* Component content */}</View>;
};
```

## Testing Rules

### Test File Naming
- **Unit Tests**: `ComponentName.test.tsx` or `ComponentName.spec.tsx`
- **Integration Tests**: `ComponentName.integration.test.tsx`
- **E2E Tests**: `ComponentName.e2e.test.tsx`

### Test Structure
```typescript
// ✅ Correct - Proper test structure
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Component } from './Component';

describe('Component', () => {
  const defaultProps = {
    requiredProp: 'test',
  };
  
  it('renders correctly', () => {
    const { getByText } = render(<Component {...defaultProps} />);
    expect(getByText('test')).toBeTruthy();
  });
  
  it('handles action correctly', () => {
    const onAction = jest.fn();
    const { getByTestId } = render(
      <Component {...defaultProps} onAction={onAction} />
    );
    
    fireEvent.press(getByTestId('action-button'));
    expect(onAction).toHaveBeenCalled();
  });
});
```

## File Organization

### Directory Structure Rules
- **Feature-Based**: Organize by feature, not by type
- **Co-location**: Keep related files together
- **Index Files**: Use index files for clean imports
- **Barrel Exports**: Export multiple items from index files

### Import Path Rules
```typescript
// ✅ Correct - Clean imports
import { Component } from './Component';
import { useHook } from './hooks/useHook';
import { apiClient } from '../api';

// ❌ Incorrect - Deep imports
import { Component } from './components/Component/Component';
import { useHook } from './hooks/useHook/useHook';
```

## Documentation Rules

### Code Documentation
- **JSDoc**: Use JSDoc for public APIs and complex functions
- **Inline Comments**: Use for complex business logic
- **README Files**: Maintain README files for major directories
- **Type Documentation**: Document complex types and interfaces

### Documentation Template
```typescript
/**
 * Fetches survey data from the API with offline support
 * @param surveyId - The unique identifier for the survey
 * @param options - Optional parameters for the request
 * @returns Promise resolving to survey data or cached data if offline
 */
export const fetchSurveyData = async (
  surveyId: string,
  options?: FetchOptions
): Promise<SurveyData> => {
  // Implementation
};
```

## Security Rules

### Authentication
- **Token Storage**: Use secure storage for authentication tokens
- **Token Refresh**: Implement automatic token refresh
- **Logout**: Clear all sensitive data on logout
- **Input Validation**: Validate all user inputs

### Data Protection
```typescript
// ✅ Correct - Secure data handling
const storeToken = async (token: string) => {
  await SecureStore.setItemAsync('auth_token', token);
};

const clearSensitiveData = async () => {
  await SecureStore.deleteItemAsync('auth_token');
  await AsyncStorage.removeItem('user_data');
};
```

## Accessibility Rules

### Accessibility Guidelines
- **Semantic Elements**: Use appropriate semantic elements
- **Accessibility Labels**: Provide accessibility labels for interactive elements
- **Color Contrast**: Ensure sufficient color contrast
- **Screen Reader**: Test with screen readers

### Accessibility Template
```typescript
// ✅ Correct - Accessible component
<Button
  mode="contained"
  onPress={handlePress}
  accessibilityLabel="Submit survey"
  accessibilityHint="Submits the current survey data"
  accessibilityRole="button"
>
  Submit
</Button>
```

## Environment and Configuration

### Environment Rules
- **Environment Variables**: Use environment-specific configuration
- **Feature Flags**: Use feature flags for experimental features
- **Configuration Validation**: Validate configuration on app startup
- **Default Values**: Provide sensible defaults for all configuration

### Configuration Template
```typescript
// ✅ Correct - Environment configuration
const config = {
  apiBaseUrl: process.env.API_BASE_URL || 'https://api.example.com',
  logLevel: process.env.LOG_LEVEL || 'info',
  enableDebug: process.env.ENABLE_DEBUG === 'true',
};
```

## Git and Version Control

### Commit Message Rules
- **Conventional Commits**: Use conventional commit format
- **Descriptive Messages**: Write clear, descriptive commit messages
- **Scope**: Include scope for feature-specific changes
- **Breaking Changes**: Mark breaking changes appropriately

### Commit Message Template
```
feat(survey): add dynamic field rendering support

- Add DynamicFieldRenderer component
- Implement field type detection
- Add validation support for dynamic fields

Closes #123
```

## Code Review Rules

### Review Checklist
- [ ] Code follows TypeScript strict mode
- [ ] Uses GlobalStyles constants
- [ ] Proper error handling implemented
- [ ] Accessibility considerations included
- [ ] Performance optimizations applied
- [ ] Tests written for new functionality
- [ ] Documentation updated
- [ ] No console.log statements in production code

### Review Guidelines
- **Functionality**: Does the code work as intended?
- **Performance**: Are there performance implications?
- **Security**: Are there security concerns?
- **Maintainability**: Is the code maintainable?
- **Testing**: Is the code properly tested?

## Automated Rules

### ESLint Configuration
```json
{
  "extends": [
    "@react-native-community",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## Enforcement

### Automated Checks
- **Pre-commit Hooks**: Run linting and formatting
- **CI/CD Pipeline**: Automated testing and quality checks
- **Code Coverage**: Maintain minimum coverage requirements
- **Performance Monitoring**: Track performance metrics

### Manual Reviews
- **Code Reviews**: Peer review for all changes
- **Architecture Reviews**: Review for architectural changes
- **Security Reviews**: Review for security-sensitive changes
- **Performance Reviews**: Review for performance-critical changes

---

## Quick Reference

### Common Patterns
- **Component**: Use component template with props interface
- **Service**: Use service template with error handling
- **Hook**: Use hook template with proper dependencies
- **Test**: Use test template with proper mocking

### Common Commands
```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check

# Run tests
npm run test
```

### File Templates
- **Component**: `ComponentName.tsx` with props interface
- **Service**: `serviceName.ts` with error handling
- **Hook**: `useHookName.ts` with proper dependencies
- **Test**: `ComponentName.test.tsx` with proper mocking

These rules should be followed consistently across the project to maintain code quality and developer experience. Regular reviews and updates to these rules ensure they remain relevant and effective.
