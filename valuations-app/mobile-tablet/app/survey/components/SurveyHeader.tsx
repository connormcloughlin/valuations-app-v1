import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SurveyHeaderProps {
  address: string;
  completedCategories: number;
  totalCategories: number;
}

export default function SurveyHeader({ address, completedCategories, totalCategories }: SurveyHeaderProps) {
  const progress = Math.floor((completedCategories / totalCategories) * 100);

  return (
    <Card style={styles.headerCard}>
      <Card.Content>
        <View style={styles.addressRow}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#f39c12" />
          <Text style={styles.addressText}>{address}</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>Survey Progress</Text>
            <Text style={styles.progressPercentage}>{progress}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressDetails}>
            {completedCategories} of {totalCategories} categories completed
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f39c12',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#f39c12',
  },
  progressDetails: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
    textAlign: 'right',
  },
}); 