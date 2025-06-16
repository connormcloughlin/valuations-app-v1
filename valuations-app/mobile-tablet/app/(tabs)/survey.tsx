import React, { useState } from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Card, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { logNavigation } from '../../utils/logger';

// Mock data for survey categories based on the form images
const surveySections = [
  {
    id: 'section-a',
    title: 'SECTION A - AGREED VALUE ITEMS',
    categories: [
      { id: 'cat-1', title: 'CLOTHING' },
      { id: 'cat-2', title: 'FURNITURE' },
      { id: 'cat-3', title: 'LINEN' },
      { id: 'cat-4', title: 'LUGGAGE/CONTAINERS' },
      { id: 'cat-5', title: 'JEWELLERY' },
      { id: 'cat-6', title: 'ANTIQUES' },
      { id: 'cat-7', title: 'VALUABLE ARTWORKS' },
      { id: 'cat-8', title: 'VALUABLE CARPETS' },
      { id: 'cat-9', title: 'COLLECTIONS' },
      { id: 'cat-10', title: 'VALUABLE ORNAMENTS' },
      { id: 'cat-11', title: 'SPORT EQUIPMENT' },
      { id: 'cat-12', title: 'OUTDOOR EQUIPMENT' },
    ]
  },
  {
    id: 'section-b',
    title: 'SECTION B - REPLACEMENT VALUE ITEMS',
    categories: [
      { id: 'cat-13', title: 'DOMESTIC APPLIANCES' },
      { id: 'cat-14', title: 'VISUAL, SOUND, COMPUTERS' },
      { id: 'cat-15', title: 'PHOTOGRAPHIC EQUIPMENT' },
      { id: 'cat-16', title: 'HIGH RISK ITEMS' },
      { id: 'cat-17', title: 'POWER TOOLS' },
    ]
  }
];

// Mock data for valuations
const mockValuations = [
  { id: '1', address: '123 Main St', date: '2024-04-28', status: 'In Progress' },
  { id: '2', address: '456 Oak Ave', date: '2024-04-26', status: 'Completed' },
  { id: '3', address: '789 Pine Rd', date: '2024-04-24', status: 'Pending Client' },
];

// Add Survey type
interface Survey {
  id: string;
  address: string;
  date: string;
  status: string;
}

export default function SurveyScreen() {
  logNavigation('Survey Tab');
  const [surveys, setSurveys] = useState<Survey[]>(mockValuations);
  
  const startNewSurvey = () => {
    router.push('/(tabs)/new-survey');
  };
  
  const openSurvey = (survey: Survey) => {
    router.push({
      pathname: '/survey/[id]',
      params: { id: survey.id }
    });
  };

  const renderSurveyCard = ({ item }: { item: Survey }) => (
    <Card style={styles.card} onPress={() => openSurvey(item)}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="clipboard-text" size={24} color="#4a90e2" />
          <Text style={styles.cardTitle}>{item.address}</Text>
        </View>
        <View style={styles.cardDetails}>
          <Text style={styles.cardDate}>Date: {item.date}</Text>
          <View style={[styles.statusBadge, 
            item.status === 'Completed' ? styles.completed : 
            item.status === 'In Progress' ? styles.inProgress : styles.pending
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Property Surveys</Text>
        <Text style={styles.subtitle}>Record and manage property content valuations</Text>
      </View>

      <Button 
        mode="contained" 
        style={styles.newButton}
        icon="plus"
        onPress={startNewSurvey}
      >
        New Survey
      </Button>

      <Text style={styles.sectionTitle}>Active Surveys</Text>
      <FlatList
        data={surveys}
        renderItem={renderSurveyCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.surveyList}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 5,
  },
  newButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#4a90e2',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  surveyList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  card: {
    marginVertical: 8,
    marginHorizontal: 5,
    borderRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 10,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  completed: {
    backgroundColor: '#2ecc71',
  },
  inProgress: {
    backgroundColor: '#f39c12',
  },
  pending: {
    backgroundColor: '#95a5a6',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
}); 