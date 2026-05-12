import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import api from '../../../api';
import { storeDataForKey, getDataForKey } from '../../../utils/offlineStorage';
import { getAllRiskAssessmentItems } from '../../../utils/db';
import {
  categoriesForLocalOfflineSection,
  isLocalOfflineSectionId
} from '../../../services/offlineSectionMaterialization';
import { declaredLineValue } from '../../../components/survey/items/dynamic/itemFieldMapping';

function clientContactFromAppointment(appointment: Record<string, any>, ordersList: Record<string, any>) {
  const ol = ordersList || {};
  const phone =
    appointment.cell ??
    appointment.phone ??
    appointment.phoneNumber ??
    appointment.Phone ??
    appointment.PhoneNo ??
    appointment.PhoneNumber ??
    appointment.clientPhone ??
    appointment.client_phone ??
    ol.clientCell ??
    ol.ClientCell ??
    ol.clientPhoneNo ??
    ol.ClientPhoneNo ??
    ol.clientPhone ??
    ol.Phone ??
    'N/A';
  const email =
    appointment.email ??
    appointment.emailAddress ??
    appointment.Email ??
    appointment.EmailAddress ??
    appointment.clientEmail ??
    appointment.client_email ??
    ol.clientEmail ??
    ol.Email ??
    'N/A';
  return { clientPhone: String(phone), clientEmail: String(email) };
}

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
  // SLA fields (from appointment with-order / list-view)
  surveyor_status?: string | null;
  surveyor_due_date?: string | null;
  sla_status?: string | null;
  sla_due_date?: string | null;
  /** Client cellphone / email for survey details (from with-order / ordersList). */
  clientPhone?: string;
  clientEmail?: string;
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
  selectedSectionId: string | null;
  
  // Actions
  fetchSurveyData: () => Promise<void>;
  fetchCategories: (sectionId: string, sectionTitle: string) => Promise<void>;
  /** Collapse section accordion and clear loaded categories */
  clearSectionSelection: () => void;
  refreshCategoryValues: () => Promise<void>;
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
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Refs so refreshCategoryValues can read latest without changing its identity (avoids useFocusEffect loop)
  const surveyRef = useRef<Survey | null>(null);
  const categoriesRef = useRef<Category[]>([]);
  surveyRef.current = survey;
  categoriesRef.current = categories;

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
        
        // Check network connectivity before attempting API call
        const NetInfo = await import('@react-native-community/netinfo');
        const netInfo = await NetInfo.default.fetch();
        
        if (!netInfo.isConnected) {
          console.log('📱 Offline: Using cached data only');
          return; // Exit early if offline - we already have cached data
        }
        
        // Continue to fetch fresh data in background if online
        console.log('🌐 Online: Fetching fresh data in background...');
      } else {
        // No cached data - check if we're offline and try SQLite fallback
        const NetInfo = await import('@react-native-community/netinfo');
        const netInfo = await NetInfo.default.fetch();
        
        if (!netInfo.isConnected) {
          console.log('📱 Offline: No cached data, trying SQLite fallback...');
          
          // Try to get appointment data from SQLite
          const { getAppointmentById } = await import('../../../utils/db');
          const sqliteAppointment = await getAppointmentById(parseInt(surveyId));
          
          if (sqliteAppointment) {
            console.log('✅ Found appointment data in SQLite');
            
            // Map SQLite appointment data to Survey interface
            const surveyData: Survey = {
              id: surveyId,
              address: String(sqliteAppointment.location || 'No address provided'),
              client: String(sqliteAppointment.category || 'Unknown client'),
              date: sqliteAppointment.startTime || new Date().toISOString(),
              policyNo: 'N/A',
              sumInsured: 'Not specified',
              orderNumber: String(sqliteAppointment.orderID || 'Unknown'),
              lastEdited: sqliteAppointment.dateModified || new Date().toISOString().split('T')[0],
              broker: 'Not specified',
              appointmentId: String(sqliteAppointment.appointmentID || surveyId),
              status: sqliteAppointment.inviteStatus || 'unknown',
              clientPhone: 'N/A',
              clientEmail: 'N/A',
              categories: [],
              totalValue: 0,
              completedCategories: 0
            };
            
            setSurvey(surveyData);
            setLoading(false);
            return; // Exit early - we have SQLite data
          } else {
            console.log('❌ No appointment data found in SQLite either');
            setError('Survey not found. You are offline and no cached data is available.');
            setLoading(false);
            return;
          }
        }
      }
      
      // Use the same API approach as appointment details screen
      const appointmentsApi = await import('../../../api/appointments');
      const response = await appointmentsApi.default.getAppointmentById(surveyId) as any;
      
      if (response && response.success && response.data) {
        const appointment = response.data;
        const ordersList = appointment.ordersList || {};
        // SLA can be at top level or nested in ordersList (with-order response)
        const surveyor_status = appointment.surveyor_status ?? appointment.surveyorStatus ?? ordersList.surveyor_status ?? ordersList.surveyorStatus ?? null;
        const surveyor_due_date = appointment.surveyor_due_date ?? appointment.surveyorDueDate ?? ordersList.surveyor_due_date ?? ordersList.surveyorDueDate ?? null;
        const sla_status = appointment.sla_status ?? appointment.slaStatus ?? ordersList.sla_status ?? ordersList.slaStatus ?? null;
        const sla_due_date = appointment.sla_due_date ?? appointment.slaDueDate ?? ordersList.sla_due_date ?? ordersList.slaDueDate ?? null;

        const { clientPhone, clientEmail } = clientContactFromAppointment(appointment, ordersList);

        // Map appointment data to Survey interface using the same pattern as appointment details
        const surveyData: Survey = {
          id: surveyId,
          address: String(appointment.address || appointment.location || appointment.property_address || 'No address provided'),
          client: String(appointment.client || appointment.clientName || appointment.customer_name || ordersList.clientsName || ordersList.client || 'Unknown client'),
          date: appointment.startTime || appointment.date || appointment.appointment_date || new Date().toISOString(),
          policyNo: String(appointment.policyNo || appointment.policyNumber || ordersList.policy || 'N/A'),
          sumInsured: String(appointment.sumInsured ?? ordersList.sumInsured ?? 'Not specified'),
          orderNumber: String(appointment.orderNumber || appointment.orderID || appointment.order_id || ordersList.orderid || 'Unknown'),
          lastEdited: appointment.lastEdited || appointment.lastModified || appointment.dateModified || new Date().toISOString().split('T')[0],
          broker: String(appointment.broker || ordersList.broker || 'Not specified'),
          appointmentId: String(appointment.appointmentID || appointment.appointmentId || appointment.id || surveyId),
          status: appointment.Invite_Status || appointment.inviteStatus || appointment.status || 'unknown',
          clientPhone,
          clientEmail,
          // Categories load on-demand through component interactions
          categories: [],
          totalValue: 0,
          completedCategories: 0,
          // SLA fields (from top level or ordersList)
          surveyor_status,
          surveyor_due_date,
          sla_status,
          sla_due_date
        };
        
        setSurvey(surveyData);
        
        // Cache the fresh survey data
        console.log('💾 Caching survey data...');
        await storeDataForKey(cacheKey, surveyData);
      } else {
        console.error('❌ Failed to fetch appointment:', response);
        
        // Only set error if we don't have cached data
        if (!cachedData || !cachedData.data) {
          setError('Failed to load survey data');
        } else {
          console.log('📱 Using cached data despite API failure');
        }
      }
    } catch (err) {
      console.error('❌ Error fetching survey data:', err);
      
      // Only set error if we don't have cached data
      const cacheKey = `survey_data_${surveyId}`;
      const cachedData = await getDataForKey(cacheKey);
      
      if (!cachedData || !cachedData.data) {
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } else {
        console.log('📱 Using cached data despite error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for a section (following SectionsCategories logic)
  const fetchCategories = async (sectionId: string, sectionTitle: string) => {
    console.log('🔍 Fetching categories for section:', sectionId);
    // Clear UI immediately so old section's categories are not shown while loading
    setCategories([]);
    setCategoriesError(null);
    setSelectedSectionTitle(sectionTitle);
    setSelectedSectionId(sectionId);
    setCategoriesLoading(true);
    
    const cacheKey = `section_categories_${sectionId}`;
    
    try {
      if (isLocalOfflineSectionId(sectionId)) {
        const cats = await categoriesForLocalOfflineSection(sectionId);
        setCategories(cats);
        if (survey) {
          const totalValue = cats.reduce((sum, cat) => sum + cat.value, 0);
          setSurvey({ ...survey, categories: cats, totalValue });
        }
        try {
          await storeDataForKey(cacheKey, cats);
        } catch {
          /* non-fatal */
        }
        setCategoriesLoading(false);
        return;
      }

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

      const prefetchService = await import('../../../services/prefetchService');
      await prefetchService.default.hydrateMediaMetadataFromHierarchy(compositeResponse.data);
      
      // Cache field configurations if available (shared with prefetchService.buildPrefetchQueue)
      if (fieldConfigResponse?.success && fieldConfigResponse?.data?.categories) {
        console.log(`🚀 Pre-loading field configurations for ${fieldConfigResponse.data.categories.length} categories`);
        await prefetchService.default.applyOrderFieldConfigurationCaches(orderNumber, fieldConfigResponse.data);
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
            if (String(section.riskAssessmentSectionId) === String(sectionId) && section.categories) {
              console.log(`📋 Found ${section.categories.length} categories in composite data for section ${sectionId}`);
              
              // Process categories from composite API
              foundCategories = section.categories.map((category: any) => {
                const categoryId = category.riskAssessmentCategoryId || category.riskassessmentcategoryid || category.categoryId;
                const categoryName = category.categoryName || category.categoryname || 'Unnamed Category';
                const riskTemplateCategoryId = category.riskTemplateCategoryId || category.risktemplatecategoryid || category.RiskTemplateCategoryID;
                
                // Calculate totals from items in composite data
                const items = category.items || [];
                const itemCount = items.length;
                const totalValue = items.reduce(
                  (sum: number, item: any) => sum + declaredLineValue(item.price),
                  0
                );
                
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

  const clearSectionSelection = useCallback(() => {
    setSelectedSectionId(null);
    setSelectedSectionTitle(null);
    setCategories([]);
    setCategoriesError(null);
    setCategoriesLoading(false);
  }, []);

  const updateSurvey = (updates: Partial<Survey>) => {
    if (survey) {
      setSurvey({ ...survey, ...updates });
    }
  };

  /** Recompute category values and item counts from SQLite so totals stay correct after editing items. */
  const refreshCategoryValues = useCallback(async () => {
    const currentSurvey = surveyRef.current;
    if (!currentSurvey) return;
    const currentCategories = categoriesRef.current;
    const currentList = currentCategories.length > 0 ? currentCategories : currentSurvey.categories;
    if (currentList.length === 0) return;
    try {
      const allItems = await getAllRiskAssessmentItems();
      const appointmentId = currentSurvey.appointmentId ?? surveyId;
      const relevantItems = appointmentId
        ? allItems.filter(
            (i) => !i.isDeleted && (i.appointmentid == null || String(i.appointmentid) === String(appointmentId))
          )
        : allItems.filter((i) => !i.isDeleted);
      const byCategory: Record<string, { value: number; items: number }> = {};
      for (const item of relevantItems) {
        const catId = String(item.riskassessmentcategoryid);
        if (!byCategory[catId]) byCategory[catId] = { value: 0, items: 0 };
        byCategory[catId].value += declaredLineValue(item.price);
        byCategory[catId].items += 1;
      }
      const updated = currentList.map((c) => {
        const key = String(c.id);
        const rec = byCategory[key];
        return {
          ...c,
          value: rec ? rec.value : c.value,
          items: rec ? rec.items : c.items,
        };
      });
      const totalValue = updated.reduce((sum, cat) => sum + cat.value, 0);
      if (currentCategories.length > 0) setCategories(updated);
      setSurvey((prev) => (prev ? { ...prev, categories: updated, totalValue } : prev));
    } catch (err) {
      console.warn('Failed to refresh category values from SQLite:', err);
    }
  }, [surveyId]);

  useEffect(() => {
    // Safety check: ensure category configurations are loaded before fetching survey data
    const initializeSurvey = async () => {
      try {
        const prefetchService = await import('../../../services/prefetchService');
        await prefetchService.default.ensureCategoryConfigurationsLoaded();
        fetchSurveyData();
      } catch (error) {
        console.error('❌ Error ensuring category configurations loaded:', error);
        // Still try to fetch survey data even if safety check fails
        fetchSurveyData();
      }
    };
    
    initializeSurvey();
  }, [surveyId]);

  // New appointment: don't show previous section's categories
  useEffect(() => {
    setSelectedSectionId(null);
    setSelectedSectionTitle(null);
    setCategories([]);
    setCategoriesError(null);
    setCategoriesLoading(false);
  }, [surveyId]);

  // Start prefetch when survey data is first loaded (by surveyId + orderNumber only, so category/totalValue updates don't re-trigger)
  const orderNumber = survey?.orderNumber ?? null;
  useEffect(() => {
    if (surveyId && orderNumber) {
      const startPrefetch = async () => {
        try {
          console.log(`🚀 SURVEY DATA PROVIDER - Starting prefetch for survey ${surveyId}, order ${orderNumber}`);
          const prefetchService = await import('../../../services/prefetchService');
          const [hierarchyResp, fieldResp] = await Promise.all([
            api.getRiskAssessmentCompleteHierarchy(orderNumber),
            api.getOrderCategoryFieldConfigurations(orderNumber)
          ]);
          const hierarchyOk =
            hierarchyResp?.success === true && hierarchyResp.data != null;
          const fieldOk =
            fieldResp?.success === true &&
            Array.isArray(fieldResp.data?.categories) &&
            fieldResp.data.categories.length > 0;
          const prefetchResult = await prefetchService.default.startAppointmentPrefetch(
            surveyId,
            orderNumber,
            hierarchyOk && fieldOk
              ? { hierarchy: hierarchyResp, orderFieldConfig: fieldResp.data }
              : undefined
          );
          console.log(`🔍 SURVEY DATA PROVIDER - Prefetch result:`, prefetchResult);
        } catch (error) {
          console.error('❌ SURVEY DATA PROVIDER - Prefetch error:', error);
        }
      };
      startPrefetch();
    }
  }, [surveyId, orderNumber]);

  const contextValue: SurveyContextType = {
    survey,
    loading,
    error,
    categories,
    categoriesLoading,
    categoriesError,
    selectedSectionTitle,
    selectedSectionId,
    fetchSurveyData,
    fetchCategories,
    clearSectionSelection,
    refreshCategoryValues,
    updateSurvey,
  };

  return (
    <SurveyContext.Provider value={contextValue}>
      {children}
    </SurveyContext.Provider>
  );
}; 