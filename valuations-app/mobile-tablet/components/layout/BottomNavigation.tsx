import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define the tab configuration type
export type TabConfig = {
  name: string;
  title: string;
  icon: 'view-dashboard' | 'clipboard-list' | 'note-text' | 'account' | 'calendar-clock' | 'plus-circle';
  path: string;
};

interface BottomNavigationProps {
  tabs: TabConfig[];
  customActiveCheck?: (tabPath: string, currentPath: string) => boolean;
}

export default function BottomNavigation({ 
  tabs, 
  customActiveCheck 
}: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  
  // Default active check function
  const defaultIsActive = (tabPath: string): boolean => {
    return pathname === tabPath || 
           pathname.startsWith(tabPath + '/') || 
           (tabPath === '/(tabs)' && pathname === '/(tabs)');
  };

  const isActive = (tabPath: string): boolean => {
    if (customActiveCheck) {
      return customActiveCheck(tabPath, pathname);
    }
    return defaultIsActive(tabPath);
  };

  return (
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
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