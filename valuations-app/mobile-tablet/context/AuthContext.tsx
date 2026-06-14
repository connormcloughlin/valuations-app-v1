import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import azureAdService from '../services/azureAdService';
import authApi from '../api/auth';
import sessionService from '../core/auth/sessionService';
// Note: Using transport client for API calls instead of deprecated apiClient
// Dynamic import to prevent bundling at startup
const getInitializeDatabase = () => import('../utils/db');
import { AppState, AppStateStatus } from 'react-native';
import { fullSecurePurge } from '../core/security';
import { useRenderCount } from '../hooks/useRenderCount';
import {
  MOCK_REVIEWER_EMAIL,
  MOCK_REVIEWER_PASSWORD,
  REVIEW_MODE_STORAGE_KEY,
} from '../core/reviewMode/constants';

interface User {
  id: string;
  name: string;
  email: string;
  token: string;
  azureToken?: string; // Store Azure token separately for potential refresh
  roles?: string[]; // Add roles to user interface
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithAzure: () => Promise<boolean>;
  loginWithCredentials: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  validateToken: (token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Simple JWT decode function (client-side only, no signature verification)
 */
const decodeJWT = (token: string): any => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('❌ Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired (client-side validation)
 */
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      return true; // Consider invalid if no expiration
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('❌ Error checking token expiration:', error);
    return true; // Consider expired on error
  }
};

/**
 * Base64 encode for mock JWT (works in React Native where btoa may be unavailable).
 */
function base64Encode(str: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(str);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let i = 0; i < str.length; i += 3) {
    const a = str.charCodeAt(i);
    const b = i + 1 < str.length ? str.charCodeAt(i + 1) : -1;
    const c = i + 2 < str.length ? str.charCodeAt(i + 2) : -1;
    output += chars[a >> 2];
    output += chars[((a & 3) << 4) | (b >= 0 ? b >> 4 : 0)];
    output += b >= 0 ? chars[((b & 15) << 2) | (c >= 0 ? c >> 6 : 0)] : '=';
    output += c >= 0 ? chars[c & 63] : '=';
  }
  return output;
}

/**
 * Build a minimal mock JWT for review mode (client-side only; not verified by backend).
 * Payload must include iat and exp for sessionService.persistSession.
 */
