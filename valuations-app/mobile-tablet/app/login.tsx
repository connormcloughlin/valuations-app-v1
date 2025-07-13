import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { logNavigation } from '../utils/logger';
import { useAuth } from '../context/AuthContext';
import { loginStyles } from './GlobalStyles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithAzure, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during login');
    }
  };

  const handleAzureLogin = async () => {
    try {
      const success = await loginWithAzure();
      if (success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', 'Azure AD login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during Azure login');
    }
  };

  logNavigation('Login Screen');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={loginStyles.container}
    >
      <View style={loginStyles.content}>
        <Text style={loginStyles.title}>Welcome Back</Text>
        <Text style={loginStyles.subtitle}>Sign in to continue</Text>

        <View style={loginStyles.form}>
          <TextInput
            style={loginStyles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={loginStyles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={[loginStyles.loginButton, isLoading && loginStyles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={loginStyles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[loginStyles.azureButton, isLoading && loginStyles.loginButtonDisabled]} 
            onPress={handleAzureLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={loginStyles.azureButtonText}>Sign In with Azure AD</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={loginStyles.forgotPassword}>
            <Text style={loginStyles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
} 