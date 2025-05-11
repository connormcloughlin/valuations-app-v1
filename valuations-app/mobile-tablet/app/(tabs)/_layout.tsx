import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define the tab configuration type
type TabConfig = {
  name: string;
  title: string;
  icon: 'view-dashboard' | 'clipboard-list' | 'note-text' | 'account';
  path: string;
};

// Modern TabBar implementation with animations
export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  
  // Create our tabs config with explicit paths
  const tabs: TabConfig[] = [
    { name: 'index', title: 'Dashboard', icon: 'view-dashboard', path: '/(tabs)' },
    { name: 'valuations', title: 'Valuations', icon: 'clipboard-list', path: '/(tabs)/valuations' },
    { name: 'survey', title: 'Survey', icon: 'note-text', path: '/(tabs)/survey' },
    { name: 'profile', title: 'Profile', icon: 'account', path: '/(tabs)/profile' }
  ];
  
  // Check which tab is active
  const isActive = (tabPath: string): boolean => {
    return pathname === tabPath || 
           pathname.startsWith(tabPath + '/') || 
           (tabPath === '/(tabs)' && pathname === '/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* This renders the current screen */}
      <View style={styles.content}>
        <Slot />
      </View>
      
      {/* Modern custom tab bar */}
      <View style={[
        styles.tabBar, 
        { paddingBottom: Math.max(insets.bottom, 10) }
      ]}>
        {tabs.map(tab => (
          <TabButton 
            key={tab.name}
            icon={tab.icon}
            label={tab.title}
            active={isActive(tab.path)}
            onPress={() => router.push(tab.path as any)}
          />
        ))}
      </View>
    </View>
  );
}

// Tab button component with animations
interface TabButtonProps {
  icon: TabConfig['icon'];
  label: string;
  active: boolean;
  onPress: () => void;
}

function TabButton({ icon, label, active, onPress }: TabButtonProps) {
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(active ? 1 : 0);
  
  // Update animations when active state changes
  useEffect(() => {
    opacity.value = withTiming(active ? 1 : 0, { duration: 200 });
    if (active) {
      scale.value = withTiming(1.1, { duration: 200 });
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [active, opacity, scale]);
  
  // Animated styles
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      height: opacity.value === 0 ? 0 : 16,
    };
  });
  
  const animatedColorStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      opacity.value,
      [0, 1],
      ['transparent', 'rgba(74, 144, 226, 0.1)']
    );
    
    return {
      backgroundColor,
    };
  });
  
  // Helper function to get text color by active state
  const getIconColor = () => active ? '#4a90e2' : '#9e9e9e';
  
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={styles.tabButton}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.tabButtonContainer, animatedColorStyle]}>
        <Animated.View style={animatedIconStyle}>
          <MaterialCommunityIcons
            name={icon}
            size={25}
            color={getIconColor()}
          />
        </Animated.View>
        
        <Animated.View style={[styles.labelContainer, animatedLabelStyle]}>
          <Text style={[styles.label, { color: getIconColor() }]}>
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
  },
  tabButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 16,
  },
  labelContainer: {
    marginTop: 4,
    overflow: 'hidden',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  }
});
