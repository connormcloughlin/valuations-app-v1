import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, List, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSlaStatusLabel, getSlaStatusColor } from '../../constants/slaStatus';
import { formatDateForSA } from '../../utils/dateUtils';
import { workingDaysRemainingTo } from '../../utils/workingDays';

export interface SurveyorSlaCardProps {
  surveyorStatus: string | null | undefined;
  surveyorDueDate: string | null | undefined;
  surveyorStartDate?: string | null;
  /** Optional: if not provided, computed from surveyorDueDate via workingDaysRemainingTo */
  workingDaysRemaining?: number | null;
}

export const SurveyorSlaCard: React.FC<SurveyorSlaCardProps> = ({
  surveyorStatus,
  surveyorDueDate,
  surveyorStartDate,
  workingDaysRemaining: workingDaysProp
}) => {
  const hasSegment = surveyorStatus != null || surveyorDueDate != null || surveyorStartDate != null;
  const workingDays = workingDaysProp ?? (surveyorDueDate ? workingDaysRemainingTo(surveyorDueDate) : null);
  const label = getSlaStatusLabel(surveyorStatus);
  const color = getSlaStatusColor(surveyorStatus);

  if (!hasSegment) {
    return (
      <Card style={styles.card}>
        <Card.Title
          title="Surveyor SLA (5 days)"
          subtitle="Submit for QA within 5 working days of completing the appointment"
          left={(props) => <MaterialCommunityIcons name="clock-check-outline" {...props} size={24} color="#95a5a6" />}
        />
        <Card.Content>
          <Text style={styles.pendingText}>SLA starts when appointment is completed</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Surveyor SLA (5 days)"
        subtitle="Submit for QA within 5 working days of completing the appointment"
        left={(props) => <MaterialCommunityIcons name="clock-check-outline" {...props} size={24} color={color} />}
      />
      <Card.Content>
        <List.Item
          title="Status"
          description={label}
          left={(props) => <List.Icon {...props} icon="flag" color={color} />}
        />
        <Divider />
        {surveyorDueDate && (
          <>
            <List.Item
              title="Due date"
              description={formatDateForSA(surveyorDueDate)}
              left={(props) => <List.Icon {...props} icon="calendar" />}
            />
            <Divider />
          </>
        )}
        {workingDays !== null && (
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
