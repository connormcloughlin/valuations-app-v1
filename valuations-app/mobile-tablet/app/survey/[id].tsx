import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { logNavigation } from '../../utils/logger';
import api from '../../api';
import { AppLayout, TabConfig } from '../../components/layout';

// Import new components
import SurveyHeader from './components/SurveyHeader';
import SurveyDetails from './components/SurveyDetails';
import RiskAssessmentTemplates from './components/RiskAssessmentTemplates';
import CategoriesList from './components/CategoriesList';
import SurveyActions from './components/SurveyActions';
import { SurveyLoading, SurveyError } from './components/SurveyStates';

// Add Survey and Category types
interface Category {
  id: string;
  name: string;
  items: number;
  value: number;
}

interface RiskTemplate {
  riskassessmentid?: string;
  assessmentid?: number;
  assessmenttypeid?: number;
  assessmenttypename?: string;
  templatename?: string;
  prefix?: string;
  comments?: string;
}

interface Survey {
  id: string;
  address: string;
  client: string;
  date: string;
  policyNo: string;
  sumInsured: string;
  orderNumber: string;
  lastEdited: string;
  broker: string;
  categories: Category[];
  totalValue: number;
  completedCategories: number;
  appointmentId?: string;
  status?: string;
}

// Define tabs for survey navigation
const surveyTabs: TabConfig[] = [
  {
    name: 'dashboard',
    title: 'Dashboard',
    icon: 'view-dashboard',
    path: '/(tabs)'
  },
  {
    name: 'survey',
    title: 'Survey',
    icon: 'note-text',
    path: '/(tabs)/survey'
  },
  {
    name: 'new-survey',
    title: 'New Survey',
    icon: 'plus-circle',
    path: '/(tabs)/new-survey'
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: 'account',
    path: '/(tabs)/profile'
  }
];

