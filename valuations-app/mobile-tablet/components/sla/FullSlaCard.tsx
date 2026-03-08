import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Card, List, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSlaStatusLabel, getSlaStatusColor } from '../../constants/slaStatus';
import { formatDateForSA } from '../../utils/dateUtils';
import { workingDaysRemainingTo } from '../../utils/workingDays';

export interface FullSlaCardProps {
  slaStatus: string | null | undefined;
  slaDueDate: string | null | undefined;
  slaStartDate?: string | null;
  completedAt?: string | null;
}

export const FullSlaCard: React.FC<FullSlaCardProps> = ({
  slaStatus,
  slaDueDate,
  slaStartDate,
  completedAt
}) => {
  const hasSla = slaStatus != null || slaDueDate != null || slaStartDate != null;
  const workingDays = slaDueDate ? workingDaysRemainingTo(slaDueDate) : null;
  const label = getSlaStatusLabel(slaStatus);
  const color = getSlaStatusColor(slaStatus);

  if (!hasSla) {
    return (
      <Card style={styles.card}>
        <Card.Title
          title="Order SLA (10 days)"
          subtitle="Full order cycle from appointment to completion"
          left={(props) => <MaterialCommunityIcons name="clock-outline" {...props} size={24} color="#95a5a6" />}
        />
        <Card.Content>
          <Text style={styles.pendingText}>SLA not started (no appointment booked)</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Order SLA (10 days)"
        subtitle="Full order cycle from appointment to completion"
        left={(props) => <MaterialCommunityIcons name="clock-outline" {...props} size={24} color={color} />}
      />
      <Card.Content>
        <List.Item
          title="Status"
          description={label}
          left={(props) => <List.Icon {...props} icon="flag" color={color} />}
        />
        <Divider />
        {slaDueDate && (
          <>
            <List.Item
              title="Due date"
              description={formatDateForSA(slaDueDate)}
              left={(props) => <List.Icon {...props} icon="calendar" />}
            />
            <Divider />
          </>
        )}
        {workingDays !== null && slaStatus !== 'met' && slaStatus !== 'breached' && (
          <List.Item
            title="Working days"
            description={
              workingDays > 0
                ? `${workingDays} working days remaining`
                : workingDays < 0
                  ? `${Math.abs(workingDays)} days overdue`
                  : 'Due today'
            }
            left={(props) => <List.Icon {...props} icon="calendar-clock" />}
          />
        )}
        {completedAt && (
          <List.Item
            title="Completed"
            description={formatDateForSA(completedAt)}
            left={(props) => <List.Icon {...props} icon="check-circle" />}
          />
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8
  },
  pendingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  }
});
