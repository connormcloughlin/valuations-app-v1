import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWorkflowTasks } from '../api/workflowTasks';
import type { TabConfig } from '../components/layout';
import { MAIN_TABS } from '../components/layout/mainTabConfig';

/**
 * Same tab list and task badge behaviour as `app/(tabs)/_layout.tsx` — use for survey/sync screens
 * so bottom navigation matches the dashboard.
 */
export function useMainTabTabs(): TabConfig[] {
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

  return MAIN_TABS.map((tab) =>
    tab.path === '/(tabs)/tasks'
      ? { ...tab, badge: taskCount > 0 ? taskCount : undefined }
      : tab
  );
}
