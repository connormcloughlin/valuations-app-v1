import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface SurveySummaryActionsProps {
  onShare: () => void;
  onDownloadPdf: () => void;
  onComplete?: () => void;
  completing?: boolean;
}

export default function SurveySummaryActions({ onShare, onDownloadPdf, onComplete, completing }: SurveySummaryActionsProps) {
  return (
    <View style={styles.buttonContainer}>
      <View style={styles.topRow}>
        <Button
          mode="outlined"
          onPress={onShare}
          style={styles.shareButton}
          icon="share-variant"
        >
          Share Summary
        </Button>
        <Button
          mode="outlined"
          onPress={onDownloadPdf}
          style={styles.pdfButton}
          icon="file-pdf-box"
        >
          Download PDF
        </Button>
      </View>
      
      {onComplete && (
        <Button
          mode="contained"
          onPress={onComplete}
          style={styles.completeButton}
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

const styles = StyleSheet.create({
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  shareButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#3498db',
  },
  pdfButton: {
    flex: 1,
    marginLeft: 8,
    borderColor: '#9b59b6',
  },
  completeButton: {
    backgroundColor: '#2ecc71',
    marginTop: 8,
  },
}); 