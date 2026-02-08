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

function buildFormData(mediaData: {
  fileName: string;
  fileType: string;
  entityName: string;
  entityID: number;
  base64Data: string;
  metadata?: string;
  deviceId?: string;
  userId?: string;
}): FormData {
  const formData = new FormData();
  formData.append('file', {
    uri: `data:${mediaData.fileType};base64,${mediaData.base64Data}`,
    type: mediaData.fileType,
    name: mediaData.fileName
  } as any);
  formData.append('entityName', mediaData.entityName);
  formData.append('entityId', mediaData.entityID.toString());
  let backendFileType = 'photo';
  if (mediaData.fileType.includes('image')) backendFileType = 'photo';
  else if (mediaData.fileType.includes('pdf') || mediaData.fileType.includes('document')) backendFileType = 'document';
  else if (mediaData.fileName.toLowerCase().includes('signature')) backendFileType = 'signature';
  formData.append('fileType', backendFileType);
  formData.append('deviceId', mediaData.deviceId || 'mobile-device');
  formData.append('userId', mediaData.userId || 'mobile-user');
  if (mediaData.metadata) formData.append('metadata', mediaData.metadata);
  return formData;
}

export async function uploadMedia(mediaData: {
  fileName: string;
  fileType: string;
  entityName: string;
  entityID: number;
  base64Data: string;
  metadata?: string;
  deviceId?: string;
  userId?: string;
}): Promise<ApiResponse> {
  try {
    const formData = buildFormData(mediaData);
    const data = await transportClient.post('sync.media.upload', '/sync/media/upload', formData);
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

export async function deleteMedia(mediaID: number): Promise<ApiResponse> {
  try {
    const data = await transportClient.delete('media.delete', `/media/${mediaID}`);
    return { success: true, data, status: 200 };
  } catch (error) {
    console.error('Error deleting media from backend:', error);
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
    const results: Array<{ success: boolean; data?: any; status?: number; message?: string; originalMediaID?: number }> = [];
    for (const mediaFile of mediaFiles) {
      try {
        const formData = buildFormData({
          ...mediaFile,
          deviceId: 'mobile-device',
          userId: mediaFile.uploadedBy || 'mobile-user'
        });
        const data = await transportClient.post('sync.media.upload', '/sync/media/upload', formData);
        results.push({ success: true, data, status: 200, originalMediaID: mediaFile.mediaID });
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