export default function SurveyScreen() {
  logNavigation('Survey Detail Screen');
  const params = useLocalSearchParams();
  const { id } = params;
  const surveyId = id as string;
  
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Categories state for section selection
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedSectionTitle, setSelectedSectionTitle] = useState<string | null>(null);
  
  useEffect(() => {
    fetchSurveyData();
  }, [surveyId]);

  // Fetch categories for a section (following SectionsCategories logic)
  const fetchCategories = async (sectionId: string) => {
    console.log('🔍 Fetching categories for section:', sectionId);
    setCategoriesLoading(true);
    setCategoriesError(null);
    
    try {
      const res = await api.getRiskAssessmentCategories(sectionId);
      console.log('✅ getRiskAssessmentCategories response:', res);
      
      if (res.success && res.data) {
        const categoriesWithItems: Category[] = [];
        
        // Fetch items for each category (following ItemComponents logic)
        for (const c of res.data) {
          const categoryId = c.id || c.categoryid || c.riskassessmentcategoryid;
          const categoryName = c.name || c.categoryname || 'Unnamed Category';
          
          console.log('🔍 Fetching items for category:', categoryId);
          
          try {
            // Check SQLite first, then API (same pattern as ItemComponents.tsx)
            const { getAllRiskAssessmentItems } = await import('../../utils/db');
            const localItems = await getAllRiskAssessmentItems();
            const categoryItems = localItems.filter(item => 
              String(item.riskassessmentcategoryid) === String(categoryId)
            );
            
            let itemCount = 0;
            let totalValue = 0;
            
            if (categoryItems.length === 0) {
              // No items in SQLite, fetch from API
              console.log('No items in SQLite for category, fetching from API:', categoryId);
              const apiResponse = await api.getRiskAssessmentItems(categoryId);
              
              if (apiResponse?.success && Array.isArray(apiResponse.data)) {
                console.log('Got items from API:', apiResponse.data.length);
                itemCount = apiResponse.data.length;
                totalValue = apiResponse.data.reduce((sum: number, item: any) => {
                  const price = Number(item.price) || 0;
                  const qty = Number(item.qty) || 1;
                  return sum + (price * qty);
                }, 0);
                
                // Store in SQLite for future use (same as ItemComponents)
                const { insertRiskAssessmentItem } = await import('../../utils/db');
                for (const item of apiResponse.data) {
                  const sqliteItem = {
                    riskassessmentitemid: Number(item.riskassessmentitemid),
                    riskassessmentcategoryid: Number(item.riskassessmentcategoryid),
                    itemprompt: item.itemprompt || '',
                    itemtype: Number(item.itemtype) || 0,
                    rank: Number(item.rank) || 0,
                    commaseparatedlist: item.commaseparatedlist || '',
                    selectedanswer: item.selectedanswer || '',
                    qty: Number(item.qty) || 0,
                    price: Number(item.price) || 0,
                    description: item.description || '',
                    model: item.model || '',
                    location: item.location || '',
                    assessmentregisterid: Number(item.assessmentregisterid) || 0,
                    assessmentregistertypeid: Number(item.assessmentregistertypeid) || 0,
                    datecreated: item.datecreated || new Date().toISOString(),
                    createdbyid: item.createdbyid || '',
                    dateupdated: item.dateupdated || new Date().toISOString(),
                    updatedbyid: item.updatedbyid || '',
                    issynced: Number(item.issynced) || 0,
                    syncversion: Number(item.syncversion) || 0,
                    deviceid: item.deviceid || '',
                    syncstatus: item.syncstatus || '',
                    synctimestamp: item.synctimestamp || new Date().toISOString(),
                    hasphoto: Number(item.hasphoto) || 0,
                    latitude: Number(item.latitude) || 0,
                    longitude: Number(item.longitude) || 0,
                    notes: item.notes || '',
                    pending_sync: 0
                  };
                  
                  try {
                    await insertRiskAssessmentItem(sqliteItem);
                  } catch (insertError) {
                    console.warn('Failed to insert item to SQLite:', insertError);
                  }
                }
              }
            } else {
              // Use SQLite items
              console.log('Using existing SQLite items for category:', categoryItems.length);
              itemCount = categoryItems.length;
              totalValue = categoryItems.reduce((sum, item) => {
                const price = Number(item.price) || 0;
                const qty = Number(item.qty) || 1;
                return sum + (price * qty);
              }, 0);
            }
            
            categoriesWithItems.push({
              id: String(categoryId),
              name: categoryName,
              items: itemCount,
              value: totalValue
            });
            
          } catch (itemError) {
            console.warn(`Failed to fetch items for category ${categoryId}:`, itemError);
            // Add category with zero values if item fetch fails
            categoriesWithItems.push({
              id: String(categoryId),
              name: categoryName,
              items: 0,
              value: 0
            });
          }
        }
        
        setCategories(categoriesWithItems);
        
        // Update the survey categories as well
        if (survey) {
          setSurvey({
            ...survey,
            categories: categoriesWithItems,
            totalValue: categoriesWithItems.reduce((sum, cat) => sum + cat.value, 0)
          });
        }
      } else {
        setCategoriesError(res.message || 'Failed to load categories');
      }
    } catch (err: any) {
      console.error('❌ Error loading categories:', err);
      setCategoriesError(err.message || 'Error loading categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchSurveyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Fetching survey data for ID: ${surveyId}`);
      
      // Try to get appointment data using the same API as in-progress.tsx
      // @ts-ignore - this method exists in the API
      const response = await api.getAppointmentsByListView({
        status: 'In-Progress',
        page: 1,
        pageSize: 50,
        surveyor: null
      });
      
      if (response && response.success && response.data) {
        // Find the specific appointment by ID
        const appointment = response.data.find((appt: any) => {
          const apptId = String(appt.appointmentID || appt.appointmentId || appt.id);
          return apptId === surveyId;
        });
        
        if (appointment) {
          console.log('✅ Found appointment data:', appointment);
          
          // Map appointment data to Survey interface using the same pattern as in-progress.tsx
          const surveyData: Survey = {
            id: surveyId,
            address: String(appointment.address || 'No address provided'),
            client: String(appointment.client || 'Unknown client'),
            date: appointment.startTime || appointment.date || new Date().toISOString(),
            policyNo: String(appointment.policyNo || 'N/A'),
            sumInsured: String(appointment.sumInsured || 'Not specified'),
            orderNumber: String(appointment.orderNumber || appointment.orderID || 'Unknown'),
            lastEdited: appointment.lastEdited || appointment.dateModified || new Date().toISOString().split('T')[0],
            broker: String(appointment.broker || 'Not specified'),
            appointmentId: String(appointment.appointmentID || appointment.appointmentId || appointment.id),
            status: appointment.Invite_Status || appointment.inviteStatus || appointment.status || 'unknown',
            // TODO: Fetch real categories from risk assessment API
            categories: [], // Will be populated when categories API is integrated
            totalValue: 0,
            completedCategories: 0
          };
          
          setSurvey(surveyData);
        } else {
          console.warn(`❌ No appointment found with ID: ${surveyId}`);
          setError('Survey not found or is not in progress');
        }
      } else {
        console.error('❌ Failed to fetch appointments:', response);
        setError('Failed to load survey data');
      }
    } catch (err) {
      console.error('❌ Error fetching survey data:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const navigateToCategory = (categoryId: string, categoryName: string) => {
    router.push({
      pathname: '/survey/items',
      params: { 
        categoryId, 
        categoryTitle: categoryName,
        surveyId,
        appointmentId: survey?.appointmentId
      }
    });
  };

  const handleTemplateSelection = (template: RiskTemplate) => {
    console.log('🚀 Template selected for accordion view:', template);
    // Template is now handled by the accordion in RiskAssessmentTemplates component
    // No navigation needed as sections will be shown inline
  };

  const handleSectionSelection = (sectionId: string, sectionTitle: string) => {
    console.log('🚀 Section selected:', sectionId, sectionTitle);
    setSelectedSectionTitle(sectionTitle);
    fetchCategories(sectionId);
  };
  
  const continueSurvey = () => {
    // Navigate to new-survey with appointment data for proper template selection
    if (survey?.appointmentId) {
      router.push({
        pathname: '/(tabs)/new-survey',
        params: {
          appointmentId: survey.appointmentId,
          status: survey.status || 'in-progress',
          orderNumber: survey.orderNumber,
          clientName: survey.client,
          address: survey.address,
          policyNo: survey.policyNo,
          sumInsured: survey.sumInsured,
          broker: survey.broker
        }
      });
    } else {
      // Fallback to old categories screen
      router.push({
        pathname: '/survey/categories_old',
        params: { surveyId }
      });
    }
  };
  
  const finishSurvey = () => {
    router.push({
      pathname: '/survey/summary/[id]',
      params: { id: surveyId }
    });
  };
  
  if (loading) {
    return (
      <AppLayout
        title="Loading Survey"
        tabs={surveyTabs}
        showHeader={true}
        showBottomNav={true}
        showLogout={true}
      >
        <SurveyLoading />
      </AppLayout>
    );
  }
  
  if (error || !survey) {
    return (
      <AppLayout
        title="Survey Error"
        tabs={surveyTabs}
        showHeader={true}
        showBottomNav={true}
        showLogout={true}
      >
        <SurveyError 
          title="Survey Not Found"
          message={error || "The survey you're looking for doesn't exist or has been deleted."}
          onGoBack={() => router.back()} 
        />
      </AppLayout>
    );
  }
  
  // Calculate progress (mock for now until categories are integrated)
  const progress = survey.categories.length > 0 ? 
    Math.floor((survey.completedCategories / survey.categories.length) * 100) : 0;
  
  return (
    <AppLayout
      title={survey.client}
      tabs={surveyTabs}
      showHeader={true}
      showBottomNav={true}
      showLogout={true}
    >
      <ScrollView style={styles.scrollView}>
        <SurveyHeader 
          address={survey.address}
          completedCategories={survey.completedCategories}
          totalCategories={survey.categories.length || 1} // Avoid division by zero
        />
        
        <SurveyDetails
          client={survey.client}
          orderNumber={survey.orderNumber}
          policyNo={survey.policyNo}
          sumInsured={survey.sumInsured}
          broker={survey.broker}
          lastEdited={survey.lastEdited}
        />
        
        <RiskAssessmentTemplates
          orderNumber={survey.orderNumber}
          onTemplatePress={handleTemplateSelection}
          onSectionPress={handleSectionSelection}
        />
        
        {/* Show categories status when a section is selected */}
        {selectedSectionTitle && (
          <View style={styles.categoriesStatus}>
            <Text style={styles.selectedSectionTitle}>
              Categories from: {selectedSectionTitle}
            </Text>
            {categoriesLoading && (
              <Text style={styles.loadingText}>Loading categories...</Text>
            )}
            {categoriesError && (
              <Text style={styles.errorText}>{categoriesError}</Text>
            )}
          </View>
        )}
        
        <CategoriesList
          categories={categories.length > 0 ? categories : survey.categories}
          totalValue={categories.length > 0 ? categories.reduce((sum, cat) => sum + cat.value, 0) : survey.totalValue}
          onCategoryPress={navigateToCategory}
        />
      </ScrollView>
      
      <SurveyActions
        progress={progress}
        onContinueSurvey={continueSurvey}
        onFinishSurvey={finishSurvey}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: 16,
  },
  categoriesStatus: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  selectedSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    fontStyle: 'italic',
  },
}); 