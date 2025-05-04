import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Card, Button, Divider, List } from 'react-native-paper';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mock data for a completed survey
const mockSurveyData = {
  surveyInfo: {
    id: 'S12345',
    surveyor: 'Nicole Ellis',
    date: '2024-04-25',
    clientName: 'M.R. Gumede',
    sumInsured: 'R 3 mil',
    policyNo: 'K 82 mil',
    address: '29 Killarney Avenue, Sandhurst',
    broker: 'Discovery',
  },
  categories: [
    {
      id: 'cat-1',
      title: 'CLOTHING (GENTS/BOYS)',
      totalValue: 3500,
      items: [
        { id: '1', description: 'Belts', quantity: 3, price: 300 },
        { id: '2', description: 'Hats/Gloves/Scarves', quantity: 5, price: 1200 },
        { id: '3', description: 'Shirts/T-Shirts', quantity: 25, price: 7500 },
        { id: '4', description: 'Shoes/Trainers', quantity: 15, price: 9000 },
      ]
    },
    {
      id: 'cat-2',
      title: 'FURNITURE',
      totalValue: 142000,
      items: [
        { id: '5', description: 'Dining Table', room: 'Dining', quantity: 1, price: 15000 },
        { id: '6', description: 'Chairs', room: 'Dining', quantity: 8, price: 24000 },
        { id: '7', description: 'Sofa', room: 'Lounge', quantity: 1, price: 25000 },
        { id: '8', description: 'Coffee Table', room: 'Lounge', quantity: 1, price: 7000 },
        { id: '9', description: 'Bed (Queen)', room: 'Main Bedroom', quantity: 1, price: 18000 },
      ]
    },
    {
      id: 'cat-8',
      title: 'VALUABLE CARPETS',
      totalValue: 45000,
      items: [
        { id: '10', description: 'Persian Rug 4x6', quantity: 1, price: 45000 },
      ]
    },
  ]
};

export default function SummaryScreen() {
  const [expandedCategories, setExpandedCategories] = useState(mockSurveyData.categories.map(c => c.id));
  
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  
  const totalValue = mockSurveyData.categories.reduce(
    (sum, category) => sum + category.totalValue, 
    0
  );
  
  const renderCategoryItems = (category) => {
    if (category.id === 'cat-2') {
      // Group furniture items by room
      const roomGroups = {};
      category.items.forEach(item => {
        if (!roomGroups[item.room]) {
          roomGroups[item.room] = [];
        }
        roomGroups[item.room].push(item);
      });
      
      return Object.entries(roomGroups).map(([room, items]) => (
        <View key={room}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomTitle}>{room}</Text>
          </View>
          {items.map(item => renderItem(item))}
        </View>
      ));
    } else {
      return category.items.map(item => renderItem(item));
    }
  };
  
  const renderItem = (item) => (
    <View key={item.id} style={styles.itemRow}>
      <View style={styles.itemDetails}>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
      </View>
      <Text style={styles.itemPrice}>R {item.price.toLocaleString()}</Text>
    </View>
  );
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Survey Summary',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />

      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.surveyHeader}>
                <MaterialCommunityIcons name="file-document" size={24} color="#4a90e2" />
                <Text style={styles.surveyId}>Survey {mockSurveyData.surveyInfo.id}</Text>
              </View>
              
              <View style={styles.clientInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Client:</Text>
                  <Text style={styles.infoValue}>{mockSurveyData.surveyInfo.clientName}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date:</Text>
                  <Text style={styles.infoValue}>{mockSurveyData.surveyInfo.date}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoValue}>{mockSurveyData.surveyInfo.address}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Sum Insured:</Text>
                  <Text style={styles.infoValue}>{mockSurveyData.surveyInfo.sumInsured}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
          
          <View style={styles.summaryHeader}>
            <Text style={styles.sectionTitle}>Inventory Summary</Text>
            <Text style={styles.totalAmount}>Total: R {totalValue.toLocaleString()}</Text>
          </View>
          
          {mockSurveyData.categories.map(category => (
            <Card key={category.id} style={styles.categoryCard}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category.id)}
              >
                <View style={styles.categoryTitleContainer}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryTotal}>R {category.totalValue.toLocaleString()}</Text>
                </View>
                <MaterialCommunityIcons
                  name={expandedCategories.includes(category.id) ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#555"
                />
              </TouchableOpacity>
              
              {expandedCategories.includes(category.id) && (
                <View style={styles.itemsList}>
                  {renderCategoryItems(category)}
                </View>
              )}
            </Card>
          ))}
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            style={styles.editButton}
            icon="pencil"
            onPress={() => router.push('/survey/categories')}
          >
            Edit Survey
          </Button>
          <Button
            mode="contained"
            style={styles.doneButton}
            icon="check"
            onPress={() => router.push('/(tabs)')}
          >
            Submit
          </Button>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    marginBottom: 16,
    borderRadius: 10,
  },
  surveyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  surveyId: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#2c3e50',
  },
  clientInfo: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  categoryCard: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f4f7',
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  categoryTotal: {
    fontSize: 14,
    color: '#27ae60',
    marginTop: 4,
    fontWeight: '500',
  },
  itemsList: {
    padding: 12,
  },
  roomHeader: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    borderRadius: 6,
  },
  roomTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemDetails: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    color: '#2c3e50',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  editButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#3498db',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#27ae60',
  },
}); 