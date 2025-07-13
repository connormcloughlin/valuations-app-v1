import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { appHeaderStyles } from '../../app/GlobalStyles';

interface AppHeaderProps {
  title?: string;
  showLogout?: boolean;
  onLogout?: () => void;
}

export default function AppHeader({ 
  title = 'Qantam', 
  showLogout = true,
  onLogout 
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      if (onLogout) {
        onLogout();
      } else {
        await logout();
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={[appHeaderStyles.header, { paddingTop: insets.top }]}>
      <View style={appHeaderStyles.headerLeft}>
        <Text style={appHeaderStyles.headerTitle}>{title}</Text>
      </View>
      {showLogout && (
        <View style={appHeaderStyles.headerRight}>
          <Text style={appHeaderStyles.userName}>{user?.name || 'User'}</Text>
          <TouchableOpacity onPress={handleLogout} style={appHeaderStyles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={24} color="#2c3e50" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
} 