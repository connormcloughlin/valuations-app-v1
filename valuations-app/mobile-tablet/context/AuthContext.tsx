import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  token: string;
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

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser({ ...parsedUser, token });
        console.log('User authenticated from storage:', parsedUser.email);
      } else {
        console.log('No authentication data found');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
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
      
      // TODO: Implement Azure AD authentication
      // This would use @azure/msal-react-native or similar
      console.log('Azure AD login initiated...');
      
      // Mock Azure AD response for now
      const mockAzureUser: User = {
        id: 'azure-user-id',
        name: 'Connor McLoughlin',
        email: 'connor@quantam.co.za',
        token: 'azure-token-' + Date.now()
      };

      await AsyncStorage.setItem('authToken', mockAzureUser.token);
      await AsyncStorage.setItem('userData', JSON.stringify({
        id: mockAzureUser.id,
        name: mockAzureUser.name,
        email: mockAzureUser.email
      }));

      setUser(mockAzureUser);
      console.log('User logged in with Azure AD:', mockAzureUser.email);
      return true;
    } catch (error) {
      console.error('Azure AD login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear stored authentication data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      // Clear user state
      setUser(null);
      
      console.log('User logged out successfully');
      
      // Navigate to login screen
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
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