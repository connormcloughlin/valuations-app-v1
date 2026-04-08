import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { Card, ActivityIndicator, Button } from 'react-native-paper';
import CategoriesList from './CategoriesList';
import type { Category } from './SurveyDataProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../api';
import { API_BASE_URL } from '../../../constants/apiConfig';
import transportClient from '../../../core/transport/transportClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mediaService from '../../../services/mediaService';
import sectionCloneService from '../../../services/sectionCloneService';

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
  /** Copied offline; needs server reconcile on sync */
  offlinePending?: boolean;
}

interface RiskAssessmentTemplatesProps {
  orderNumber: string;
  /** Survey appointment id — required for SQLite `appointmentid` on cloned item rows */
  appointmentId?: string;
  /** Increment to refresh template photo counts (e.g. after adding a template photo) */
  templatePhotosRefreshKey?: number;
  onTemplatePress?: (template: RiskTemplate) => void;
  onSectionPress?: (sectionId: string, sectionTitle: string) => void;
  onAddTemplatePhoto?: (templateId: string, templateName: string) => void;
  onViewTemplatePhotos?: (templateId: string, templateName: string) => void;
  onAddSectionPhoto?: (sectionId: string, sectionName: string) => void;
  onViewSectionPhotos?: (sectionId: string, sectionName: string) => void;
  /** Accordion: which section is expanded (categories shown nested below it) */
  selectedSectionId?: string | null;
  sectionCategories?: Category[];
  sectionCategoriesLoading?: boolean;
  sectionCategoriesError?: string | null;
  sectionCategoriesTotal?: number;
  onCategoryPress?: (categoryId: string, categoryName: string, riskTemplateCategoryId?: number) => void;
  onAddCategoryPhoto?: (categoryId: string, categoryName: string) => void;
  onViewCategoryPhotos?: (categoryId: string, categoryName: string) => void;
  categoryPhotoCountRefreshKey?: number;
}

