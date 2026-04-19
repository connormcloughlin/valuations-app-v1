import type { TabConfig } from './BottomNavigation';

/**
 * Single source of truth for primary app bottom navigation (matches `(tabs)/_layout`).
 * Survey stack and other full-screen flows should use this + `useMainTabTabs` for badge parity.
 */
export const MAIN_TABS: TabConfig[] = [
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
