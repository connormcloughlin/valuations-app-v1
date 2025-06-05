# Expo SDK 53 Upgrade Guide

## Overview
This document provides a comprehensive, step-by-step plan to safely upgrade the Valuations App from Expo SDK 52 to SDK 53. This upgrade includes major changes like React Native 0.79, React 19, and the New Architecture being enabled by default.

## Current State Analysis
- **Current SDK**: 52.0.46
- **Target SDK**: 53.0.0
- **React Native**: Will upgrade from 0.76.9 → 0.79
- **React**: Will upgrade to React 19
- **Major Change**: New Architecture enabled by default

## Phase 1: Pre-Upgrade Preparation & Backup

### 1.1 Create Full Backup
```bash
# Create a complete backup branch
git checkout -b backup-before-sdk53-upgrade
git add -A && git commit -m "Complete backup before Expo SDK 53 upgrade"
git push origin backup-before-sdk53-upgrade

# Create working branch
git checkout -b expo-sdk53-upgrade
```

### 1.2 Environment Setup
```bash
# Update Node.js (SDK 53 requires Node 20+)
# Verify: node --version (should be 20+ since Node 18 reached EOL)

# Update global tools
npm install -g @expo/cli@latest
npm install -g eas-cli@latest
```

### 1.3 Dependency Analysis
```bash
# Check for potential issues
cd valuations-app/mobile-tablet
npx expo-doctor@latest

# Check for New Architecture compatibility
# Note any libraries that may have issues
```

## Phase 2: Core Expo Upgrade

### 2.1 Update Expo SDK
```bash
# Main upgrade command
npx expo install expo@^53.0.0 --fix
```

### 2.2 Update App Configuration
Update `app.json`:
```json
{
  "expo": {
    "name": "Valuations App",
    "slug": "valuations-mobile-tablet",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "valuations-app",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "bundler": "metro",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-font", 
      "expo-screen-orientation",
      "expo-sqlite"
    ],
    "experiments": {
      "typedRoutes": true
    },
    "newArchEnabled": false
  }
}
```

**Important**: Start with `"newArchEnabled": false` for initial upgrade, then enable later.

## Phase 3: Handle Breaking Changes

### 3.1 React 19 Compatibility
Update `package.json` to handle React 19 peer dependency issues:
```json
{
  "overrides": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

### 3.2 Metro Configuration Updates
Update `metro.config.js` to handle new `package.json:exports` behavior:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Set the project root to the current directory
config.projectRoot = __dirname;

// Handle both ESM and CommonJS modules
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'cjs', 'mjs', 'json'];

// Add support for expo-router's file system based routing
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Add ESM resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main', 'module'];

// SDK 53: Handle package.json exports if needed
// Uncomment if you have issues with specific libraries
// config.resolver.unstable_enablePackageExports = false;

module.exports = config;
```

### 3.3 TypeScript Updates
Update `package.json` to use recommended TypeScript version:
```json
{
  "devDependencies": {
    "typescript": "~5.8.3"
  }
}
```

### 3.4 Edge-to-Edge Android (Important!)
Your app will need to handle edge-to-edge layouts on Android. Add this to your root layout:
```bash
# Install the recommended package
npm install react-native-edge-to-edge
```

## Phase 4: Dependency Resolution & Testing

### 4.1 Clean Installation
```bash
# Clear all caches
rm -rf node_modules
rm package-lock.json  # or yarn.lock if using yarn

# Fresh install with legacy peer deps to avoid React 19 conflicts
npm install --legacy-peer-deps

# Alternative for yarn users:
# yarn install --frozen-lockfile
```

### 4.2 Test Basic Functionality
```bash
# Test the app starts
npx expo start --clear

# Test on both platforms
npx expo run:ios
npx expo run:android
```

## Phase 5: New Architecture Migration (Phase 2)

Only attempt this **after** the basic upgrade is working:

### 5.1 Enable New Architecture
Update `app.json`:
```json
{
  "expo": {
    "newArchEnabled": true
  }
}
```

### 5.2 Test with New Architecture
```bash
# Clear everything and rebuild
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

## Phase 6: Library-Specific Updates

### 6.1 Background Tasks
If you use background tasks, migrate from `expo-background-fetch`:
```bash
# Remove old package
npm uninstall expo-background-fetch

