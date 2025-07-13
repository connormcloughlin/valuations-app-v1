import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { loginScreenStyles } from '../../app/GlobalStyles';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: Implement login logic
    console.log('Login attempt with:', { email, password });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={loginScreenStyles.container}
    >
      <View style={loginScreenStyles.content}>
        <Text style={loginScreenStyles.title}>Welcome Back</Text>
        <Text style={loginScreenStyles.subtitle}>Sign in to continue</Text>

        <View style={loginScreenStyles.form}>
          <TextInput
            style={loginScreenStyles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={loginScreenStyles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={loginScreenStyles.loginButton} onPress={handleLogin}>
            <Text style={loginScreenStyles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={loginScreenStyles.forgotPassword}>
            <Text style={loginScreenStyles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen; 