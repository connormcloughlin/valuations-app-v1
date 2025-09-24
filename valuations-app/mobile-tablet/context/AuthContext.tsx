import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import azureAdService from '../services/azureAdService';
import authApi from '../api/auth';
// Note: Using transport client for API calls instead of deprecated apiClient
import { initializeDatabase } from '../utils/db';
import { AppState, AppStateStatus } from 'react-native';

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
  login: (email: string, password: string) => Promise<boolean>;
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

      // Check if this is API key mode
      if (token === 'api-key-mode') {
        console.log('🔑 API key mode detected, checking user context');
        
        // For API key mode, check if user context exists
        const userContext = await AsyncStorage.getItem('userContext');
        if (userContext) {
          console.log('🔑 User context found for API key mode');
          return true;
        } else {
          console.log('🔑 No user context found for API key mode');
          return false;
        }
      }

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
      
      const token = await AsyncStorage.getItem('authToken');
      const azureToken = await AsyncStorage.getItem('azureToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (__DEV__) {
        console.log('🔐 Token status:', {
          hasAuthToken: !!token,
          hasAzureToken: !!azureToken,
          hasUserData: !!userData
        });
      }
      
      if (token && userData) {
        console.log('🔐 Found stored token and user data, validating...');
        
        // Validate the token before considering user authenticated
        const isTokenValid = await validateToken(token);
        
        if (isTokenValid) {
          console.log('🔐 Token validation successful, setting user as authenticated');
          
          // Check if this is API key mode
          if (token === 'api-key-mode') {
            console.log('🔑 API key mode detected, using stored user data');
            
            // For API key mode, use stored user data
            const parsedUser = JSON.parse(userData);
            setUser({ 
              ...parsedUser, 
              token,
              azureToken: azureToken || undefined
            });
            
            // Restore user context for API key mode
            const userContext = await AsyncStorage.getItem('userContext');
            if (userContext) {
              const parsedUserContext = JSON.parse(userContext);
              authApi.setUserContext(parsedUserContext);
              console.log('👤 User context restored for API key mode');
            }
          } else {
            // JWT mode - try to get fresh user data from the verify endpoint
            try {
              // Note: JWT validation removed - using API key mode instead
              authApi.setAuthToken(token);
              const verifyResponse = await authApi.verifyToken();
              
              if (verifyResponse && (verifyResponse as any).data && (verifyResponse as any).data.valid === true) {
                // Use fresh user data from the server
                const freshUserData = (verifyResponse as any).data.user;
                console.log('🔐 Using fresh user data from server:', freshUserData);
                
                setUser({ 
                  id: freshUserData.id,
                  name: freshUserData.name,
                  email: freshUserData.email,
                  token,
                  azureToken: azureToken || undefined
                });
                
                // Update stored user data with fresh information
                await AsyncStorage.setItem('userData', JSON.stringify({
                  id: freshUserData.id,
                  name: freshUserData.name,
                  email: freshUserData.email
                }));
              } else {
                // Fall back to stored user data
                const parsedUser = JSON.parse(userData);
                setUser({ 
                  ...parsedUser, 
                  token,
                  azureToken: azureToken || undefined
                });
              }
            } catch (verifyError) {
              console.log('🔐 Could not get fresh user data, using stored data');
              // Fall back to stored user data
              const parsedUser = JSON.parse(userData);
              setUser({ 
                ...parsedUser, 
                token,
                azureToken: azureToken || undefined
              });
            }
            
            // Set the API token for subsequent requests (JWT mode)
            authApi.setAuthToken(token);
          }
          
          if (__DEV__) {
            console.log('🔐 User authenticated:', user?.email);
          }
          
          // Add a small delay to ensure state is properly set
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          // Only clear tokens if they are definitely invalid (expired)
          // Don't clear on network issues or server unavailability
          console.log('🔐 Token validation failed, but keeping tokens for retry');
          // Set user as null but don't clear stored tokens yet
          setUser(null);
          
          if (__DEV__) {
            console.log('🔐 User not authenticated, but tokens preserved');
          }
        }
      } else {
        console.log('🔐 No authentication data found, user not authenticated');
        if (__DEV__) {
          console.log('🔐 No authentication data found');
        }
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      
      // Only clear auth data if it's a critical error, not just a network issue
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('timeout')) {
        console.log('🔐 Auth check timeout, keeping existing auth state');
        // Don't clear auth data on timeout, just continue with existing state
      } else {
        console.log('🔐 Critical auth error, clearing stored data...');
        // On critical error, clear stored data to be safe
        try {
          await AsyncStorage.multiRemove(['authToken', 'azureToken', 'userData']);
          authApi.setAuthToken('');
          setUser(null);
          console.log('🔐 Cleared auth data due to critical error');
        } catch (clearError) {
          console.error('❌ Error clearing auth data:', clearError);
        }
      }
    } finally {
      setIsLoading(false);
      if (__DEV__) {
        console.log('🔐 Auth check completed:', { isAuthenticated: !!user });
      }
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual Azure AD authentication
      // For now, simulate login
      if (email && password) {
        const mockUser: User = {
          id: '1',
          name: 'Connor McLoughlin',
          email: email,
          token: 'mock-token-' + Date.now()
        };

        await AsyncStorage.setItem('authToken', 'api-key-mode');
        await AsyncStorage.setItem('userData', JSON.stringify({
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email
        }));

        // Store user context for API key authentication
        const userContext = {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email
        };
        await AsyncStorage.setItem('userContext', JSON.stringify(userContext));
        authApi.setUserContext(userContext);

        setUser(mockUser);
        console.log('🔐 Mock user logged in with API key authentication:', email);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

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
      
      if (authResult && authResult.account) {
        console.log('🔐 Azure AD authentication successful, starting token exchange...');
        
        // Step 2: Exchange Azure AD token for API token
        const userInfo = {
          id: authResult.account.identifier,
          name: authResult.account.name,
          email: authResult.account.username
        };
        
        console.log('🔐 User info for API key authentication:', userInfo);
        
        // For API key mode, we don't need token exchange - just store user context
        const azureUser: User = {
          id: authResult.account.identifier,
          name: authResult.account.name || 'Azure User',
          email: authResult.account.username,
          token: 'api-key-mode', // Placeholder for API key mode
          azureToken: authResult.accessToken, // Store Azure token for potential refresh
          roles: authResult.roles || [] // Include roles from Azure AD
        };

        // Store user data for API key authentication
        await AsyncStorage.setItem('authToken', azureUser.token);
        await AsyncStorage.setItem('azureToken', azureUser.azureToken || '');
        await AsyncStorage.setItem('userData', JSON.stringify({
          id: azureUser.id,
          name: azureUser.name,
          email: azureUser.email
        }));

        // Store user context for API key authentication
        const userContext = {
          id: azureUser.id,
          name: azureUser.name,
          email: azureUser.email,
          azureId: authResult.account.identifier,
          roles: authResult.roles || [], // Include roles from Azure AD
          role: authResult.roles?.[0] || 'Surveyor' // Primary role (first role or default)
        };
        await AsyncStorage.setItem('userContext', JSON.stringify(userContext));
        
        // Update the user context cache for API key mode
        authApi.setUserContext(userContext);

        setUser(azureUser);
        console.log('🔐 API key authentication successful, user logged in:', azureUser.email);
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
      
      // Clear stored authentication data (including both API and Azure tokens)
      await AsyncStorage.multiRemove(['authToken', 'azureToken', 'userData', 'userContext']);
      
      // Clear API client auth header and user context
      authApi.setAuthToken('');
      authApi.setUserContext(null);
      
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
    login,
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