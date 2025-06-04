import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ActivityIndicator, ProgressBar, Card, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import prefetchService from '../services/prefetchService';

interface PrefetchProgress {
  total: number;
  completed: number;
  failed: number;
  isActive: boolean;
  currentTask?: string;
}

interface PrefetchProgressIndicatorProps {
  visible?: boolean;
  style?: any;
}

export const PrefetchProgressIndicator: React.FC<PrefetchProgressIndicatorProps> = ({ 
  visible = true, 
  style 
}) => {
  const [progress, setProgress] = useState<PrefetchProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    isActive: false
  });
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Subscribe to progress updates
    const unsubscribe = prefetchService.onProgress((newProgress) => {
      setProgress(newProgress);
    });

    // Get initial progress
    setProgress(prefetchService.getCurrentProgress());

    return unsubscribe;
  }, []);

  if (!visible || (!progress.isActive && progress.total === 0)) {
    return null;
  }

  const progressPercent = progress.total > 0 ? progress.completed / progress.total : 0;
  const successRate = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  if (isMinimized) {
    return (
      <View style={[styles.minimizedContainer, style]}>
        <TouchableOpacity 
          style={styles.minimizedContent}
          onPress={() => setIsMinimized(false)}
        >
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.minimizedText}>
            Preloading... {progress.completed}/{progress.total}
          </Text>
          <MaterialCommunityIcons name="chevron-up" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Card style={[styles.container, style]} elevation={2}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons 
            name="cloud-download" 
            size={20} 
            color={progress.isActive ? "#4CAF50" : "#666"} 
          />
          <Text style={styles.title}>
            {progress.isActive ? "Preloading Survey Data" : "Preload Complete"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon="minus"
            size={16}
            onPress={() => setIsMinimized(true)}
            style={styles.minimizeButton}
          />
        </View>
      </View>

      <View style={styles.content}>
        {progress.isActive && (
          <View style={styles.progressContainer}>
            <ProgressBar 
              progress={progressPercent} 
              color="#4CAF50"
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {progress.completed} of {progress.total} categories loaded
            </Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{progress.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          
          {progress.failed > 0 && (
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: '#f44336' }]}>{progress.failed}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          )}
          
          <View style={styles.stat}>
            <Text style={styles.statValue}>{successRate.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {progress.currentTask && (
          <Text style={styles.currentTask}>
            Loading: {progress.currentTask.replace('category-', 'Category ')}
          </Text>
        )}

        {!progress.isActive && progress.total > 0 && (
          <View style={styles.completedContainer}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.completedText}>
              Survey data ready for offline use
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

// Compact version for embedding in other screens
export const PrefetchStatusBadge: React.FC<{ style?: any }> = ({ style }) => {
  const [progress, setProgress] = useState<PrefetchProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    isActive: false
  });

  useEffect(() => {
    const unsubscribe = prefetchService.onProgress(setProgress);
    setProgress(prefetchService.getCurrentProgress());
    return unsubscribe;
  }, []);

  if (!progress.isActive && progress.total === 0) {
    return null;
  }

  const progressPercent = progress.total > 0 ? progress.completed / progress.total : 0;

  return (
    <View style={[styles.badgeContainer, style]}>
      {progress.isActive ? (
        <ActivityIndicator size="small" color="#4CAF50" />
      ) : (
        <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
      )}
      <Text style={styles.badgeText}>
        {progress.isActive 
          ? `Loading ${progress.completed}/${progress.total}` 
          : `${progress.completed} categories ready`
        }
      </Text>
    </View>
  );
};

// Offline status indicator
export const OfflineStatusIndicator: React.FC<{ 
  cachedCategoriesCount: number;
  style?: any;
}> = ({ cachedCategoriesCount, style }) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const netInfo = await NetInfo.fetch();
      setIsOffline(!netInfo.isConnected);
    };

    checkConnection();
    
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOffline(!state.isConnected);
    });

    return unsubscribe;
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[styles.offlineContainer, style]}>
      <MaterialCommunityIcons name="wifi-off" size={16} color="#ff9800" />
      <Text style={styles.offlineText}>
        📴 Offline Mode - {cachedCategoriesCount} categories available
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  minimizedContainer: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
  minimizedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  minimizedText: {
    marginLeft: 8,
    marginRight: 4,
    fontSize: 12,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
  },
  title: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  minimizeButton: {
    margin: 0,
    padding: 0,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  currentTask: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  completedText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 11,
    color: '#666',
  },
  offlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    margin: 8,
  },
  offlineText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#f57c00',
  },
});

export default PrefetchProgressIndicator; 