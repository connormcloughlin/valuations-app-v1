import React from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { surveySummaryActionsStyles } from '../../../GlobalStyles';

interface SurveySummaryActionsProps {
  onShare: () => void;
  onDownloadPdf: () => void;
  onComplete?: () => void;
  completing?: boolean;
  inviteStatus?: string;
}

export default function SurveySummaryActions({ onShare, onDownloadPdf, onComplete, completing, inviteStatus }: SurveySummaryActionsProps) {
  // Determine button text and icon based on appointment status
  const getButtonConfig = () => {
    if (inviteStatus === 'In-Progress') {
      return {
        text: 'Complete Appointment',
        icon: 'check-circle',
        loadingText: 'Completing...'
      };
    } else if (inviteStatus === 'Finalise') {
      return {
        text: 'Submit for QA',
        icon: 'send',
        loadingText: 'Submitting...'
      };
    } else {
      // Default fallback
      return {
        text: 'Complete Survey',
        icon: 'check-circle',
        loadingText: 'Completing...'
      };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <View style={surveySummaryActionsStyles.buttonContainer}>
      <View style={surveySummaryActionsStyles.topRow}>
        <Button
          mode="outlined"
          onPress={onShare}
          style={surveySummaryActionsStyles.shareButton}
          icon="share-variant"
        >
          Share Summary
        </Button>
        <Button
          mode="outlined"
          onPress={onDownloadPdf}
          style={surveySummaryActionsStyles.pdfButton}
          icon="file-pdf-box"
        >
          Download PDF
        </Button>
      </View>
      
      {onComplete && (
        <Button
          mode="contained"
          onPress={onComplete}
          style={surveySummaryActionsStyles.completeButton}
          icon={buttonConfig.icon}
          loading={completing}
          disabled={completing}
        >
          {completing ? buttonConfig.loadingText : buttonConfig.text}
        </Button>
      )}
    </View>
  );
}

