import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Changed to true to show the dashboard
  const isAuthenticated = true;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {!isAuthenticated ? (
          <Stack>
            <Stack.Screen name="login" options={{ headerShown: false }} />
          </Stack>
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
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
        )}
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