# Install new package
npm install expo-background-task
```

### 6.2 Audio/Video Updates
- `expo-av` is deprecated, but still works in SDK 53
- Consider migrating to `expo-audio` and `expo-video` for new features

## Phase 7: Testing & Validation

### 7.1 Comprehensive Testing Checklist
- [ ] App starts without crashes
- [ ] Navigation works properly
- [ ] SQLite database operations work
- [ ] Image picker functionality works  
- [ ] Network requests work
- [ ] Background sync works
- [ ] Camera functionality (if used)
- [ ] File system operations work
- [ ] Push notifications work (in dev build)

### 7.2 Performance Testing
- [ ] App startup time acceptable
- [ ] Smooth navigation
- [ ] Memory usage reasonable
- [ ] Battery usage acceptable

## Phase 8: Build & Deploy Testing

### 8.1 Development Builds
```bash
# Create new development build
eas build --profile development --platform all
```

### 8.2 Production Testing
```bash
# Test production build
eas build --profile production --platform all
```

## Rollback Plan

If issues arise:

### Quick Rollback
```bash
git checkout backup-before-sdk53-upgrade
npm install
npx expo start
```

### Partial Rollback (keep some changes)
```bash
# Cherry-pick specific commits
git cherry-pick <specific-commit-hash>
```

## Known Issues & Workarounds

### Common SDK 53 Issues
1. **Library Incompatibility**: Some libraries may not support React 19 yet
   - **Solution**: Add to `overrides` in package.json or find alternatives

2. **Metro ES Module Issues**: Package.json exports causing problems
   - **Solution**: Set `unstable_enablePackageExports: false` in metro config

3. **New Architecture Issues**: Third-party libraries may break
   - **Solution**: Disable New Architecture temporarily, update libraries

### Your App-Specific Considerations
- **SQLite**: You're using the current API, should be fine
- **Media Upload**: Your backend sync should continue working
- **React Navigation**: Should auto-upgrade to v7
- **Forms/UI**: react-native-paper should work fine

## Success Criteria

Before considering the upgrade complete:
- [ ] All core app functionality works
- [ ] No runtime crashes
- [ ] Performance is acceptable
- [ ] New Architecture works (if enabled)
- [ ] Production builds work
- [ ] EAS Update works
- [ ] All team members can run the app

## Emergency Contacts & Resources

- **Expo Discord**: For real-time help
- **Expo Office Hours**: Wednesdays 12:00PM Pacific
- **React Native Upgrade Helper**: For native code changes
- **Expo Doctor**: `npx expo-doctor@latest` for automated checks

## Estimated Timeline

- **Phase 1-2 (Basic Upgrade)**: 2-4 hours
- **Phase 3-4 (Fixes & Testing)**: 4-8 hours  
- **Phase 5 (New Architecture)**: 2-4 hours
- **Phase 6-8 (Full Testing)**: 4-8 hours
- **Total**: 1-3 days depending on issues encountered

## Major Breaking Changes in SDK 53

### React 19 Changes
- Automatic batching affects state updates
- Some third-party libraries may have peer dependency conflicts
- New React features available (Suspense improvements, `use` hook)

### New Architecture (Default)
- Fabric renderer replaces Paper
- TurboModules replace legacy native modules
- Improved performance but potential compatibility issues
- Can be disabled if needed: `"newArchEnabled": false`

### Metro & Package Resolution
- `package.json:exports` enabled by default
- May cause issues with some libraries
- ESM/CommonJS dual package hazard possible

### Platform Changes
- iOS 15.1+ required (was 13.4+)
- Android SDK 24+ required (was 23+)
- Xcode 16+ required

### Deprecated/Removed Features
- `expo-av` Video deprecated (use `expo-video`)
- `expo-background-fetch` deprecated (use `expo-background-task`)
- JSC engine support deprecated (use Hermes)
- `setImmediate` polyfill removed

## Post-Upgrade Optimization

### Performance Improvements
- Enable remote build caching: `experiments.remoteBuildCache`
- Use Expo Atlas for bundle analysis: `EXPO_ATLAS=1 npx expo`
- Consider React Compiler: `experiments.reactCompiler`

### New Features to Explore
- **Expo UI**: Native SwiftUI/Jetpack Compose components
- **DOM Components**: Mix web components with native
- **Server Components**: React Server Components (experimental)
- **Background Tasks**: New `expo-background-task` capabilities

## Notes

This plan prioritizes safety with multiple rollback points. Start with phases 1-4, get those working perfectly, then tackle the New Architecture in phase 5. Each phase can be completed independently, allowing for incremental progress and testing.

Remember to test thoroughly on both iOS and Android after each major phase before proceeding to the next one. 