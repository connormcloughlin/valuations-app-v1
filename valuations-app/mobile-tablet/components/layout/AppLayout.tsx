import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppHeader from './AppHeader';
import BottomNavigation, { TabConfig } from './BottomNavigation';
import { appLayoutStyles } from '../../app/GlobalStyles';

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
    <View style={appLayoutStyles.container}>
      {showHeader && (
        <AppHeader 
          title={title}
          showLogout={showLogout}
          onLogout={onLogout}
        />
      )}
      
      <View style={appLayoutStyles.content}>
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