import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  useSharedValue,
  interpolate
} from 'react-native-reanimated';

interface SurveyDetailsProps {
  client: string;
  orderNumber: string;
  policyNo: string;
  sumInsured: string;
  broker: string;
  lastEdited: string;
  initialExpanded?: boolean;
}

export default function SurveyDetails({ 
  client, 
  orderNumber, 
  policyNo, 
  sumInsured, 
  broker, 
  lastEdited,
  initialExpanded = false
}: SurveyDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const animationProgress = useSharedValue(initialExpanded ? 1 : 0);

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    animationProgress.value = withTiming(newExpanded ? 1 : 0, {
      duration: 300,
    });
  };

  // Animated styles for the content
  const animatedContentStyle = useAnimatedStyle(() => {
    const height = interpolate(
      animationProgress.value,
      [0, 1],
      [0, 200] // Approximate height of the content
    );
    
    return {
      height,
      opacity: animationProgress.value,
      overflow: 'hidden',
    };
  });

  // Animated styles for the chevron icon
  const animatedChevronStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      animationProgress.value,
      [0, 1],
      [0, 180]
    );
    
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  return (
    <View style={styles.sectionContainer}>
      {/* Collapsible Header */}
      <TouchableOpacity 
        style={styles.headerContainer} 
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>Survey Details</Text>
        <Animated.View style={animatedChevronStyle}>
          <MaterialCommunityIcons 
            name="chevron-down" 
            size={24} 
            color="#2c3e50" 
          />
        </Animated.View>
      </TouchableOpacity>
      
      {/* Collapsible Content */}
      <Animated.View style={animatedContentStyle}>
        <Card style={styles.detailsCard}>
          <Card.Content>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Client:</Text>
              <Text style={styles.detailValue}>{client}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order Number:</Text>
              <Text style={styles.detailValue}>{orderNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Policy Number:</Text>
              <Text style={styles.detailValue}>{policyNo}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sum Insured:</Text>
              <Text style={styles.detailValue}>{sumInsured}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Broker:</Text>
              <Text style={styles.detailValue}>{broker}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Edited:</Text>
              <Text style={styles.detailValue}>{lastEdited}</Text>
            </View>
          </Card.Content>
        </Card>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  detailsCard: {
    borderRadius: 8,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    color: '#7f8c8d',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
}); 