import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../api';
import { API_BASE_URL } from '../../../constants/apiConfig';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import GlobalStyles constants
import { colors, spacing, borderRadius, typography } from '../../GlobalStyles';

// Define types for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  status?: number;
  message?: string;
}

interface RiskTemplate {
  riskassessmentid?: string;
  riskAssessmentId?: string; // camelCase from hierarchy API
  assessmentid?: number;
  assessmenttypeid?: number;
  assessmenttypename?: string;
  assessmentTypeName?: string; // camelCase from hierarchy API
  templatename?: string;
  prefix?: string;
  comments?: string;
}

interface Section {
  id: string;
  title: string;
}

interface RiskAssessmentTemplatesProps {
  orderNumber: string;
  onTemplatePress?: (template: RiskTemplate) => void;
  onSectionPress?: (sectionId: string, sectionTitle: string) => void;
}

// Helper function to fetch templates by order ID
const fetchTemplatesByOrderId = async (orderId: string): Promise<ApiResponse<RiskTemplate[]>> => {
  try {
    console.log(`Fetching templates for order ID: ${orderId}`);
    
    // Create authenticated axios instance
    const token = await AsyncStorage.getItem('authToken');
    const fullUrl = `${API_BASE_URL}/risk-assessment-master/by-order/${orderId}?page=1&pageSize=20`;
    console.log(`🌐 FULL URL: ${fullUrl}`);
    console.log(`🔑 AUTH TOKEN: ${token ? `Bearer ${token.substring(0, 20)}...` : 'NO TOKEN'}`);
    
    const axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    const response = await axiosInstance.get(`/risk-assessment-master/by-order/${orderId}?page=1&pageSize=20`);
    console.log('API response:', JSON.stringify(response.data, null, 2));
    
    // Ensure we return an array, even if API returns different structure
    const templatesArray = Array.isArray(response.data) ? response.data : 
                          response.data && Array.isArray(response.data.data) ? response.data.data :
                          response.data && Array.isArray(response.data.templates) ? response.data.templates : [];
    
    return {
      success: true,
      data: templatesArray,
      status: response.status
    };
  } catch (error: any) {
    console.error(`❌ Error in API call: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`❌ Error details:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to fetch templates',
      status: error.response?.status || 0
    };
  }
};

