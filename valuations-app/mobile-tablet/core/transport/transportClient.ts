import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../../constants/apiConfig';
import { policies } from './policies';
import { handleApiError, handleApiSuccess } from '../errors/errorHandler';

// Transport client configuration
interface TransportConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

interface RequestOptions {
  endpointId?: string;
  timeout?: number;
  retries?: number;
  skipCache?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

interface HeaderProvider {
  (endpointId?: string): Promise<Record<string, string>>;
}

class TransportClient {
  private axiosInstance: any;
  private headerProvider?: HeaderProvider;
  private config: TransportConfig;

  constructor() {
    this.config = {
      baseURL: API_BASE_URL,
      timeout: 10000,
      retries: 2,
      retryDelay: 1000
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    this.setupInterceptors();
  }

  /**
   * Set header provider for authentication and user context
   */
  setHeaderProvider(provider: HeaderProvider): void {
    this.headerProvider = provider;
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config: AxiosRequestConfig) => {
        // Add headers from provider if available
        if (this.headerProvider) {
          try {
            // Pass endpointId to header provider if available
            const endpointId = (config as any)._endpointId;
            const headers = await this.headerProvider(endpointId);
            Object.assign(config.headers, headers);
          } catch (error) {
            console.warn('Failed to get headers from provider:', error);
          }
        }

        // Add correlation ID
        config.headers = config.headers || {};
        config.headers['X-Request-Id'] = this.generateCorrelationId();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        console.error('Transport error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Main request method with policy support
   */
  async request<T = any>(
    config: AxiosRequestConfig,
    options: RequestOptions = {}
  ): Promise<T> {
    const { endpointId, timeout, retries, skipCache, priority } = options;
    
    // Get policy for endpoint if specified
    const policy = endpointId ? policies.get(endpointId) : null;
    
    // Merge config with policy settings
    const requestConfig: AxiosRequestConfig = {
      ...config,
      timeout: timeout || policy?.timeoutMs || this.config.timeout,
    };
    
    // Store endpointId for header provider
    (requestConfig as any)._endpointId = endpointId;

    // Apply retry logic
    const maxRetries = retries ?? policy?.retry?.attempts ?? this.config.retries;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (__DEV__) {
          console.log(`🚀 ${config.method?.toUpperCase() || 'GET'} ${config.url} (attempt ${attempt + 1})`);
          console.log(`📤 Request config:`, {
            url: requestConfig.url,
            method: requestConfig.method,
            params: requestConfig.params,
            headers: Object.keys(requestConfig.headers || {}),
            timeout: requestConfig.timeout
          });
          
          // For auth endpoints, add extra logging
          if (config.url?.includes('auth')) {
            console.log(`🔐 AUTH REQUEST - EndpointId: ${endpointId}`);
            console.log(`🔐 AUTH REQUEST - Full URL: ${requestConfig.url}`);
            console.log(`🔐 AUTH REQUEST - Headers:`, requestConfig.headers);
            console.log(`🔐 AUTH REQUEST - Data:`, typeof requestConfig.data === 'object' ? JSON.stringify(requestConfig.data, null, 2) : requestConfig.data);
          }
        }

        const response = await this.axiosInstance(requestConfig);
        
        if (__DEV__) {
          console.log(`✅ ${config.url} (${response.status})`);
        }

        // Use centralized success handling
        const successResult = handleApiSuccess(response, endpointId);
        return successResult.data;

      } catch (error: any) {
        lastError = error;
        
        // Use centralized error handling
        const errorResult = handleApiError(error, endpointId);
        
        // If error is treated as empty result, return it instead of throwing
        if (errorResult.treatAsEmpty) {
          return errorResult.data;
        }
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * this.config.retryDelay;
          if (__DEV__) {
            console.log(`⏳ Retrying in ${delay}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpointId: string,
    path: string,
    params?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url: path,
      params
    }, { ...options, endpointId });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpointId: string,
    path: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url: path,
      data
    }, { ...options, endpointId });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpointId: string,
    path: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      url: path,
      data
    }, { ...options, endpointId });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpointId: string,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      url: path
    }, { ...options, endpointId });
  }

  /**
   * Get transport metrics
   */
  getMetrics(): { baseURL: string; timeout: number; retries: number } {
    return {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      retries: this.config.retries
    };
  }
}

// Export singleton instance
export const transportClient = new TransportClient();
export default transportClient;
