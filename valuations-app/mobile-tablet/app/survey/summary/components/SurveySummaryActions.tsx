import React from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { surveySummaryActionsStyles } from '../../../GlobalStyles';

interface SurveySummaryActionsProps {
  onShare: () => void;
  onDownloadPdf: () => void;
  onComplete?: () => void;
  completing?: boolean;
}

export default function SurveySummaryActions({ onShare, onDownloadPdf, onComplete, completing }: SurveySummaryActionsProps) {
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
          icon="check-circle"
          loading={completing}
          disabled={completing}
        >
          {completing ? 'Completing...' : 'Complete Survey'}
        </Button>
      )}
    </View>
  );
}

