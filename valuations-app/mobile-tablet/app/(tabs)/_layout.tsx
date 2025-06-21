import React from 'react';
import { Slot } from 'expo-router';
import { AppLayout, TabConfig } from '../../components/layout';

// Define the tab configuration
const tabs: TabConfig[] = [
  {
    name: 'dashboard',
    title: 'Dashboard',
    icon: 'view-dashboard',
    path: '/(tabs)'
  },
  {
    name: 'valuations',
    title: 'Valuations',
    icon: 'clipboard-list',
    path: '/(tabs)/valuations'
  },
  {
    name: 'survey',
    title: 'Survey',
    icon: 'note-text',
    path: '/(tabs)/survey'
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: 'account',
    path: '/(tabs)/profile'
  }
];

export default function TabLayout() {
  return (
    <AppLayout
      title="Qantam"
      tabs={tabs}
      showHeader={true}
      showBottomNav={true}
      showLogout={true}
    >
      <Slot />
    </AppLayout>
  );
}
