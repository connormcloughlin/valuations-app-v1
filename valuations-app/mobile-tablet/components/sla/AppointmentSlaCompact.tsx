import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSlaStatusLabel, getSlaStatusColor } from '../../constants/slaStatus';
import { formatDateForSA } from '../../utils/dateUtils';
import { workingDaysRemainingTo } from '../../utils/workingDays';

export interface AppointmentSlaCompactProps {
  surveyorStatus: string | null | undefined;
  surveyorDueDate: string | null | undefined;
  surveyorStartDate?: string | null;

  slaStatus: string | null | undefined;
  slaDueDate: string | null | undefined;
  slaStartDate?: string | null;
  completedAt?: string | null;
}

interface RowProps {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  windowLabel: string;
  status: string | null | undefined;
  dueDate: string | null | undefined;
  hasSegment: boolean;
  idleHint: string;
  /** Hide working days when SLA is closed (met / breached). */
  hideWorkingDaysWhenClosed?: boolean;
  completedAt?: string | null;
}

function SlaRow({
  iconName,
  title,
  windowLabel,
  status,
  dueDate,
  hasSegment,
  idleHint,
  hideWorkingDaysWhenClosed,
  completedAt
}: RowProps) {
  const color = hasSegment ? getSlaStatusColor(status) : '#95a5a6';
  const label = hasSegment ? getSlaStatusLabel(status) : 'Pending';
  const workingDays = dueDate ? workingDaysRemainingTo(dueDate) : null;

  const showWorkingDays =
    workingDays !== null &&
    !(hideWorkingDaysWhenClosed && (status === 'met' || status === 'breached'));

  const metaParts: string[] = [];
  if (dueDate) metaParts.push(`Due ${formatDateForSA(dueDate)}`);
  if (showWorkingDays && workingDays !== null) {
    if (workingDays > 0) metaParts.push(`${workingDays} working days left`);
    else if (workingDays < 0) metaParts.push(`${Math.abs(workingDays)} days overdue`);
    else metaParts.push('Due today');
  }
  if (completedAt) metaParts.push(`Completed ${formatDateForSA(completedAt)}`);
  const meta = metaParts.length ? metaParts.join(' · ') : (hasSegment ? '' : idleHint);

  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={iconName} size={20} color={color} style={styles.icon} />
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={styles.title} numberOfLines={1}>
            {title} <Text style={styles.window}>· {windowLabel}</Text>
          </Text>
          <View style={[styles.statusPill, { backgroundColor: color }]}>
            <Text style={styles.statusPillText} numberOfLines={1}>{label}</Text>
          </View>
        </View>
        {meta ? <Text style={styles.meta} numberOfLines={1}>{meta}</Text> : null}
      </View>
    </View>
  );
}

export const AppointmentSlaCompact: React.FC<AppointmentSlaCompactProps> = ({
  surveyorStatus,
  surveyorDueDate,
  surveyorStartDate,
  slaStatus,
  slaDueDate,
  slaStartDate,
  completedAt
}) => {
  const hasSurveyor = surveyorStatus != null || surveyorDueDate != null || surveyorStartDate != null;
  const hasFull = slaStatus != null || slaDueDate != null || slaStartDate != null;

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <SlaRow
          iconName="clock-check-outline"
          title="Surveyor SLA"
          windowLabel="5 days"
          status={surveyorStatus}
          dueDate={surveyorDueDate}
          hasSegment={hasSurveyor}
          idleHint="Starts when appointment is completed"
        />
        <View style={styles.divider} />
        <SlaRow
          iconName="clock-outline"
          title="Order SLA"
          windowLabel="10 days"
          status={slaStatus}
          dueDate={slaDueDate}
          hasSegment={hasFull}
          idleHint="Not started (no appointment booked)"
          hideWorkingDaysWhenClosed
          completedAt={completedAt ?? null}
        />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6
  },
  content: {
    paddingVertical: 6
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4
  },
  icon: {
    marginTop: 2,
    marginRight: 10
  },
  rowBody: {
    flex: 1,
    minWidth: 0
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 8
  },
  window: {
    fontSize: 12,
    fontWeight: '400',
    color: '#7f8c8d'
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    maxWidth: 110
  },
  statusPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: '#eef0f3',
    marginVertical: 4
  }
});
