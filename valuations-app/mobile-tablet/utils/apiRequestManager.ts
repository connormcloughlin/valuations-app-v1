import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import asyncStorageManager from './asyncStorageManager';

// Configuration constants
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CIRCUIT_BREAKER_THRESHOLD = 5; // failures before opening circuit
const CIRCUIT_BREAKER_TIMEOUT = 30 * 1000; // 30 seconds
const REQUEST_TIMEOUT = 10 * 1000; // 10 seconds default timeout

interface CachedResponse {
  data: any;
  timestamp: number;
  etag?: string;
  lastModified?: string;
}

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

interface RequestOptions {
  cacheTTL?: number;
  skipCache?: boolean;
  skipDeduplication?: boolean;
  retries?: number;
  priority?: 'high' | 'normal' | 'low';
}

export class ApiRequestManager {
  private pendingRequests = new Map<string, PendingRequest>();
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private requestQueue: Array<{ key: string; config: AxiosRequestConfig; options: RequestOptions; resolve: Function; reject: Function }> = [];
  private isProcessingQueue = false;

  /**
   * Make a deduplicated, cached API request
   */
  async request<T = any>(
    config: AxiosRequestConfig,
    options: RequestOptions = {}
  ): Promise<T> {
    const requestKey = this.generateRequestKey(config);
    const {
      cacheTTL = DEFAULT_CACHE_TTL,
      skipCache = false,
      skipDeduplication = false,
      retries = 2,
      priority = 'normal'
    } = options;

    // Check circuit breaker
    if (this.isCircuitOpen(requestKey)) {
      throw new Error(`Circuit breaker open for ${config.url}`);
    }

    // Check cache first (unless skipped)
    if (!skipCache) {
      const cachedResponse = await this.getCachedResponse(requestKey);
      if (cachedResponse) {
        console.log(`📦 Cache hit for ${config.url}`);
        return cachedResponse.data;
      }
    }

    // Check for pending request (deduplication)
    if (!skipDeduplication && this.pendingRequests.has(requestKey)) {
      const pending = this.pendingRequests.get(requestKey)!;
      console.log(`🔄 Deduplicating request for ${config.url}`);
      return await pending.promise;
    }

    // Create new request
    const requestPromise = this.executeRequest(config, options, requestKey);
    
    // Store as pending (for deduplication)
    if (!skipDeduplication) {
      this.pendingRequests.set(requestKey, {
        promise: requestPromise,
        timestamp: Date.now()
      });
    }

    try {
      const result = await requestPromise;
      
      // Cache successful response
      if (!skipCache && result) {
        await this.cacheResponse(requestKey, result, cacheTTL);
      }
      
      // Reset circuit breaker on success
      this.resetCircuitBreaker(requestKey);
      
      return result;
      
    } catch (error) {
      // Record failure for circuit breaker
      this.recordFailure(requestKey);
      throw error;
      
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Execute the actual HTTP request with retries
   */
  private async executeRequest(
    config: AxiosRequestConfig,
    options: RequestOptions,
    requestKey: string
  ): Promise<any> {
    const { retries = 2 } = options;
    let lastError: any;

    // Set default timeout
    const requestConfig = {
      ...config,
      timeout: config.timeout || REQUEST_TIMEOUT
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🚀 API Request (attempt ${attempt + 1}/${retries + 1}): ${config.method?.toUpperCase() || 'GET'} ${config.url}`);
        
        const response: AxiosResponse = await axios(requestConfig);
        
        console.log(`✅ API Success: ${config.url} (${response.status})`);
        return response.data;
        
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ API Error (attempt ${attempt + 1}): ${config.url}`, error.message);
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Generate a unique key for request caching/deduplication
   */
  private generateRequestKey(config: AxiosRequestConfig): string {
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || '';
    const params = config.params ? JSON.stringify(config.params) : '';
    const data = config.data ? JSON.stringify(config.data) : '';
    
    return `${method}:${url}:${params}:${data}`;
  }

  /**
   * Get cached response if valid
   */
  private async getCachedResponse(requestKey: string): Promise<CachedResponse | null> {
    try {
      const cached = await asyncStorageManager.getItem(`api_cache_${requestKey}`);
      
      if (cached && typeof cached === 'object') {
        const cachedResponse = cached as CachedResponse;
        const age = Date.now() - cachedResponse.timestamp;
        
        console.log(`📦 Cache check for ${requestKey}: ${age}ms old`);
        return cachedResponse;
      }
      
      return null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  /**
   * Cache successful response
   */
  private async cacheResponse(requestKey: string, data: any, ttl: number): Promise<void> {
    try {
      const cachedResponse: CachedResponse = {
        data,
        timestamp: Date.now()
      };
      
      await asyncStorageManager.setItem(`api_cache_${requestKey}`, cachedResponse, ttl);
      console.log(`💾 Cached response for ${requestKey} (TTL: ${ttl / 1000}s)`);
      
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  /**
   * Circuit breaker functionality
   */
  private isCircuitOpen(requestKey: string): boolean {
    const domain = this.extractDomain(requestKey);
    const breaker = this.circuitBreakers.get(domain);
    
    if (!breaker) return false;
    
    const now = Date.now();
    
    switch (breaker.state) {
      case 'open':
        if (now - breaker.lastFailure > CIRCUIT_BREAKER_TIMEOUT) {
          breaker.state = 'half-open';
          console.log(`🔄 Circuit breaker half-open for ${domain}`);
          return false;
        }
        return true;
        
      case 'half-open':
        return false;
        
      default:
        return false;
    }
  }

  private recordFailure(requestKey: string): void {
    const domain = this.extractDomain(requestKey);
    const breaker = this.circuitBreakers.get(domain) || {
      failures: 0,
      lastFailure: 0,
      state: 'closed' as const
    };
    
    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      breaker.state = 'open';
      console.warn(`⚡ Circuit breaker opened for ${domain} (${breaker.failures} failures)`);
    }
    
    this.circuitBreakers.set(domain, breaker);
  }

  private resetCircuitBreaker(requestKey: string): void {
    const domain = this.extractDomain(requestKey);
    const breaker = this.circuitBreakers.get(domain);
    
    if (breaker) {
      breaker.failures = 0;
      breaker.state = 'closed';
      this.circuitBreakers.set(domain, breaker);
    }
  }

  private extractDomain(requestKey: string): string {
    // Extract domain/endpoint from request key for circuit breaker grouping
    const parts = requestKey.split(':');
    return parts.length > 1 ? parts[1].split('/')[0] : 'default';
  }

  /**
   * Batch multiple requests
   */
  async batchRequest<T = any>(
    requests: Array<{ config: AxiosRequestConfig; options?: RequestOptions }>,
    options: { maxConcurrency?: number; failFast?: boolean } = {}
  ): Promise<Array<T | Error>> {
    const { maxConcurrency = 5, failFast = false } = options;
    const results: Array<T | Error> = [];
    
    console.log(`📦 Batch request: ${requests.length} requests, max concurrency: ${maxConcurrency}`);
    
    // Process requests in chunks
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const chunk = requests.slice(i, i + maxConcurrency);
      
      const chunkPromises = chunk.map(async ({ config, options }) => {
        try {
          return await this.request<T>(config, options);
        } catch (error) {
          if (failFast) throw error;
          return error as Error;
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }
    
    console.log(`✅ Batch request completed: ${results.filter(r => !(r instanceof Error)).length}/${requests.length} successful`);
    return results;
  }

  /**
   * Clear all cached responses
   */
  async clearCache(): Promise<void> {
    try {
      // Get all keys and filter for API cache keys
      const stats = await asyncStorageManager.getStorageStats();
      console.log(`🧹 Clearing API cache (${stats.itemCount} items)`);
      
      // The asyncStorageManager will handle the cleanup
      await asyncStorageManager.cleanup();
      
      console.log('✅ API cache cleared');
    } catch (error) {
      console.error('❌ Error clearing API cache:', error);
    }
  }

  /**
   * Get cache and circuit breaker statistics
   */
  async getStats(): Promise<{
    pendingRequests: number;
    circuitBreakers: number;
    cacheSize: number;
  }> {
    const storageStats = await asyncStorageManager.getStorageStats();
    
    return {
      pendingRequests: this.pendingRequests.size,
      circuitBreakers: this.circuitBreakers.size,
      cacheSize: storageStats.totalSize
    };
  }

  /**
   * Clean up expired pending requests
   */
  cleanupPendingRequests(): void {
    const now = Date.now();
    const maxAge = 60 * 1000; // 1 minute
    
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > maxAge) {
        this.pendingRequests.delete(key);
        console.log(`🧹 Cleaned up stale pending request: ${key}`);
      }
    }
  }
}

// Export singleton instance
export const apiRequestManager = new ApiRequestManager();
export default apiRequestManager; 