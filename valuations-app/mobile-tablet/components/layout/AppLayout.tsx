import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppHeader from './AppHeader';
import BottomNavigation, { TabConfig } from './BottomNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
  showLogout?: boolean;
  tabs?: TabConfig[];
  customActiveCheck?: (tabPath: string, currentPath: string) => boolean;
  onLogout?: () => void;
}

export default function AppLayout({
  children,
  title = 'Qantam',
  showHeader = true,
  showBottomNav = true,
  showLogout = true,
  tabs = [],
  customActiveCheck,
  onLogout
}: AppLayoutProps) {
  return (
    <View style={styles.container}>
      {showHeader && (
        <AppHeader 
          title={title}
          showLogout={showLogout}
          onLogout={onLogout}
        />
      )}
      
      <View style={styles.content}>
        {children}
      </View>
      
      {showBottomNav && tabs.length > 0 && (
        <BottomNavigation 
          tabs={tabs}
          customActiveCheck={customActiveCheck}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    flex: 1,
  },
}); 