import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    initializeApp();
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('🔐 App state changed:', nextAppState);
      
      if (nextAppState === 'active' && !isAuthenticated) {
        // App came to foreground and user is not authenticated
        // Try to restore authentication state
        console.log('🔐 App became active, checking for stored auth...');
        checkAuthStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated]);

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
    }
  };

  /**
   * Validate token with the backend
   */
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      if (!token) {
        console.log('🔐 No token provided for validation');
        return false;
      }

      // API key mode removed - JWT authentication only

      // JWT mode validation
      // First, do client-side validation to check if token is expired
      if (isTokenExpired(token)) {
        console.log('🔐 Token expired (client-side check)');
        return false;
      }

      // For external APIs, we'll rely primarily on client-side validation
      // and only attempt server validation if needed
      console.log('🔐 Token appears valid (client-side check)');
      
      // Optionally try server validation, but don't fail if endpoint doesn't exist
      try {
        // Note: JWT validation removed - using API key mode instead
        // Set the token temporarily for this validation request
        authApi.setAuthToken(token);
        
        // Call the verify endpoint (this might not exist in external APIs)
        const response = await authApi.verifyToken();

        // Handle the new response format from the implemented backend
        if (response && (response as any).data) {
          if ((response as any).data.valid === true) {
            console.log('🔐 Token validation successful (server-side)');
            console.log('🔐 User info:', (response as any).data.user);
            return true;
          } else {
            // Handle normalized error responses
            const errorCode = (response as any).data.code;
            console.log('🔐 Token validation failed (server-side):', {
              code: errorCode,
              message: (response as any).data.message
            });
            
            // Handle specific error codes
            if (errorCode === 'INVALID_TOKEN' || errorCode === 'NO_TOKEN') {
              console.log('🔐 Token is invalid, clearing stored data');
              return false;
            } else if (errorCode === 'RATE_LIMITED') {
              console.log('🔐 Rate limited, but token might still be valid');
              // Don't clear tokens on rate limiting, just accept client-side validation
              return !isTokenExpired(token);
            } else {
              console.log('🔐 Unknown error code, accepting token based on client-side validation');
              return !isTokenExpired(token);
            }
          }
        } else {
          console.log('🔐 Invalid response format, using client-side validation');
          return !isTokenExpired(token);
        }
      } catch (serverError) {
        console.log('🔐 Server validation not available or failed, using client-side validation');
        // If server validation fails (e.g., endpoint doesn't exist), 
        // we'll accept the token if it passes client-side validation
        return !isTokenExpired(token);
      }
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return false;
    }
  };

  const checkAuthStatus = async () => {
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
      if (__DEV__) {
        console.log('🔐 Auth check completed:', { isAuthenticated: !!user });
      }
    }
  };

  // DEPRECATED: Legacy username/password login removed
  // Use loginWithAzure() for proper Azure AD authentication

  const loginWithAzure = async (): Promise<boolean> => {
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
  };

  const logout = async (): Promise<void> => {
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
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    loginWithAzure,
    logout,
    checkAuthStatus,
    validateToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 