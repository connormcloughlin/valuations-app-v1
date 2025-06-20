import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../Themed';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import appointmentsApi from '../../api/appointments';

interface StatsData {
  scheduled: number;
  inProgress: number;
  completed: number;
  pendingSync: number;
  lastSync: string;
}

interface ApiStatsResponse {
  byInviteStatus: {
    [key: string]: number;
  };
}

interface StatsCardsProps {
  onCardPress: (cardType: 'scheduled' | 'inProgress' | 'completed' | 'sync') => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ onCardPress }) => {
  const [stats, setStats] = useState<StatsData>({
    scheduled: 0,
    inProgress: 0,
    completed: 0,
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
      
      // Fetch stats from the appointments/stats API
      const response = await appointmentsApi.getAppointmentStats() as any;
      
      // Get pending sync count from SQLite
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
      
      if (response?.success && response?.data?.byInviteStatus) {
        const inviteStats = response.data.byInviteStatus;
        
        // Map invite statuses to our stats
        const scheduled = inviteStats['Booked'] || 0;
        const inProgress = (inviteStats['In-progress'] || 0) + (inviteStats['In Progress'] || 0);
        const completed = inviteStats['Completed'] || 0;
        
        console.log('Appointment stats loaded:', { scheduled, inProgress, completed, pendingSync });
        
        setStats({
          scheduled,
          inProgress,
          completed,
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
        console.warn('Invalid API response format or failed request:', response);
        
        // Set error state but keep trying to show something useful
        setStats({
          scheduled: 0,
          inProgress: 0,
          completed: 0,
          pendingSync,
          lastSync: response?.success === false ? 'API Error' : 'Invalid Data'
        });
      }
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
      
      // Show error state
      setStats({
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        pendingSync: 0,
        lastSync: 'Connection Error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = (cardType: 'scheduled' | 'inProgress' | 'completed' | 'sync') => {
    // If it's a sync card press, navigate to the sync component
    if (cardType === 'sync') {
      router.push('/sync');
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
    cardType: 'scheduled' | 'inProgress' | 'completed' | 'sync'
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