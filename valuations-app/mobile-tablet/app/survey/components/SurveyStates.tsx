import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, commonStyles } from '../../GlobalStyles';

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
      <ActivityIndicator size="large" color={colors.primary} />
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
      <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.error} />
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
    backgroundColor: colors.background,
  },
  loadingContainer: commonStyles.loadingContainer,
  loadingText: commonStyles.loadingText,
  centeredContainer: commonStyles.centered,
  errorTitle: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  errorMessage: {
    fontSize: typography.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  errorButton: {
    backgroundColor: colors.primaryDark,
  },
}); 