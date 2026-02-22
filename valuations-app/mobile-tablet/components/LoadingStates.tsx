import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../app/GlobalStyles';

interface LoadingStateProps {
  message?: string;
  showSpinner?: boolean;
  size?: 'small' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  showSpinner = true,
  size = 'large'
}) => (
  <View style={styles.container}>
    {showSpinner && <ActivityIndicator size={size} color={colors.primary} />}
    <Text style={styles.message}>{message}</Text>
  </View>
);

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4
}) => (
  <View style={[styles.skeleton, { width, height, borderRadius }]} />
);

interface ProgressiveLoadingProps {
  steps: string[];
  currentStep: number;
  totalSteps: number;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  steps,
  currentStep,
  totalSteps
}) => (
  <View style={styles.progressiveContainer}>
    <View style={styles.progressBar}>
      <View 
        style={[
          styles.progressFill, 
          { width: `${(currentStep / totalSteps) * 100}%` }
        ]} 
      />
    </View>
    <Text style={styles.stepText}>
      {steps[currentStep - 1] || 'Loading...'}
    </Text>
    <Text style={styles.progressText}>
      Step {currentStep} of {totalSteps}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  message: {
    marginTop: spacing.md,
    fontSize: typography.lg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  skeleton: {
    backgroundColor: colors.gray[200],
    opacity: 0.6,
  },
  progressiveContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepText: {
    fontSize: typography.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
