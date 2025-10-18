import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import { router } from 'expo-router';
import { logNavigation } from '../utils/logger';
import { useAuth } from '../context/AuthContext';
import { loginStyles } from './GlobalStyles';
import { ProgressiveLoading } from '../components/LoadingStates';

type LoginStep = 'idle' | 'initiating' | 'opening_azure' | 'authenticating' | 'completing' | 'success' | 'error';

export default function LoginScreen() {
  const { loginWithAzure, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<LoginStep>('idle');
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  const loginSteps = [
    'Initiating login...',
    'Opening Azure AD...',
    'Authenticating with Azure...',
    'Completing login...'
  ];

  // Monitor app state changes during login
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('🔐 App state changed during login:', nextAppState);
      setAppState(nextAppState);
      
      // If app comes back to foreground during login, check if we're still in process
      if (nextAppState === 'active' && currentStep !== 'idle' && currentStep !== 'success') {
        console.log('🔐 App returned to foreground, checking login status...');
        // You might want to check authentication status here
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [currentStep]);

  const handleAzureLogin = async () => {
    if (currentStep !== 'idle') return; // Prevent multiple clicks
    
    try {
      setCurrentStep('initiating');
      console.log('🔐 Starting Azure AD login process...');
      
      // Step 1: Initiate login
      setCurrentStep('opening_azure');
      console.log('🔐 Opening Azure AD authentication...');
      
      const success = await loginWithAzure();
      
      if (success) {
        setCurrentStep('completing');
        console.log('🔐 Azure AD login successful, completing authentication...');
        
        // Small delay to show completion step
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setCurrentStep('success');
        console.log('🔐 Login completed successfully, navigating to dashboard');
        
        // Navigate to dashboard
        router.replace('/(tabs)');
      } else {
        setCurrentStep('error');
        console.log('🔐 Azure AD login failed');
        Alert.alert('Login Failed', 'Azure AD login failed. Please try again.');
        setCurrentStep('idle');
      }
    } catch (error) {
      setCurrentStep('error');
      console.error('🔐 Azure AD login error:', error);
      Alert.alert('Error', 'An error occurred during Azure login. Please try again.');
      setCurrentStep('idle');
    }
  };

  logNavigation('Login Screen');

  const isProcessing = currentStep !== 'idle' && currentStep !== 'success';
  const currentStepIndex = ['idle', 'initiating', 'opening_azure', 'authenticating', 'completing'].indexOf(currentStep);

  return (
    <View style={loginStyles.container}>
      <View style={loginStyles.content}>
        <Text style={loginStyles.title}>Welcome Back</Text>
        <Text style={loginStyles.subtitle}>Sign in with your Azure AD account</Text>

        <View style={loginStyles.form}>
          <TouchableOpacity 
            style={[
              loginStyles.azureButton, 
              isProcessing && loginStyles.loginButtonDisabled
            ]} 
            onPress={handleAzureLogin}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={loginStyles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={loginStyles.loadingText}>
                  {currentStep === 'opening_azure' ? 'Opening Azure AD...' : 
                   currentStep === 'authenticating' ? 'Authenticating...' :
                   currentStep === 'completing' ? 'Completing login...' :
                   'Processing...'}
                </Text>
              </View>
            ) : (
              <Text style={loginStyles.azureButtonText}>Sign In with Azure AD</Text>
            )}
          </TouchableOpacity>
          
          {isProcessing && (
            <View style={loginStyles.statusContainer}>
              <ProgressiveLoading
                steps={loginSteps}
                currentStep={Math.max(1, currentStepIndex)}
                totalSteps={loginSteps.length}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
} 