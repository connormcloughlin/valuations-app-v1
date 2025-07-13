import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import GlobalStyles constants
import { colors, spacing, borderRadius, typography } from '../../GlobalStyles';

interface SurveyHeaderProps {
  address: string;
  completedCategories: number;
  totalCategories: number;
}

export default function SurveyHeader({ address, completedCategories, totalCategories }: SurveyHeaderProps) {
  const progress = Math.floor((completedCategories / totalCategories) * 100);

  return (
    <Card style={styles.headerCard}>
      <Card.Content>
        <View style={styles.addressRow}>
          <MaterialCommunityIcons name="map-marker" size={20} color={colors.warning} />
          <Text style={styles.addressText}>{address}</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>Survey Progress</Text>
            <Text style={styles.progressPercentage}>{progress}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressDetails}>
            {completedCategories} of {totalCategories} categories completed
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addressText: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  progressPercentage: {
    fontSize: typography.sm,
    fontWeight: 'bold',
    color: colors.warning,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.warning,
  },
  progressDetails: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
}); 