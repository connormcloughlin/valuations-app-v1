import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { Card, Button, Chip, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { logNavigation } from '../../../utils/logger';
import { useAuth } from '../../../context/AuthContext';
import { scheduledAppointmentsStyles, colors } from '../../GlobalStyles';
import { formatDateForSA } from '../../../utils/dateUtils';
import { getWorkflowTasks, getWorkflowTaskTypes, type WorkflowTask, type TaskType } from '../../../api/workflowTasks';
import { setTaskForDetail } from '../../../utils/taskDetailStore';
import { SurveyorFilterIndicator } from '../../../components/SurveyorFilterIndicator';

function getTaskTypeIcon(code: string): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (code) {
    case 'book_appointment':
      return 'calendar-plus';
    case 'follow_up':
      return 'phone-in-talk';
    default:
      return 'clipboard-check';
  }
}

export default function TasksScreen() {
  logNavigation('Tasks Screen');
  const { user, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [selectedTaskTypeId, setSelectedTaskTypeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setLoading(false);
      return;
    }
    getWorkflowTaskTypes().then((res) => {
      if (res.success && res.data) setTaskTypes(res.data);
    });
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchTasks(page);
    } else {
      setLoading(false);
    }
  }, [page, isAuthenticated, user?.id, selectedTaskTypeId]);

  const fetchTasks = async (pageNum: number) => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const result = await getWorkflowTasks(
        user.id,
        pageNum,
        20,
        selectedTaskTypeId ?? undefined,
        'claimed, in_progress'
      );
      if (result.success && result.data !== undefined) {
        let list = result.data;
        if (selectedTaskTypeId != null) {
          list = list.filter((t) => t.taskType?.id === selectedTaskTypeId);
        }
        setTasks(list);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } else {
        setError(result.message ?? 'Failed to load tasks');
        setTasks([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSelectTaskType = (id: number | null) => {
    setSelectedTaskTypeId(id);
    setPage(1);
  };

  const filteredTasks =
    searchQuery.trim() === ''
      ? tasks
      : tasks.filter(
          (t) =>
            String(t.orderId).includes(searchQuery.trim()) ||
            (t.taskType?.name ?? '').toLowerCase().includes(searchQuery.trim().toLowerCase())
        );

  const statusLabel = (status: string) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1) : '';

  const openTaskDetail = (item: WorkflowTask) => {
    setTaskForDetail(item);
    router.push({ pathname: `/(tabs)/tasks/${item.id}`, params: { id: String(item.id) } });
  };

  const renderItem = ({ item }: { item: WorkflowTask }) => {
    const dateLabel = item.completedAt
      ? formatDateForSA(item.completedAt)
      : item.dueAt
        ? formatDateForSA(item.dueAt)
        : null;
    const taskCode = item.taskType?.code ?? '';

    return (
      <Card
        style={scheduledAppointmentsStyles.appointmentCard}
        onPress={() => openTaskDetail(item)}
      >
        <Card.Content>
          <View style={scheduledAppointmentsStyles.appointmentHeader}>
            <MaterialCommunityIcons
              name={getTaskTypeIcon(taskCode)}
              size={20}
              color={colors.primary}
              style={scheduledAppointmentsStyles.icon}
            />
            <Text style={scheduledAppointmentsStyles.appointmentAddress} numberOfLines={1}>
              {item.taskType?.name ?? 'Task'}
            </Text>
          </View>

          <View style={scheduledAppointmentsStyles.appointmentDetails}>
            <View style={scheduledAppointmentsStyles.detailRow}>
              <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.gray[500]} style={scheduledAppointmentsStyles.detailIcon} />
              <Text style={scheduledAppointmentsStyles.detailText}>Order: {item.orderId}</Text>
            </View>
            {dateLabel && (
              <View style={scheduledAppointmentsStyles.detailRow}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.gray[500]} style={scheduledAppointmentsStyles.detailIcon} />
                <Text style={scheduledAppointmentsStyles.detailText}>
                  {item.completedAt ? 'Completed: ' : 'Due: '}{dateLabel}
                </Text>
              </View>
            )}
            <View style={scheduledAppointmentsStyles.detailRow}>
              <MaterialCommunityIcons name="progress-clock" size={16} color={colors.gray[500]} style={scheduledAppointmentsStyles.detailIcon} />
              <Text style={scheduledAppointmentsStyles.detailText}>{statusLabel(item.status)}</Text>
            </View>
            {item.notes ? (
              <View style={scheduledAppointmentsStyles.detailRow}>
                <MaterialCommunityIcons name="note-text-outline" size={16} color={colors.gray[500]} style={scheduledAppointmentsStyles.detailIcon} />
                <Text style={scheduledAppointmentsStyles.detailText} numberOfLines={2}>{item.notes}</Text>
              </View>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const goToNextPage = () => {
    if (page < pagination.totalPages) setPage((p) => p + 1);
  };

  const goToPreviousPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  if (!isAuthenticated || !user) {
    return (
      <>
        <Stack.Screen options={{ title: 'Tasks', headerTitleStyle: { fontWeight: '600' } }} />
        <View style={[scheduledAppointmentsStyles.container, { padding: 20 }]}>
          <Text style={scheduledAppointmentsStyles.detailText}>Sign in to see your tasks.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Tasks',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />

      <View style={scheduledAppointmentsStyles.container}>
        <Searchbar
          placeholder="Search by order no. or task type"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={scheduledAppointmentsStyles.searchBar}
          iconColor={colors.primary}
        />

        {taskTypes.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Chip
                selected={selectedTaskTypeId === null}
                onPress={() => onSelectTaskType(null)}
                compact
                style={{ marginRight: 6 }}
              >
                All
              </Chip>
              {taskTypes.map((tt) => (
                <Chip
                  key={tt.id}
                  selected={selectedTaskTypeId === tt.id}
                  onPress={() => onSelectTaskType(tt.id)}
                  compact
                  style={{ marginRight: 6 }}
                >
                  {tt.name}
                </Chip>
              ))}
            </ScrollView>
          </View>
        )}

        {loading ? (
          <View style={scheduledAppointmentsStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={scheduledAppointmentsStyles.loadingText}>Loading tasks...</Text>
          </View>
        ) : error ? (
          <View style={scheduledAppointmentsStyles.errorContainer}>
            <Text style={scheduledAppointmentsStyles.errorText}>{error}</Text>
            <Button
              mode="contained"
              onPress={() => fetchTasks(page)}
              style={scheduledAppointmentsStyles.retryButton}
              buttonColor={colors.primary}
            >
              <Text style={{ color: 'white' }}>Retry</Text>
            </Button>
          </View>
        ) : tasks.length > 0 && filteredTasks.length > 0 ? (
          <>
            <SurveyorFilterIndicator
              appointmentCount={filteredTasks.length}
              showEmptyState={false}
              resource="tasks"
            />
            <FlatList
              data={filteredTasks}
              renderItem={renderItem}
              keyExtractor={(item) => `task-${item.id}`}
              contentContainerStyle={scheduledAppointmentsStyles.listContainer}
              refreshing={loading}
              onRefresh={() => fetchTasks(page)}
            />
            <View style={scheduledAppointmentsStyles.paginationContainer}>
              <Button
                mode="outlined"
                onPress={goToPreviousPage}
                disabled={page <= 1 || loading}
                style={scheduledAppointmentsStyles.paginationButton}
              >
                <MaterialCommunityIcons name="chevron-left" size={16} />
                Previous
              </Button>
              <Text style={scheduledAppointmentsStyles.paginationText}>
                Page {page} of {pagination.totalPages || 1}
              </Text>
              <Button
                mode="outlined"
                onPress={goToNextPage}
                disabled={page >= pagination.totalPages || loading}
                style={scheduledAppointmentsStyles.paginationButton}
              >
                Next
                <MaterialCommunityIcons name="chevron-right" size={16} />
              </Button>
            </View>
          </>
        ) : (
          <View style={scheduledAppointmentsStyles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={64} color="#ccc" />
            <Text style={scheduledAppointmentsStyles.emptyText}>
              {tasks.length === 0 ? 'No tasks found' : 'No tasks match your search'}
            </Text>
            <Text style={scheduledAppointmentsStyles.emptySubtext}>
              Try a different filter or search term
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
