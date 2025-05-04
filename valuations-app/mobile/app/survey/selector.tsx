import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api';

interface RiskTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export default function SurveySelector() {
  const { appointmentId, orderId } = useLocalSearchParams<{ appointmentId: string; orderId: string }>();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<RiskTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        // Get all risk templates associated with this order using the api client
        const response = await api.getRiskTemplatesForOrder(orderId);
        if (response.success) {
          setTemplates(response.data);
        } else {
          setError('Failed to load assessment types');
        }
      } catch (err) {
        console.error('Error loading templates:', err);
        setError('An error occurred while loading assessment types');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadTemplates();
    }
  }, [orderId]);

  const handleTemplateSelect = (template: RiskTemplate) => {
    // Navigate to the survey screen with the selected template
    router.push({
      pathname: '/survey/categories',
      params: {
        appointmentId,
        orderId,
        templateId: template.id,
        templateName: template.name
      }
    });
  };

  // Helper function to get an icon based on template name
  const getIconName = (template: RiskTemplate) => {
    const name = template.name.toLowerCase();
    if (name.includes('inventory')) return 'clipboard-list';
    if (name.includes('domestic')) return 'home';
    if (name.includes('building')) return 'office-building';
    if (name.includes('contents')) return 'sofa';
    return 'clipboard-check';
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Select Assessment Type',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />

      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : templates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No assessment types found for this order</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.instructions}>
              Select the assessment type you want to work on:
            </Text>
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleTemplateSelect(item)}>
                  <View style={styles.card}>
                    <View style={styles.cardContent}>
                      <MaterialCommunityIcons 
                        name={getIconName(item)} 
                        size={32} 
                        color="#0066cc" 
                        style={styles.icon} 
                      />
                      <View style={styles.textContainer}>
                        <Text style={styles.templateName}>{item.name}</Text>
                        {item.description && (
                          <Text style={styles.templateDescription}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                      <MaterialCommunityIcons 
                        name="chevron-right" 
                        size={24} 
                        color="#666" 
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
            />
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  instructions: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
}); 