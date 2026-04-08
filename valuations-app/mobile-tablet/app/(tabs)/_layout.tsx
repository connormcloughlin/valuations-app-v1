import React, { useState, useEffect } from 'react';
import { Slot } from 'expo-router';
import { AppLayout, TabConfig } from '../../components/layout';
import { useAuth } from '../../context/AuthContext';
import { getWorkflowTasks } from '../../api/workflowTasks';

// Base tab configuration
const baseTabs: TabConfig[] = [
  {
    name: 'dashboard',
    title: 'Dashboard',
    icon: 'view-dashboard',
    path: '/(tabs)'
  },
  {
    name: 'tasks',
    title: 'Tasks',
    icon: 'clipboard-list',
    path: '/(tabs)/tasks'
  },
  {
    name: 'commission',
    title: 'Commission',
    icon: 'cash-multiple',
    path: '/(tabs)/commission'
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: 'account',
    path: '/(tabs)/profile'
  }
];

export default function TabLayout() {
  const { user, isAuthenticated } = useAuth();
  const [taskCount, setTaskCount] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setTaskCount(0);
      return;
    }
    getWorkflowTasks(user.id, 1, 1, undefined, 'claimed, in_progress')
      .then((res) => {
        if (res.success && res.pagination != null) {
          setTaskCount(res.pagination.totalCount ?? 0);
        }
      })
      .catch(() => setTaskCount(0));
  }, [isAuthenticated, user?.id]);

  const tabs: TabConfig[] = baseTabs.map((tab) =>
    tab.path === '/(tabs)/tasks'
      ? { ...tab, badge: taskCount > 0 ? taskCount : undefined }
      : tab
  );

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
