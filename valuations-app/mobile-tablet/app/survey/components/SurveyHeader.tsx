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
  /** Surveyor SLA status (from appointment). Optional. */
  surveyorStatus?: string | null;
  /** Surveyor segment due date (ISO). Optional. */
  surveyorDueDate?: string | null;
}

export default function SurveyHeader({ address, surveyorStatus, surveyorDueDate }: SurveyHeaderProps) {
  return (
    <Card style={styles.headerCard}>
      <Card.Content>
        <View style={styles.addressRow}>
          <MaterialCommunityIcons name="map-marker" size={20} color={colors.warning} />
          <Text style={styles.addressText}>{address}</Text>
        </View>

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
  slaBadgeContainer: {
    marginTop: spacing.md,
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