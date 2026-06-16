/**
 * Secure Session Service for Centralized Token & User Context Management
 * 
 * Continuity Strategy:
 * - Soft expiry triggers preemptive refresh (default 120s before expiry)
 * - Hard expiry forces logout only after grace period or explicit revocation
 * - Single-flight refresh prevents multiple concurrent refresh requests
 * - Request queuing during refresh ensures seamless operation continuity
 * 
 * Dependencies: Backend must provide soft/hard expiry timestamps in token payload or metadata
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { hashEmail, maskSensitiveData, maskEmail } from './cryptoUtils';
import { logger } from '../logging';

// Session state interface
interface SessionState {
  token: string;
  refreshToken?: string;
  userId: string;
  email: string;
  emailHash: string;
  userContext: {
    userId: string;
    emailHash: string;
  };
  softExpiry: number; // timestamp when preemptive refresh should start
  hardExpiry: number; // timestamp when token is absolutely invalid
  issuedAt: number;
  lastRefreshed?: number;
}

// Metrics counters
interface SessionMetrics {
  refreshCount: number;
  refreshFailureCount: number;
  softWindowCount: number;
  queuedRequestsCount: number;
  deduplicatedRequestsCount: number;
}

// Request queue item
interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  body?: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  signature: string; // For deduplication
}

// Continuity events
type ContinuityEvent = 
  | 'session:refresh-started'
  | 'session:refresh-success'
  | 'session:refresh-temporary-failure'
  | 'session:refresh-hard-failure'
  | 'session:queue-drained';

// Event listener type
type ContinuityEventListener = (event: ContinuityEvent, data?: any) => void;

// Configuration
interface SessionConfig {
  preemptiveRefreshThreshold: number; // seconds before expiry to trigger refresh
  maxRetries: number;
  baseRetryDelay: number; // milliseconds
  gracePerioAfterHardExpiry: number; // seconds
}

const DEFAULT_CONFIG: SessionConfig = {
  preemptiveRefreshThreshold: 120, // 2 minutes
  maxRetries: 2,
  baseRetryDelay: 500, // 500ms
  gracePerioAfterHardExpiry: 15 // 15 seconds
};

const SESSION_META_KEY = 'secureSessionMeta';
const SECURE_TOKEN_KEY = 'qv_auth_access_token';
const SECURE_REFRESH_KEY = 'qv_auth_refresh_token';
const LEGACY_SESSION_KEY = 'secureSession';

class SessionService {
  private currentSession: SessionState | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private requestQueue: QueuedRequest[] = [];
  private eventListeners: ContinuityEventListener[] = [];
  private metrics: SessionMetrics = {
    refreshCount: 0,
    refreshFailureCount: 0,
    softWindowCount: 0,
    queuedRequestsCount: 0,
    deduplicatedRequestsCount: 0
  };
  private config: SessionConfig = DEFAULT_CONFIG;

  /**
   * Load session from secure storage
   */
  async loadSession(): Promise<SessionState | null> {
    try {
      let sessionData = await AsyncStorage.getItem(SESSION_META_KEY);
      let token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
      let refreshToken = await SecureStore.getItemAsync(SECURE_REFRESH_KEY);

      if (!sessionData) {
        const legacyData = await AsyncStorage.getItem(LEGACY_SESSION_KEY);
        if (legacyData) {
          const legacySession = JSON.parse(legacyData) as SessionState;
          token = legacySession.token;
          refreshToken = legacySession.refreshToken;
          const { token: _t, refreshToken: _r, ...meta } = legacySession;
          sessionData = JSON.stringify(meta);
          await AsyncStorage.setItem(SESSION_META_KEY, sessionData);
          if (token) {
            await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token);
          }
          if (refreshToken) {
            await SecureStore.setItemAsync(SECURE_REFRESH_KEY, refreshToken);
          }
          await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
        }
      }

      if (!sessionData || !token) {
        logger.debug('No stored session found', { operation: 'session_load' });
        return null;
      }

      const sessionMeta = JSON.parse(sessionData) as Omit<SessionState, 'token' | 'refreshToken'>;
      const session: SessionState = {
        ...sessionMeta,
        token,
        refreshToken: refreshToken ?? undefined,
      };
      
      // Validate session integrity
      if (!this.isValidSession(session)) {
        logger.warn('Invalid session data found, clearing storage', { operation: 'session_validation' });
        await this.invalidate();
        return null;
      }

      // Check if session is still valid
      if (this.isHardExpired(session)) {
        logger.info('Session hard expired, clearing storage', { operation: 'session_expiry' });
        await this.invalidate();
        return null;
      }

      this.currentSession = session;
      this.schedulePreemptiveRefresh();
      
      logger.info('Session loaded successfully', { 
        operation: 'session_load',
        userId: session.userId,
        emailHash: session.emailHash
      });
      return session;
    } catch (error) {
      logger.error('Error loading session', { operation: 'session_load' }, undefined, error as Error);
      return null;
    }
  }

  /**
   * Persist session to secure storage
   */
  async persistSession(token: string, refreshToken: string, userEmail: string, userId: string): Promise<void> {
    try {
      const decodedToken = this.decodeJWT(token);
      if (!decodedToken) {
        throw new Error('Invalid token format');
      }

      const now = Date.now();
      const emailHash = await hashEmail(userEmail);
      
      // Extract expiry information from token
      const issuedAt = decodedToken.iat * 1000; // Convert to milliseconds
      const hardExpiry = decodedToken.exp * 1000; // Convert to milliseconds
      
      // Calculate soft expiry (preemptive refresh threshold)
      const softExpiry = hardExpiry - (this.config.preemptiveRefreshThreshold * 1000);

      const session: SessionState = {
        token,
        refreshToken,
        userId,
        email: userEmail,
        emailHash,
        userContext: {
          userId,
          emailHash
        },
        softExpiry,
        hardExpiry,
        issuedAt,
        lastRefreshed: now
      };

      const { token: accessToken, refreshToken: storedRefresh, ...meta } = session;
      await SecureStore.setItemAsync(SECURE_TOKEN_KEY, accessToken);
      if (storedRefresh) {
        await SecureStore.setItemAsync(SECURE_REFRESH_KEY, storedRefresh);
      } else {
        await SecureStore.deleteItemAsync(SECURE_REFRESH_KEY);
      }
      await AsyncStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
      await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
      this.currentSession = session;
      this.schedulePreemptiveRefresh();
      
      logger.info('Session persisted successfully', { 
        operation: 'session_persist',
        userId,
        emailHash: session.emailHash
      });
    } catch (error) {
      logger.error('Error persisting session', { operation: 'session_persist' }, undefined, error as Error);
      throw error;
    }
  }

  /**
   * Get authentication headers for API requests
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await this.getCurrentSession();
    if (!session) {
      logger.debug('No session available for auth headers', { operation: 'auth_headers' });
      return {};
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${session.token}`,
      'X-User-Context': JSON.stringify(session.userContext)
    };

    logger.debug('Auth headers generated', { 
      operation: 'auth_headers',
      userId: session.userId,
      emailHash: session.emailHash
    }, {
      hasToken: !!session.token,
      hasUserContext: !!session.userContext,
      headerCount: Object.keys(headers).length
    });

    return headers;
  }

  /**
   * Get current session with automatic refresh if needed
   */
  async getCurrentSession(): Promise<SessionState | null> {
    // Load session if not in memory
    if (!this.currentSession) {
      await this.loadSession();
    }

    if (!this.currentSession) {
      return null;
    }

    // Check if refresh is needed
    if (this.shouldRefresh(this.currentSession)) {
      const refreshed = await this.refreshIfStale();
      if (!refreshed) {
        return null;
      }
    }

    return this.currentSession;
  }

  /**
   * Refresh token if stale (single-flight pattern)
   */
  async refreshIfStale(): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    // Return existing refresh promise if already in progress
    if (this.refreshPromise) {
      console.log('⏳ Refresh already in progress, awaiting existing promise');
      return await this.refreshPromise;
    }

    // Emit refresh started event
    this.emitEvent('session:refresh-started');
    
    // Start new refresh operation
    this.refreshPromise = this.performRefresh();
    
    try {
      const result = await this.refreshPromise;
      
      if (result) {
        this.emitEvent('session:refresh-success');
        // Execute any queued requests
        await this.executeQueuedRequests();
      } else {
        this.emitEvent('session:refresh-temporary-failure');
      }
      
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh with retry logic
   */
  private async performRefresh(): Promise<boolean> {
    if (!this.currentSession?.refreshToken) {
      console.error('❌ No refresh token available');
      return false;
    }

    this.metrics.refreshCount++;

    for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt++) {
      try {
        console.log(`🔄 Attempting token refresh (attempt ${attempt})`);
        
        // TODO: Integrate with actual auth API
        // For now, we'll simulate the refresh
        const refreshResult = await this.callRefreshAPI(this.currentSession.refreshToken);
        
        if (refreshResult.success) {
          await this.persistSession(
            refreshResult.token,
            refreshResult.refreshToken,
            this.currentSession.email,
            this.currentSession.userId
          );
          
          console.log('✅ Token refreshed successfully');
          return true;
        }
        
        throw new Error(refreshResult.error || 'Refresh failed');
      } catch (error: any) {
        console.error(`❌ Refresh attempt ${attempt} failed:`, error.message);
        
        if (attempt <= this.config.maxRetries) {
          const delay = this.config.baseRetryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.delay(delay);
        } else {
          this.metrics.refreshFailureCount++;
          
          // Check if this is a hard failure (token revoked) or transient
          if (this.isHardFailure(error)) {
            console.error('🔒 Hard refresh failure, invalidating session');
            this.emitEvent('session:refresh-hard-failure', { error: error.message });
            await this.invalidate();
            return false;
          } else {
            console.warn('⚠️ Transient refresh failure, session still valid until hard expiry');
            return false;
          }
        }
      }
    }

    return false;
  }

  /**
   * Invalidate current session and clear storage
   */
  async invalidate(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSION_META_KEY);
      await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
      await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
      await SecureStore.deleteItemAsync(SECURE_REFRESH_KEY);
      
      // Clear user context (separate storage)
      await AsyncStorage.removeItem('userContext');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('reviewMode');
      
      // Clear memory state
      this.currentSession = null;
      
      // Cancel any pending refresh timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
      
      // Cancel any in-flight refresh
      this.refreshPromise = null;
      
      console.log('✅ Session invalidated and storage cleared');
    } catch (error) {
      console.error('❌ Error invalidating session:', error);
    }
  }

  /**
   * Get session metrics for debugging
   */
  getMetrics(): SessionMetrics {
    return { ...this.metrics };
  }

  /**
   * Queue a request during refresh to ensure continuity
   */
  async queueRequest<T>(
    method: string, 
    url: string, 
    executor: () => Promise<T>,
    body?: any
  ): Promise<T> {
    // If no refresh in progress, execute immediately
    if (!this.refreshPromise) {
      return await executor();
    }

    // Generate request signature for deduplication
    const signature = this.generateRequestSignature(method, url, body);
    
    // Check for duplicate requests
    const existingRequest = this.requestQueue.find(req => req.signature === signature);
    if (existingRequest) {
      console.log('🔄 Deduplicating request:', signature);
      this.metrics.deduplicatedRequestsCount++;
      
      // Return the existing promise
      return new Promise((resolve, reject) => {
        existingRequest.resolve = resolve;
        existingRequest.reject = reject;
      });
    }

    // Queue the request
    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: this.generateRequestId(),
        method,
        url,
        body,
        resolve: resolve as any,
        reject,
        timestamp: Date.now(),
        signature
      };

      this.requestQueue.push(queuedRequest);
      this.metrics.queuedRequestsCount++;
      
      console.log(`📋 Request queued (${this.requestQueue.length} total): ${method} ${url}`);
    });
  }

  /**
   * Execute all queued requests after successful refresh
   */
  private async executeQueuedRequests(): Promise<void> {
    if (this.requestQueue.length === 0) {
      return;
    }

    console.log(`🔄 Executing ${this.requestQueue.length} queued requests`);
    
    const requests = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of requests) {
      try {
        // Re-execute the request with fresh token
        const result = await this.executeRequest(request);
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }

    this.emitEvent('session:queue-drained', { executedCount: requests.length });
  }

  /**
   * Execute a single queued request
   */
  private async executeRequest(request: QueuedRequest): Promise<any> {
    // This would integrate with the transport client
    // For now, we'll simulate the execution
    console.log(`🔄 Executing queued request: ${request.method} ${request.url}`);
    
    // TODO: Integrate with actual transport client
    // This is a placeholder - in real implementation, this would call the transport client
    throw new Error('Request execution not implemented - requires transport client integration');
  }

  /**
   * Generate request signature for deduplication
   */
  private generateRequestSignature(method: string, url: string, body?: any): string {
    const bodyHash = body ? this.hashObject(body) : '';
    return `${method}:${url}:${bodyHash}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Hash object for signature generation
   */
  private hashObject(obj: any): string {
    try {
      const str = JSON.stringify(obj);
      // Simple hash function - in production, use crypto.subtle.digest
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36);
    } catch {
      return 'unknown';
    }
  }

  /**
   * Add event listener for continuity events
   */
  addEventListener(listener: ContinuityEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: ContinuityEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Emit continuity event
   */
  private emitEvent(event: ContinuityEvent, data?: any): void {
    console.log(`📡 Continuity event: ${event}`, data);
    this.eventListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('❌ Error in continuity event listener:', error);
      }
    });
  }

  /**
   * Check if session should be refreshed
   */
  private shouldRefresh(session: SessionState): boolean {
    const now = Date.now();
    
    // Check if we're in soft expiry window
    if (now >= session.softExpiry) {
      this.metrics.softWindowCount++;
      return true;
    }
    
    return false;
  }

  /**
   * Check if session is hard expired
   */
  private isHardExpired(session: SessionState): boolean {
    const now = Date.now();
    return now >= session.hardExpiry;
  }

  /**
   * Schedule preemptive refresh timer
   */
  private schedulePreemptiveRefresh(): void {
    if (!this.currentSession) return;
    
    const now = Date.now();
    const timeToSoftExpiry = this.currentSession.softExpiry - now;
    
    if (timeToSoftExpiry > 0) {
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
      }
      
      this.refreshTimer = setTimeout(() => {
        console.log('⏰ Preemptive refresh triggered by timer');
        this.refreshIfStale();
      }, timeToSoftExpiry);
      
      console.log(`⏰ Preemptive refresh scheduled in ${Math.round(timeToSoftExpiry / 1000)}s`);
    }
  }


  /**
   * Decode JWT token (client-side only, no signature verification)
   */
  private decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('❌ Failed to decode JWT:', error);
      return null;
    }
  }

  /**
   * Validate session structure
   */
  private isValidSession(session: any): session is SessionState {
    return session &&
           typeof session.token === 'string' &&
           typeof session.userId === 'string' &&
           typeof session.email === 'string' &&
           typeof session.emailHash === 'string' &&
           typeof session.softExpiry === 'number' &&
           typeof session.hardExpiry === 'number' &&
           session.userContext &&
           typeof session.userContext.userId === 'string' &&
           typeof session.userContext.emailHash === 'string';
  }


  /**
   * Check if refresh failure is hard (token revoked) or transient
   */
  private isHardFailure(error: any): boolean {
    // Check for explicit revocation codes from server
    if (error.status === 401 && error.code === 'TOKEN_REVOKED') {
      return true;
    }
    
    // Check for other permanent failure indicators
    if (error.status === 403 || error.status === 400) {
      return true;
    }
    
    // Treat network errors and 5xx as transient
    return false;
  }

  /**
   * Call refresh API using auth service
   */
  private async callRefreshAPI(refreshToken: string): Promise<{success: boolean, token?: string, refreshToken?: string, error?: string}> {
    try {
      // Import authApi dynamically to avoid circular dependencies
      const { default: authApi } = await import('../../api/auth');
      
      console.log('🔄 Calling refresh API with refresh token');
      const response = await authApi.refreshToken(refreshToken);
      
      if ((response as any).success && (response as any).data?.token) {
        return {
          success: true,
          token: (response as any).data.token,
          refreshToken: (response as any).data.refreshToken || refreshToken
        };
      } else {
        return {
          success: false,
          error: (response as any).data?.message || 'Refresh failed'
        };
      }
    } catch (error: any) {
      console.error('❌ Refresh API call failed:', error);
      return {
        success: false,
        error: error?.message || 'Network error during refresh'
      };
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const sessionService = new SessionService();
export default sessionService;
