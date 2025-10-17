/**
 * Tests for SessionService
 * Validates core functionality including refresh coalescing, preemptive refresh, and metrics
 */

import sessionService from '../core/auth/sessionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock crypto utilities
jest.mock('../core/auth/cryptoUtils', () => ({
  hashEmail: jest.fn((email: string) => Promise.resolve(`hash_${email}`)),
  maskSensitiveData: jest.fn((data: string) => `${data.substring(0, 6)}...[${data.length}]`),
  maskEmail: jest.fn((email: string) => `${email.split('@')[0].substring(0, 2)}***@${email.split('@')[1]}`),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any existing session state
    sessionService.invalidate();
  });

  describe('persistSession', () => {
    it('should persist session with hashed email', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38gSNa6831S0xJBOP7VUEXk-jnhQnwy-75Nc4k4o';
      const refreshToken = 'refresh_token_123';
      const email = 'test@example.com';
      const userId = 'user123';

      await sessionService.persistSession(mockToken, refreshToken, email, userId);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'secureSession',
        expect.stringContaining('"emailHash":"hash_test@example.com"')
      );
    });
  });

  describe('loadSession', () => {
    it('should return null for invalid session data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid_json');

      const session = await sessionService.loadSession();

      expect(session).toBeNull();
    });

    it('should return null for expired session', async () => {
      const expiredSession = {
        token: 'token',
        userId: 'user123',
        email: 'test@example.com',
        emailHash: 'hash_test@example.com',
        userContext: { userId: 'user123', emailHash: 'hash_test@example.com' },
        softExpiry: Date.now() - 1000, // 1 second ago
        hardExpiry: Date.now() - 1000, // 1 second ago (expired)
        issuedAt: Date.now() - 3600000, // 1 hour ago
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(expiredSession));

      const session = await sessionService.loadSession();

      expect(session).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('secureSession');
    });

    it('should load valid session successfully', async () => {
      const validSession = {
        token: 'token',
        userId: 'user123',
        email: 'test@example.com',
        emailHash: 'hash_test@example.com',
        userContext: { userId: 'user123', emailHash: 'hash_test@example.com' },
        softExpiry: Date.now() + 600000, // 10 minutes from now
        hardExpiry: Date.now() + 3600000, // 1 hour from now
        issuedAt: Date.now() - 1000, // 1 second ago
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(validSession));

      const session = await sessionService.loadSession();

      expect(session).toEqual(validSession);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return empty headers when no session', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const headers = await sessionService.getAuthHeaders();

      expect(headers).toEqual({});
    });

    it('should return auth headers for valid session', async () => {
      const validSession = {
        token: 'valid_token',
        userId: 'user123',
        email: 'test@example.com',
        emailHash: 'hash_test@example.com',
        userContext: { userId: 'user123', emailHash: 'hash_test@example.com' },
        softExpiry: Date.now() + 600000,
        hardExpiry: Date.now() + 3600000,
        issuedAt: Date.now() - 1000,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(validSession));

      const headers = await sessionService.getAuthHeaders();

      expect(headers).toEqual({
        'Authorization': 'Bearer valid_token',
        'X-User-Context': JSON.stringify(validSession.userContext)
      });
    });
  });

  describe('invalidate', () => {
    it('should clear all stored session data', async () => {
      await sessionService.invalidate();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('secureSession');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('userContext');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('metrics', () => {
    it('should track metrics counters', () => {
      const metrics = sessionService.getMetrics();

      expect(metrics).toEqual({
        refreshCount: 0,
        refreshFailureCount: 0,
        softWindowCount: 0
      });
    });
  });

  describe('refreshIfStale', () => {
    it('should return false when no session', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await sessionService.refreshIfStale();

      expect(result).toBe(false);
    });

    it('should implement single-flight refresh pattern', async () => {
      const validSession = {
        token: 'valid_token',
        refreshToken: 'refresh_token',
        userId: 'user123',
        email: 'test@example.com',
        emailHash: 'hash_test@example.com',
        userContext: { userId: 'user123', emailHash: 'hash_test@example.com' },
        softExpiry: Date.now() - 1000, // Already in soft expiry window
        hardExpiry: Date.now() + 3600000,
        issuedAt: Date.now() - 1000,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(validSession));

      // Start two concurrent refresh operations
      const promise1 = sessionService.refreshIfStale();
      const promise2 = sessionService.refreshIfStale();

      // Both should resolve to the same result (single-flight pattern)
      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe(result2);
    });
  });
});

/**
 * Integration tests for SessionService continuity features
 */
describe('SessionService Continuity', () => {
  it('should handle soft vs hard expiry correctly', async () => {
    // Session in soft expiry window but not hard expired
    const sessionInSoftWindow = {
      token: 'token',
      refreshToken: 'refresh_token',
      userId: 'user123',
      email: 'test@example.com',
      emailHash: 'hash_test@example.com',
      userContext: { userId: 'user123', emailHash: 'hash_test@example.com' },
      softExpiry: Date.now() - 1000, // 1 second ago (should trigger refresh)
      hardExpiry: Date.now() + 600000, // 10 minutes from now (still valid)
      issuedAt: Date.now() - 1000,
    };

    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(sessionInSoftWindow));

    const session = await sessionService.getCurrentSession();
    
    // Should load session despite soft expiry
    expect(session).toBeTruthy();
    
    // Should attempt refresh (though it will fail in test environment)
    const metrics = sessionService.getMetrics();
    expect(metrics.refreshCount).toBeGreaterThan(0);
  });

  it('should validate session structure correctly', async () => {
    const invalidSession = {
      token: 'token',
      // Missing required fields
    };

    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(invalidSession));

    const session = await sessionService.loadSession();

    expect(session).toBeNull();
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('secureSession');
  });
});





