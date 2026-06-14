import transportClient from '../core/transport/transportClient';
import { debugLog } from '../utils/debugUtils';

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  status?: number;
}

function handleApiError(error: any): ApiResponse {
  if (error.response) {
    return { success: false, status: error.response.status, message: `Server error: ${error.response.status}` };
  }
  if (error.request) {
    return { success: false, message: 'No response from server. Check your connection.' };
  }
  return { success: false, message: error.message || 'Unknown error occurred' };
}

/**
 * POST /sync/batch. Server contract: persist and return `qty: null` (or omit) for unset quantity;
 * do not coerce blank qty to `1` in `results.riskAssessmentItems.updatedItems` or DB defaults.
 */
export async function syncChanges(syncData: {
  riskAssessmentItems?: any[];
  riskAssessmentMasters?: any[];
  appointments?: any[];
  syncTimestamp?: string;
  /** @see BACKEND_OFFLINE_SECTION_CLONE_SYNC.md — optional; backend may ignore until implemented */
  offlineSectionClones?: any[];
}): Promise<ApiResponse> {
  try {
    debugLog('SYNC POST /sync/batch payload (object)', syncData);
    debugLog('SYNC POST /sync/batch payload (json)', JSON.stringify(syncData, null, 2));
    const data = await transportClient.post('sync.batch', '/sync/batch', syncData);
    return { success: true, data, status: 200 };
  } catch (error) {
    console.error('Error syncing changes to server:', error);
    return handleApiError(error);
  }
}

export async function getSyncChanges(params: {
  lastSyncTimestamp: string;
  deviceId: string;
  userId: string;
  entities?: string[];
  excludeDeviceId?: string;
  limit?: number;
}): Promise<ApiResponse> {
  try {
    const entities =
      params.entities && params.entities.length > 0
        ? params.entities.join(',')
        : undefined;
    const data = await transportClient.get('sync.changes', '/sync/changes', {
      deviceId: params.deviceId,
      userId: params.userId,
      lastSyncTimestamp: params.lastSyncTimestamp,
      excludeDeviceId: params.excludeDeviceId ?? params.deviceId,
      entities,
      limit: params.limit ?? 200,
    });
    return { success: true, data, status: 200 };
  } catch (error) {
    console.error('Error fetching sync changes:', error);
    return handleApiError(error);
  }
}

export async function pushSyncBatch(syncData: {
  deviceId: string;
  userId: string;
  appointments?: any[];
  riskAssessmentMasters?: any[];
  riskAssessmentItems?: any[];
  deletedEntities?: any[];
}): Promise<ApiResponse> {
  try {
    const data = await transportClient.post('sync.batch', '/sync/batch', syncData);
    return { success: true, data, status: 200 };
  } catch (error) {
    console.error('Error pushing sync batch:', error);
    return handleApiError(error);
  }
}

export async function getSyncSessions(deviceId: string): Promise<ApiResponse> {
  try {
    const data = await transportClient.get('sync.sessions', '/sync/sessions', { deviceId });
    return { success: true, data, status: 200 };
  } catch (error) {
    console.error('Error fetching sync sessions:', error);
    return handleApiError(error);
  }
}

export async function getSyncHealth(): Promise<ApiResponse> {
  try {
    const data = await transportClient.get('sync.debug', '/sync/debug');
    return { success: true, data, status: 200 };
  } catch (error) {
    console.error('Error checking sync health:', error);
    return handleApiError(error);
  }
}
