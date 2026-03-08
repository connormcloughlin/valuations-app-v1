import transportClient from '../core/transport/transportClient';

export interface TaskType {
  id: number;
  code: string;
  name: string;
  assignedToRole: string;
}

export interface WorkflowTask {
  id: number;
  orderId: number;
  assessmentId: number | null;
  appointmentId: number | null;
  taskType: TaskType;
  status: string;
  assignedToRole: string;
  claimedByUserId: string;
  claimedAt: string;
  createdAt: string;
  dueAt: string | null;
  completedAt: string | null;
  completedByUserId: string | null;
  notes: string | null;
}

export interface WorkflowTasksPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface WorkflowTasksResponse {
  data: WorkflowTask[];
  pagination: WorkflowTasksPagination;
}

export interface GetTasksResult {
  success: boolean;
  data?: WorkflowTask[];
  pagination?: WorkflowTasksPagination;
  message?: string;
}

export interface TaskTypesResponse {
  data: TaskType[];
}

export interface GetTaskTypesResult {
  success: boolean;
  data?: TaskType[];
  message?: string;
}

/**
 * Get workflow task types (for filtering).
 */
export async function getWorkflowTaskTypes(): Promise<GetTaskTypesResult> {
  try {
    const response = await transportClient.get<TaskTypesResponse>(
      'workflow.task-types',
      '/workflow/task-types'
    );

    if (response?.data && Array.isArray(response.data)) {
      return { success: true, data: response.data };
    }

    return { success: false, message: 'Invalid response from workflow task-types API' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch task types';
    console.error('Error fetching workflow task types:', error);
    return { success: false, message };
  }
}

/**
 * Get workflow tasks claimed by the given user (paginated).
 * @param userId - Azure AD user ID (e.g. from useAuth().user.id)
 * @param page - Page number (1-based)
 * @param pageSize - Page size (default 20)
 * @param taskTypeId - Optional task type ID to filter by (if supported by backend)
 * @param status - Optional comma-separated status filter (e.g. 'claimed, in_progress')
 */
export async function getWorkflowTasks(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
  taskTypeId?: number | null,
  status?: string
): Promise<GetTasksResult> {
  try {
    const params: Record<string, string | number> = {
      claimedByUserId: userId,
      page,
      pageSize
    };
    if (taskTypeId != null) {
      params.taskTypeId = taskTypeId;
    }
    if (status != null && status !== '') {
      params.status = status;
    }

    const response = await transportClient.get<WorkflowTasksResponse>(
      'workflow.tasks',
      '/workflow/tasks',
      params
    );

    if (response?.data) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        pagination: response.pagination
      };
    }

    return {
      success: false,
      message: 'Invalid response from workflow tasks API'
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch workflow tasks';
    console.error('Error fetching workflow tasks:', error);
    return { success: false, message };
  }
}
