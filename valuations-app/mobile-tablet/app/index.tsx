import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Redirect, useSegments, useRootNavigation } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import api from '../api';
import connectionUtils from '../utils/connectionUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { indexStyles } from './GlobalStyles';

export default function Index() {
  const segments = useSegments();
  const rootNavigation = useRootNavigation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Show loading while auth is checking
  if (authLoading) {
    return (
      <View style={indexStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={indexStyles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }
  
  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/login" />;
  }
} 