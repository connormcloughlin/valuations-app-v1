import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Redirect, useSegments, useRootNavigation } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import api from '../api';
import connectionUtils from '../utils/connectionUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This key lets us track if we've already redirected in this session
const HAS_NAVIGATED_KEY = '@app_has_navigated_to_dashboard';

export default function Index() {
  const segments = useSegments();
  const rootNavigation = useRootNavigation();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkNavigation = async () => {
      try {
        // Always set flag to track navigation
        await AsyncStorage.setItem(HAS_NAVIGATED_KEY, 'true');
      } catch (error) {
        console.error('Error setting navigation state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (rootNavigation?.isReady) {
      checkNavigation();
    }
  }, [rootNavigation?.isReady]);
  
  // Show loading while we're initializing
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  // Always redirect to the dashboard tabs
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeded',
    padding: 6,
    borderRadius: 4,
  },
  offlineText: {
    fontSize: 12,
    color: '#e74c3c',
    marginLeft: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 150,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  refreshButton: {
    backgroundColor: '#3498db',
  },
  clearButton: {
    backgroundColor: '#e74c3c',
  },
  retryButton: {
    backgroundColor: '#3498db',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  templateInfo: {
    marginLeft: 12,
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  templateId: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  templateDescription: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
}); 