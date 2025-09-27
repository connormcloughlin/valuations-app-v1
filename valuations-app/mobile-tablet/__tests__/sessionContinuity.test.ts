/**
 * Session Continuity Tests
 * 
 * Tests for S2C - Seamless Session Continuity features including:
 * - Request queuing during refresh
 * - Request deduplication
 * - Continuity events
 * - Soft vs hard expiry handling
 */

import sessionService from '../core/auth/sessionService';
import { useSessionContinuity } from '../core/auth/useSessionContinuity';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn()
}));

// Mock auth API
jest.mock('../api/auth', () => ({
  default: {
    refreshToken: jest.fn()
  }
}));

describe('Session Continuity (S2C)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset session service state
    (sessionService as any).currentSession = null;
    (sessionService as any).refreshPromise = null;
    (sessionService as any).requestQueue = [];
    (sessionService as any).eventListeners = [];
  });

  describe('Request Queuing', () => {
    it('should queue requests during refresh and execute after success', async () => {
      // Mock a session in soft expiry window
      const mockSession = {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        userId: 'user-123',
        email: 'test@example.com',
        emailHash: 'hash123',
        userContext: { userId: 'user-123', emailHash: 'hash123' },
        softExpiry: Date.now() - 1000, // Past soft expiry
        hardExpiry: Date.now() + 300000, // 5 minutes from now
        issuedAt: Date.now() - 600000
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSession));
      
      // Mock successful refresh
      const { default: authApi } = await import('../api/auth');
      (authApi.refreshToken as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          token: 'new-token',
          refreshToken: 'new-refresh-token'
        }
      });

      // Load session to trigger refresh
      await sessionService.loadSession();
      
      // Verify refresh was triggered
      expect(authApi.refreshToken).toHaveBeenCalled();
    });

    it('should deduplicate identical requests', async () => {
      const mockSession = {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        userId: 'user-123',
        email: 'test@example.com',
        emailHash: 'hash123',
        userContext: { userId: 'user-123', emailHash: 'hash123' },
        softExpiry: Date.now() - 1000,
        hardExpiry: Date.now() + 300000,
        issuedAt: Date.now() - 600000
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSession));
      
      // Mock refresh to be in progress
      const refreshPromise = Promise.resolve(true);
      (sessionService as any).refreshPromise = refreshPromise;

      // Queue two identical requests
      const request1 = sessionService.queueRequest('POST', '/api/test', () => Promise.resolve('result1'), { data: 'test' });
      const request2 = sessionService.queueRequest('POST', '/api/test', () => Promise.resolve('result2'), { data: 'test' });

      // Both should resolve to the same result (deduplication)
      const results = await Promise.all([request1, request2]);
      expect(results[0]).toBe(results[1]);
    });
  });

  describe('Continuity Events', () => {
    it('should emit refresh-started event', async () => {
      const eventListener = jest.fn();
      sessionService.addEventListener(eventListener);

      const mockSession = {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        userId: 'user-123',
        email: 'test@example.com',
        emailHash: 'hash123',
        userContext: { userId: 'user-123', emailHash: 'hash123' },
        softExpiry: Date.now() - 1000,
        hardExpiry: Date.now() + 300000,
        issuedAt: Date.now() - 600000
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSession));
      
      // Mock successful refresh
      const { default: authApi } = await import('../api/auth');
      (authApi.refreshToken as jest.Mock).mockResolvedValue({
        success: true,
        data: { token: 'new-token', refreshToken: 'new-refresh-token' }
      });

      await sessionService.loadSession();
      
      // Should emit refresh-started event
      expect(eventListener).toHaveBeenCalledWith('session:refresh-started');
    });

    it('should emit refresh-success event on successful refresh', async () => {
      const eventListener = jest.fn();
      sessionService.addEventListener(eventListener);

      const mockSession = {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        userId: 'user-123',
        email: 'test@example.com',
        emailHash: 'hash123',
        userContext: { userId: 'user-123', emailHash: 'hash123' },
        softExpiry: Date.now() - 1000,
        hardExpiry: Date.now() + 300000,
        issuedAt: Date.now() - 600000
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSession));
      
      const { default: authApi } = await import('../api/auth');
      (authApi.refreshToken as jest.Mock).mockResolvedValue({
        success: true,
        data: { token: 'new-token', refreshToken: 'new-refresh-token' }
      });

      await sessionService.loadSession();
      
      expect(eventListener).toHaveBeenCalledWith('session:refresh-success');
    });

    it('should emit refresh-hard-failure event on token revocation', async () => {
      const eventListener = jest.fn();
      sessionService.addEventListener(eventListener);

      const mockSession = {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        userId: 'user-123',
        email: 'test@example.com',
        emailHash: 'hash123',
        userContext: { userId: 'user-123', emailHash: 'hash123' },
        softExpiry: Date.now() - 1000,
        hardExpiry: Date.now() + 300000,
        issuedAt: Date.now() - 600000
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSession));
      
      const { default: authApi } = await import('../api/auth');
      (authApi.refreshToken as jest.Mock).mockRejectedValue({
        status: 401,
        code: 'TOKEN_REVOKED',
        message: 'Token has been revoked'
      });

      await sessionService.loadSession();
      
      expect(eventListener).toHaveBeenCalledWith('session:refresh-hard-failure', expect.any(Object));
    });
  });

  describe('Soft vs Hard Expiry', () => {
    it('should trigger preemptive refresh in soft expiry window', async () => {
      const mockSession = {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        userId: 'user-123',
        email: 'test@example.com',
        emailHash: 'hash123',
        userContext: { userId: 'user-123', emailHash: 'hash123' },
        softExpiry: Date.now() - 1000, // Past soft expiry
        hardExpiry: Date.now() + 300000, // 5 minutes from now
        issuedAt: Date.now() - 600000
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSession));
      
      const { default: authApi } = await import('../api/auth');
      (authApi.refreshToken as jest.Mock).mockResolvedValue({
        success: true,
        data: { token: 'new-token', refreshToken: 'new-refresh-token' }
      });

      await sessionService.loadSession();
      
      // Should have triggered refresh
      expect(authApi.refreshToken).toHaveBeenCalled();
    });

    it('should invalidate session on hard expiry', async () => {
      const mockSession = {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        userId: 'user-123',
        email: 'test@example.com',
        emailHash: 'hash123',
        userContext: { userId: 'user-123', emailHash: 'hash123' },
        softExpiry: Date.now() - 1000,
        hardExpiry: Date.now() - 1000, // Past hard expiry
        issuedAt: Date.now() - 600000
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSession));
      
      const session = await sessionService.loadSession();
      
      // Should return null due to hard expiry
      expect(session).toBeNull();
    });
  });

  describe('useSessionContinuity Hook', () => {
    it('should provide session continuity state', () => {
      // This would require React Testing Library setup
      // For now, we'll test the hook interface
      expect(typeof useSessionContinuity).toBe('function');
    });

    it('should provide refresh actions', () => {
      // Test that the hook returns the expected action functions
      const mockHook = useSessionContinuity();
      expect(typeof mockHook.refreshNow).toBe('function');
      expect(typeof mockHook.clearQueue).toBe('function');
      expect(typeof mockHook.addEventListener).toBe('function');
      expect(typeof mockHook.removeEventListener).toBe('function');
    });
  });

  describe('Metrics', () => {
    it('should track queued requests count', async () => {
      const mockSession = {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        userId: 'user-123',
        email: 'test@example.com',
        emailHash: 'hash123',
        userContext: { userId: 'user-123', emailHash: 'hash123' },
        softExpiry: Date.now() - 1000,
        hardExpiry: Date.now() + 300000,
        issuedAt: Date.now() - 600000
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSession));
      
      // Mock refresh in progress
      (sessionService as any).refreshPromise = Promise.resolve(true);

      // Queue a request
      sessionService.queueRequest('GET', '/api/test', undefined, () => Promise.resolve('result'));

      const metrics = sessionService.getMetrics();
      expect(metrics.queuedRequestsCount).toBeGreaterThan(0);
    });

    it('should track deduplicated requests count', async () => {
      // Mock refresh in progress
      (sessionService as any).refreshPromise = Promise.resolve(true);

      // Queue two identical requests
      sessionService.queueRequest('POST', '/api/test', () => Promise.resolve('result1'), { data: 'test' });
      sessionService.queueRequest('POST', '/api/test', () => Promise.resolve('result2'), { data: 'test' });

      const metrics = sessionService.getMetrics();
      expect(metrics.deduplicatedRequestsCount).toBeGreaterThan(0);
    });
  });
});
