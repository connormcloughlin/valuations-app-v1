import { useState, useEffect } from 'react';
import api from '../../../../api';
import appointmentsApi from '../../../../api/appointments';
import { declaredLineValue } from '../../../../components/survey/items/dynamic/itemFieldMapping';

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
  /** dbo.Risk_Assessment_Master.AssessmentTypeID (RiskTemplateID); 5 = Domestic Risk */
  riskTemplateId?: number | null;
  /** dbo.Risk_Assessment_Master.Totalmileage (prefill on QA re-submit) */
  prefillTotalMileage?: string | null;
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
  inviteStatus?: string;
  /** Prefill for optional mileage on Submit for QA (first non–template-5 master, else first). */
  qaMileagePrefill?: string;
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

        // 2. Use composite API to get all assessment data at once
        let assessmentTypeSummaries: AssessmentTypeSummary[] = [];
        let totalValue = 0;
        
        console.log(`🚀 Using composite API for order: ${orderNumber}`);
        
        try {
          // Use composite hierarchy API
          const compositeResponse = await api.getRiskAssessmentCompleteHierarchy(orderNumber);
          
          if (compositeResponse?.success && compositeResponse?.data?.assessmentMasters) {
            console.log('✅ Composite API response received');
            
            // Process all assessment masters from composite data
            for (const master of compositeResponse.data.assessmentMasters) {
              const assessmentTypeName =
                master.assessmenttypename ||
                master.assessmentTypeName ||
                master.templateName ||
                'Unknown Assessment';
              const masterRowId = String(master.riskAssessmentId ?? master.riskassessmentid ?? '');
              const rawTemplateId = master.assessmentTypeId ?? master.assessmenttypeid ?? master.AssessmentTypeID;
              const riskTemplateIdParsed =
                rawTemplateId == null || rawTemplateId === '' ? NaN : Number(rawTemplateId);
              const riskTemplateId = Number.isFinite(riskTemplateIdParsed) ? riskTemplateIdParsed : null;
              const rawMileage = master.totalmileage ?? master.Totalmileage;
              const prefillTotalMileage =
                rawMileage != null && String(rawMileage).trim() !== '' ? String(rawMileage).trim() : null;

              console.log(`📋 Processing assessment type: ${assessmentTypeName} (master ${masterRowId})`);
              
              const sectionSummaries: SectionSummary[] = [];
              
              if (master.sections) {
                for (const section of master.sections) {
                  const sectionName = section.sectionName || section.sectionname || 'Unknown Section';
                  const sectionId = section.riskassessmentsectionid;
                  
                  console.log(`📂 Processing section: ${sectionName} (ID: ${sectionId})`);
                  
                  const categorySummaries: CategorySummary[] = [];
                  
                  if (section.categories) {
                    for (const category of section.categories) {
                      const categoryId = category.riskassessmentcategoryid || category.categoryId;
                      const categoryName = category.categoryName || category.categoryname || 'Unnamed Category';
                      
                      console.log(`🔍 Processing category: ${categoryName} (ID: ${categoryId})`);
                      
                      // Calculate totals from items in composite data
                      const items = category.items || [];
                      const itemCount = items.length;
                      const categoryValue = items.reduce(
                        (sum: number, item: any) => sum + declaredLineValue(item.price),
                        0
                      );
                      
                      categorySummaries.push({
                        id: categoryId,
                        name: categoryName,
                        items: itemCount,
                        value: categoryValue
                      });
                      
                      console.log(`📊 Category ${categoryName}: ${itemCount} items, value: ${categoryValue}`);
                    }
                  }
                  
                  // Calculate section totals
                  const sectionTotalItems = categorySummaries.reduce((sum, cat) => sum + cat.items, 0);
                  const sectionTotalValue = categorySummaries.reduce((sum, cat) => sum + cat.value, 0);
                  
                  sectionSummaries.push({
                    id: sectionId,
                    name: sectionName,
                    categories: categorySummaries,
                    totalItems: sectionTotalItems,
                    totalValue: sectionTotalValue
                  });
                  
                  console.log(`📊 Section ${sectionName}: ${sectionTotalItems} items, value: ${sectionTotalValue}`);
                }
              }
              
              // Calculate assessment type totals
              const assessmentTypeTotalItems = sectionSummaries.reduce((sum, section) => sum + section.totalItems, 0);
              const assessmentTypeTotalValue = sectionSummaries.reduce((sum, section) => sum + section.totalValue, 0);
              
              assessmentTypeSummaries.push({
                id: masterRowId,
                name: assessmentTypeName,
                sections: sectionSummaries,
                totalItems: assessmentTypeTotalItems,
                totalValue: assessmentTypeTotalValue,
                riskTemplateId,
                prefillTotalMileage,
              });
              
              console.log(`📊 Assessment Type ${assessmentTypeName}: ${assessmentTypeTotalItems} items, value: ${assessmentTypeTotalValue}`);
            }
            
            // Calculate overall total
            totalValue = assessmentTypeSummaries.reduce((sum, assessmentType) => sum + assessmentType.totalValue, 0);
            
            console.log(`✅ Processed ${assessmentTypeSummaries.length} assessment types from composite API with total value: ${totalValue}`);
          } else {
            console.warn('⚠️ Composite API failed or no data, using fallback approach');
            throw new Error('Composite API returned invalid data');
          }
        } catch (compositeError) {
          console.warn('⚠️ Composite API failed, using fallback approach:', compositeError);
          
          // Fallback: Try to get data from SQLite
          try {
            console.log('🔄 Attempting fallback SQLite approach...');
            const { getAllRiskAssessmentItems } = await import('../../../../utils/db');
            const allItems = await getAllRiskAssessmentItems();
            
            // Group items by category and calculate totals
            const categoryMap = new Map<string, { items: any[], totalValue: number }>();
            
            for (const item of allItems) {
              const categoryId = String(item.riskassessmentcategoryid);
              if (!categoryMap.has(categoryId)) {
                categoryMap.set(categoryId, { items: [], totalValue: 0 });
              }
              
              const categoryData = categoryMap.get(categoryId)!;
              categoryData.items.push(item);
              categoryData.totalValue += declaredLineValue(item.price);
            }
            
            const fallbackCategories: CategorySummary[] = [];
            let fallbackSectionTotalItems = 0;
            let fallbackSectionTotalValue = 0;
            
            for (const [categoryId, data] of categoryMap) {
              fallbackCategories.push({
                id: categoryId,
                name: `Category ${categoryId}`,
                items: data.items.length,
                value: data.totalValue
              });
              fallbackSectionTotalItems += data.items.length;
              fallbackSectionTotalValue += data.totalValue;
            }
            
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
          } catch (fallbackError) {
            console.error('❌ Fallback SQLite approach also failed:', fallbackError);
            throw new Error('Failed to load survey data from any source');
          }
        }

        const DOMESTIC_RISK_TEMPLATE_ID = 5;
        const mileageTargetMaster =
          assessmentTypeSummaries.find((at) => at.riskTemplateId !== DOMESTIC_RISK_TEMPLATE_ID) ??
          assessmentTypeSummaries[0];
        const qaMileagePrefill =
          mileageTargetMaster?.prefillTotalMileage != null &&
          String(mileageTargetMaster.prefillTotalMileage).trim() !== ''
            ? String(mileageTargetMaster.prefillTotalMileage).trim()
            : '';

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
          inviteStatus: appointmentData.inviteStatus || 'Unknown',
          qaMileagePrefill,
        };

        setSurvey(completedSurvey);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching survey summary:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch survey summary');
        setLoading(false);
      }
    };

    fetchSurveySummary();
  }, [surveyId, orderNumberFromParams]);

  return { survey, loading, error };
} 