import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

interface OfflineNoticeProps {
  showOffline?: boolean;
  showOnline?: boolean;
}

const OfflineNotice: React.FC<OfflineNoticeProps> = ({ 
  showOffline = true, 
  showOnline = false 
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  // Listen for connection changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    
    // Check initial connection
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Animate banner appearance
  useEffect(() => {
    // Show banner if:
    // - Not connected and we want to show offline state
    // - Connected and we want to show online state
    const shouldShow = 
      (isConnected === false && showOffline) || 
      (isConnected === true && showOnline);
      
    if (shouldShow && !visible) {
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // If showing "online" status, hide after 3 seconds
      if (isConnected && showOnline) {
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
    } else if (!shouldShow && visible) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }
  }, [isConnected, showOffline, showOnline, visible, fadeAnim]);
  
  if (!visible) {
    return null;
  }
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        isConnected ? styles.onlineContainer : styles.offlineContainer,
        { opacity: fadeAnim }
      ]}
    >
      <MaterialCommunityIcons 
        name={isConnected ? 'wifi-check' : 'wifi-off'} 
        size={16} 
        color={isConnected ? '#fff' : '#fff'} 
      />
      <Text style={styles.text}>
        {isConnected ? 'Online - Connected to server' : 'Offline - Using cached data'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    zIndex: 1000,
  },
  offlineContainer: {
    backgroundColor: '#e74c3c',
  },
  onlineContainer: {
    backgroundColor: '#2ecc71',
  },
  text: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default OfflineNotice; 