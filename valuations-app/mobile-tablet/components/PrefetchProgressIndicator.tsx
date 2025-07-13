import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ActivityIndicator, ProgressBar, Card, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import prefetchService from '../services/prefetchService';
import { prefetchProgressIndicatorStyles } from '../app/GlobalStyles';

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
      <View style={[prefetchProgressIndicatorStyles.minimizedContainer, style]}>
        <TouchableOpacity 
          style={prefetchProgressIndicatorStyles.minimizedContent}
          onPress={() => setIsMinimized(false)}
        >
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={prefetchProgressIndicatorStyles.minimizedText}>
            Preloading... {progress.completed}/{progress.total}
          </Text>
          <MaterialCommunityIcons name="chevron-up" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Card style={[prefetchProgressIndicatorStyles.container, style]} elevation={2}>
      <View style={prefetchProgressIndicatorStyles.header}>
        <View style={prefetchProgressIndicatorStyles.headerLeft}>
          <MaterialCommunityIcons 
            name="cloud-download" 
            size={20} 
            color={progress.isActive ? "#4CAF50" : "#666"} 
          />
          <Text style={prefetchProgressIndicatorStyles.title}>
            {progress.isActive ? "Preloading Survey Data" : "Preload Complete"}
          </Text>
        </View>
        <View style={prefetchProgressIndicatorStyles.headerRight}>
          <IconButton
            icon="minus"
            size={16}
            onPress={() => setIsMinimized(true)}
            style={prefetchProgressIndicatorStyles.minimizeButton}
          />
        </View>
      </View>

      <View style={prefetchProgressIndicatorStyles.content}>
        {progress.isActive && (
          <View style={prefetchProgressIndicatorStyles.progressContainer}>
            <ProgressBar 
              progress={progressPercent} 
              color="#4CAF50"
              style={prefetchProgressIndicatorStyles.progressBar}
            />
            <Text style={prefetchProgressIndicatorStyles.progressText}>
              {progress.completed} of {progress.total} categories loaded
            </Text>
          </View>
        )}

        <View style={prefetchProgressIndicatorStyles.statsContainer}>
          <View style={prefetchProgressIndicatorStyles.stat}>
            <Text style={prefetchProgressIndicatorStyles.statValue}>{progress.completed}</Text>
            <Text style={prefetchProgressIndicatorStyles.statLabel}>Completed</Text>
          </View>
          
          {progress.failed > 0 && (
            <View style={prefetchProgressIndicatorStyles.stat}>
              <Text style={[prefetchProgressIndicatorStyles.statValue, { color: '#f44336' }]}>{progress.failed}</Text>
              <Text style={prefetchProgressIndicatorStyles.statLabel}>Failed</Text>
            </View>
          )}
          
          <View style={prefetchProgressIndicatorStyles.stat}>
            <Text style={prefetchProgressIndicatorStyles.statValue}>{successRate.toFixed(0)}%</Text>
            <Text style={prefetchProgressIndicatorStyles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {!progress.isActive && progress.total > 0 && (
          <View style={prefetchProgressIndicatorStyles.completedContainer}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
            <Text style={prefetchProgressIndicatorStyles.completedText}>
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
    <View style={[prefetchProgressIndicatorStyles.badgeContainer, style]}>
      {progress.isActive ? (
        <ActivityIndicator size="small" color="#4CAF50" />
      ) : (
        <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
      )}
      <Text style={prefetchProgressIndicatorStyles.badgeText}>
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
    <View style={[prefetchProgressIndicatorStyles.offlineContainer, style]}>
      <MaterialCommunityIcons name="wifi-off" size={16} color="#ff9800" />
      <Text style={prefetchProgressIndicatorStyles.offlineText}>
        📴 Offline Mode - {cachedCategoriesCount} categories available
      </Text>
    </View>
  );
}; 