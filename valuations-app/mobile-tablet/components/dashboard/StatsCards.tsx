import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../Themed';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatsData {
  scheduled: number;
  inProgress: number;
  completed: number;
  lastSync: string;
}

interface StatsCardsProps {
  onCardPress: (cardType: 'scheduled' | 'inProgress' | 'completed' | 'sync') => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ onCardPress }) => {
  const [stats, setStats] = useState<StatsData>({
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    lastSync: 'Never'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls
      // const [scheduledRes, inProgressRes, completedRes] = await Promise.all([
      //   api.getScheduledCount(),
      //   api.getInProgressCount(),
      //   api.getCompletedCount()
      // ]);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock data for now
      setStats({
        scheduled: 2,
        inProgress: 1,
        completed: 3,
        lastSync: 'Today 11:45'
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
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
      onPress={() => onCardPress(cardType)}
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
      {renderCard('Scheduled', loading ? '...' : stats.scheduled, 'calendar-clock', '#4a90e2', 'scheduled')}
      {renderCard('In Progress', loading ? '...' : stats.inProgress, 'clipboard-edit-outline', '#f39c12', 'inProgress')}
      {renderCard('Completed', loading ? '...' : stats.completed, 'clipboard-check', '#2ecc71', 'completed')}
      
      <Card style={styles.card} onPress={() => onCardPress('sync')}>
        <Card.Content>
          <MaterialCommunityIcons name="cloud-sync" size={32} color="#95a5a6" />
          <Text style={styles.cardTitle}>Sync</Text>
          <Text style={styles.syncStatus}>Last: {loading ? '...' : stats.lastSync}</Text>
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