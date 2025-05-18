import axios from 'axios';
import { API_CONFIG } from './config';

// Create axios instance with config
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS
});

// Add response interceptor for standardizing responses
apiClient.interceptors.response.use(
  (response) => {
    // For successful responses, wrap in standard format
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },
  (error) => {
    // For error responses, format error information
    const errorResponse = {
      success: false,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'Unknown error occurred'
    };
    
    // Still reject the promise, but with formatted error
    return Promise.reject(errorResponse);
  }
);

export default apiClient; 