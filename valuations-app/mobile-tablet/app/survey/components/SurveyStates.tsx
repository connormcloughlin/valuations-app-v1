import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SurveyLoadingProps {
  title?: string;
}

interface SurveyErrorProps {
  title?: string;
  message?: string;
  onGoBack: () => void;
}

export function SurveyLoading({ title = 'Loading Survey' }: SurveyLoadingProps) {
  return (
    <View style={[styles.container, styles.loadingContainer]}>
      <ActivityIndicator size="large" color="#4a90e2" />
      <Text style={styles.loadingText}>Loading survey data...</Text>
    </View>
  );
}

export function SurveyError({ 
  title = 'Survey Not Found',
  message = "The survey you're looking for doesn't exist or has been deleted.",
  onGoBack 
}: SurveyErrorProps) {
  return (
    <View style={[styles.container, styles.centeredContainer]}>
      <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#e74c3c" />
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <Button 
        mode="contained" 
        onPress={onGoBack} 
        style={styles.errorButton}
      >
        Go Back
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#3498db',
  },
}); 