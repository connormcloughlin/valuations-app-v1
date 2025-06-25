import React, { useState, useEffect, createContext, useContext } from 'react';
import api from '../../../api';
import { storeDataForKey, getDataForKey } from '../../../utils/offlineStorage';

// Types
export interface Category {
  id: string;
  name: string;
  items: number;
  value: number;
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
            const { getAllRiskAssessmentItems } = await import('../../../utils/db');
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
                
                // Store in SQLite for future use (Step 1.2 - Batch Insert Optimization)
                const { batchInsertRiskAssessmentItems } = await import('../../../utils/db');
                const sqliteItems = apiResponse.data.map((item: any) => ({
                  riskassessmentitemid: Number(item.riskassessmentitemid),
                  riskassessmentcategoryid: Number(item.riskassessmentcategoryid),
                  itemprompt: item.itemprompt || '',
                  itemtype: Number(item.itemtype) || 0,
                  rank: Number(item.rank) || 0,
                  commaseparatedlist: item.commaseparatedlist || '',
                  selectedanswer: item.selectedanswer || '',
                  qty: Number(item.qty) || 1,
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
                }));
                
                try {
                  await batchInsertRiskAssessmentItems(sqliteItems);
                } catch (insertError) {
                  console.warn('Failed to batch insert items to SQLite:', insertError);
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
        
        // Cache the processed categories data
        console.log('💾 Caching section categories data...');
        await storeDataForKey(cacheKey, categoriesWithItems);
        
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