import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { initNetworkListener } from './utils/networkUtils';
import OfflineNotice from './components/OfflineNotice';

export default function App() {
  // Initialize network listener when app starts
  useEffect(() => {
    const unsubscribe = initNetworkListener();
    
    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <OfflineNotice showOffline={true} showOnline={true} />
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
} 