import { useState, useEffect } from 'react';
import api from '../../../../api';
import appointmentsApi from '../../../../api/appointments';

interface CategorySummary {
  id: string;
  name: string;
  items: number;
  value: number;
}

interface SectionSummary {
  id: string;
  name: string;
  categories: CategorySummary[];
  totalItems: number;
  totalValue: number;
}

interface AssessmentTypeSummary {
  id: string;
  name: string;
  sections: SectionSummary[];
  totalItems: number;
  totalValue: number;
}

interface CompletedSurvey {
  id: string;
  address: string;
  client: string;
  date: string;
  policyNo: string;
  sumInsured: string;
  orderNumber: string;
  submitted: string;
  broker: string;
  completionDate: string;
  assessmentTypes: AssessmentTypeSummary[];
  totalValue: number;
  notes?: string;
}

export function useSurveySummaryData(surveyId: string, orderNumberFromParams?: string) {
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<CompletedSurvey | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurveySummary = async () => {
      if (!surveyId) {
        setError('No survey ID provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        let appointmentData: any = {};
        let orderNumber: string | undefined = orderNumberFromParams as string;

        // 1. Fetch appointment details using the with-order endpoint
        console.log(`🔍 Fetching appointment data for ID: ${surveyId}`);
        
        // Use the existing getAppointmentById method which calls /appointments/{id}/with-order
        const appointmentResponse = await appointmentsApi.getAppointmentById(surveyId) as any;
        
        if (!appointmentResponse || !appointmentResponse.success || !appointmentResponse.data) {
          throw new Error(`Failed to fetch appointment data for ID ${surveyId}.`);
        }
        
        const appointment = appointmentResponse.data;
        
        console.log('✅ Found appointment data:', appointment);
        appointmentData = appointment;
        orderNumber = appointmentData.OrderID || appointmentData.orderNumber || appointmentData.orderID;

        if (!orderNumber) {
          throw new Error('Order number could not be determined for this appointment.');
        }

        // 2. First, get the risk assessment masters to determine what data we need to fetch
        let assessmentTypeSummaries: AssessmentTypeSummary[] = [];
        let totalValue = 0;

        try {
          console.log('🔍 Fetching risk assessment masters from API for order:', orderNumber);
          
          // Use the same API approach as RiskAssessmentTemplates component
          const { API_BASE_URL } = await import('../../../../constants/apiConfig');
          const AsyncStorage = await import('@react-native-async-storage/async-storage');
          const axios = await import('axios');
          
          const token = await AsyncStorage.default.getItem('authToken');
          const axiosInstance = axios.default.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          });
          
          const mastersResponse = await axiosInstance.get(`/risk-assessment-master/by-order/${orderNumber}?page=1&pageSize=20`);
          console.log('✅ Risk assessment masters API response:', mastersResponse.data);
          
          // Handle both single object and array responses (same as RiskAssessmentTemplates)
          const mastersData = Array.isArray(mastersResponse.data) ? mastersResponse.data : 
                             mastersResponse.data && Array.isArray(mastersResponse.data.data) ? mastersResponse.data.data :
                             mastersResponse.data && Array.isArray(mastersResponse.data.templates) ? mastersResponse.data.templates : [];
          
          console.log(`📋 Found ${mastersData.length} risk assessment masters:`, mastersData);
          
          // Filter out "Domestic Risk" assessment template
          const filteredMastersData = mastersData.filter((master: any) => {
            const assessmentTypeName = master.assessmenttypename || master.assessmentTypeName || '';
            const isDomsticRisk = assessmentTypeName.toLowerCase().includes('domestic risk');
            if (isDomsticRisk) {
              console.log('🚫 Filtering out Domestic Risk template:', assessmentTypeName);
            }
            return !isDomsticRisk;
          });
          
          console.log(`📋 After filtering: ${filteredMastersData.length} risk assessment masters (removed Domestic Risk)`);
          
          if (filteredMastersData.length === 0) {
            throw new Error(`No valid risk assessment masters found for order ${orderNumber} after filtering. Cannot generate summary without masters data.`);
          }

          // Now that we have filtered masters, fetch the detailed data for each master
          for (const master of filteredMastersData) {
            console.log('🔍 Processing master:', master);
            
            const masterAssessmentTypeName = master.assessmenttypename || master.assessmentTypeName || `Assessment ${master.riskassessmentid || master.id}`;
            const riskAssessmentId = master.riskassessmentid || master.id;
            
            if (!riskAssessmentId) {
              console.warn('⚠️ No risk assessment ID found for master, skipping');
              continue;
            }
            
            console.log('🔍 Fetching sections for risk assessment ID:', riskAssessmentId);
            
            // Get sections for this specific risk assessment
            const sectionsResponse = await api.getRiskAssessmentSections(riskAssessmentId);
            console.log('✅ getRiskAssessmentSections response:', sectionsResponse);
            
            if (!sectionsResponse.success || !sectionsResponse.data) {
              console.warn('⚠️ Failed to load sections for risk assessment:', riskAssessmentId);
              continue;
            }
            
            const sections = sectionsResponse.data.map((s: any) => ({
              id: s.id || s.sectionid || s.riskassessmentsectionid,
              title: s.sectionname || s.name || 'Unnamed Section',
            }));
            
            console.log('📋 Found sections:', sections);
            
            // For each section, get categories and their items
            const sectionSummaries: SectionSummary[] = [];
            
            for (const section of sections) {
              console.log('🔍 Processing section:', section.title);
              
              try {
                // Get categories for this section (same approach as detail screen)
                const categoriesResponse = await api.getRiskAssessmentCategories(section.id);
                console.log('✅ getRiskAssessmentCategories response for section', section.id, ':', categoriesResponse);
                
                if (!categoriesResponse.success || !categoriesResponse.data) {
                  console.warn('⚠️ Failed to load categories for section:', section.id);
                  continue;
                }
                
                // For each category, get items using the same pattern as detail screen
                const categorySummaries: CategorySummary[] = [];
                
                for (const c of categoriesResponse.data) {
                  const categoryId = c.id || c.categoryid || c.riskassessmentcategoryid;
                  const categoryName = c.name || c.categoryname || 'Unnamed Category';
                  
                  console.log('🔍 Processing category:', categoryName);
                  
                  try {
                    // Check SQLite first, then API (same pattern as detail screen)
                    const { getAllRiskAssessmentItems } = await import('../../../../utils/db');
                    const localItems = await getAllRiskAssessmentItems();
                    const categoryItems = localItems.filter(item => 
                      String(item.riskassessmentcategoryid) === String(categoryId)
                    );
                    
                    let itemCount = 0;
                    let categoryValue = 0;
                    
                    if (categoryItems.length === 0) {
                      // No items in SQLite, fetch from API (same as detail screen)
                      console.log('No items in SQLite for category, fetching from API:', categoryId);
                      const apiResponse = await api.getRiskAssessmentItems(categoryId);
                      
                      if (apiResponse?.success && Array.isArray(apiResponse.data)) {
                        console.log('Got items from API:', apiResponse.data.length);
                        itemCount = apiResponse.data.length;
                        categoryValue = apiResponse.data.reduce((sum: number, item: any) => {
                          const price = Number(item.price) || 0;
                          const qty = Number(item.qty) || 1;
                          return sum + (price * qty);
                        }, 0);
                        
                        // Store in SQLite for future use (Step 1.2 - Batch Insert Optimization)
                        const { batchInsertRiskAssessmentItems } = await import('../../../../utils/db');
                        const sqliteItems = apiResponse.data.map((item: any) => ({
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
                        }));
                        
                        try {
                          await batchInsertRiskAssessmentItems(sqliteItems);
                        } catch (insertError) {
                          console.warn('Failed to batch insert items to SQLite:', insertError);
                        }
                      }
                    } else {
                      // Use SQLite items (same as detail screen)
                      console.log('Using existing SQLite items for category:', categoryItems.length);
                      itemCount = categoryItems.length;
                      categoryValue = categoryItems.reduce((sum, item) => {
                        const price = Number(item.price) || 0;
                        const qty = Number(item.qty) || 1;
                        return sum + (price * qty);
                      }, 0);
                    }
                    
                    categorySummaries.push({
                      id: String(categoryId),
                      name: categoryName,
                      items: itemCount,
                      value: categoryValue
                    });
                    
                  } catch (itemError) {
                    console.warn(`Failed to fetch items for category ${categoryId}:`, itemError);
                    // Add category with zero values if item fetch fails (same as detail screen)
                    categorySummaries.push({
                      id: String(categoryId),
                      name: categoryName,
                      items: 0,
                      value: 0
                    });
                  }
                }
                
                // Calculate section totals
                const sectionTotalItems = categorySummaries.reduce((sum, cat) => sum + cat.items, 0);
                const sectionTotalValue = categorySummaries.reduce((sum, cat) => sum + cat.value, 0);
                
                sectionSummaries.push({
                  id: section.id,
                  name: section.title,
                  categories: categorySummaries,
                  totalItems: sectionTotalItems,
                  totalValue: sectionTotalValue
                });
                
              } catch (sectionError) {
                console.warn('⚠️ Error processing section:', section.title, sectionError);
              }
            }
            
            // Create assessment type summary for this master
            const masterTotalItems = sectionSummaries.reduce((sum, section) => sum + section.totalItems, 0);
            const masterTotalValue = sectionSummaries.reduce((sum, section) => sum + section.totalValue, 0);
            
            assessmentTypeSummaries.push({
              id: String(riskAssessmentId),
              name: masterAssessmentTypeName,
              sections: sectionSummaries,
              totalItems: masterTotalItems,
              totalValue: masterTotalValue
            });
            
            console.log(`✅ Added assessment type: ${masterAssessmentTypeName} with ${masterTotalItems} items, value: ${masterTotalValue}`);
          }
          
          totalValue = assessmentTypeSummaries.reduce((sum, type) => sum + type.totalValue, 0);
          console.log(`✅ Final summary: ${assessmentTypeSummaries.length} assessment types, total value: ${totalValue}`);
          
        } catch (dbError) {
          console.warn('⚠️ Could not fetch survey data using API pattern:', dbError);
          // Fallback to SQLite-only approach if API fails
          console.log('🔄 Falling back to SQLite-only data...');
          
          try {
            const { getAllRiskAssessmentItems } = await import('../../../../utils/db');
            const localItems = await getAllRiskAssessmentItems();
            
            if (localItems.length > 0) {
              // Group items by category only as fallback
              const categoryMap = new Map<string, { name: string; items: any[]; value: number }>();
              
              for (const item of localItems) {
                const categoryId = String(item.riskassessmentcategoryid);
                const price = Number(item.price) || 0;
                const qty = Number(item.qty) || 1;
                const itemValue = price * qty;
                
                if (!categoryMap.has(categoryId)) {
                  categoryMap.set(categoryId, {
                    name: `Category ${categoryId}`,
                    items: [],
                    value: 0
                  });
                }
                
                const category = categoryMap.get(categoryId)!;
                category.items.push(item);
                category.value += itemValue;
              }
              
              const fallbackCategories: CategorySummary[] = Array.from(categoryMap.entries()).map(([id, data]) => ({
                id,
                name: data.name,
                items: data.items.length,
                value: data.value
              }));
              
              const fallbackSectionTotalItems = fallbackCategories.reduce((sum, cat) => sum + cat.items, 0);
              const fallbackSectionTotalValue = fallbackCategories.reduce((sum, cat) => sum + cat.value, 0);
              
              assessmentTypeSummaries = [{
                id: 'fallback',
                name: 'Property Assessment',
                sections: [{
                  id: 'fallback-section',
                  name: 'Assessment Items',
                  categories: fallbackCategories,
                  totalItems: fallbackSectionTotalItems,
                  totalValue: fallbackSectionTotalValue
                }],
                totalItems: fallbackSectionTotalItems,
                totalValue: fallbackSectionTotalValue
              }];
              
              totalValue = fallbackSectionTotalValue;
              console.log('✅ Using fallback SQLite data with total value:', totalValue);
            }
          } catch (fallbackError) {
            console.error('❌ Fallback SQLite approach also failed:', fallbackError);
          }
        }

        // 3. Map data to CompletedSurvey interface
        const completedSurvey: CompletedSurvey = {
          id: surveyId,
          address: appointmentData.address || 'No address provided',
          client: appointmentData.client || 'Unknown Client',
          date: appointmentData.startTime || appointmentData.date || new Date().toISOString(),
          policyNo: appointmentData.policyNo || 'N/A',
          sumInsured: String(appointmentData.sumInsured || 'N/A'),
          orderNumber: String(orderNumber),
          submitted: appointmentData.dateModified || new Date().toISOString(),
          broker: appointmentData.broker || 'N/A',
          completionDate: new Date().toISOString().split('T')[0],
          assessmentTypes: assessmentTypeSummaries,
          totalValue: totalValue,
          notes: appointmentData.notes || '',
        };

        setSurvey(completedSurvey);

      } catch (err: any) {
        console.error('Error fetching survey summary:', err);
        setError(err.message || 'An unexpected error occurred while loading the summary.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurveySummary();
  }, [surveyId, orderNumberFromParams]);

  return { loading, survey, error };
} 