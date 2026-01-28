import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button } from 'react-native-paper';

interface RenderStats {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
}

interface PerformanceMonitorProps {
  showInProduction?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  showInProduction = false 
}) => {
  const [renderStats, setRenderStats] = useState<RenderStats[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  // Only show in development or if explicitly enabled
  if (!__DEV__ && !showInProduction) {
    return null;
  }
  
  useEffect(() => {
    // For React Native, we'll use a simple approach
    // Components will log their render counts to console
    // This monitor will show a summary of what's been logged
    console.log('📊 Performance Monitor: Ready to track renders');
  }, []);
  
  const resetStats = () => {
    setRenderStats([]);
    console.log('📊 Performance Monitor: Stats reset');
  };
  
  const totalRenders = renderStats.reduce((sum, stat) => sum + stat.renderCount, 0);
  
  if (!isVisible) {
    return (
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.floatingButtonText}>📊</Text>
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.title}>Performance Monitor</Text>
            <View style={styles.headerButtons}>
              <Button 
                mode="outlined" 
                compact 
                onPress={resetStats}
                style={styles.resetButton}
              >
                Reset
              </Button>
              <Button 
                mode="outlined" 
                compact 
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                Close
              </Button>
            </View>
          </View>
          
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              Total Renders: {totalRenders}
            </Text>
            <Text style={styles.summaryText}>
              Components: {renderStats.length}
            </Text>
          </View>
          
          <ScrollView style={styles.statsList}>
            {renderStats
              .sort((a, b) => b.renderCount - a.renderCount)
              .map((stat, index) => (
                <View key={stat.componentName} style={styles.statItem}>
                  <Text style={styles.componentName}>
                    {stat.componentName}
                  </Text>
                  <View style={styles.statDetails}>
                    <Text style={styles.renderCount}>
                      {stat.renderCount} renders
                    </Text>
                    <Text style={styles.lastRender}>
                      {new Date(stat.lastRenderTime).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ))}
          </ScrollView>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 9999,
    maxWidth: 300,
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  resetButton: {
    borderColor: '#ff6b6b',
  },
  closeButton: {
    borderColor: '#4ecdc4',
  },
  summary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  summaryText: {
    color: '#fff',
    fontSize: 12,
  },
  statsList: {
    maxHeight: 200,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  componentName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  statDetails: {
    alignItems: 'flex-end',
  },
  renderCount: {
    color: '#ff6b6b',
    fontSize: 11,
    fontWeight: 'bold',
  },
  lastRender: {
    color: '#ccc',
    fontSize: 10,
  },
  floatingButton: {
    position: 'absolute',
    top: 50,
    right: 10,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default PerformanceMonitor;
