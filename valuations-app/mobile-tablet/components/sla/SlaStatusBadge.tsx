import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getSlaStatusLabel, getSlaStatusColor } from '../../constants/slaStatus';
import { formatDateForSA } from '../../utils/dateUtils';

export interface SlaStatusBadgeProps {
  /** Surveyor segment status (on_track, at_risk, breached, met). Null = Pending. */
  surveyorStatus: string | null | undefined;
  /** Surveyor segment due date (ISO string). Optional, shown next to badge. */
  surveyorDueDate?: string | null;
  /** If true, show a compact badge only (no due date text). */
  compact?: boolean;
}

export const SlaStatusBadge: React.FC<SlaStatusBadgeProps> = ({
  surveyorStatus,
  surveyorDueDate,
  compact = false
}) => {
  const label = getSlaStatusLabel(surveyorStatus);
  const color = getSlaStatusColor(surveyorStatus);
  const formattedDue = surveyorDueDate ? formatDateForSA(surveyorDueDate) : null;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {!compact && formattedDue && (
        <Text style={styles.dueText}>Due {formattedDue}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  dueText: {
    fontSize: 12,
    color: '#666'
  }
});
