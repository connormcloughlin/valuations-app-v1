import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

// Import GlobalStyles constants
import { colors, spacing } from '../../GlobalStyles';

interface SurveyActionsProps {
  onContinueSurvey: () => void;
  onFinishSurvey: () => void;
  onSync?: () => void | Promise<void>;
  syncing?: boolean;
  pendingChangesCount?: number;
}

export default function SurveyActions({ onContinueSurvey, onFinishSurvey, onSync, syncing, pendingChangesCount = 0 }: SurveyActionsProps) {
  const hasPendingChanges = pendingChangesCount > 0;

  return (
    <View style={styles.buttonContainer}>
      {onSync != null && (
        <Button
          mode="outlined"
          onPress={onSync}
          disabled={syncing || !hasPendingChanges}
          loading={syncing}
          style={styles.syncButton}
          icon="sync"
        >
          {syncing ? 'Syncing...' : `Sync Changes (${pendingChangesCount})`}
        </Button>
      )}
      <Button
        mode="contained"
        onPress={onFinishSurvey}
        style={styles.finishButton}
        icon="check-circle"
      >
        Complete Appointment
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
  syncButton: {
    flex: 1,
    marginRight: spacing.sm,
    borderColor: colors.warning,
  },
  finishButton: {
    flex: 1,
    backgroundColor: colors.success,
  },
}); 