// Helper function to fetch templates by order ID
const fetchTemplatesByOrderId = async (orderId: string): Promise<ApiResponse<RiskTemplate[]>> => {
  try {
    console.log(`Fetching templates for order ID: ${orderId}`);
    
    // Use the transport client instead of the deprecated API client
    const response = await transportClient.get('risk-assessments.sections', `/risk-assessment-master/by-order/${orderId}?page=1&pageSize=20`);
    
    console.log('API response:', JSON.stringify(response, null, 2));
    
    // Ensure we return an array, even if API returns different structure
    const templatesArray = Array.isArray(response) ? response : 
                          response && Array.isArray(response.data) ? response.data :
                          response && Array.isArray(response.templates) ? response.templates : [];
    
    return {
      success: true,
      data: templatesArray,
      status: 200
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

export default function RiskAssessmentTemplates({
  orderNumber,
  appointmentId,
  templatePhotosRefreshKey = 0,
  onTemplatePress,
  onSectionPress,
  onAddTemplatePhoto,
  onViewTemplatePhotos,
  onAddSectionPhoto,
  onViewSectionPhotos,
  selectedSectionId = null,
  sectionCategories = [],
  sectionCategoriesLoading = false,
  sectionCategoriesError = null,
  sectionCategoriesTotal = 0,
  onCategoryPress,
  onAddCategoryPhoto,
  onViewCategoryPhotos,
  categoryPhotoCountRefreshKey = 0,
}: RiskAssessmentTemplatesProps) {
  const [templates, setTemplates] = useState<RiskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [sectionsLoading, setSectionsLoading] = useState<Record<string, boolean>>({});
  const [sectionsError, setSectionsError] = useState<Record<string, string | null>>({});
  const [hierarchyData, setHierarchyData] = useState<any>(null);
  const [templatePhotoCounts, setTemplatePhotoCounts] = useState<Record<string, number>>({});
  const [sectionPhotoCounts, setSectionPhotoCounts] = useState<Record<string, number>>({});

  const [cloneModalVisible, setCloneModalVisible] = useState(false);
  const [cloneTemplateId, setCloneTemplateId] = useState<string | null>(null);
  const [cloneSourceSection, setCloneSourceSection] = useState<Section | null>(null);
  const [cloneTargetName, setCloneTargetName] = useState('');
  const [cloneBusy, setCloneBusy] = useState(false);

  useEffect(() => {
    fetchTemplatesAndHierarchy();
  }, [orderNumber]);

  // Load photo count per template so we can disable view icon when 0
  useEffect(() => {
    if (templates.length === 0 || !onViewTemplatePhotos) return;
    let cancelled = false;
    const loadCounts = async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        templates.map(async (template: RiskTemplate) => {
          const templateId = template.riskAssessmentId || template.riskassessmentid || String(template.assessmentid);
          if (!templateId) return;
          try {
            const entityId = parseInt(templateId, 10);
            if (isNaN(entityId)) return;
            const photos = await mediaService.getPhotosForEntity('riskAssessmentMaster', entityId);
            if (!cancelled) counts[templateId] = photos.length;
          } catch {
            if (!cancelled) counts[templateId] = 0;
          }
        })
      );
      if (!cancelled) setTemplatePhotoCounts(counts);
    };
    loadCounts();
    return () => { cancelled = true; };
  }, [templates, onViewTemplatePhotos, templatePhotosRefreshKey]);

  // Load photo count per section so we can disable view icon when 0
  useEffect(() => {
    const allSections = Object.values(sections).flat();
    if (allSections.length === 0 || !onViewSectionPhotos) return;
    let cancelled = false;
    const loadCounts = async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        allSections.map(async (section: Section) => {
          const sectionId = section.id;
          if (!sectionId) return;
          try {
            const entityId = parseInt(sectionId, 10);
            if (isNaN(entityId)) return;
            const photos = await mediaService.getPhotosForEntity('riskAssessmentSection', entityId);
            if (!cancelled) counts[sectionId] = photos.length;
          } catch {
            if (!cancelled) counts[sectionId] = 0;
          }
        })
      );
      if (!cancelled) setSectionPhotoCounts(counts);
    };
    loadCounts();
    return () => { cancelled = true; };
  }, [sections, onViewSectionPhotos, templatePhotosRefreshKey]);

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
            const prefetchService = await import('../../../services/prefetchService');
            await prefetchService.default.hydrateMediaMetadataFromHierarchy(hierarchyResponse.data);
            
            // Cache field configurations if available (shared with prefetchService.buildPrefetchQueue)
            if (fieldConfigResponse?.success && fieldConfigResponse?.data?.categories) {
              console.log(`🚀 Pre-loading field configurations for ${fieldConfigResponse.data.categories.length} categories`);
              await prefetchService.default.applyOrderFieldConfigurationCaches(orderNumber, fieldConfigResponse.data);
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
                if (__DEV__) {
                  console.log(`🚀 Processing template ${templateId}, sections count:`, template.sections?.length || 0);
                }
                
                if (templateId && template.sections) {
                  // Sections are nested within each template
                  const templateSections = template.sections.map((section: any) => ({
                    id: String(section.riskAssessmentSectionId || section.riskassessmentsectionid),
                    title: section.sectionName || section.sectionname || 'Unnamed Section',
                  }));
                  sectionsFromHierarchy[templateId] = templateSections;
                  console.log(`🚀 Added ${templateSections.length} sections for template ${templateId}`);
                }
              });
              const mergedHierarchy = appointmentId
                ? await sectionCloneService.mergeOfflineSectionsIntoMap(sectionsFromHierarchy, appointmentId)
                : sectionsFromHierarchy;
              setSections(mergedHierarchy);
              if (__DEV__) {
                console.log('🚀 All sections populated for templates:', Object.keys(mergedHierarchy));
              }
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
          id: String(section.riskAssessmentSectionId || section.riskassessmentsectionid),
          title: section.sectionName || section.sectionname || 'Unnamed Section',
        }));
        
        setSections((prev) => {
          const base = { ...prev, [templateId]: templateSections };
          if (appointmentId) {
            sectionCloneService.mergeOfflineSectionsIntoMap(base, appointmentId).then((merged) => {
              setSections(merged);
            });
          }
          return base;
        });
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
          const templateSections = res.data.map((s: any) => ({
            id: String(s.id || s.sectionid || s.riskassessmentsectionid),
            title: s.sectionname || s.name || 'Unnamed Section',
          }));
          setSections((prev) => {
            const base = { ...prev, [templateId]: templateSections };
            if (appointmentId) {
              sectionCloneService.mergeOfflineSectionsIntoMap(base, appointmentId).then((merged) => {
                setSections(merged);
              });
            }
            return base;
          });
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
        console.log('First template structure size:', JSON.stringify(response.data[0]).length, 'bytes');
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

  const openCloneSectionModal = (templateId: string) => {
    if (!appointmentId) {
      Alert.alert('Not available', 'Appointment context is missing; cannot copy section.');
      return;
    }
    const list = sections[templateId];
    if (!list || list.length === 0) {
      Alert.alert('Load sections', 'Expand this template and wait for sections to load first.');
      return;
    }
    setCloneTemplateId(templateId);
    setCloneSourceSection(null);
    setCloneTargetName('');
    setCloneModalVisible(true);
  };

  const runSectionClone = async () => {
    if (!cloneTemplateId || !cloneSourceSection || !appointmentId || !orderNumber) return;
    setCloneBusy(true);
    try {
      const result = await sectionCloneService.cloneSectionFromTemplate({
        riskAssessmentId: cloneTemplateId,
        sourceSectionId: String(cloneSourceSection.id),
        targetSectionName: cloneTargetName.trim() || undefined,
        orderNumber: String(orderNumber),
        appointmentId: String(appointmentId)
      });
      if (result.success) {
        if (result.materializedOffline) {
          Alert.alert(
            'Section added offline',
            'You can open categories and capture data now. The section will sync to the server when you are back online.'
          );
        } else if (result.queued) {
          Alert.alert('Queued', 'You are offline. The section copy will run when you sync.');
        } else {
          Alert.alert(
            'Section copied',
            result.itemsInserted != null
              ? `${result.itemsInserted} item row(s) saved locally. Pull to refresh if the hierarchy does not update.`
              : 'Done.'
          );
        }
        setCloneModalVisible(false);
        setCloneTemplateId(null);
        setCloneSourceSection(null);
        setCloneTargetName('');
        await fetchTemplatesAndHierarchy();
      } else {
        Alert.alert('Copy failed', result.error || 'Unknown error');
      }
    } finally {
      setCloneBusy(false);
    }
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
        
        if (__DEV__) {
          console.log(`🎯 Rendering template ${index}:`, { templateId, templateName, template });
        }
        
        if (!templateId || !templateName) {
          console.log(`❌ Skipping template ${index}: missing ID or name`);
          return null;
        }
        
        const isExpanded = expandedTemplate === templateId;
        
        return (
          <Card 
            key={`template-${templateId}-${index}`} 
            style={styles.templateCard}
          >
            <Card.Content>
              <View style={styles.templateContent}>
                <TouchableOpacity
                  style={styles.templateMainRow}
                  onPress={() => {
                    if (isExpanded) {
                      setExpandedTemplate(null);
                    } else {
                      setExpandedTemplate(templateId);
                      if (!sections[templateId] && !sectionsLoading[templateId]) {
                        fetchSections(templateId);
                      }
                    }
                    if (onTemplatePress) {
                      onTemplatePress(template);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{templateName}</Text>
                    {template.comments && (
                      <Text style={styles.templateDescription}>
                        {template.comments}
                      </Text>
                    )}
                  </View>
                  <View style={styles.templateRightRow}>
                    {onAddTemplatePhoto && (
                      <TouchableOpacity
                        onPress={() => onAddTemplatePhoto(templateId, templateName)}
                        style={styles.templatePhotoIcon}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialCommunityIcons name="camera" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                    {onViewTemplatePhotos && (
                      <TouchableOpacity
                        onPress={templatePhotoCounts[templateId] > 0 ? () => onViewTemplatePhotos(templateId, templateName) : undefined}
                        style={styles.templatePhotoIcon}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        disabled={(templatePhotoCounts[templateId] ?? 0) === 0}
                      >
                        <MaterialCommunityIcons
                          name="image-multiple"
                          size={20}
                          color={(templatePhotoCounts[templateId] ?? 0) > 0 ? colors.primary : colors.textMuted}
                        />
                      </TouchableOpacity>
                    )}
                    <MaterialCommunityIcons 
                      name={isExpanded ? "chevron-down" : "chevron-right"} 
                      size={24} 
                      color={colors.textMuted} 
                    />
                  </View>
                </TouchableOpacity>
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
                  
                  {appointmentId && sections[templateId] && sections[templateId].length > 0 && (
                    <TouchableOpacity
                      style={styles.addSectionCopyRow}
                      onPress={() => openCloneSectionModal(templateId)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="content-copy" size={18} color={colors.primary} />
                      <Text style={styles.addSectionCopyText}>Copy section from…</Text>
                    </TouchableOpacity>
                  )}

                  {sections[templateId] && sections[templateId].map((section: Section) => {
                    const sectionExpanded = selectedSectionId != null && String(selectedSectionId) === String(section.id);
                    return (
                      <Card key={section.id} style={styles.sectionCard}>
                        <Card.Content style={styles.sectionCardContent}>
                          <TouchableOpacity
                            style={styles.sectionContent}
                            activeOpacity={0.7}
                            onPress={() => onSectionPress && onSectionPress(section.id, section.title)}
                          >
                            <View style={styles.sectionInfo}>
                              <Text style={styles.sectionName}>{section.title}</Text>
                              <Text style={styles.sectionDetails}>
                                {section.offlinePending
                                  ? 'Pending sync • Tap to expand or collapse'
                                  : sectionExpanded
                                    ? 'Section • Tap to collapse categories'
                                    : 'Section • Tap to expand categories'}
                              </Text>
                            </View>
                            <View style={styles.sectionRightRow}>
                              {onAddSectionPhoto && (
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e?.stopPropagation?.();
                                    onAddSectionPhoto(section.id, section.title);
                                  }}
                                  style={styles.templatePhotoIcon}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                  <MaterialCommunityIcons name="camera" size={20} color={colors.primary} />
                                </TouchableOpacity>
                              )}
                              {onViewSectionPhotos && (
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e?.stopPropagation?.();
                                    if ((sectionPhotoCounts[section.id] ?? 0) > 0) {
                                      onViewSectionPhotos(section.id, section.title);
                                    }
                                  }}
                                  style={styles.templatePhotoIcon}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  disabled={(sectionPhotoCounts[section.id] ?? 0) === 0}
                                >
                                  <MaterialCommunityIcons
                                    name="image-multiple"
                                    size={20}
                                    color={(sectionPhotoCounts[section.id] ?? 0) > 0 ? colors.primary : colors.textMuted}
                                  />
                                </TouchableOpacity>
                              )}
                              <MaterialCommunityIcons
                                name={sectionExpanded ? 'chevron-down' : 'chevron-right'}
                                size={24}
                                color="#95a5a6"
                              />
                            </View>
                          </TouchableOpacity>

                          {sectionExpanded && (
                            <View style={styles.sectionCategoriesAccordion}>
                              {sectionCategoriesLoading && (
                                <View style={styles.sectionCategoriesLoadingRow}>
                                  <ActivityIndicator size="small" color={colors.primary} />
                                  <Text style={styles.sectionsLoadingText}>Loading categories...</Text>
                                </View>
                              )}
                              {sectionCategoriesError ? (
                                <Text style={styles.sectionsErrorText}>{sectionCategoriesError}</Text>
                              ) : null}
                              {!sectionCategoriesLoading && !sectionCategoriesError && onCategoryPress && (
                                <CategoriesList
                                  embedded
                                  categories={sectionCategories}
                                  totalValue={sectionCategoriesTotal}
                                  onCategoryPress={onCategoryPress}
                                  photoCountRefreshKey={categoryPhotoCountRefreshKey}
                                  onAddCategoryPhoto={onAddCategoryPhoto}
                                  onViewCategoryPhotos={onViewCategoryPhotos}
                                />
                              )}
                            </View>
                          )}
                        </Card.Content>
                      </Card>
                    );
                  })}
                  
                  {sections[templateId] && sections[templateId].length === 0 && (
                    <Text style={styles.noSectionsText}>No sections available</Text>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>
        );
      })}

      <Modal
        visible={cloneModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!cloneBusy) setCloneModalVisible(false);
        }}
      >
        <View style={styles.cloneModalOverlay}>
          <View style={styles.cloneModalCard}>
            <Text style={styles.cloneModalTitle}>Copy section</Text>
            <Text style={styles.cloneModalHint}>
              Same assessment — structure only (empty answers). Requires backend API (see BACKEND_SECTION_CLONE_API_SPEC.md).
            </Text>
            {cloneTemplateId && sections[cloneTemplateId] ? (
              <ScrollView style={styles.cloneSectionList} nestedScrollEnabled>
                {sections[cloneTemplateId]!.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.cloneSectionRow,
                      cloneSourceSection?.id === s.id && styles.cloneSectionRowSelected
                    ]}
                    onPress={() => {
                      setCloneSourceSection(s);
                      setCloneTargetName(`${s.title} (copy)`);
                    }}
                  >
                    <Text style={styles.cloneSectionRowText}>{s.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
            <Text style={styles.cloneModalLabel}>New section name</Text>
            <TextInput
              value={cloneTargetName}
              onChangeText={setCloneTargetName}
              placeholder="e.g. Building (2)"
              style={styles.cloneModalInput}
              editable={!cloneBusy}
            />
            <View style={styles.cloneModalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  if (!cloneBusy) setCloneModalVisible(false);
                }}
              >
                Cancel
              </Button>
              <Button mode="contained" disabled={cloneBusy || !cloneSourceSection} onPress={runSectionClone}>
                {cloneBusy ? 'Working…' : 'Copy'}
              </Button>
            </View>
            {cloneBusy ? (
              <ActivityIndicator style={{ marginTop: spacing.sm }} color={colors.primary} />
            ) : null}
          </View>
        </View>
      </Modal>
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
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  templateMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  templateInfo: {
    flex: 1,
  },
  templateRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templatePhotoIcon: {
    padding: 4,
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
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
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
  // Match CategoriesList visual weight: gap between cards + comfortable row height
  sectionCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    marginLeft: spacing.md, // Indent sections under templates
  },
  sectionCardContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  sectionCategoriesAccordion: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  sectionCategoriesLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  sectionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    minHeight: 56,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionName: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionDetails: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  noSectionsText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: typography.xs,
    padding: spacing.sm,
  },
  addSectionCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  addSectionCopyText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  cloneModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  cloneModalCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    maxHeight: '85%',
  },
  cloneModalTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  cloneModalHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cloneSectionList: {
    maxHeight: 220,
    marginBottom: spacing.sm,
  },
  cloneSectionRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  cloneSectionRowSelected: {
    backgroundColor: '#e8f4fd',
  },
  cloneSectionRowText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  cloneModalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: colors.textPrimary,
  },
  cloneModalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    marginBottom: spacing.md,
    fontSize: 14,
  },
  cloneModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});