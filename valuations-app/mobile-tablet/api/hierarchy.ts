import transportClient from '../core/transport/transportClient';
import { requestDeduplication } from '../core/requestDeduplication';
import { getData, storeData, removeCachedKey } from './cache';
import { normalizeCompleteHierarchyEnvelope } from '../utils/completeHierarchyPayload';

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  status?: number;
  fromCache?: boolean;
}

function handleApiError(error: any): ApiResponse {
  if (error.response) {
    const data = error.response.data;
    const msg =
      (typeof data?.message === 'string' && data.message) ||
      (typeof data?.error === 'string' && data.error) ||
      `Server error: ${error.response.status}`;
    return { success: false, status: error.response.status, message: msg };
  }
  if (error.request) {
    return { success: false, message: 'No response from server. Check your connection.' };
  }
  return { success: false, message: error.message || 'Unknown error occurred' };
}

export async function getRiskAssessmentMasterByOrder(orderId: string): Promise<ApiResponse> {
  try {
    const data = await transportClient.get('risk-assessment.master', `/risk-assessment-master/by-order/${orderId}`);
    // 204 No Content or empty body is valid (e.g. no risk assessment for this order)
    return { success: true, data: data ?? null, status: 200 };
  } catch (error) {
    console.error('Error fetching risk assessment master by order:', error);
    return handleApiError(error);
  }
}

export async function getRiskAssessmentCompleteHierarchy(orderId: string): Promise<ApiResponse> {
  const cacheKey = `risk_assessment_hierarchy_${orderId}`;
  let isOnline = true;
  try {
    const NetInfo = await import('@react-native-community/netinfo');
    const netInfo = await NetInfo.default.fetch();
    isOnline = netInfo.isConnected === true && netInfo.isInternetReachable === true;
  } catch {
    // assume online
  }
  let cachedData = null;
  try {
    cachedData = await getData(cacheKey);
  } catch (e) {
    console.error('Error reading cached hierarchy data:', e);
  }
  if (!isOnline) {
    if (cachedData?.data) {
      const normalized = normalizeCompleteHierarchyEnvelope(cachedData.data);
      if (normalized.success && normalized.data) {
        return {
          success: true,
          data: normalized.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data (offline)'
        };
      }
    }
    return { success: false, message: 'You are offline and no cached hierarchy data is available.', status: 0, data: null };
  }
  try {
    const data = await requestDeduplication.deduplicateRequest(
      `risk-assessment.hierarchy:${orderId}`,
      () =>
        transportClient.get(
          'risk-assessment.hierarchy',
          `/mobile/risk-assessment/${orderId}/complete-hierarchy`
        )
    );
    const normalized = normalizeCompleteHierarchyEnvelope(data);
    if (normalized.success && normalized.data) {
      try {
        await storeData(cacheKey, data, 4 * 60 * 60 * 1000);
      } catch (storageError) {
        console.error('Error caching hierarchy data:', storageError);
      }
      return { success: true, data: normalized.data, status: 200 };
    }
    throw new Error('Invalid response format from composite API');
  } catch (error) {
    console.error('Error fetching complete hierarchy from server:', error);
    if (cachedData?.data) {
      const normalized = normalizeCompleteHierarchyEnvelope(cachedData.data);
      if (normalized.success && normalized.data) {
        return {
          success: true,
          data: normalized.data,
          fromCache: true,
          status: 200,
          message: 'Using cached data due to server error'
        };
      }
    }
    return handleApiError(error);
  }
}

export function riskAssessmentHierarchyCacheKey(orderId: string): string {
  return `risk_assessment_hierarchy_${orderId}`;
}

/** Call after section clone (or similar) so the next hierarchy read refetches from API. */
export async function invalidateRiskAssessmentHierarchyCache(orderId: string): Promise<void> {
  await removeCachedKey(riskAssessmentHierarchyCacheKey(orderId));
}

/**
 * Clone a section under the same risk assessment (structure-only; server creates rows).
 * Backend contract: [BACKEND_SECTION_CLONE_API_SPEC.md](../BACKEND_SECTION_CLONE_API_SPEC.md)
 */
export async function cloneRiskAssessmentSection(
  riskAssessmentId: string | number,
  body: {
    sourceRiskAssessmentSectionId: number;
    targetSectionName?: string;
    clientMutationId?: string;
  }
): Promise<ApiResponse> {
  try {
    const id = String(riskAssessmentId);
    const payload = await transportClient.post(
      'risk-assessment.section-clone',
      `/mobile/risk-assessment/${id}/sections/clone`,
      body
    );
    if (payload && typeof payload === 'object' && payload.success === false) {
      const p = payload as { message?: string; error?: string; data?: unknown; status?: number };
      const errText =
        (typeof p.message === 'string' && p.message) ||
        (typeof p.error === 'string' && p.error) ||
        '';
      return {
        success: false,
        message: errText || 'Section clone failed',
        data: p.data,
        status: p.status
      };
    }
    return { success: true, data: payload?.data ?? payload, status: 200 };
  } catch (error) {
    console.error('cloneRiskAssessmentSection error:', error);
    return handleApiError(error);
  }
}

export async function getOrderCategoryFieldConfigurations(orderId: string): Promise<ApiResponse> {
  const cacheKey = `order_field_configurations_${orderId}`;
  let isOnline = true;
  try {
    const NetInfo = await import('@react-native-community/netinfo');
    const netInfo = await NetInfo.default.fetch();
    isOnline = netInfo.isConnected === true && netInfo.isInternetReachable === true;
  } catch {
    // assume online
  }
  let cachedData = null;
  try {
    cachedData = await getData(cacheKey);
  } catch (e) {
    console.error('Error reading cached field config data:', e);
  }
  if (!isOnline) {
    if (cachedData?.data) {
      return { success: true, data: cachedData.data, fromCache: true, status: 200, message: 'Using cached data (offline)' };
    }
    return { success: false, message: 'You are offline and no cached field configuration data is available.', status: 0, data: null };
  }
  try {
    const data = await requestDeduplication.deduplicateRequest(
      `config.order.categories:${orderId}`,
      () =>
        transportClient.get(
          'config.order.categories',
          `/mobile/config/order/${orderId}/categories/complete`
        )
    );
    // API returns { success, data: { categories } }; transport returns that or [] when 404 treated as empty
    const normalized = Array.isArray(data)
      ? { success: true, data: { categories: data }, status: 200 }
      : data;
    if (normalized?.success) {
      try {
        await storeData(cacheKey, normalized, 4 * 60 * 60 * 1000);
      } catch (storageError) {
        console.error('Error caching field config data:', storageError);
      }
      return normalized;
    }
    throw new Error('Invalid response format from field config API');
  } catch (error) {
    console.error('Error fetching order field configurations from server:', error);
    if (cachedData?.data) {
      return { success: true, data: cachedData.data, fromCache: true, status: 200, message: 'Using cached data due to server error' };
    }
    return handleApiError(error);
  }
}
