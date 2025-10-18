import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../Themed';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import transportClient from '../../core/transport/transportClient';
import { statsCardsStyles } from '../../app/GlobalStyles';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { setGlobalRefreshFunction } from '../../utils/dashboardRefresh';
import riskAssessmentSyncService from '../../services/riskAssessmentSyncService';
// Dynamic import to prevent bundling at startup
const getRequestDeduplication = () => import('../../core/requestDeduplication');
import { LoadingState, SkeletonLoader } from '../LoadingStates';

interface StatsData {
  scheduled: number;
  inProgress: number;
  completed: number;
  finalise: number;
  pendingSync: number;
  lastSync: string;
}

interface ApiStatsResponse {
  byInviteStatus: {
    [key: string]: number;
  };
}

interface OptimizedStatsCardsProps {
  onCardPress: (cardType: 'scheduled' | 'inProgress' | 'completed' | 'finalise' | 'sync') => void;
  forceReload?: boolean;
}

export const OptimizedStatsCards: React.FC<OptimizedStatsCardsProps> = ({ onCardPress, forceReload = false }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { setRefreshStats } = useDashboard();
  
  const [stats, setStats] = useState<StatsData>({
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    finalise: 0,
    pendingSync: 0,
    lastSync: 'Never'
  });
  const [loading, setLoading] = useState(true);
  const [waitingForAuth, setWaitingForAuth] = useState(false);

  // Add a ref to track if stats have been fetched to prevent duplicate calls
  const statsFetchedRef = useRef(false);

  // Define fetchStats function with request deduplication
  const fetchStats = useCallback(async () => {
    const cacheKey = 'dashboard-stats';
    
    try {
      setLoading(true);
      
      const { requestDeduplication } = await getRequestDeduplication();
      const statsData = await requestDeduplication.deduplicateRequest(
        cacheKey,
        async () => {
          // Use the optimized mobile dashboard API endpoint
          const endpoint = '/mobile/appointment/dashboard/status-counts';
          
          const startTime = Date.now();
          console.log(`📊 Fetching dashboard stats from: ${endpoint}`);
          console.log(`📊 Surveyor filtering will be handled by backend based on X-User-Context header`);
          
          const response = await transportClient.get('appointments.list', endpoint);
          const loadTime = Date.now() - startTime;
          
          console.log(`📊 Dashboard stats loaded in ${loadTime}ms:`, response?.data);
          
          if (response?.success && response?.data) {
            const data = response.data;
            
            // Handle the statusCounts array format
            let scheduled = 0, inProgress = 0, completed = 0, finalise = 0;
            
            if (data.statusCounts && Array.isArray(data.statusCounts)) {
              data.statusCounts.forEach((item: any) => {
                switch (item.inviteStatus) {
                  case 'Booked':
                    scheduled = item.count;
                    break;
                  case 'In-Progress':
                    inProgress = item.count;
                    break;
                  case 'Completed':
                    completed = item.count;
                    break;
                  case 'Finalise':
                    finalise = item.count;
                    break;
                }
              });
            } else if (data.byInviteStatus) {
              // Fallback format
              scheduled = data.byInviteStatus?.['Booked'] || 0;
              inProgress = data.byInviteStatus?.['In-Progress'] || 0;
              completed = data.byInviteStatus?.['Completed'] || 0;
              finalise = data.byInviteStatus?.['Finalise'] || 0;
            }
            
            return {
              scheduled,
              inProgress,
              completed,
              finalise
            };
          } else {
            throw new Error('Failed to load dashboard stats');
          }
        }
      );

      // Get pending sync count from local database
      const pendingChanges = await riskAssessmentSyncService.getPendingChangesCount();
      const pendingSyncCount = pendingChanges.total || 0;
      
      console.log(`📊 Pending sync count: ${pendingSyncCount} (${pendingChanges.riskAssessmentItems} items, ${pendingChanges.appointments} appointments, ${pendingChanges.riskAssessmentMasters} masters, ${pendingChanges.mediaFiles} media)`);
      
      const newStats = {
        scheduled: statsData.scheduled,
        inProgress: statsData.inProgress,
        completed: statsData.completed,
        finalise: statsData.finalise,
        pendingSync: pendingSyncCount,
        lastSync: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      };
      
      setStats(newStats);
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      
      // Even if there's an error, try to get pending sync count from local database
      try {
        const pendingChanges = await riskAssessmentSyncService.getPendingChangesCount();
        const pendingSyncCount = pendingChanges.total || 0;
        
        console.log(`📊 Pending sync count (error occurred): ${pendingSyncCount}`);
        
        setStats(prevStats => ({
          ...prevStats,
          pendingSync: pendingSyncCount,
          lastSync: 'Error loading stats'
        }));
      } catch (syncError) {
        console.error('❌ Error getting pending sync count:', syncError);
        setStats(prevStats => ({
          ...prevStats,
          lastSync: 'Error loading stats'
        }));
      }
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Add a function to manually refresh stats  
  const refreshStats = useCallback(() => {
    console.log('🔄 Refreshing dashboard stats...');
    statsFetchedRef.current = false; // Allow fetching again
    setLoading(true); // Show loading state
    fetchStats();
  }, [fetchStats]);

  // Register the refresh function globally
  useEffect(() => {
    setGlobalRefreshFunction(refreshStats);
  }, [refreshStats]);

  // Handle force reload when forceReload prop changes
  useEffect(() => {
    if (forceReload && isAuthenticated && user && !isLoading) {
      console.log('🔄 Force reload triggered for OptimizedStatsCards');
      statsFetchedRef.current = false; // Allow fetching again
      fetchStats();
    }
  }, [forceReload, isAuthenticated, user, isLoading, fetchStats]);

  // Don't render anything if auth is still loading or not authenticated
  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  const handleCardPress = (cardType: 'scheduled' | 'inProgress' | 'completed' | 'finalise' | 'sync') => {
    // If it's a sync card press, navigate to the sync component
    if (cardType === 'sync') {
      router.push('/sync');
      return;
    }
    
    // If it's a finalise card press, navigate to the finalise appointments page
    if (cardType === 'finalise') {
      router.push('/(tabs)/appointments/finalise');
      return;
    }
    
    // If there's an error, refresh the stats
    if (stats.lastSync.includes('Error') || stats.lastSync.includes('Invalid')) {
      fetchStats();
    }
    
    // Call the original onCardPress handler
    onCardPress(cardType);
  };

  const renderCard = (
    title: string,
    count: number | string,
    icon: string,
    color: string,
    cardType: 'scheduled' | 'inProgress' | 'completed' | 'finalise' | 'sync'
  ) => (
    <Card 
      key={cardType}
      style={statsCardsStyles.card} 
      onPress={() => handleCardPress(cardType)}
    >
      <Card.Content>
        <MaterialCommunityIcons name={icon as any} size={32} color={color} />
        <Text style={statsCardsStyles.cardTitle}>{title}</Text>
        <Text style={statsCardsStyles.cardCount}>{count}</Text>
      </Card.Content>
    </Card>
  );

  // Show skeleton loading while data is loading
  if (loading) {
    return (
      <View style={statsCardsStyles.cardsContainer}>
        {[1, 2, 3, 4, 5].map((index) => (
          <Card key={index} style={statsCardsStyles.card}>
            <Card.Content>
              <SkeletonLoader width={32} height={32} borderRadius={16} />
              <SkeletonLoader width="60%" height={16} style={{ marginTop: 8 }} />
              <SkeletonLoader width="40%" height={20} style={{ marginTop: 4 }} />
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  }

  return (
    <View style={statsCardsStyles.cardsContainer}>
      {renderCard('Booked', waitingForAuth ? 'Auth...' : stats.scheduled, 'calendar-clock', '#4a90e2', 'scheduled')}
      {renderCard('In Progress', waitingForAuth ? 'Auth...' : stats.inProgress, 'clipboard-edit-outline', '#f39c12', 'inProgress')}
      {renderCard('Completed', waitingForAuth ? 'Auth...' : stats.completed, 'clipboard-check', '#2ecc71', 'completed')}
      {renderCard('Finalise', waitingForAuth ? 'Auth...' : stats.finalise, 'clipboard-check-outline', '#9b59b6', 'finalise')}
      
      <Card style={statsCardsStyles.card} onPress={() => handleCardPress('sync')}>
        <Card.Content>
          <MaterialCommunityIcons 
            name="cloud-sync" 
            size={32} 
            color={stats.pendingSync > 0 ? "#f39c12" : "#95a5a6"} 
          />
          <Text style={statsCardsStyles.cardTitle}>Pending Sync</Text>
          <Text style={[
            statsCardsStyles.cardCount,
            stats.pendingSync > 0 && statsCardsStyles.pendingCount
          ]}>
            {waitingForAuth ? 'Auth...' : stats.pendingSync}
          </Text>
        </Card.Content>
      </Card>

      {/* Debug card - only show in development */}
      {__DEV__ && (
        <Card style={[statsCardsStyles.card, statsCardsStyles.debugCard]} onPress={() => {
          console.log('Debug card pressed - opening development tools');
          alert('Debug tools available below in Development Tools section');
        }}>
          <Card.Content>
            <MaterialCommunityIcons name="bug" size={32} color="#fff" />
            <Text style={[statsCardsStyles.cardTitle, { color: '#fff' }]}>Debug DB</Text>
            <Text style={statsCardsStyles.debugStatus}>Dev Only</Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );
};
