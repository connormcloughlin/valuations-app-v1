import transportClient from '../core/transport/transportClient';

/** Workflow task type codes the AI agent polls. */
export const ELECTRONICS_PRICING_TASK_CODE = 'electronics_pricing';
export const ART_VALUATION_TASK_CODE = 'art_valuation';

export interface TaskType {
  id: number;
  code: string;
  name: string;
  assignedToRole: string;
}

export interface CreateWorkflowTaskItem {
  assessmentId: number;
  taskTypeCode: string;
  assignedToRole: string;
  appointmentId?: number | null;
  dueAt?: string | null;
  notes?: string | null;
}

export interface CreateWorkflowTasksBody {
  orderId: number;
  tasks: CreateWorkflowTaskItem[];
  createdByUserId?: string | null;
}

export interface CreateWorkflowTasksResult {
  success: boolean;
  data?: WorkflowTask[];
  message?: string;
}

export interface GetAllowedTaskTypesResult {
  success: boolean;
  data?: TaskType[];
  message?: string;
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
 * Allowed workflow task types for an assessment (template matrix).
 * Used by Submit for QA to show Pricing / Art toggles only when allowed.
 */
export async function getAllowedWorkflowTaskTypes(
  assessmentId: number
): Promise<GetAllowedTaskTypesResult> {
  try {
    const response = await transportClient.get<{ data: TaskType[] } | TaskType[] | null>(
      'workflow.allowed-task-types',
      '/workflow/allowed-task-types',
      { assessmentId }
    );

    if (response == null) {
      return { success: true, data: [] };
    }

    if (Array.isArray(response)) {
      return { success: true, data: response };
    }

    if (typeof response === 'object' && response !== null && 'data' in response) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
      };
    }

    return { success: false, message: 'Invalid response from allowed-task-types API' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch allowed task types';
    console.error('Error fetching allowed workflow task types:', error);
    return { success: false, message };
  }
}

/**
 * Create workflow task(s) — bulk “Send to workflow” for AI agent pickup.
 */
export async function createWorkflowTasks(
  body: CreateWorkflowTasksBody
): Promise<CreateWorkflowTasksResult> {
  try {
    if (!body.orderId || !Array.isArray(body.tasks) || body.tasks.length === 0) {
      return { success: false, message: 'orderId and at least one task are required' };
    }

    const raw = await transportClient.post<{ data: WorkflowTask | WorkflowTask[] } | WorkflowTask[] | null>(
      'workflow.tasks.create',
      '/workflow/tasks',
      body
    );

    if (raw == null) {
      return { success: false, message: 'Empty response from create workflow tasks API' };
    }

    if (Array.isArray(raw)) {
      return { success: true, data: raw };
    }

    if (typeof raw === 'object' && raw !== null && 'data' in raw) {
      const data = raw.data;
      if (Array.isArray(data)) {
        return { success: true, data };
      }
      if (data && typeof data === 'object') {
        return { success: true, data: [data as WorkflowTask] };
      }
    }

    return { success: false, message: 'Invalid response from create workflow tasks API' };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: { message?: string } | string; message?: string } }; message?: string };
    const data = err.response?.data;
    const serverMessage =
      (typeof data?.error === 'object' && data?.error?.message) ||
      data?.message ||
      (typeof data?.error === 'string' ? data.error : null);
    const message = serverMessage || err.message || 'Failed to create workflow tasks';
    console.error('Error creating workflow tasks:', error);
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

    const raw = await transportClient.get<WorkflowTasksResponse | null>(
      'workflow.tasks',
      '/workflow/tasks',
      params
    );

    // 204 No Content / empty body → null from transport. Legacy: Axios object leaked when body was ''.
    let payload: WorkflowTasksResponse | null = null;
    if (raw == null) {
      payload = null;
    } else if (
      typeof raw === 'object' &&
      raw !== null &&
      'config' in raw &&
      'status' in raw &&
      typeof (raw as { status: unknown }).status === 'number'
    ) {
      const ax = raw as { status: number; data: unknown };
      if (ax.status === 204 || ax.data === '' || ax.data == null) {
        payload = null;
      } else {
        payload = ax.data as WorkflowTasksResponse;
      }
    } else {
      payload = raw as WorkflowTasksResponse;
    }

    if (payload == null) {
      return {
        success: true,
        data: [],
        pagination: {
          page,
          pageSize,
          totalCount: 0,
          totalPages: 0
        }
      };
    }

    if (typeof payload === 'object' && payload !== null && 'data' in payload) {
      return {
        success: true,
        data: Array.isArray(payload.data) ? payload.data : [],
        pagination: payload.pagination
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