function buildMockJWT(): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 365 * 24 * 3600; // 1 year
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { iat: now, exp, sub: 'review-user-id', email: MOCK_REVIEWER_EMAIL };
  const b64 = (obj: object) => base64Encode(JSON.stringify(obj));
  return `${b64(header)}.${b64(payload)}.mock_signature`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthenticated = !!user;
  
  // Monitor re-renders for performance debugging
  const { renderCount } = useRenderCount('AuthProvider', __DEV__);

  useEffect(() => {
    const startTime = Date.now();
    console.log('🚀 AuthProvider: Starting initialization...');
    
    initializeApp().then(() => {
      const endTime = Date.now();
      console.log(`✅ AuthProvider: Initialization completed in ${endTime - startTime}ms`);
    }).catch((error) => {
      console.error('❌ AuthProvider: Initialization failed:', error);
    });
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Starting app initialization...');
      
      // Check if database is already initialized to prevent duplicate initialization
      if (!dbInitialized) {
        const { initializeDatabase } = await getInitializeDatabase();
        await initializeDatabase();
        setDbInitialized(true);
        console.log('✅ Database initialized');
      } else {
        console.log('✅ Database already initialized, skipping...');
      }
      
      // Then check authentication status with timeout and retry logic
      let authCheckAttempts = 0;
      const maxAuthAttempts = 3;
      
      while (authCheckAttempts < maxAuthAttempts) {
        try {
          console.log(`🔐 Auth check attempt ${authCheckAttempts + 1}/${maxAuthAttempts}`);
          
          await Promise.race([
            checkAuthStatus(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Authentication check timeout')), 15000) // 15 second timeout
            )
          ]);
          
          console.log('✅ Authentication check completed successfully');
          break; // Success, exit the retry loop
          
        } catch (authError) {
          authCheckAttempts++;
          console.error(`❌ Authentication check attempt ${authCheckAttempts} failed:`, authError);
          
          if (authCheckAttempts >= maxAuthAttempts) {
            console.error('❌ All authentication check attempts failed');
            // On final failure, ensure loading is stopped
            setIsLoading(false);
          } else {
            console.log(`⏳ Retrying authentication check in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
    } catch (error) {
      console.error('❌ Error during app initialization:', error);
      // Continue with auth check even if DB fails
      try {
        await checkAuthStatus();
      } catch (authError) {
        console.error('❌ Authentication check also failed:', authError);
        // Ensure loading is stopped even if everything fails
        setIsLoading(false);
      }
    } finally {
      // Mark initialization as complete
      setIsInitialized(true);
      console.log('✅ App initialization completed');
    }
  };

  /**
   * Validate token with the backend
   */
  const validateToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      if (!token) {
        console.log('🔐 No token provided for validation');
        return false;
      }
      if (isTokenExpired(token)) {
        console.log('🔐 Token expired (client-side check)');
        return false;
      }
      console.log('🔐 Token appears valid (client-side check)');
      try {
        authApi.setAuthToken(token);
        const response = await authApi.verifyToken();
        if (response && (response as any).data) {
          if ((response as any).data.valid === true) {
            console.log('🔐 Token validation successful (server-side)');
            return true;
          }
          const errorCode = (response as any).data.code;
          if (errorCode === 'INVALID_TOKEN' || errorCode === 'NO_TOKEN') return false;
          if (errorCode === 'RATE_LIMITED') return !isTokenExpired(token);
          return !isTokenExpired(token);
        }
        return !isTokenExpired(token);
      } catch {
        return !isTokenExpired(token);
      }
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return false;
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔐 Checking authentication status using sessionService...');
      
      // Load session from sessionService
      const session = await sessionService.getCurrentSession();
      
      if (session) {
        console.log('🔐 Valid session found via sessionService');
        console.log('🔐 Session details:', {
          userId: session.userId,
          email: session.email,
          hasToken: !!session.token,
          tokenPreview: session.token ? session.token.substring(0, 20) + '...' : 'null',
          softExpiry: new Date(session.softExpiry).toISOString(),
          hardExpiry: new Date(session.hardExpiry).toISOString(),
          isHardExpired: Date.now() >= session.hardExpiry
        });
        
        // Get any stored Azure token for display/refresh purposes
        const azureToken = await AsyncStorage.getItem('azureToken');
        
        // Create user object from session data
        const user: User = {
          id: session.userId,
          name: session.email.split('@')[0], // Use email prefix as default name
          email: session.email,
          token: session.token,
          azureToken: azureToken || undefined
        };
        
        // Try to get stored user data for better display name
        try {
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            user.name = parsedUser.name || user.name;
          }
        } catch (parseError) {
          console.warn('⚠️ Could not parse stored user data, using email prefix as name');
        }
        
        setUser(user);
        if (session.email === MOCK_REVIEWER_EMAIL) {
          await AsyncStorage.setItem(REVIEW_MODE_STORAGE_KEY, 'true');
        }
        console.log(`🔐 User authenticated via sessionService: ${session.email}`);
      } else {
        console.log('🔐 No valid session found, user not authenticated');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setUser(null);
      
      // Let sessionService handle session cleanup
      if (error instanceof Error && error.message.includes('expired')) {
        console.log('🔒 Session expired, sessionService will handle cleanup');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAsReviewer = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const mockJwt = buildMockJWT();
      await sessionService.persistSession(
        mockJwt,
        'mock-refresh-token',
        MOCK_REVIEWER_EMAIL,
        'review-user-id'
      );
      await AsyncStorage.setItem(REVIEW_MODE_STORAGE_KEY, 'true');
      const mockUser: User = {
        id: 'review-user-id',
        name: 'Review User',
        email: MOCK_REVIEWER_EMAIL,
        token: mockJwt,
      };
      setUser(mockUser);
      console.log('🔐 Mock reviewer login successful');
      return true;
    } catch (error) {
      console.error('❌ Mock reviewer login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithAzure = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('🔐 Starting Azure AD authentication...');
      
      // Step 1: Authenticate with Azure AD
      let authResult = await azureAdService.signInSilently();
      
      // If silent login fails, do interactive login
      if (!authResult) {
        console.log('🔐 Silent login failed, starting interactive login...');
        try {
          authResult = await azureAdService.signInInteractive();
        } catch (authError) {
          console.error('❌ Interactive authentication failed:', authError);
          // Don't set loading to false here, let the finally block handle it
          return false;
        }
      }
      
      console.log('🔐 Azure AD auth result:', {
        hasAuthResult: !!authResult,
        hasAccount: !!authResult?.account,
        hasAccessToken: !!authResult?.accessToken,
        accountId: authResult?.account?.identifier,
        accountEmail: authResult?.account?.username
      });

      if (authResult && authResult.account) {
        console.log('🔐 Azure AD authentication successful, starting token exchange...');
        
        // Step 2: Exchange Azure AD token for API token
        const userInfo = {
          id: authResult.account.identifier,
          name: authResult.account.name,
          email: authResult.account.username
        };
        
        console.log('🔐 User info for JWT token exchange:', userInfo);
        console.log('🔐 About to call authApi.exchangeToken...');
        console.log('🔐 Azure access token preview:', authResult.accessToken ? authResult.accessToken.substring(0, 50) + '...' : 'null');
        
        // Step 3: Exchange Azure AD token for JWT token
        try {
          const exchangeResponse = await authApi.exchangeToken(authResult.accessToken, userInfo);
          
          const jwtToken = (exchangeResponse as any)?.data?.token || (exchangeResponse as any)?.token;
          const refreshToken = (exchangeResponse as any)?.data?.refreshToken || (exchangeResponse as any)?.refreshToken || 'dummy_refresh_token';
          
          if ((exchangeResponse as any)?.success && jwtToken) {
            
            console.log('🔄 JWT token exchange successful');
            console.log('🔄 JWT token preview:', jwtToken ? jwtToken.substring(0, 50) + '...' : 'null');
            console.log('🔄 Refresh token preview:', refreshToken ? refreshToken.substring(0, 20) + '...' : 'null');
            
            // Store session using sessionService
            try {
              await sessionService.persistSession(
                jwtToken,
                refreshToken,
                authResult.account.username,
                authResult.account.identifier
              );
              console.log('✅ Session persisted successfully');
            } catch (persistError) {
              console.error('❌ Failed to persist session:', persistError);
              throw persistError;
            }
            
            // Create user object from Azure AD info
            const azureUser: User = {
              id: authResult.account.identifier,
              name: authResult.account.name || 'Azure User',
              email: authResult.account.username,
              token: jwtToken,
              azureToken: authResult.accessToken,
              roles: authResult.roles || []
            };

            setUser(azureUser);
            console.log('🔐 JWT authentication successful, user logged in:', azureUser.email);
          } else {
            throw new Error('Token exchange failed: ' + ((exchangeResponse as any).data?.message || 'Unknown error'));
          }
        } catch (exchangeError: any) {
          console.error('❌ JWT token exchange failed:', exchangeError);
          throw new Error('Failed to exchange Azure AD token for JWT: ' + (exchangeError?.message || exchangeError));
        }
        return true;
      } else {
        console.error('❌ Azure AD authentication failed - no account returned');
        return false;
      }
    } catch (error) {
      console.error('❌ Azure AD login error:', error);
      return false;
    } finally {
      setIsLoading(false);
      console.log('🔐 Azure AD login process completed');
    }
  }, []);

  const loginWithCredentials = useCallback(async (username: string, password: string): Promise<boolean> => {
    const usernameTrimmed = username.trim().toLowerCase();
    if (usernameTrimmed === MOCK_REVIEWER_EMAIL && password === MOCK_REVIEWER_PASSWORD) {
      return loginAsReviewer();
    }
    return loginWithAzure();
  }, [loginAsReviewer, loginWithAzure]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Sign out from Azure AD first
      try {
        console.log('🔐 Starting Azure AD sign-out...');
        await azureAdService.signOut();
        console.log('🔐 Azure AD sign-out successful');
      } catch (azureError) {
        console.error('❌ Azure AD sign-out failed:', azureError);
        // Continue with local logout even if Azure logout fails
      }
      
      // Invalidate session using sessionService
      await sessionService.invalidate();
      await AsyncStorage.removeItem(REVIEW_MODE_STORAGE_KEY);

      // Perform secure data purge (S6 implementation)
      try {
        console.log('🔐 Starting secure data purge...');
        const purgeResult = await fullSecurePurge();
        
        if (purgeResult.success) {
          console.log('✅ Secure data purge completed successfully', {
            asyncStorageKeys: purgeResult.clearedItems.asyncStorage.length,
            databaseTables: purgeResult.clearedItems.databaseTables.length,
            cacheKeys: purgeResult.clearedItems.cacheKeys.length
          });
        } else {
          console.warn('⚠️ Secure data purge completed with errors:', purgeResult.errors);
        }
      } catch (purgeError) {
        console.error('❌ Secure data purge failed:', purgeError);
        // Continue with logout even if purge fails
      }
      
      // Clear user state
      setUser(null);
      
      console.log('✅ User logged out successfully');
      
      // Navigate to login screen
      router.replace('/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle app state changes (background/foreground) - after checkAuthStatus is defined
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (__DEV__) console.log('🔐 App state changed:', nextAppState);
      if (nextAppState === 'active' && !isAuthenticated) {
        checkAuthStatus();
      }
      if (nextAppState === 'active' && isAuthenticated) {
        import('../services/pullSyncService')
          .then(({ default: pullSyncService }) => pullSyncService.pullServerChanges())
          .catch((error) => console.warn('Foreground pull sync failed:', error));
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, checkAuthStatus]);

  // Memoize the context value so consumers only re-render when user/isLoading/isAuthenticated or callbacks change
  const value: AuthContextType = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    loginWithAzure,
    loginWithCredentials,
    logout,
    checkAuthStatus,
    validateToken
  }), [user, isLoading, isAuthenticated, loginWithAzure, loginWithCredentials, logout, checkAuthStatus, validateToken]);

  // Don't render children until initialization is complete
  if (!isInitialized) {
    return (
      <AuthContext.Provider value={value}>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#f5f5f5'
        }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
            Initializing app...
          </Text>
        </View>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('❌ useAuth called outside of AuthProvider context');
    // Return a default context to prevent crashes
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
      loginWithAzure: async () => false,
      loginWithCredentials: async () => false,
      logout: async () => {},
      checkAuthStatus: async () => {},
      validateToken: async () => false
    };
  }
  return context;
} 