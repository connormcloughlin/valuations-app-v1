import React from 'react';
import { Slot } from 'expo-router';
import { AppLayout } from '../../components/layout';
import { useMainTabTabs } from '../../hooks/useMainTabTabs';

export default function TabLayout() {
  const tabs = useMainTabTabs();

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
