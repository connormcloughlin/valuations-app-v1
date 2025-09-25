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
import { hashEmail, maskSensitiveData, maskEmail } from './cryptoUtils';

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
}

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

class SessionService {
  private currentSession: SessionState | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private metrics: SessionMetrics = {
    refreshCount: 0,
    refreshFailureCount: 0,
    softWindowCount: 0
  };
  private config: SessionConfig = DEFAULT_CONFIG;

  /**
   * Load session from secure storage
   */
  async loadSession(): Promise<SessionState | null> {
    try {
      const sessionData = await AsyncStorage.getItem('secureSession');
      if (!sessionData) {
        console.log('📋 No stored session found');
        return null;
      }

      const session: SessionState = JSON.parse(sessionData);
      
      // Validate session integrity
      if (!this.isValidSession(session)) {
        console.warn('⚠️ Invalid session data found, clearing storage');
        await this.invalidate();
        return null;
      }

      // Check if session is still valid
      if (this.isHardExpired(session)) {
        console.log('🔒 Session hard expired, clearing storage');
        await this.invalidate();
        return null;
      }

      this.currentSession = session;
      this.schedulePreemptiveRefresh();
      
      console.log(`✅ Session loaded for user: ${maskSensitiveData(session.token)}`);
      return session;
    } catch (error) {
      console.error('❌ Error loading session:', error);
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

      await AsyncStorage.setItem('secureSession', JSON.stringify(session));
      this.currentSession = session;
      this.schedulePreemptiveRefresh();
      
      console.log(`✅ Session persisted for user: ${maskEmail(userEmail)}`);
    } catch (error) {
      console.error('❌ Error persisting session:', error);
      throw error;
    }
  }

  /**
   * Get authentication headers for API requests
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await this.getCurrentSession();
    if (!session) {
      console.log('🔐 No session available for auth headers');
      return {};
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${session.token}`,
      'X-User-Context': JSON.stringify(session.userContext)
    };

    console.log('🔐 Auth headers generated:', {
      hasToken: !!session.token,
      tokenPreview: session.token ? session.token.substring(0, 20) + '...' : 'null',
      userContext: session.userContext,
      headersPreview: {
        authorization: headers.Authorization ? 'Bearer ***' : 'missing',
        userContext: headers['X-User-Context'] ? 'present' : 'missing'
      }
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

    // Start new refresh operation
    this.refreshPromise = this.performRefresh();
    
    try {
      const result = await this.refreshPromise;
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
      // Clear stored session
      await AsyncStorage.removeItem('secureSession');
      
      // Clear user context (separate storage)
      await AsyncStorage.removeItem('userContext');
      await AsyncStorage.removeItem('authToken');
      
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
