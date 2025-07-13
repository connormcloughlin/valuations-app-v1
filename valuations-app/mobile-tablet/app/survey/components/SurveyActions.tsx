import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

// Import GlobalStyles constants
import { colors, spacing, borderRadius } from '../../GlobalStyles';

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
      >
        Complete Survey
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  continueButton: {
    flex: 1,
    marginRight: spacing.sm,
    borderColor: colors.warning,
  },
  finishButton: {
    flex: 1,
    backgroundColor: colors.success,
  },
}); 