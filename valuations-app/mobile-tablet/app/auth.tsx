import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const { isAuthenticated, checkAuthStatus } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Check auth status to see if login was successful
      await checkAuthStatus();
      
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      }, 1000);
    };

    handleCallback();
  }, [isAuthenticated, checkAuthStatus]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ marginTop: 16, fontSize: 16 }}>Completing authentication...</Text>
    </View>
  );
} 