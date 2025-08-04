import React, { useState, useEffect, createContext, useContext } from 'react';
import api from '../../../api';
import { storeDataForKey, getDataForKey } from '../../../utils/offlineStorage';

// Types
export interface Category {
  id: string;
  name: string;
  items: number;
  value: number;
  risktemplatecategoryid?: number; // Add the template category ID
}

export interface RiskTemplate {
  riskassessmentid?: string;
  assessmentid?: number;
  assessmenttypeid?: number;
  assessmenttypename?: string;
  templatename?: string;
  prefix?: string;
  comments?: string;
}

export interface Survey {
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

// Context
interface SurveyContextType {
  // Survey data
  survey: Survey | null;
  loading: boolean;
  error: string | null;
  
  // Categories data
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  selectedSectionTitle: string | null;
  
  // Actions
  fetchSurveyData: () => Promise<void>;
  fetchCategories: (sectionId: string, sectionTitle: string) => Promise<void>;
  updateSurvey: (updates: Partial<Survey>) => void;
}

const SurveyContext = createContext<SurveyContextType | null>(null);

export const useSurveyData = () => {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error('useSurveyData must be used within a SurveyDataProvider');
  }
  return context;
};

interface SurveyDataProviderProps {
  surveyId: string;
  children: React.ReactNode;
}

