import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { logPerformanceSummary, checkPerformanceIssues, resetPerformanceTracking } from '../utils/performanceTracker';

interface SimplePerformanceMonitorProps {
  showInProduction?: boolean;
}

export const SimplePerformanceMonitor: React.FC<SimplePerformanceMonitorProps> = ({ 
  showInProduction = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Only show in development or if explicitly enabled
  if (!__DEV__ && !showInProduction) {
    return null;
  }
  
  const showPerformanceInfo = () => {
    Alert.alert(
      'Performance Monitor',
      `This monitor tracks component re-renders through console logs.

Look for these patterns in your console:
🔄 ComponentName rendered X times

Expected performance targets:
• LoginScreen: 1-3 renders
• AuthProvider: 1-3 renders  
• Dashboard: 1-2 renders

High render counts indicate performance issues that need optimization.`,
      [
        { text: 'Show Console Logs', onPress: () => console.log('📊 Performance Monitor: Check console for render logs') },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };
  
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
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Performance Monitor</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsVisible(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.infoText}>
            Monitor component re-renders through console logs.
          </Text>
          
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={showPerformanceInfo}
          >
            <Text style={styles.infoButtonText}>📋 Performance Guide</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logButton}
            onPress={() => {
              logPerformanceSummary();
              checkPerformanceIssues();
            }}
          >
            <Text style={styles.logButtonText}>📊 Show Performance Summary</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              resetPerformanceTracking();
              Alert.alert('Reset Complete', 'Performance tracking has been reset');
            }}
          >
            <Text style={styles.resetButtonText}>🔄 Reset Tracking</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 9999,
    maxWidth: 280,
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    padding: 12,
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
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    gap: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
  },
  infoButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  infoButtonText: {
    color: '#4caf50',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  logButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  logButtonText: {
    color: '#2196f3',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  resetButtonText: {
    color: '#ff9800',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
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

export default SimplePerformanceMonitor;
