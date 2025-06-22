import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
// Using a more compatible import approach for icons
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import connectionUtils from '../utils/connectionUtils';

interface ConnectionStatusProps {
  showOffline?: boolean;
  showOnline?: boolean;
  checkInterval?: number; // Time in ms between connection checks
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  showOffline = true, 
  showOnline = false, // Default to NOT showing online banner
  checkInterval = 120000, // Default to checking every 2 minutes (increased from 60s)
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>('Not checked yet');
  const [visible, setVisible] = useState<boolean>(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const lastStatusRef = useRef<boolean>(true);
  const onlineShownRef = useRef<boolean>(false);
  
  // Check connection status
  const checkConnectionStatus = async () => {
    try {
      // Get the current connection status without making a network request
      let currentStatus = connectionUtils.isConnected();
      
      // Only update UI if status changed
      if (currentStatus !== lastStatusRef.current) {
        setIsConnected(currentStatus);
        lastStatusRef.current = currentStatus;
      }
      
      // Only call getStatus if truly needed
      if (!currentStatus || !onlineShownRef.current) {
        const status = await connectionUtils.getStatus();
        if (status !== currentStatus) {
          setIsConnected(status);
          lastStatusRef.current = status;
        }
      }
      
      setLastChecked(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error in connection check:', error);
      setIsConnected(false);
      lastStatusRef.current = false;
      setLastChecked(`Error: ${new Date().toLocaleTimeString()}`);
    }
  };

  // Manual check triggered by user
  const handleManualCheck = () => {
    setLastChecked('Checking...');
    checkConnectionStatus();
  };
  
  // Initial check and setup interval for periodic checks
  useEffect(() => {
    // Check immediately on mount
    checkConnectionStatus();
    
    // Set up periodic checks with longer interval
    const intervalId = setInterval(checkConnectionStatus, checkInterval);
    
    // Clean up interval
    return () => clearInterval(intervalId);
  }, [checkInterval]);
  
  // Animate banner appearance
  useEffect(() => {
    // Show banner if:
    // - Not connected and we want to show offline state
    // - Connected and we want to show online state AND we haven't shown it yet
    const shouldShowOffline = isConnected === false && showOffline;
    const shouldShowOnline = isConnected === true && showOnline && !onlineShownRef.current;
    
    const shouldShow = shouldShowOffline || shouldShowOnline;
      
    if (shouldShow && !visible) {
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // If showing "online" status, hide after 3 seconds and mark as shown
      if (isConnected && showOnline) {
        onlineShownRef.current = true; // Mark that we've shown the online banner
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
          });
        }, 3000);
      }
    } else if (!shouldShow && visible && !shouldShowOffline) {
      // Only animate out if we're not showing the offline banner
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }
  }, [isConnected, showOffline, showOnline, visible, fadeAnim]);

  // Reset the shown flag when connection status changes
  useEffect(() => {
    if (!isConnected) {
      onlineShownRef.current = false;
    }
  }, [isConnected]);
  
  if (!visible) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        isConnected ? styles.onlineContainer : styles.offlineContainer,
        { opacity: fadeAnim }
      ]}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons 
          name={isConnected ? 'wifi-check' : 'wifi-off'} 
          size={20} 
          color={isConnected ? '#fff' : '#fff'} 
        />
        <Text style={[styles.text, isConnected ? styles.onlineText : styles.offlineText]}>
          {isConnected ? 'Online' : 'Offline'} 
          <Text style={styles.subText}> (Last checked: {lastChecked})</Text>
        </Text>
      </View>
      
      {!isConnected && (
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleManualCheck}
        >
          <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40, // Adjusted to be visible below status bar
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
  },
  offlineContainer: {
    backgroundColor: '#e74c3c',
  },
  onlineContainer: {
    backgroundColor: '#2ecc71',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  offlineText: {
    color: '#fff',
  },
  onlineText: {
    color: '#fff',
  },
  subText: {
    fontSize: 12,
    fontWeight: 'normal',
    opacity: 0.8,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});

export default ConnectionStatus; 