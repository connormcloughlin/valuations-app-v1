# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Valuations App - Offline Support

This document provides information about the offline support implementation in the Valuations App.

## Overview

The app has been enhanced with offline capabilities for risk template APIs, allowing users to:

1. View and interact with risk templates, sections, categories, and items when offline
2. Cache API responses for offline use
3. See visual indicators of network status
4. Automatically fall back to cached data when API calls fail

## Required Dependencies

The implementation uses built-in React Native features and AsyncStorage, which is already included in the project:

- `@react-native-async-storage/async-storage` - For local storage of API data

No additional dependencies are needed for this implementation.

## How Offline Support Works

### 1. Network Monitoring

- The app periodically checks connectivity status
- A visual indicator shows when the app is offline
- Network status is checked by attempting to make a simple HTTP request

### 2. Data Caching

- All API responses are cached locally using AsyncStorage
- Cache includes risk templates, sections, categories, and items
- Each cached item includes a timestamp to track freshness

### 3. Offline Data Retrieval

- When online, the app fetches fresh data and updates the cache
- When API calls fail (due to being offline or server issues), the app automatically uses cached data
- API functions transparently handle this offline/online switching

### 4. User Experience

- Users see a banner when offline
- The UI adapts to show when cached data is being used
- Critical functions remain available even without network access

## Implementation Details

The main components of the offline implementation are:

1. **API Layer (api/index.ts)** - Enhanced API functions with offline fallback logic
   - Each API call attempts to fetch from the server first
   - If the call fails, it automatically tries to retrieve from the local cache
   - Successful API responses are cached for future offline use

2. **Connection Status (connectionUtils.ts)** - Utility for checking network connectivity
   - Uses a lightweight ping approach instead of relying on third-party packages
   - Periodically checks connection status to keep UI updated

3. **Connection Indicator (ConnectionStatus.tsx)** - UI component for displaying network status
   - Shows a banner indicating online/offline status
   - Automatically updates when connectivity changes

## Clearing Cached Data

For testing or troubleshooting, you can clear the cached data with the following code:

```javascript
import api from './api';

// Clear all cached API data
api.clearAllCachedData();
```

## Benefits of This Approach

1. **No Additional Dependencies** - Uses only AsyncStorage which is already in the project
2. **Simple Implementation** - Easier to maintain than solutions with multiple dependencies
3. **Error Resilience** - Handles both offline scenarios and API errors the same way
4. **Automatic Caching** - All API calls are automatically cached for offline use
