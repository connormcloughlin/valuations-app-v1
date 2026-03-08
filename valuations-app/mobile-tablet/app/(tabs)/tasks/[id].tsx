import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { logNavigation } from '../../../utils/logger';
import { getTaskForDetail, clearTaskForDetail } from '../../../utils/taskDetailStore';
import { formatDateForSA, formatDateTimeForSA } from '../../../utils/dateUtils';
import type { WorkflowTask } from '../../../api/workflowTasks';
import { taskDetailStyles } from '../../GlobalStyles';
import { colors } from '../../GlobalStyles';

function DetailRow({
  label,
  value,
  last = false
}: {
  label: string;
  value: string | null | undefined;
  last?: boolean;
}) {
  if (value == null || value === '') return null;
  return (
    <View style={[taskDetailStyles.row, last && taskDetailStyles.rowLast]}>
      <Text style={taskDetailStyles.label}>{label}</Text>
      <Text style={taskDetailStyles.value}>{value}</Text>
    </View>
  );
}

export default function TaskDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<WorkflowTask | null>(null);

  useEffect(() => {
    logNavigation('Task Detail');
    const t = getTaskForDetail();
    setTask(t);
    return () => clearTaskForDetail();
  }, [params.id]);

  if (!task) {
    return (
      <>
        <Stack.Screen options={{ title: 'Task details' }} />
        <View style={[taskDetailStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={taskDetailStyles.value}>Task not found. Go back to the list.</Text>
        </View>
      </>
    );
  }

  const statusLabel = task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : '—';

  return (
    <>
      <Stack.Screen
        options={{
          title: task.taskType?.name ?? 'Task details',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      <ScrollView style={taskDetailStyles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={taskDetailStyles.section}>
          <Text style={taskDetailStyles.sectionTitle}>Overview</Text>
          <DetailRow label="Task ID" value={String(task.id)} />
          <DetailRow label="Order ID" value={String(task.orderId)} />
          <DetailRow label="Status" value={statusLabel} />
          <DetailRow label="Assessment ID" value={task.assessmentId != null ? String(task.assessmentId) : null} />
          <DetailRow label="Appointment ID" value={task.appointmentId != null ? String(task.appointmentId) : null} last />
        </View>

        <View style={taskDetailStyles.section}>
          <Text style={taskDetailStyles.sectionTitle}>Task type</Text>
          <DetailRow label="Name" value={task.taskType?.name ?? null} />
          <DetailRow label="Code" value={task.taskType?.code ?? null} />
          <DetailRow label="Assigned to role" value={task.taskType?.assignedToRole ?? null} last />
        </View>

        <View style={taskDetailStyles.section}>
          <Text style={taskDetailStyles.sectionTitle}>Dates</Text>
          <DetailRow label="Created" value={task.createdAt ? formatDateTimeForSA(task.createdAt).date + ' ' + formatDateTimeForSA(task.createdAt).time : null} />
          <DetailRow label="Claimed at" value={task.claimedAt ? formatDateTimeForSA(task.claimedAt).date + ' ' + formatDateTimeForSA(task.claimedAt).time : null} />
          <DetailRow label="Due at" value={task.dueAt ? formatDateTimeForSA(task.dueAt).date + ' ' + formatDateTimeForSA(task.dueAt).time : null} />
          <DetailRow label="Completed at" value={task.completedAt ? formatDateTimeForSA(task.completedAt).date + ' ' + formatDateTimeForSA(task.completedAt).time : null} last />
        </View>

        <View style={taskDetailStyles.section}>
          <Text style={taskDetailStyles.sectionTitle}>Assignment</Text>
          <DetailRow label="Assigned to role" value={task.assignedToRole ?? null} />
          <DetailRow label="Claimed by user ID" value={task.claimedByUserId ?? null} />
          <DetailRow label="Completed by user ID" value={task.completedByUserId ?? null} last />
        </View>

        {task.notes != null && task.notes !== '' && (
          <View style={taskDetailStyles.section}>
            <Text style={taskDetailStyles.sectionTitle}>Notes</Text>
            <View style={[taskDetailStyles.row, taskDetailStyles.rowLast]}>
              <Text style={[taskDetailStyles.value, taskDetailStyles.valueMultiline, { flex: 1 }]}>
                {task.notes}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}
