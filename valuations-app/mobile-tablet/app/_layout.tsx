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
import ConnectionStatus from '../components/ConnectionStatus';
import connectionUtils from '../utils/connectionUtils';
import { initializeDatabase } from '../utils/db';
import { AuthProvider } from '../context/AuthContext';

import { useColorScheme } from '../hooks/useColorScheme';
import { useOrientation } from '../hooks/useOrientation';
import { logNavigation } from '../utils/logger';

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
    connectionUtils.updateConnectionStatus();
    
    // Set up periodic connection checks
    const intervalId = setInterval(() => {
      connectionUtils.updateConnectionStatus();
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <AuthProvider>
            <ConnectionStatus showOffline={true} showOnline={true} />
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
              <Stack.Screen name="survey/new" />
              <Stack.Screen name="survey/categories" />
              <Stack.Screen name="survey/items" />
              <Stack.Screen name="survey/summary" />
              <Stack.Screen name="survey/[id]" />
              <Stack.Screen name="survey/summary/[id]" />
              <Stack.Screen name="appointment/[id]" />
              <Stack.Screen name="appointments/scheduled" options={{ headerShown: true }} />
              <Stack.Screen name="appointments/in-progress" options={{ headerShown: true }} />
              <Stack.Screen name="appointments/completed" options={{ headerShown: true }} />
              <Stack.Screen name="+not-found" options={{ headerShown: true }} />
            </Stack>
            <StatusBar style="auto" />
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
