import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import connectionUtils from '../utils/connectionUtils';
import { connectionStatusStyles } from '../app/GlobalStyles';

interface ConnectionStatusProps {
  showOffline?: boolean;
  showOnline?: boolean;
  checkInterval?: number;
}

const ONLINE_BANNER_MS = 3500;

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showOffline = true,
  showOnline = false,
  checkInterval = 30000,
}) => {
  const insets = useSafeAreaInsets();
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>('Not checked yet');
  const [visible, setVisible] = useState<boolean>(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const lastStatusRef = useRef<boolean>(true);
  const onlineShownForSessionRef = useRef<boolean>(false);
  const onlineHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOnlineHideTimer = useCallback(() => {
    if (onlineHideTimeoutRef.current) {
      clearTimeout(onlineHideTimeoutRef.current);
      onlineHideTimeoutRef.current = null;
    }
  }, []);

  /** Single source of truth: always refresh reachability (do not trust stale sync isConnected). */
  const checkConnectionStatus = useCallback(async () => {
    try {
      const status = await connectionUtils.getStatus();
      const changed = status !== lastStatusRef.current;
      if (changed) {
        setIsConnected(status);
        lastStatusRef.current = status;
        if (!status) {
          onlineShownForSessionRef.current = false;
        }
      } else {
        setIsConnected(status);
      }
      setLastChecked(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error in connection check:', error);
      setIsConnected(false);
      lastStatusRef.current = false;
      onlineShownForSessionRef.current = false;
      setLastChecked(`Error: ${new Date().toLocaleTimeString()}`);
    }
  }, []);

  // Initial check, periodic checks, and NetInfo for fast UI when the radio reconnects
  useEffect(() => {
    void checkConnectionStatus();

    const intervalId = setInterval(() => {
      void checkConnectionStatus();
    }, checkInterval);

    const unsubscribe = NetInfo.addEventListener(() => {
      void checkConnectionStatus();
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
      clearOnlineHideTimer();
    };
  }, [checkInterval, checkConnectionStatus, clearOnlineHideTimer]);

  const handleManualCheck = () => {
    setLastChecked('Checking...');
    void checkConnectionStatus();
  };

  // Drive banner: offline stays until online; online (green) auto-dismisses after ONLINE_BANNER_MS
  useEffect(() => {
    if (!isConnected) {
      clearOnlineHideTimer();
      onlineShownForSessionRef.current = false;
      if (showOffline) {
        if (!visible) {
          setVisible(true);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      } else if (visible) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }
      return;
    }

    // Connected
    if (!showOnline) {
      clearOnlineHideTimer();
      if (visible) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }
      return;
    }

    // One green "Online" toast per offline→online cycle (ref reset while disconnected)
    if (onlineShownForSessionRef.current) {
      return;
    }

    onlineShownForSessionRef.current = true;
    if (!visible) {
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    clearOnlineHideTimer();
    onlineHideTimeoutRef.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
      onlineHideTimeoutRef.current = null;
    }, ONLINE_BANNER_MS);
  }, [isConnected, showOffline, showOnline, visible, fadeAnim, clearOnlineHideTimer]);

  if (!visible) return null;

  const topOffset = Math.max(insets.top, 8);

  return (
    <Animated.View
      style={[
        connectionStatusStyles.container,
        { top: topOffset },
        isConnected ? connectionStatusStyles.onlineContainer : connectionStatusStyles.offlineContainer,
        { opacity: fadeAnim },
      ]}
    >
      <View style={connectionStatusStyles.content}>
        <MaterialCommunityIcons
          name={isConnected ? 'wifi-check' : 'wifi-off'}
          size={20}
          color="#fff"
        />
        <Text
          style={[
            connectionStatusStyles.text,
            isConnected ? connectionStatusStyles.onlineText : connectionStatusStyles.offlineText,
          ]}
        >
          {isConnected ? 'Online' : 'Offline'}
          <Text style={connectionStatusStyles.subText}> (Last checked: {lastChecked})</Text>
        </Text>
      </View>

      {!isConnected && (
        <TouchableOpacity style={connectionStatusStyles.refreshButton} onPress={handleManualCheck}>
          <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default ConnectionStatus;
