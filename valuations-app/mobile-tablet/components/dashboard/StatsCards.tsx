import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../Themed';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { enhancedApiClient } from '../../api/enhancedClient';

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
  const [stats, setStats] = useState<StatsData>({
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    finalise: 0,
    pendingSync: 0,
    lastSync: 'Never'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Use the optimized mobile dashboard API endpoint with enhanced client for caching
      const endpoint = '/mobile/appointment/dashboard/status-counts';
      console.log('🚀 Fetching dashboard stats from optimized mobile API...');
      console.log('🔍 Full endpoint URL will be: [BASE_URL]' + endpoint);
      
      // Check if we have auth token and decode it to see user info
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const authToken = await AsyncStorage.default.getItem('authToken');
      console.log('🔐 Auth token available:', authToken ? `Yes (${authToken.substring(0, 20)}...)` : 'No');
      
      if (authToken) {
        try {
          // Decode JWT token to see user info (without verification, just for debugging)
          const tokenParts = authToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('🔍 Token payload (user info):', {
              userId: payload.sub || payload.userId || payload.id,
              email: payload.email,
              role: payload.role,
              tenant: payload.tenant || payload.tenantId,
              exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiry'
            });
          }
        } catch (decodeError: any) {
          console.warn('⚠️ Could not decode auth token:', decodeError?.message || 'Unknown error');
        }
      }
      
      // Call API directly without authentication to get unfiltered data
      console.log('🚀 Calling dashboard API without authentication for unfiltered data');
      
      console.log('🔍 Calling authenticated API (backend should return unfiltered data)');
      
      const response = await enhancedApiClient.get(endpoint, {
        requestOptions: { 
          skipCache: true, // Always hit the actual API, no caching for dashboard stats
          skipDeduplication: false // Still allow deduplication for simultaneous requests
        }
      });
      
      console.log('🔍 Response received from endpoint:', endpoint);
      
      // Get pending sync count from SQLite (run in parallel with API call)
      let pendingSync = 0;
      try {
        const { 
          getPendingSyncRiskAssessmentItems, 
          getPendingSyncAppointments, 
          getPendingSyncRiskAssessmentMasters, 
          getPendingSyncMediaFiles 
        } = await import('../../utils/db');
        
        const [pendingItems, pendingAppointments, pendingMasters, pendingMedia] = await Promise.all([
          getPendingSyncRiskAssessmentItems(),
          getPendingSyncAppointments(),
          getPendingSyncRiskAssessmentMasters(),
          getPendingSyncMediaFiles()
        ]);
        
        pendingSync = pendingItems.length + pendingAppointments.length + pendingMasters.length + pendingMedia.length;
      } catch (syncError) {
        console.warn('Could not fetch pending sync count:', syncError);
      }
      
      // Handle nested data structure from enhanced API client
      const apiData = response?.data?.data || response?.data;
      
      if (response?.success && apiData?.statusCounts) {
        const statusCounts = apiData.statusCounts;
        
        // Check if we have any data
        if (statusCounts.length === 0) {
          console.warn('⚠️ Mobile dashboard API returned empty statusCounts array. This might indicate:');
          console.warn('   - No appointments in database for current user');
          console.warn('   - Backend query filters excluding all data');
          console.warn('   - Database connection or query issue');
        }
        
        // Create a lookup map for easier access
        const statusMap = statusCounts.reduce((acc: any, item: any) => {
          acc[item.inviteStatus] = item.count;
          return acc;
        }, {});
        
        // Map status counts to our stats
        const scheduled = statusMap['Booked'] || 0;
        const inProgress = statusMap['In-progress'] || 0;
        const completed = statusMap['Completed'] || 0;
        const finalise = statusMap['Finalise'] || 0;
        
        // Get performance info if available
        const performanceData = response.data.performance || apiData.performance;
        const queryTime = performanceData?.queryTime || 'N/A';
        console.log(`📊 Dashboard stats loaded in ${queryTime}:`, { 
          scheduled, 
          inProgress, 
          completed, 
          finalise, 
          pendingSync,
          totalAppointments: apiData.totalAppointments,
          cacheKey: apiData.cacheKey?.substring(0, 20) + '...'
        });
        
        setStats({
          scheduled,
          inProgress,
          completed,
          finalise,
          pendingSync,
          lastSync: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        });
      } else {
        console.error('❌ Mobile dashboard API failed or returned invalid format:', response);
        throw new Error('Mobile dashboard API failed');
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      
      // Show error state
      setStats({
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        finalise: 0,
        pendingSync: 0,
        lastSync: 'Connection Error'
      });
    } finally {
      setLoading(false);
    }
  };

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
      style={styles.card} 
      onPress={() => handleCardPress(cardType)}
    >
      <Card.Content>
        <MaterialCommunityIcons name={icon as any} size={32} color={color} />
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardCount}>{count}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.cardsContainer}>
      {renderCard('Booked', loading ? '...' : stats.scheduled, 'calendar-clock', '#4a90e2', 'scheduled')}
      {renderCard('In Progress', loading ? '...' : stats.inProgress, 'clipboard-edit-outline', '#f39c12', 'inProgress')}
      {renderCard('Completed', loading ? '...' : stats.completed, 'clipboard-check', '#2ecc71', 'completed')}
      {renderCard('Finalise', loading ? '...' : stats.finalise, 'clipboard-check-outline', '#9b59b6', 'finalise')}
      
      <Card style={styles.card} onPress={() => handleCardPress('sync')}>
        <Card.Content>
          <MaterialCommunityIcons 
            name="cloud-sync" 
            size={32} 
            color={stats.pendingSync > 0 ? "#f39c12" : "#95a5a6"} 
          />
          <Text style={styles.cardTitle}>Pending Sync</Text>
          <Text style={[
            styles.cardCount,
            stats.pendingSync > 0 && styles.pendingCount
          ]}>
            {loading ? '...' : stats.pendingSync}
          </Text>
        </Card.Content>
      </Card>

      {/* Debug card - only show in development */}
      {__DEV__ && (
        <Card style={[styles.card, styles.debugCard]} onPress={() => {
          console.log('Debug card pressed - opening development tools');
          alert('Debug tools available below in Development Tools section');
        }}>
          <Card.Content>
            <MaterialCommunityIcons name="bug" size={32} color="#fff" />
            <Text style={[styles.cardTitle, { color: '#fff' }]}>Debug DB</Text>
            <Text style={styles.debugStatus}>Dev Only</Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: 'transparent',
  },
  card: {
    width: '45%',
    margin: '2.5%',
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 10,
  },
  cardCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 5,
  },
  pendingCount: {
    color: '#f39c12',
  },
  syncStatus: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  debugCard: {
    backgroundColor: '#e74c3c',
  },
  debugStatus: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
}); 