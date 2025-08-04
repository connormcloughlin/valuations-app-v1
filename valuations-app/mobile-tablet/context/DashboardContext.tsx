import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DashboardContextType {
  refreshStats: (() => void) | undefined;
  refreshAppointments: (() => void) | undefined;
  refreshSurveys: (() => void) | undefined;
  setRefreshStats: (fn: (() => void) | undefined) => void;
  setRefreshAppointments: (fn: (() => void) | undefined) => void;
  setRefreshSurveys: (fn: (() => void) | undefined) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [refreshStats, setRefreshStats] = useState<(() => void) | undefined>(undefined);
  const [refreshAppointments, setRefreshAppointments] = useState<(() => void) | undefined>(undefined);
  const [refreshSurveys, setRefreshSurveys] = useState<(() => void) | undefined>(undefined);

  // Debug: Log when context is created
  console.log('📊 DashboardProvider: Context created, refreshStats:', typeof refreshStats);

  const contextValue: DashboardContextType = {
    refreshStats,
    refreshAppointments,
    refreshSurveys,
    setRefreshStats: (fn: (() => void) | undefined) => {
      console.log('📊 DashboardProvider: setRefreshStats called with function type:', typeof fn);
      setRefreshStats(fn);
      console.log('📊 DashboardProvider: setRefreshStats state updated, new value type:', typeof fn);
    },
    setRefreshAppointments,
    setRefreshSurveys,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  console.log('📊 useDashboard: Context retrieved, setRefreshStats type:', typeof context.setRefreshStats);
  return context;
} 