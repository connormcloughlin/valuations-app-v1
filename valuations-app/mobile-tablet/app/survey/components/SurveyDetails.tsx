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

// Import GlobalStyles constants
import { colors, spacing, borderRadius, typography } from '../../GlobalStyles';

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
            color={colors.textPrimary} 
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
    marginBottom: spacing.lg,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  detailsCard: {
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    width: 120,
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
}); 