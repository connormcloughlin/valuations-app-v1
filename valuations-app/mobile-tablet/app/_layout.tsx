import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import ConnectionStatus from '../components/ConnectionStatus';
import UpdateNotification from '../components/UpdateNotification';
import connectionUtils from '../utils/connectionUtils';
// Dynamic import to prevent bundling at startup
const getInitializeDatabase = () => import('../utils/db');
import { AuthProvider } from '../context/AuthContext';
import { DashboardProvider } from '../context/DashboardContext';
import { bundleOptimization } from '../core/bundleOptimization';

import { useColorScheme } from '../hooks/useColorScheme';
import { useOrientation } from '../hooks/useOrientation';
import { logNavigation } from '../utils/logger';
import SimplePerformanceMonitor from '../components/SimplePerformanceMonitor';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create simplified theme objects without font customizations
const customDefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
  }
};

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
  }
};

export default function RootLayout() {
  logNavigation('RootLayout');
  
  const colorScheme = useColorScheme();
  const { orientation } = useOrientation();
  
  // Remove font loading since it might be causing issues
  const [loaded] = useFonts({});
  
  // Update notification state
  const [updateStatus, setUpdateStatus] = useState<'checking' | 'downloading' | 'ready' | 'error' | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | undefined>(undefined);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Database initialization moved to AuthProvider to ensure it happens after authentication

  useEffect(() => {
    async function unlockOrientation() {
      await ScreenOrientation.unlockAsync();
    }
    unlockOrientation();
  }, []);

  // Initialize connection monitoring
  useEffect(() => {
    // Check connection status initially
    connectionUtils.getStatus();
    
    // Set up periodic connection checks
    const intervalId = setInterval(() => {
      connectionUtils.getStatus();
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Initialize bundle optimization
  useEffect(() => {
    console.log('🚀 Initializing performance optimizations...');
    
    // Initialize bundle optimization
    bundleOptimization.processPreloadQueue();
    
    console.log('✅ Performance optimizations initialized');
  }, []);

  // Automatic update checking with user notifications
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // Only check for updates if we're not in development and updates are enabled
        if (!__DEV__ && Updates.isEnabled) {
          // Show checking status
          setUpdateStatus('checking');
          setUpdateMessage('Checking for updates...');
          setShowUpdateNotification(true);
          
          const update = await Updates.checkForUpdateAsync();
          
          if (update.isAvailable) {
            // Show downloading status
            setUpdateStatus('downloading');
            setUpdateMessage('Downloading update...');
            
            const result = await Updates.fetchUpdateAsync();
            
            if (result.isNew) {
              // Show ready status
              setUpdateStatus('ready');
              setUpdateMessage('Update ready! Reloading app...');
              
              // Wait a moment so user can see the message, then reload
              setTimeout(async () => {
                await Updates.reloadAsync();
              }, 1500);
            } else {
              // Update was already downloaded
              setUpdateStatus('ready');
              setUpdateMessage('Update ready! Reloading app...');
              setTimeout(async () => {
                await Updates.reloadAsync();
              }, 1500);
            }
          } else {
            // No update available - hide notification after a brief moment
            setTimeout(() => {
              setShowUpdateNotification(false);
              setUpdateStatus(null);
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
        // Show error to user
        setUpdateStatus('error');
        setUpdateMessage('Update check failed. You can continue using the app.');
        // Auto-hide error after 5 seconds
        setTimeout(() => {
          setShowUpdateNotification(false);
          setUpdateStatus(null);
        }, 5000);
      }
    };

    // Check for updates when app starts (with a small delay to not block initial render)
    const timeoutId = setTimeout(checkForUpdates, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <AuthProvider>
            <DashboardProvider>
              <ConnectionStatus showOffline={true} showOnline={true} />
              <UpdateNotification 
                visible={showUpdateNotification}
                status={updateStatus}
                message={updateMessage}
                onDismiss={() => {
                  setShowUpdateNotification(false);
                  setUpdateStatus(null);
                }}
              />
              {/* Use simplified themes to avoid font issues */}
              <Stack
                screenOptions={{ 
                  headerShown: false,
                  // Add animation based on orientation
                  animation: orientation === 'landscape' ? 'slide_from_right' : 'default',
                }}
              >
              <Stack.Screen name="index" />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="survey/items" />
              <Stack.Screen name="survey/[id]" />
              <Stack.Screen name="survey/summary/[id]" />
              {/* Appointment routes removed during cleanup - using tabs navigation instead */}
              <Stack.Screen name="+not-found" options={{ headerShown: true }} />
            </Stack>
            <StatusBar style="auto" />
            </DashboardProvider>
          </AuthProvider>
        </PaperProvider>
        <SimplePerformanceMonitor />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
