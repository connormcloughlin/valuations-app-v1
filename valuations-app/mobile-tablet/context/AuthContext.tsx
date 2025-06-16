import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import azureAdService from '../services/azureAdService';
import authApi from '../api/auth';
import { initializeDatabase } from '../utils/db';

interface User {
  id: string;
  name: string;
  email: string;
  token: string;
  azureToken?: string; // Store Azure token separately for potential refresh
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithAzure: () => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // First initialize the database
      console.log('🗄️ Starting app initialization...');
      console.log('🗄️ Initializing database...');
      await initializeDatabase();
      console.log('✅ Database initialized successfully');
      setDbInitialized(true);
      
      // Then check authentication status
      console.log('🔐 Starting authentication check...');
      await checkAuthStatus();
      console.log('✅ Authentication check completed');
    } catch (error) {
      console.error('❌ Error during app initialization:', error);
      // Continue with auth check even if DB fails
      try {
        console.log('🔐 Attempting authentication check after DB error...');
        await checkAuthStatus();
        console.log('✅ Authentication check completed after DB error');
      } catch (authError) {
        console.error('❌ Authentication check also failed:', authError);
        // Ensure loading is stopped even if everything fails
        setIsLoading(false);
      }
    }
  };

  const checkAuthStatus = async () => {
    try {
      console.log('🔐 Setting loading state to true');
      setIsLoading(true);
      
      console.log('🔐 Retrieving stored tokens...');
      const token = await AsyncStorage.getItem('authToken');
      const azureToken = await AsyncStorage.getItem('azureToken');
      const userData = await AsyncStorage.getItem('userData');
      
      console.log('🔐 Token status:', {
        hasAuthToken: !!token,
        hasAzureToken: !!azureToken,
        hasUserData: !!userData
      });
      
      if (token && userData) {
        console.log('🔐 Parsing user data...');
        const parsedUser = JSON.parse(userData);
        setUser({ 
          ...parsedUser, 
          token,
          azureToken: azureToken || undefined
        });
        console.log('🔐 User authenticated from storage:', parsedUser.email);
        
        // Set the API token for subsequent requests
        console.log('🔐 Setting API auth token...');
        authApi.setAuthToken(token);
        console.log('🔐 API auth token set successfully');
      } else {
        console.log('🔐 No authentication data found');
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
    } finally {
      console.log('🔐 Setting loading state to false');
      setIsLoading(false);
      console.log('🔐 checkAuthStatus completed');
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

        await AsyncStorage.setItem('authToken', mockUser.token);
        await AsyncStorage.setItem('userData', JSON.stringify({
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email
        }));

        setUser(mockUser);
        console.log('User logged in:', email);
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
        authResult = await azureAdService.signInInteractive();
      }
      
      if (authResult && authResult.account) {
        console.log('🔐 Azure AD authentication successful, starting token exchange...');
        
        // Step 2: Exchange Azure AD token for API token
        const tokenExchangeResult = await authApi.exchangeToken(authResult.accessToken);
        
        if ((tokenExchangeResult as any).success && (tokenExchangeResult as any).data?.token) {
        const azureUser: User = {
          id: authResult.account.identifier,
          name: authResult.account.name || 'Azure User',
          email: authResult.account.username,
            token: (tokenExchangeResult as any).data.token, // Use API token, not Azure token
            azureToken: authResult.accessToken // Store Azure token for potential refresh
        };

          // Store API token (not Azure token) for subsequent requests
        await AsyncStorage.setItem('authToken', azureUser.token);
          await AsyncStorage.setItem('azureToken', azureUser.azureToken || '');
        await AsyncStorage.setItem('userData', JSON.stringify({
          id: azureUser.id,
          name: azureUser.name,
          email: azureUser.email
        }));

        setUser(azureUser);
          console.log('🔐 Token exchange successful, user logged in:', azureUser.email);
        return true;
        } else {
          console.error('❌ Token exchange failed:', (tokenExchangeResult as any).message);
          return false;
        }
      } else {
        console.error('❌ Azure AD authentication failed - no account returned');
        return false;
      }
    } catch (error) {
      console.error('❌ Azure AD login error:', error);
      return false;
    } finally {
      setIsLoading(false);
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
      await AsyncStorage.multiRemove(['authToken', 'azureToken', 'userData']);
      
      // Clear API client auth header
      authApi.setAuthToken('');
      
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
    checkAuthStatus
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