/**
 * Request Deduplication Service
 * Prevents multiple identical API calls from being made simultaneously
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicationService {
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  /**
   * Get or create a request promise
   * If the same request is already pending, return the existing promise
   */
  async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Clean up expired requests
    this.cleanupExpiredRequests();

    // Check if request is already pending
    const existingRequest = this.pendingRequests.get(key);
    if (existingRequest) {
      console.log(`🔄 Request deduplication: Reusing existing request for ${key}`);
      return existingRequest.promise;
    }

    // Create new request
    console.log(`🆕 Request deduplication: Creating new request for ${key}`);
    const promise = requestFn();
    
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    // Clean up after request completes
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return promise;
  }

  /**
   * Clean up expired requests
   */
  private cleanupExpiredRequests(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.REQUEST_TIMEOUT) {
        console.log(`🧹 Request deduplication: Cleaning up expired request ${key}`);
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Clear all pending requests
   */
  clearAll(): void {
    console.log(`🧹 Request deduplication: Clearing all pending requests`);
    this.pendingRequests.clear();
  }

  /**
   * Get current pending requests count
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

export const requestDeduplication = new RequestDeduplicationService();
