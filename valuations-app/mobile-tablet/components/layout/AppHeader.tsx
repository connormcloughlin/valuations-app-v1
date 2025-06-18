import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

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
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {showLogout && (
        <View style={styles.headerRight}>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={24} color="#2c3e50" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    color: '#2c3e50',
    marginRight: 12,
  },
  logoutButton: {
    padding: 4,
  },
}); 