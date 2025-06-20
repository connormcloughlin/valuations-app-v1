import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface SurveySummaryActionsProps {
  onShare: () => void;
  onDownloadPdf: () => void;
}

export default function SurveySummaryActions({ onShare, onDownloadPdf }: SurveySummaryActionsProps) {
  return (
    <View style={styles.buttonContainer}>
      <Button
        mode="outlined"
        onPress={onShare}
        style={styles.shareButton}
        icon="share-variant"
      >
        Share Summary
      </Button>
      <Button
        mode="contained"
        onPress={onDownloadPdf}
        style={styles.pdfButton}
        icon="file-pdf-box"
      >
        Download PDF
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  shareButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#2ecc71',
  },
  pdfButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
  },
}); 