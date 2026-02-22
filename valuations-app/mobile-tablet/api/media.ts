import transportClient from '../core/transport/transportClient';

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
 * Map file type to API fileType (photo | signature | document).
 */
function toBackendFileType(fileType: string, fileName: string): string {
  if (fileType.includes('image')) return 'photo';
  if (fileType.includes('pdf') || fileType.includes('document')) return 'document';
  if (fileName.toLowerCase().includes('signature')) return 'signature';
  return 'photo';
}

/**
 * Upload media using JSON body with base64 (Option B per API guide).
 * API expects base64 in one of: data, base64Data, base64, fileData.
 * Content-Type: application/json.
 */
function buildJsonUploadBody(mediaData: {
  fileName: string;
  fileType: string;
  entityName: string;
  entityID: number;
  base64Data: string;
  metadata?: string;
  deviceId?: string;
  userId?: string;
}): Record<string, unknown> {
  const fileType = toBackendFileType(mediaData.fileType, mediaData.fileName);
  const body: Record<string, unknown> = {
    entityName: mediaData.entityName,
    entityId: mediaData.entityID,
    fileType,
    deviceId: mediaData.deviceId || 'mobile-device',
    userId: mediaData.userId || 'mobile-user',
    fileName: mediaData.fileName,
    data: mediaData.base64Data,
  };
  if (mediaData.metadata) body.metadata = mediaData.metadata;
  return body;
}

export async function uploadMedia(mediaData: {
  fileName: string;
  fileType: string;
  entityName: string;
  entityID: number;
  base64Data?: string;
  localFileUri?: string;
  metadata?: string;
  deviceId?: string;
  userId?: string;
}): Promise<ApiResponse> {
  try {
    if (!mediaData.base64Data) {
      return { success: false, message: 'Media upload requires base64Data (use JSON upload)', status: 400 };
    }
    const body = buildJsonUploadBody({
      ...mediaData,
      base64Data: mediaData.base64Data,
    });
    const data = await transportClient.post('sync.media.upload', '/sync/media/upload', body);
    return { success: true, data, status: 200 };
  } catch (error) {
    console.error('Error uploading media to sync API:', error);
    return handleApiError(error);
  }
}

export async function getMediaForEntity(entityName: string, entityID: number): Promise<ApiResponse> {
  try {
    const data = await transportClient.get('sync.media.entity', `/sync/media/entity/${entityName}/${entityID}`);
    return { success: true, data, status: 200 };
  } catch (error) {
    console.error('Error fetching media from sync API:', error);
    return handleApiError(error);
  }
}

/**
 * Delete media via sync API. Uses the backend media ID (from BackendMediaID in SQLite).
 * The backend expects the server-assigned media ID, not the local device MediaID.
 */
export async function deleteMedia(backendMediaID: number): Promise<ApiResponse> {
  try {
    const data = await transportClient.delete('sync.media.delete', `/sync/media/${backendMediaID}`);
    return { success: true, data, status: 200 };
  } catch (error) {
    console.error('Error deleting media from sync API:', error);
    return handleApiError(error);
  }
}

export async function fetchImage(mediaID: number): Promise<ApiResponse> {
  try {
    const payload = await transportClient.get<any>('media.image', `/media/${mediaID}/image`, undefined, { timeout: 30000 });
    let imageUrl: string;
    if (payload && typeof payload === 'object' && payload.imageUrl) {
      imageUrl = payload.imageUrl.startsWith('data:') ? payload.imageUrl : `data:image/jpeg;base64,${payload.imageUrl}`;
    } else if (typeof payload === 'string') {
      imageUrl = payload.startsWith('data:') ? payload : `data:image/jpeg;base64,${payload}`;
    } else {
      return { success: false, message: 'Unexpected image payload format', status: 500 };
    }
    return { success: true, data: { imageUrl, mediaID }, status: 200 };
  } catch (error) {
    console.error('Error fetching image through API proxy:', error);
    return handleApiError(error);
  }
}

export async function uploadMediaBatch(mediaFiles: Array<{
  mediaID?: number;
  fileName: string;
  fileType: string;
  entityName: string;
  entityID: number;
  base64Data: string;
  metadata?: string;
  uploadedAt: string;
  uploadedBy?: string;
}>): Promise<ApiResponse> {
  try {
    const results: Array<{ success: boolean; data?: any; status?: number; message?: string; originalMediaID?: number; backendMediaID?: number }> = [];
    for (const mediaFile of mediaFiles) {
      try {
        const body = buildJsonUploadBody({
          fileName: mediaFile.fileName,
          fileType: mediaFile.fileType,
          entityName: mediaFile.entityName,
          entityID: mediaFile.entityID,
          base64Data: mediaFile.base64Data,
          metadata: mediaFile.metadata,
          deviceId: 'mobile-device',
          userId: mediaFile.uploadedBy || 'mobile-user'
        });
        const data = await transportClient.post('sync.media.upload', '/sync/media/upload', body);
        const backendMediaID = data?.mediaFile?.mediaID ?? data?.mediaID ?? data?.id;
        const id = typeof backendMediaID === 'number' ? backendMediaID : undefined;
        results.push({ success: true, data, status: 200, originalMediaID: mediaFile.mediaID, backendMediaID: id });
      } catch (error: any) {
        results.push({
          success: false,
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
          originalMediaID: mediaFile.mediaID
        });
      }
    }
    return { success: true, data: { uploaded: results.filter(r => r.success).length, results }, status: 200 };
  } catch (error) {
    console.error('Error batch uploading media to sync API:', error);
    return handleApiError(error);
  }
}