export default function RiskAssessmentTemplates({ orderNumber, onTemplatePress, onSectionPress }: RiskAssessmentTemplatesProps) {
  const [templates, setTemplates] = useState<RiskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [sectionsLoading, setSectionsLoading] = useState<Record<string, boolean>>({});
  const [sectionsError, setSectionsError] = useState<Record<string, string | null>>({});
  const [hierarchyData, setHierarchyData] = useState<any>(null);

  useEffect(() => {
    fetchTemplatesAndHierarchy();
  }, [orderNumber]);

  // Fetch both templates and complete hierarchy
  const fetchTemplatesAndHierarchy = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, fetch the complete hierarchy if we have an order number
      if (orderNumber) {
        console.log(`🚀 Fetching complete hierarchy for order: ${orderNumber}`);
        try {
          // Fetch hierarchy and field configurations in parallel
          const [hierarchyResponse, fieldConfigResponse] = await Promise.all([
            api.getRiskAssessmentCompleteHierarchy(orderNumber),
            api.getOrderCategoryFieldConfigurations(orderNumber)
          ]);
          
          console.log('🚀 Hierarchy response:', hierarchyResponse);
          console.log('🚀 Field config response:', fieldConfigResponse);
          
          if (hierarchyResponse.success && hierarchyResponse.data) {
            console.log('🚀 Complete hierarchy loaded successfully');
            setHierarchyData(hierarchyResponse.data);
            
            // Cache field configurations if available
            if (fieldConfigResponse?.success && fieldConfigResponse?.data?.categories) {
              console.log(`🚀 Pre-loading field configurations for ${fieldConfigResponse.data.categories.length} categories`);
              
              // Store field configurations in a format that can be used by ConfigurationService
              const configurationService = await import('../../../services/configurationService');
              await configurationService.default.cacheOrderFieldConfigurations(orderNumber, fieldConfigResponse.data);
            }
            
            // Extract templates from hierarchy data - handle nested structure
            const templatesFromHierarchy = hierarchyResponse.data.assessmentMasters || hierarchyResponse.data.data?.assessmentMasters || [];
            console.log('🚀 Templates from hierarchy:', templatesFromHierarchy);
            
            if (templatesFromHierarchy.length > 0) {
              console.log(`🚀 Found ${templatesFromHierarchy.length} templates in hierarchy`);
              setTemplates(templatesFromHierarchy);
              
              // Pre-populate sections from hierarchy data
              const sectionsFromHierarchy: Record<string, Section[]> = {};
              templatesFromHierarchy.forEach((template: any) => {
                // Handle different field name cases from the API response
                const templateId = template.riskAssessmentId || template.riskassessmentid || String(template.assessmentid);
                console.log(`🚀 Processing template ${templateId}, sections:`, template.sections);
                
                if (templateId && template.sections) {
                  // Sections are nested within each template
                  const templateSections = template.sections.map((section: any) => ({
                    id: section.riskAssessmentSectionId || section.riskassessmentsectionid,
                    title: section.sectionName || section.sectionname || 'Unnamed Section',
                  }));
                  sectionsFromHierarchy[templateId] = templateSections;
                  console.log(`🚀 Added ${templateSections.length} sections for template ${templateId}`);
                }
              });
              setSections(sectionsFromHierarchy);
              console.log('🚀 All sections populated:', sectionsFromHierarchy);
              setLoading(false);
              return; // Exit early since we have hierarchy data
            }
          }
        } catch (hierarchyError) {
          console.error('Failed to fetch complete hierarchy:', hierarchyError);
        }
      }
      
      // Fallback: fetch templates the old way if hierarchy fails or no order number
      await fetchTemplates();
    } catch (err) {
      console.error('Error in fetchTemplatesAndHierarchy:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sections for a template (now only used as fallback)
  const fetchSections = (templateId: string) => {
    // If we have hierarchy data, use it instead of making API calls
    if (hierarchyData) {
      console.log('[RiskAssessmentTemplates] Using hierarchy data for sections');
      
      // Find the template in hierarchy data
      const templatesData = hierarchyData.assessmentMasters || hierarchyData.data?.assessmentMasters || [];
      const template = templatesData.find((t: any) => 
        (t.riskAssessmentId || t.riskassessmentid || String(t.assessmentid)) === templateId
      );
      
      if (template && template.sections) {
        const templateSections = template.sections.map((section: any) => ({
          id: section.riskAssessmentSectionId || section.riskassessmentsectionid,
          title: section.sectionName || section.sectionname || 'Unnamed Section',
        }));
        
        setSections(prev => ({ 
          ...prev, 
          [templateId]: templateSections
        }));
        console.log(`🚀 Used hierarchy data: ${templateSections.length} sections for template ${templateId}`);
        return;
      }
    }
    
    // Fallback to individual API call only if no hierarchy data
    console.log('[RiskAssessmentTemplates] Fallback: Fetching sections for template:', templateId);
    setSectionsLoading(prev => ({ ...prev, [templateId]: true }));
    setSectionsError(prev => ({ ...prev, [templateId]: null }));
    
    api.getRiskAssessmentSections(templateId)
      .then((res: any) => {
        console.log('[RiskAssessmentTemplates] getRiskAssessmentSections response:', res);
        if (res.success && res.data) {
          setSections(prev => ({ 
            ...prev, 
            [templateId]: res.data.map((s: any) => ({
              id: s.id || s.sectionid || s.riskassessmentsectionid,
              title: s.sectionname || s.name || 'Unnamed Section',
            }))
          }));
        } else {
          setSectionsError(prev => ({ 
            ...prev, 
            [templateId]: res.message || 'Failed to load sections' 
          }));
        }
      })
      .catch(e => {
        console.error('[RiskAssessmentTemplates] Error loading sections:', e);
        setSectionsError(prev => ({ 
          ...prev, 
          [templateId]: e.message || 'Error loading sections' 
        }));
      })
      .finally(() => setSectionsLoading(prev => ({ ...prev, [templateId]: false })));
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      if (orderNumber) {
        console.log(`Fetching templates for order: ${orderNumber}`);
        
        // Try order-specific templates first
        response = await fetchTemplatesByOrderId(orderNumber);
        console.log('Order-specific template response:', JSON.stringify(response, null, 2));
        
        if (!response.success || !response.data || response.data.length === 0) {
          console.log('Order-specific template fetch failed, falling back to general templates');
          response = await api.getRiskTemplates() as ApiResponse<RiskTemplate[]>;
          console.log('General template response:', JSON.stringify(response, null, 2));
        }
      } else {
        console.log('No order number available, fetching general templates');
        response = await api.getRiskTemplates() as ApiResponse<RiskTemplate[]>;
        console.log('General template response:', JSON.stringify(response, null, 2));
      }
      
      if (!response.success || !response.data || response.data.length === 0) {
        setError('Failed to load risk templates');
        return;
      }
      
      // Log the first template to see its structure
      if (response.data.length > 0) {
        console.log('First template structure:', JSON.stringify(response.data[0], null, 2));
      }
      
      const templatesArray = Array.isArray(response.data) ? response.data : [];
      console.log(`Loaded ${templatesArray.length} templates`);
      
      setTemplates(templatesArray);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTemplates();
  };

  if (loading) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Risk Assessment Templates</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Risk Assessment Templates</Text>
        <Card style={styles.errorCard} onPress={handleRefresh}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (templates.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Risk Assessment Templates</Text>
        <Text style={styles.emptyText}>No templates available</Text>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Risk Assessment Templates</Text>
        <Text style={styles.templateCount}>{templates.length} available</Text>
      </View>
      
      {templates.map((template: RiskTemplate, index: number) => {
        // Get the template ID using the correct field names (handle both camelCase and lowercase)
        const templateId = template.riskAssessmentId || template.riskassessmentid || String(template.assessmentid);
        
        // Get the template name using the correct field names (handle both camelCase and lowercase)
        const templateName = template.assessmentTypeName || template.templatename || template.assessmenttypename;
        
        console.log(`🎯 Rendering template ${index}:`, { templateId, templateName, template });
        
        if (!templateId || !templateName) {
          console.log(`❌ Skipping template ${index}: missing ID or name`);
          return null;
        }
        
        const isExpanded = expandedTemplate === templateId;
        
        return (
          <Card 
            key={`template-${templateId}-${index}`} 
            style={styles.templateCard}
            onPress={() => {
              if (isExpanded) {
                setExpandedTemplate(null);
              } else {
                setExpandedTemplate(templateId);
                // Fetch sections for this template if not already loaded
                if (!sections[templateId] && !sectionsLoading[templateId]) {
                  fetchSections(templateId);
                }
              }
              // Also call the optional callback
              if (onTemplatePress) {
                onTemplatePress(template);
              }
            }}
          >
            <Card.Content>
              <View style={styles.templateContent}>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{templateName}</Text>
                  {template.comments && (
                    <Text style={styles.templateDescription}>
                      {template.comments}
                    </Text>
                  )}
                </View>
                <MaterialCommunityIcons 
                  name={isExpanded ? "chevron-down" : "chevron-right"} 
                  size={24} 
                  color={colors.textMuted} 
                />
              </View>
              
              {/* Expanded sections */}
              {isExpanded && (
                <View style={styles.sectionsContainer}>
                  {sectionsLoading[templateId] && (
                    <View style={styles.sectionsLoadingContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.sectionsLoadingText}>Loading sections...</Text>
                    </View>
                  )}
                  
                  {sectionsError[templateId] && (
                    <Text style={styles.sectionsErrorText}>
                      {sectionsError[templateId]}
                    </Text>
                  )}
                  
                  {sections[templateId] && sections[templateId].map((section: Section) => (
                    <Card 
                      key={section.id} 
                      style={styles.sectionCard}
                      onPress={() => onSectionPress && onSectionPress(section.id, section.title)}
                    >
                      <Card.Content style={styles.sectionContent}>
                        <View style={styles.sectionInfo}>
                          <Text style={styles.sectionName}>{section.title}</Text>
                          <Text style={styles.sectionDetails}>
                            Section • Tap to view categories
                          </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                      </Card.Content>
                    </Card>
                  ))}
                  
                  {sections[templateId] && sections[templateId].length === 0 && (
                    <Text style={styles.noSectionsText}>No sections available</Text>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  templateCount: {
    fontSize: typography.sm,
    fontWeight: 'bold',
    color: colors.primary,
  },
  templateCard: {
    marginBottom: 3,
    borderRadius: borderRadius.sm,
  },
  templateContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  templateDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  errorCard: {
    backgroundColor: '#fff5f5',
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sm,
    marginBottom: spacing.xs,
  },
  retryText: {
    color: colors.textSecondary,
    fontSize: typography.xs,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: typography.sm,
    padding: 15,
  },
  sectionsContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  sectionsLoadingText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.xs,
  },
  sectionsErrorText: {
    color: colors.error,
    fontSize: typography.xs,
    padding: spacing.sm,
  },
  sectionCard: {
    marginBottom: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.md, // Indent sections under templates
  },
  sectionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionDetails: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  noSectionsText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: typography.xs,
    padding: spacing.sm,
  },
}); 