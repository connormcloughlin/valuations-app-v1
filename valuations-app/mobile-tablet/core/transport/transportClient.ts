import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../../constants/apiConfig';
import { policies } from './policies';
import { handleApiError, handleApiSuccess } from '../errors/errorHandler';
import { logger } from '../logging';
import { isReviewMode } from '../reviewMode/reviewMode';
import { getMockResponse } from '../reviewMode/mockData';

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
        // Explicit so future interceptors never leave Accept-Encoding empty; server may return Content-Encoding: gzip
        'Accept-Encoding': 'gzip, deflate',
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
        logger.error('Transport error occurred', {
          operation: 'transport_error'
        }, {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url
        }, error);
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
   * Dev-only: log Content-Encoding / Content-Length for large mobile GETs (verify gzip with API).
   * See docs/MOBILE_RESPONSE_COMPRESSION.md
   */
  private logMobileCompressionDev(
    response: AxiosResponse,
    requestUrl: string,
    method: string | undefined
  ): void {
    if (!__DEV__) return;
    if ((method || 'GET').toUpperCase() !== 'GET') return;
    const path = requestUrl || '';
    if (!path.includes('/mobile/')) return;
    const isLarge =
      path.includes('complete-hierarchy') ||
      path.includes('/categories/complete') ||
      path.includes('categories/all/complete');
    if (!isLarge) return;
    const h = response.headers || {};
    const enc = h['content-encoding'] ?? h['Content-Encoding'];
    const len = h['content-length'] ?? h['Content-Length'];
    console.log(
      `[HTTP] ${path} content-encoding=${enc ?? 'none'} content-length=${len ?? 'n/a'}`
    );
  }

  /**
   * Main request method with policy support
   */
  async request<T = any>(
    config: AxiosRequestConfig,
    options: RequestOptions = {}
  ): Promise<T> {
    const { endpointId, timeout, retries, skipCache, priority } = options;

    // Review mode: return mock data without calling the network
    const inReviewMode = await isReviewMode();
    if (inReviewMode) {
      const mock = await getMockResponse(
        endpointId,
        config.method?.toUpperCase() || 'GET',
        config.url || '',
        config.params,
        config.data
      );
      return mock as T;
    }
    
    // Get policy for endpoint if specified
    const policy = endpointId ? policies.get(endpointId) : null;
    
    // Merge config with policy settings
    const requestConfig: AxiosRequestConfig = {
      ...config,
      timeout: timeout || policy?.timeoutMs || this.config.timeout,
    };

    // When sending FormData (e.g. media upload), do not set Content-Type so the client
    // sets multipart/form-data with the correct boundary. Otherwise server gets "No file was uploaded".
    const isFormData = requestConfig.data && typeof (requestConfig.data as any).append === 'function';
    if (isFormData) {
      requestConfig.headers = { ...requestConfig.headers } as any;
      delete (requestConfig.headers as any)['Content-Type'];
    }
    
    // Store endpointId for header provider
    (requestConfig as any)._endpointId = endpointId;

    // Apply retry logic
    const maxRetries = retries ?? policy?.retry?.attempts ?? this.config.retries;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Log API request with structured logging
        logger.apiRequest(
          config.method?.toUpperCase() || 'GET',
          config.url || '',
          {
            endpointId,
            attempt: attempt + 1,
            timeout: requestConfig.timeout,
            priority: options.priority
          },
          {
            params: requestConfig.params,
            headers: Object.keys(requestConfig.headers || {}),
            hasData: !!requestConfig.data
          }
        );
        
        // For auth endpoints, add extra logging
        if (config.url?.includes('auth')) {
          logger.debug('Auth request details', {
            endpointId,
            operation: 'auth_request'
          }, {
            fullUrl: requestConfig.url,
            headers: requestConfig.headers,
            data: requestConfig.data
          });
        }

        const response = await this.axiosInstance(requestConfig);

        this.logMobileCompressionDev(response, config.url || '', config.method);

        // Log successful API response
        logger.apiResponse(
          response.status,
          config.url || '',
          {
            endpointId,
            attempt: attempt + 1
          },
          {
            responseTime: Date.now(),
            statusText: response.statusText,
            // Decoded JSON size after automatic gzip/br decompression — not wire bytes (see docs/MOBILE_RESPONSE_COMPRESSION.md)
            dataSize: JSON.stringify(response.data).length
          }
        );

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
          logger.debug(`Retrying request in ${delay}ms`, {
            endpointId,
            attempt: attempt + 1,
            maxRetries,
            operation: 'retry'
          });
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
   * PATCH request
   */
  async patch<T = any>(
    endpointId: string,
    path: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>({
      method: 'PATCH',
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
