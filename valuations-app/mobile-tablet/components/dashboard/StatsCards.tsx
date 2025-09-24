import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../Themed';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { enhancedApiClient } from '../../api/enhancedClient';
import { statsCardsStyles } from '../../app/GlobalStyles';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { setGlobalRefreshFunction } from '../../utils/dashboardRefresh';

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

interface StatsCardsProps {
  onCardPress: (cardType: 'scheduled' | 'inProgress' | 'completed' | 'finalise' | 'sync') => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ onCardPress }) => {
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

  // Define fetchStats function first (will be used in useCallback)
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use the optimized mobile dashboard API endpoint (no fallback)
      const endpoint = '/mobile/appointment/dashboard/status-counts';
      
      const startTime = Date.now();
      console.log(`📊 Fetching dashboard stats from: ${endpoint}`);
      console.log(`📊 Surveyor filtering will be handled by backend based on X-User-Context header`);
      const response = await enhancedApiClient.get(endpoint);
      const loadTime = Date.now() - startTime;
      
      if (response?.data?.success && response?.data?.data) {
        const data = response.data.data;
        
        console.log(`📊 Dashboard stats loaded in ${loadTime}ms:`, data);
        
        // Handle the statusCounts array format (surveyor filtering handled by backend)
        let scheduled = 0, inProgress = 0, completed = 0, finalise = 0;
        
        if (data.statusCounts && Array.isArray(data.statusCounts)) {
          // New format: statusCounts array
          data.statusCounts.forEach((item: any) => {
            switch (item.inviteStatus) {
              case 'Booked':
                scheduled = item.count;
                break;
              case 'In-progress':
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
          // Fallback format: byInviteStatus object
          scheduled = data.byInviteStatus?.['Booked'] || 0;
          inProgress = data.byInviteStatus?.['In-Progress'] || 0;
          completed = data.byInviteStatus?.['Completed'] || 0;
          finalise = data.byInviteStatus?.['Finalise'] || 0;
        }
        
        const newStats = {
          scheduled,
          inProgress,
          completed,
          finalise,
          pendingSync: data.pendingSync || 0,
          lastSync: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        };
        
        setStats(newStats);
      } else {
        console.error('❌ Failed to load dashboard stats:', response?.data?.message || 'Unknown error');
        // Set error state for user feedback
        setStats(prevStats => ({
          ...prevStats,
          lastSync: 'Error loading stats'
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      // Set error state for user feedback
      setStats(prevStats => ({
        ...prevStats,
        lastSync: 'Error loading stats'
      }));
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

  return (
    <View style={statsCardsStyles.cardsContainer}>
      {renderCard('Booked', waitingForAuth ? 'Auth...' : (loading ? '...' : stats.scheduled), 'calendar-clock', '#4a90e2', 'scheduled')}
      {renderCard('In Progress', waitingForAuth ? 'Auth...' : (loading ? '...' : stats.inProgress), 'clipboard-edit-outline', '#f39c12', 'inProgress')}
      {renderCard('Completed', waitingForAuth ? 'Auth...' : (loading ? '...' : stats.completed), 'clipboard-check', '#2ecc71', 'completed')}
      {renderCard('Finalise', waitingForAuth ? 'Auth...' : (loading ? '...' : stats.finalise), 'clipboard-check-outline', '#9b59b6', 'finalise')}
      
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
            {waitingForAuth ? 'Auth...' : (loading ? '...' : stats.pendingSync)}
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