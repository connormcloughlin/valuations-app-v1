/**
 * Centralized Error Handler
 * 
 * Integrates with the empty result policy to provide consistent
 * error handling across the application.
 */

import { evaluateEmptyResponse } from './emptyResultPolicy';

export interface ErrorHandlerResult {
  success: boolean;
  data: any;
  status: number;
  message: string;
  fromCache?: boolean;
  treatAsEmpty?: boolean;
}

/**
 * Handle API errors with centralized empty result policy
 * @param error - The error object
 * @param endpointId - The endpoint identifier
 * @param cachedData - Optional cached data to fall back to
 * @returns Standardized error response
 */
export function handleApiError(
  error: any,
  endpointId?: string,
  cachedData?: any
): ErrorHandlerResult {
  console.error('API Error:', error);
  
  if (error.response) {
    const status = error.response.status;
    const errorMessage = error.response.data?.message || error.message || '';
    const responseData = error.response.data;
    
    // Check if this should be treated as an empty result
    if (endpointId) {
      const emptyResult = evaluateEmptyResponse(
        endpointId,
        status,
        responseData,
        errorMessage
      );
      
      if (emptyResult.treatAsEmpty) {
        console.log(`📦 Treating ${status} as empty result for ${endpointId}: ${emptyResult.reason}`);
        
        return {
          success: true,
          data: [],
          status: 204, // Treat as No Content
          message: errorMessage,
          treatAsEmpty: true
        };
      }
      
      if (emptyResult.shouldLogWarning) {
        console.warn(`⚠️ ${endpointId}: ${emptyResult.reason}`);
      }
    }
    
    // Server responded with a status code outside the 2xx range
    return {
      success: false,
      status: status,
      message: `Server error: ${status}`,
      data: null
    };
  } else if (error.request) {
    // Request was made but no response was received
    console.warn('No response from server, checking for cached data...');
    
    // Try to use cached data if available
    if (cachedData && cachedData.data) {
      console.log('Using cached data due to network error');
      return {
        success: true,
        data: cachedData.data,
        status: 200,
        message: 'Using cached data due to network error',
        fromCache: true
      };
    }
    
    return {
      success: false,
      message: 'No response from server. Check your connection.',
      data: null,
      status: 0
    };
  } else {
    // Something happened in setting up the request
    return {
      success: false,
      message: error.message || 'Unknown error occurred',
      data: null,
      status: 0
    };
  }
}

/**
 * Handle successful responses with empty result policy validation
 * @param response - The response object
 * @param endpointId - The endpoint identifier
 * @returns Standardized success response
 */
export function handleApiSuccess(
  response: any,
  endpointId?: string
): ErrorHandlerResult {
  const data = response.data || response;
  const status = response.status || 200;
  
  // Check if this should be treated as an empty result
  if (endpointId && Array.isArray(data) && data.length === 0) {
    const emptyResult = evaluateEmptyResponse(endpointId, status, data);
    
    if (emptyResult.treatAsEmpty) {
      console.log(`📦 Treating empty array as valid result for ${endpointId}: ${emptyResult.reason}`);
    }
  }
  
  return {
    success: true,
    data: data,
    status: status,
    message: 'Success'
  };
}

/**
 * Legacy error handler for backward compatibility
 * @deprecated Use handleApiError with endpointId instead
 */
export function handleApiErrorLegacy(error: any): ErrorHandlerResult {
  console.warn('⚠️ Using legacy error handler - consider migrating to handleApiError with endpointId');
  
  if (error.response) {
    const status = error.response.status;
    const errorMessage = error.response.data?.message || error.message || '';
    
    // Legacy 404 handling with substring heuristics
    if (status === 404) {
      const isNoContentScenario = errorMessage.toLowerCase().includes('no items found') || 
                                  errorMessage.toLowerCase().includes('no data found') ||
                                  errorMessage.toLowerCase().includes('not found for this category');
      
      if (isNoContentScenario) {
        console.warn('⚠️ Using legacy substring heuristics for 404 handling');
        return {
          success: true,
          data: [],
          status: 204,
          message: errorMessage,
          treatAsEmpty: true
        };
      }
    }
    
    return {
      success: false,
      status: status,
      message: `Server error: ${status}`,
      data: null
    };
  } else if (error.request) {
    return {
      success: false,
      message: 'No response from server. Check your connection.',
      data: null,
      status: 0
    };
  } else {
    return {
      success: false,
      message: error.message || 'Unknown error occurred',
      data: null,
      status: 0
    };
  }
}
