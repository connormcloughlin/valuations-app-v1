import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface SurveyActionsProps {
  progress: number;
  onContinueSurvey: () => void;
  onFinishSurvey: () => void;
}

export default function SurveyActions({ progress, onContinueSurvey, onFinishSurvey }: SurveyActionsProps) {
  return (
    <View style={styles.buttonContainer}>
      <Button
        mode="outlined"
        onPress={onContinueSurvey}
        style={styles.continueButton}
        icon="clipboard-list"
      >
        Edit Categories
      </Button>
      <Button
        mode="contained"
        onPress={onFinishSurvey}
        style={styles.finishButton}
        icon="check-circle"
        disabled={progress < 100}
      >
        Complete Survey
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
  continueButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#f39c12',
  },
  finishButton: {
    flex: 1,
    backgroundColor: '#27ae60',
  },
}); 