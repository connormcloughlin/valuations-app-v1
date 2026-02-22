import { useState, useEffect, useCallback, useRef } from 'react';

// Dynamic import to prevent bundling at startup
const getRequestDeduplication = () => import('../core/requestDeduplication');

interface DashboardData {
  stats: any;
  todaysAppointments: any[];
  inProgressSurveys: any[];
  loading: boolean;
  error: string | null;
}

interface UseOptimizedDashboardProps {
  refreshTrigger?: number;
}

export const useOptimizedDashboard = ({ refreshTrigger }: UseOptimizedDashboardProps = {}) => {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    todaysAppointments: [],
    inProgressSurveys: [],
    loading: true,
    error: null
  });

  const [loadingSteps, setLoadingSteps] = useState({
    stats: false,
    appointments: false,
    surveys: false
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);
  const CACHE_DURATION = 30000; // 30 seconds

  // Check if data is fresh enough
  const isDataFresh = useCallback(() => {
    return Date.now() - lastFetchTimeRef.current < CACHE_DURATION;
  }, []);

  // Fetch dashboard stats with deduplication
  const fetchStats = useCallback(async () => {
    const cacheKey = 'dashboard-stats';
    
    try {
      setLoadingSteps(prev => ({ ...prev, stats: true }));
      
      const { requestDeduplication } = await getRequestDeduplication();
      const stats = await requestDeduplication.deduplicateRequest(
        cacheKey,
        async () => {
          // Your existing stats API call here
          console.log('📊 Fetching dashboard stats (deduplicated)');
          // return await apiClient.get('/mobile/appointment/dashboard/status-counts');
        }
      );

      setData(prev => ({ ...prev, stats }));
      setLoadingSteps(prev => ({ ...prev, stats: false }));
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      setLoadingSteps(prev => ({ ...prev, stats: false }));
      setData(prev => ({ ...prev, error: 'Failed to load dashboard stats' }));
    }
  }, []);

  // Fetch today's appointments with deduplication
  const fetchTodaysAppointments = useCallback(async () => {
    const cacheKey = 'todays-appointments';
    
    try {
      setLoadingSteps(prev => ({ ...prev, appointments: true }));
      
      const { requestDeduplication } = await getRequestDeduplication();
      const appointments = await requestDeduplication.deduplicateRequest(
        cacheKey,
        async () => {
          console.log('📋 Fetching today\'s appointments (deduplicated)');
          // Your existing appointments API call here
          // return await apiClient.get('/mobile/appointment/list-view', { params: {...} });
        }
      );

      setData(prev => ({ ...prev, todaysAppointments: appointments }));
      setLoadingSteps(prev => ({ ...prev, appointments: false }));
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      setLoadingSteps(prev => ({ ...prev, appointments: false }));
    }
  }, []);

  // Fetch in-progress surveys with deduplication
  const fetchInProgressSurveys = useCallback(async () => {
    const cacheKey = 'in-progress-surveys';
    
    try {
      setLoadingSteps(prev => ({ ...prev, surveys: true }));
      
      const { requestDeduplication } = await getRequestDeduplication();
      const surveys = await requestDeduplication.deduplicateRequest(
        cacheKey,
        async () => {
          console.log('📊 Fetching in-progress surveys (deduplicated)');
          // Your existing surveys API call here
          // return await apiClient.get('/mobile/appointment/list-view', { params: {...} });
        }
      );

      setData(prev => ({ ...prev, inProgressSurveys: surveys }));
      setLoadingSteps(prev => ({ ...prev, surveys: false }));
    } catch (error) {
      console.error('❌ Error fetching surveys:', error);
      setLoadingSteps(prev => ({ ...prev, surveys: false }));
    }
  }, []);

  // Optimized refresh function
  const refresh = useCallback(async (force = false) => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshingRef.current) {
      console.log('📊 Refresh already in progress, skipping...');
      return;
    }

    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Skip if data is fresh and not forcing refresh
    if (!force && isDataFresh()) {
      console.log('📊 Dashboard data is fresh, skipping refresh');
      return;
    }

    console.log('🔄 Refreshing dashboard data...');
    isRefreshingRef.current = true;
    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch all data in parallel with deduplication
      await Promise.all([
        fetchStats(),
        fetchTodaysAppointments(),
        fetchInProgressSurveys()
      ]);

      lastFetchTimeRef.current = Date.now();
      setData(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error);
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to refresh dashboard data' 
      }));
    } finally {
      isRefreshingRef.current = false;
    }
  }, [isDataFresh, fetchStats, fetchTodaysAppointments, fetchInProgressSurveys]);

  // Initial load
  useEffect(() => {
    refresh();
  }, []);

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger) {
      refresh(true);
    }
  }, [refreshTrigger]); // Removed refresh from dependencies to prevent loop

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...data,
    loadingSteps,
    refresh: () => refresh(true),
    isRefreshing: data.loading,
    isAnyLoading: Object.values(loadingSteps).some(loading => loading)
  };
};
