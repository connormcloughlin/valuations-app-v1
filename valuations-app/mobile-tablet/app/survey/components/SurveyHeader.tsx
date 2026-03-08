import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import GlobalStyles constants
import { colors, spacing, borderRadius, typography } from '../../GlobalStyles';
import { SlaStatusBadge } from '../../../components/sla/SlaStatusBadge';
import { formatDateForSA } from '../../../utils/dateUtils';

interface SurveyHeaderProps {
  address: string;
  completedCategories: number;
  totalCategories: number;
  /** Surveyor SLA status (from appointment). Optional; when provided, badge is shown below progress bar. */
  surveyorStatus?: string | null;
  /** Surveyor segment due date (ISO). Optional. */
  surveyorDueDate?: string | null;
}

export default function SurveyHeader({ address, completedCategories, totalCategories, surveyorStatus, surveyorDueDate }: SurveyHeaderProps) {
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
          <View style={styles.slaBadgeContainer}>
            <View style={styles.slaRow}>
              <SlaStatusBadge
                surveyorStatus={surveyorStatus}
                surveyorDueDate={surveyorDueDate}
                compact={true}
              />
              <Text style={styles.surveyorDueLabel}>
                Surveyor due date: {surveyorDueDate ? formatDateForSA(surveyorDueDate) : '—'}
              </Text>
            </View>
          </View>
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
  slaBadgeContainer: {
    marginTop: spacing.sm,
  },
  slaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  surveyorDueLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
}); 