export const SurveyDataProvider: React.FC<SurveyDataProviderProps> = ({ surveyId, children }) => {
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Categories state for section selection
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedSectionTitle, setSelectedSectionTitle] = useState<string | null>(null);

  const fetchSurveyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Fetching survey data for ID: ${surveyId}`);
      
      const cacheKey = `survey_data_${surveyId}`;
      
      // Check cache first
      console.log('📦 Checking cache for survey data...');
      const cachedData = await getDataForKey(cacheKey);
      if (cachedData && cachedData.data) {
        console.log('✅ Using cached survey data');
        setSurvey(cachedData.data);
        setLoading(false);
        // Continue to fetch fresh data in background
      }
      
      // Use the same API approach as appointment details screen
      const appointmentsApi = await import('../../../api/appointments');
      const response = await appointmentsApi.default.getAppointmentById(surveyId) as any;
      
      if (response && response.success && response.data) {
        const appointment = response.data;
        
        // Map appointment data to Survey interface using the same pattern as appointment details
        const surveyData: Survey = {
          id: surveyId,
          address: String(appointment.address || appointment.location || appointment.property_address || 'No address provided'),
          client: String(appointment.client || appointment.clientName || appointment.customer_name || 'Unknown client'),
          date: appointment.startTime || appointment.date || appointment.appointment_date || new Date().toISOString(),
          policyNo: String(appointment.policyNo || appointment.policyNumber || 'N/A'),
          sumInsured: String(appointment.sumInsured || 'Not specified'),
          orderNumber: String(appointment.orderNumber || appointment.orderID || appointment.order_id || 'Unknown'),
          lastEdited: appointment.lastEdited || appointment.lastModified || appointment.dateModified || new Date().toISOString().split('T')[0],
          broker: String(appointment.broker || 'Not specified'),
          appointmentId: String(appointment.appointmentID || appointment.appointmentId || appointment.id || surveyId),
          status: appointment.Invite_Status || appointment.inviteStatus || appointment.status || 'unknown',
          // Categories load on-demand through component interactions
          categories: [],
          totalValue: 0,
          completedCategories: 0
        };
        
        setSurvey(surveyData);
        
        // Cache the fresh survey data
        console.log('💾 Caching survey data...');
        await storeDataForKey(cacheKey, surveyData);
      } else {
        console.error('❌ Failed to fetch appointment:', response);
        setError('Failed to load survey data');
      }
    } catch (err) {
      console.error('❌ Error fetching survey data:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for a section (following SectionsCategories logic)
  const fetchCategories = async (sectionId: string, sectionTitle: string) => {
    console.log('🔍 Fetching categories for section:', sectionId);
    setCategoriesLoading(true);
    setCategoriesError(null);
    setSelectedSectionTitle(sectionTitle);
    
    const cacheKey = `section_categories_${sectionId}`;
    
    try {
      // Check cache first
      console.log('📦 Checking cache for section categories...');
      const cachedData = await getDataForKey(cacheKey);
      if (cachedData && cachedData.data) {
        console.log('✅ Using cached section categories data');
        setCategories(cachedData.data);
        setCategoriesLoading(false);
        
        // Update survey with cached categories
        if (survey) {
          setSurvey({
            ...survey,
            categories: cachedData.data,
            totalValue: cachedData.data.reduce((sum: number, cat: Category) => sum + cat.value, 0)
          });
        }
        // Continue to fetch fresh data in background
      }
      
      // Use composite API only - no fallbacks
      const orderNumber = survey?.orderNumber;
      
      if (!orderNumber || orderNumber === 'Unknown' || orderNumber === 'N/A') {
        throw new Error(`No valid order number available for composite API. Order number: ${orderNumber}`);
      }
      
      console.log(`🚀 Using composite API for order: ${orderNumber}`);
      
      // Use composite hierarchy API and field configurations in parallel
      const [compositeResponse, fieldConfigResponse] = await Promise.all([
        api.getRiskAssessmentCompleteHierarchy(orderNumber),
        api.getOrderCategoryFieldConfigurations(orderNumber)
      ]);
      
      console.log('✅ Composite API response received');
      console.log('✅ Field config response received:', fieldConfigResponse?.success);
      
      // Cache field configurations if available
      if (fieldConfigResponse?.success && fieldConfigResponse?.data?.categories) {
        console.log(`🚀 Pre-loading field configurations for ${fieldConfigResponse.data.categories.length} categories`);
        
        // Store field configurations in a format that can be used by ConfigurationService
        const configurationService = await import('../../../services/configurationService');
        await configurationService.default.cacheOrderFieldConfigurations(orderNumber, fieldConfigResponse.data);
      }
      
      if (!compositeResponse?.success || !compositeResponse?.data?.assessmentMasters) {
        throw new Error(`Composite API failed or invalid response structure. Response: ${JSON.stringify(compositeResponse)}`);
      }
      
      console.log('✅ Composite API response received');
      
      // Find the section in the composite data
      let foundCategories: Category[] = [];
      
      for (const master of compositeResponse.data.assessmentMasters) {
        if (master.sections) {
          for (const section of master.sections) {
            if (section.riskAssessmentSectionId === sectionId && section.categories) {
              console.log(`📋 Found ${section.categories.length} categories in composite data for section ${sectionId}`);
              
              // Process categories from composite API
              foundCategories = section.categories.map((category: any) => {
                const categoryId = category.riskAssessmentCategoryId || category.riskassessmentcategoryid || category.categoryId;
                const categoryName = category.categoryName || category.categoryname || 'Unnamed Category';
                const riskTemplateCategoryId = category.riskTemplateCategoryId || category.risktemplatecategoryid || category.RiskTemplateCategoryID;
                
                // Calculate totals from items in composite data
                const items = category.items || [];
                const itemCount = items.length;
                const totalValue = items.reduce((sum: number, item: any) => {
                  const price = Number(item.price) || 0;
                  const qty = Number(item.qty) || 1;
                  return sum + (price * qty);
                }, 0);
                
                return {
                  id: categoryId,
                  name: categoryName,
                  items: itemCount,
                  value: totalValue,
                  risktemplatecategoryid: riskTemplateCategoryId
                };
              });
              
              break; // Found the section, no need to continue
            }
          }
        }
      }
      
      if (foundCategories.length === 0) {
        throw new Error(`No categories found in composite data for section: ${sectionId}. Available sections: ${JSON.stringify(compositeResponse.data.assessmentMasters.map((m: any) => m.sections?.map((s: any) => s.riskAssessmentSectionId)))}`);
      }
      
      console.log(`✅ Processed ${foundCategories.length} categories from composite API`);
      setCategories(foundCategories);
      
      // Update survey with categories
      if (survey) {
        const totalValue = foundCategories.reduce((sum: number, cat: Category) => sum + cat.value, 0);
        setSurvey({
          ...survey,
          categories: foundCategories,
          totalValue: totalValue
        });
      }
      
      // Cache the categories
      await storeDataForKey(cacheKey, foundCategories);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setCategoriesError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const updateSurvey = (updates: Partial<Survey>) => {
    if (survey) {
      setSurvey({ ...survey, ...updates });
    }
  };

  useEffect(() => {
    fetchSurveyData();
  }, [surveyId]);

  const contextValue: SurveyContextType = {
    survey,
    loading,
    error,
    categories,
    categoriesLoading,
    categoriesError,
    selectedSectionTitle,
    fetchSurveyData,
    fetchCategories,
    updateSurvey,
  };

  return (
    <SurveyContext.Provider value={contextValue}>
      {children}
    </SurveyContext.Provider>
  );
}; 