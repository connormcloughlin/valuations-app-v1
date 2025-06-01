import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { logNavigation } from '../../utils/logger';
import api from '../../api';

// Define types
interface RiskTemplate {
  id?: string;
  risktemplateid?: string;
  templateid?: string;
  name?: string;
  templatename?: string;
  description?: string;
  riskassessmentid?: string;
  assessmentid?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  status?: number;
  message?: string;
}

export default function TemplatesScreen() {
  logNavigation('Risk Templates');
  
  // Get survey parameters from route
  const params = useLocalSearchParams();
  const fromSurveyDetails = !params.surveyId; // If no surveyId, we're coming from survey details
  
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [templates, setTemplates] = useState<RiskTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedTemplateObj, setSelectedTemplateObj] = useState<RiskTemplate | null>(null);
  
  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  // Fetch templates from API
  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getRiskTemplates() as ApiResponse<RiskTemplate[]>;
      
      if (!response.success || !response.data) {
        setError(`Failed to load templates: ${response.message}`);
        return;
      }
      
      setTemplates(response.data);
      
      // Log the templates received
      console.log(`Retrieved ${response.data.length} templates`);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle template selection
  const handleSelectTemplate = (template: RiskTemplate) => {
    // Get the template ID using the properties available
    const templateId = template.risktemplateid || template.templateid || template.id;
    const riskassessmentid = template.riskassessmentid || template.assessmentid || templateId;
    
    if (!templateId) {
      setError('Invalid template: No ID found');
      return;
    }
    
    console.log(`Selected template: ${templateId} - ${template.templatename || template.name}`);
    setSelectedTemplate(templateId);
    setSelectedTemplateObj(template);

    // Navigate to the new sections-categories screen
    router.push({
      pathname: '/survey/SectionsCategories',
      params: { riskassessmentid }
    });
  };
  
  // Render template item
  const renderTemplateItem = ({ item }: { item: RiskTemplate }) => {
    const templateId = item.risktemplateid || item.templateid || item.id;
    const isSelected = selectedTemplate === templateId;
    
    return (
      <TouchableOpacity onPress={() => handleSelectTemplate(item)}>
        <Card 
          style={[
            styles.templateCard, 
            isSelected && styles.selectedTemplateCard
          ]}
        >
          <Card.Content>
            <View style={styles.templateHeader}>
              <Text style={styles.templateTitle}>
                {item.templatename || item.name || 'Unnamed Template'}
              </Text>
              {isSelected && (
                <MaterialCommunityIcons name="check-circle" size={24} color="#27ae60" />
              )}
            </View>
            {item.description && (
              <Text style={styles.templateDescription}>{item.description}</Text>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>Loading risk templates...</Text>
      </View>
    );
  }
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Select Risk Template',
          headerTitleStyle: {
            fontWeight: '600',
          },
          // Add back button if coming from survey details
          headerLeft: fromSurveyDetails ? () => (
            <Button
              onPress={() => router.back()}
              mode="text"
            >
              Cancel
            </Button>
          ) : undefined,
        }}
      />
      
      <View style={styles.container}>
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Select a risk assessment template to begin
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
        
        {templates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color="#bdc3c7" />
            <Text style={styles.emptyText}>No templates available</Text>
            <Button 
              mode="outlined" 
              onPress={fetchTemplates}
              style={styles.retryButton}
            >
              Retry
            </Button>
          </View>
        ) : (
          <FlatList
            data={templates}
            renderItem={renderTemplateItem}
            keyExtractor={(item) => item.risktemplateid?.toString() || item.templateid?.toString() || item.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  instructionsContainer: {
    padding: 16,
  },
  instructionsText: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
  },
  templateCard: {
    marginBottom: 12,
    borderRadius: 10,
  },
  selectedTemplateCard: {
    borderWidth: 2,
    borderColor: '#27ae60',
    backgroundColor: '#f0fff4',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  templateDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    marginTop: 8,
  },
}); 