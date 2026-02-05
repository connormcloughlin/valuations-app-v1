import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator } from 'react-native-paper';

interface UpdateNotificationProps {
  visible: boolean;
  status: 'checking' | 'downloading' | 'ready' | 'error' | null;
  message?: string;
  onDismiss?: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ 
  visible,
  status,
  message,
  onDismiss
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!visible || !status) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'checking':
        return {
          icon: 'cloud-search',
          color: '#3498db',
          backgroundColor: '#3498db',
          defaultMessage: 'Checking for updates...',
        };
      case 'downloading':
        return {
          icon: 'cloud-download',
          color: '#f39c12',
          backgroundColor: '#f39c12',
          defaultMessage: 'Downloading update...',
        };
      case 'ready':
        return {
          icon: 'check-circle',
          color: '#27ae60',
          backgroundColor: '#27ae60',
          defaultMessage: 'Update ready! Reloading app...',
        };
      case 'error':
        return {
          icon: 'alert-circle',
          color: '#e74c3c',
          backgroundColor: '#e74c3c',
          defaultMessage: 'Update check failed',
        };
      default:
        return {
          icon: 'information',
          color: '#95a5a6',
          backgroundColor: '#95a5a6',
          defaultMessage: '',
        };
    }
  };

  const config = getStatusConfig();
  const displayMessage = message || config.defaultMessage;
  const showSpinner = status === 'checking' || status === 'downloading';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingTop: Math.max(insets.top, 12),
        },
      ]}
    >
      <View style={styles.content}>
        {showSpinner ? (
          <ActivityIndicator size="small" color="#fff" style={styles.icon} />
        ) : (
          <MaterialCommunityIcons
            name={config.icon as any}
            size={20}
            color="#fff"
            style={styles.icon}
          />
        )}
        <Text style={styles.text}>{displayMessage}</Text>
      </View>
      {onDismiss && status !== 'downloading' && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <MaterialCommunityIcons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default UpdateNotification;

