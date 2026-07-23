import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Share, Alert } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { logNavigation } from '../../../utils/logger';
import { AppLayout } from '../../../components/layout';
import { useMainTabTabs } from '../../../hooks/useMainTabTabs';
import { surveySummaryStyles } from '../../GlobalStyles';

// Import components
import SurveySummaryHeader from './components/SurveySummaryHeader';
import SurveyDetailsCard from './components/SurveyDetailsCard';
import ValuationSummaryCard from './components/ValuationSummaryCard';
import SurveySummaryActions from './components/SurveySummaryActions';
import SubmitForQaModal, { SubmitForQaPayload } from './components/SubmitForQaModal';

// Import custom hook
import { useSurveySummaryData } from './hooks/useSurveySummaryData';
import * as db from '../../../utils/db';
import {
  ART_VALUATION_TASK_CODE,
  ELECTRONICS_PRICING_TASK_CODE,
  createWorkflowTasks,
  getAllowedWorkflowTaskTypes,
  type TaskType,
} from '../../../api/workflowTasks';

export default function SurveySummaryScreen() {
  logNavigation('Survey Summary Detail');
  const tabs = useMainTabTabs();
  const params = useLocalSearchParams();
  const { id, orderNumber: orderNumberFromParams } = params;
  const surveyId = id as string;
  
  // Use custom hook for data fetching
  const { loading, survey, error } = useSurveySummaryData(surveyId, orderNumberFromParams as string);
  
  // State for completion action
  const [completing, setCompleting] = useState(false);
  const [qaModalVisible, setQaModalVisible] = useState(false);
  const [loadingAllowedTypes, setLoadingAllowedTypes] = useState(false);
  const [allowElectronicsPricing, setAllowElectronicsPricing] = useState(false);
  const [allowArtValuation, setAllowArtValuation] = useState(false);
  const [allowedTaskTypes, setAllowedTaskTypes] = useState<TaskType[]>([]);
  
  const shareSummary = async () => {
    if (!survey) return;
    
    try {
      const message = `
Survey Summary for ${survey.client}
Address: ${survey.address}
Order Number: ${survey.orderNumber}
Total Value: R${survey.totalValue.toLocaleString()}

Completed on ${survey.completionDate}
      `;
      
      await Share.share({
        message,
        title: `Valuation Survey - ${survey.client}`,
      });
    } catch (error) {
      console.error('Error sharing survey summary:', error);
    }
  };
  
  const downloadPdf = () => {
    // In a real app, this would generate and download a PDF
    console.log('Downloading PDF for survey:', surveyId);
  };

  // Prefetch allowed valuation workflow types when the QA modal opens.
  // Pricing/Art only for Inventory assessments. If no Inventory master, hide valuation section.
  // When Inventory exists: show both unless allow-list succeeds and explicitly excludes them.
  useEffect(() => {
    if (!qaModalVisible) {
      setAllowElectronicsPricing(false);
      setAllowArtValuation(false);
      setAllowedTaskTypes([]);
      setLoadingAllowedTypes(false);
      return;
    }

    let cancelled = false;
    const assessmentId = survey?.qaWorkflowAssessmentId;
    const hasInventory = survey?.hasInventoryAssessment === true && assessmentId != null;

    (async () => {
      if (!hasInventory) {
        console.warn(
          'Submit for QA: no Inventory assessment on order — hiding Pricing/Art valuation checkboxes'
        );
        setAllowElectronicsPricing(false);
        setAllowArtValuation(false);
        setAllowedTaskTypes([]);
        setLoadingAllowedTypes(false);
        return;
      }

      setLoadingAllowedTypes(true);
      // Inventory confirmed — show both while loading / if allow-list fails or is empty
      setAllowElectronicsPricing(true);
      setAllowArtValuation(true);

      try {
        const result = await getAllowedWorkflowTaskTypes(assessmentId);
        if (cancelled) return;
        const types = result.success && Array.isArray(result.data) ? result.data : [];
        setAllowedTaskTypes(types);

        if (result.success && types.length > 0) {
          const codes = new Set(types.map((t) => t.code));
          const hasElectronics = codes.has(ELECTRONICS_PRICING_TASK_CODE);
          const hasArt = codes.has(ART_VALUATION_TASK_CODE);
          setAllowElectronicsPricing(hasElectronics);
          setAllowArtValuation(hasArt);
          if (!hasElectronics && !hasArt) {
            console.warn(
              'Submit for QA: allow-list has no electronics_pricing/art_valuation for Inventory assessment',
              assessmentId,
              types.map((t) => t.code)
            );
          }
        } else {
          if (!result.success) {
            console.warn('Failed to load allowed workflow task types:', result.message);
          } else {
            console.warn(
              'Submit for QA: empty allow-list for Inventory assessment',
              assessmentId,
              '— showing Pricing/Art checkboxes anyway'
            );
          }
          setAllowElectronicsPricing(true);
          setAllowArtValuation(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Error loading allowed workflow task types:', err);
          setAllowedTaskTypes([]);
          setAllowElectronicsPricing(true);
          setAllowArtValuation(true);
        }
      } finally {
        if (!cancelled) setLoadingAllowedTypes(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [qaModalVisible, survey?.qaWorkflowAssessmentId, survey?.hasInventoryAssessment]);

  const roleForTaskCode = (code: string): string => {
    const match = allowedTaskTypes.find((t) => t.code === code);
    return match?.assignedToRole || 'Staff';
  };

  const submitForQa = async (payload: SubmitForQaPayload) => {
    if (!survey) return;
    const { totalMileageKm, electronicsPricing, artValuation } = payload;
    try {
      setCompleting(true);
      const appointmentsApi = await import('../../../api/appointments');

      const orderId = parseInt(survey.orderNumber, 10);
      if (!orderId || isNaN(orderId)) {
        throw new Error('Invalid order number for QA submission');
      }

      console.log('🔄 Submitting risk assessment for QA review...');
      const qaResponse = await appointmentsApi.default.submitRiskAssessmentForQA(orderId, totalMileageKm);

      if (!(qaResponse && qaResponse.success)) {
        throw new Error(qaResponse?.message || 'Failed to submit for QA review');
      }

      // Create valuation workflow tasks after successful QA submit (parallel with office QA).
      // Tasks attach only to the Inventory assessment. Do not roll back QA on failure.
      let workflowCreateFailedMessage: string | null = null;
      const wantsValuationTasks = electronicsPricing || artValuation;
      if (wantsValuationTasks) {
        const assessmentId = survey.qaWorkflowAssessmentId;
        const canCreateForInventory =
          survey.hasInventoryAssessment === true && assessmentId != null;
        if (!canCreateForInventory) {
          workflowCreateFailedMessage =
            'QA was submitted, but valuation workflow tasks could not be created (no Inventory assessment on this order). Ask the office to create them manually.';
        } else {
          const tasks: {
            assessmentId: number;
            taskTypeCode: string;
            assignedToRole: string;
          }[] = [];
          if (electronicsPricing) {
            tasks.push({
              assessmentId,
              taskTypeCode: ELECTRONICS_PRICING_TASK_CODE,
              assignedToRole: roleForTaskCode(ELECTRONICS_PRICING_TASK_CODE),
            });
          }
          if (artValuation) {
            tasks.push({
              assessmentId,
              taskTypeCode: ART_VALUATION_TASK_CODE,
              assignedToRole: roleForTaskCode(ART_VALUATION_TASK_CODE),
            });
          }
          console.log('🔄 Creating Inventory valuation workflow tasks...', {
            inventoryAssessmentId: assessmentId,
            tasks,
          });
          const createResult = await createWorkflowTasks({ orderId, tasks });
          if (!createResult.success) {
            workflowCreateFailedMessage =
              createResult.message ||
              'QA was submitted, but valuation workflow tasks could not be created. Ask the office to create them manually.';
            console.error('❌ Workflow task create failed after QA submit:', createResult.message);
          } else {
            console.log('✅ Valuation workflow tasks created for Inventory assessment:', createResult.data?.length ?? 0);
          }
        }
      }

      console.log('🔄 Updating appointment status to Complete...');
      const appointmentResponse = await appointmentsApi.default.updateAppointment(surveyId, {
        inviteStatus: 'Completed',
      });

      console.log('🔄 Updating risk assessment master status to RISK_ASSESSMENT_COMPLETED...');
      const riskAssessmentUpdateResponse = await appointmentsApi.default.updateRiskAssessmentMasterStatus(
        orderId,
        'RISK_ASSESSMENT_COMPLETED'
      );

      if (appointmentResponse.success && riskAssessmentUpdateResponse.success) {
        try {
          await db.deleteAllDataForOrder(orderId);
        } catch (dbError) {
          console.warn('Failed to clear local SQLite data for order:', dbError);
        }
        setQaModalVisible(false);

        if (workflowCreateFailedMessage) {
          Alert.alert('Submitted with warning', workflowCreateFailedMessage, [
            {
              text: 'OK',
              onPress: () => {
                router.push('/(tabs)');
              },
            },
          ]);
        } else {
          const valuationNote =
            wantsValuationTasks && !workflowCreateFailedMessage
              ? ' Valuation workflow tasks were created for the AI agent / specialists.'
              : '';
          Alert.alert(
            'Survey Completed',
            `The survey has been successfully submitted for QA review and marked as Complete.${valuationNote}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  router.push('/(tabs)');
                },
              },
            ]
          );
        }
      } else {
        throw new Error('Failed to update appointment or risk assessment status');
      }
    } catch (error: any) {
      console.error('❌ Error submitting for QA:', error);
      const serverMessage =
        error?.response?.data?.error?.message ??
        error?.response?.data?.message ??
        error?.message;
      const displayMessage =
        typeof serverMessage === 'string' && serverMessage !== 'Request failed with status code 400'
          ? serverMessage
          : 'An error occurred while submitting for QA review. Please try again.';
      Alert.alert('Error', displayMessage, [{ text: 'OK' }]);
    } finally {
      setCompleting(false);
    }
  };
  
  const completeSurvey = async () => {
    if (!survey) return;

    if (survey.inviteStatus === 'Finalise') {
      setQaModalVisible(true);
      return;
    }
    
    // Determine confirmation message based on appointment status
    const getConfirmationMessage = () => {
      if (survey.inviteStatus === 'In-Progress') {
        return 'Are you sure you want to complete the appointment and finalise the assessments? This action will move the appointment to the Finalise status.';
      } else {
        return 'Are you sure you want to complete this survey? This action will finalize the survey and cannot be undone.';
      }
    };

    const getButtonText = () => {
      if (survey.inviteStatus === 'In-Progress') {
        return 'Complete';
      } else {
        return 'Complete';
      }
    };
    
    Alert.alert(
      'Complete Survey',
      getConfirmationMessage(),
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: getButtonText(),
          style: 'default',
          onPress: async () => {
            try {
              setCompleting(true);
              
              console.log('🔄 Completing survey for appointment ID:', surveyId);
              
              // Import the API
              const api = await import('../../../api');
              
              // Determine the next status based on current status
              let nextStatus: string;
              let successMessage: string;
              let response: any;
              
              if (survey.inviteStatus === 'In-Progress') {
                nextStatus = 'Finalise';
                successMessage = 'The survey has been successfully completed and moved to Finalise status.';
                
                // Update the appointment status
                // @ts-ignore - this method exists in the API
                response = await api.default.updateAppointment(surveyId, {
                  inviteStatus: nextStatus
                });
              } else {
                nextStatus = 'Finalise';
                successMessage = 'The survey has been successfully completed and finalized.';
                
                // Update the appointment status
                // @ts-ignore - this method exists in the API
                response = await api.default.updateAppointment(surveyId, {
                  inviteStatus: nextStatus
                });
              }
              
              if (response && response.success) {
                console.log('✅ Survey completed successfully');
                
                Alert.alert(
                  'Survey Completed',
                  successMessage,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Navigate back to dashboard or surveys list
                        router.push('/(tabs)');
                      },
                    },
                  ]
                );
              } else {
                console.error('❌ Failed to complete survey:', response);
                Alert.alert(
                  'Error',
                  'Failed to complete the survey. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error: any) {
              console.error('❌ Error completing survey:', error);
              const serverMessage =
                error?.response?.data?.error?.message ??
                error?.response?.data?.message ??
                error?.message;
              const displayMessage =
                typeof serverMessage === 'string' && serverMessage !== 'Request failed with status code 400'
                  ? serverMessage
                  : 'An error occurred while completing the survey. Please try again.';
              Alert.alert('Error', displayMessage, [{ text: 'OK' }]);
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
  };
  
  if (loading) {
    return (
      <AppLayout
        title="Survey Summary"
        tabs={tabs}
        showHeader={true}
        showBottomNav={true}
        showLogout={true}
      >
        <View style={[surveySummaryStyles.container, surveySummaryStyles.loadingContainer]}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={surveySummaryStyles.loadingText}>Loading survey summary...</Text>
        </View>
      </AppLayout>
    );
  }
  
  if (error || !survey) {
    return (
      <AppLayout
        title="Survey Not Found"
        tabs={tabs}
        showHeader={true}
        showBottomNav={true}
        showLogout={true}
      >
        <View style={[surveySummaryStyles.container, surveySummaryStyles.centeredContainer]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={surveySummaryStyles.errorTitle}>Survey Not Found</Text>
          <Text style={surveySummaryStyles.errorMessage}>
            {error || "The survey you're looking for doesn't exist or has been deleted."}
          </Text>
          <Button 
            mode="contained" 
            onPress={() => router.back()} 
            style={surveySummaryStyles.errorButton}
          >
            Go Back
          </Button>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Survey Summary 1"
      tabs={tabs}
      showHeader={true}
      showBottomNav={true}
      showLogout={true}
    >
      <View style={surveySummaryStyles.container}>
        <ScrollView style={surveySummaryStyles.scrollView}>
          <SurveySummaryHeader
            client={survey.client}
            address={survey.address}
            completionDate={survey.completionDate}
          />
          
          <SurveyDetailsCard
            orderNumber={survey.orderNumber}
            policyNo={survey.policyNo}
            sumInsured={survey.sumInsured}
            broker={survey.broker}
            date={survey.date}
          />
          
          <ValuationSummaryCard
            assessmentTypes={survey.assessmentTypes}
            totalValue={survey.totalValue}
          />
          
          {survey.notes && (
            <View style={surveySummaryStyles.sectionContainer}>
              <Text style={surveySummaryStyles.sectionTitle}>Notes</Text>
              <View style={surveySummaryStyles.notesCard}>
                <Text style={surveySummaryStyles.notesText}>{survey.notes}</Text>
              </View>
            </View>
          )}
        </ScrollView>
        
        <SurveySummaryActions
          onShare={shareSummary}
          onDownloadPdf={downloadPdf}
          onComplete={completeSurvey}
          completing={completing}
          inviteStatus={survey.inviteStatus}
        />

        <SubmitForQaModal
          visible={qaModalVisible}
          onCancel={() => !completing && setQaModalVisible(false)}
          onSubmit={(payload) => void submitForQa(payload)}
          submitting={completing}
          initialMileage={survey.qaMileagePrefill}
          allowElectronicsPricing={allowElectronicsPricing}
          allowArtValuation={allowArtValuation}
          loadingAllowedTypes={loadingAllowedTypes}
        />
      </View>
    </AppLayout>
  );
}
