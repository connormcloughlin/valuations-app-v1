import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c3e50',
  },
  body: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    lineHeight: 20,
  },
  helper: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    marginBottom: 16,
  },
  error: {
    fontSize: 13,
    color: '#c0392b',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelBtn: {
    marginRight: 8,
  },
});

export interface SubmitForQaModalProps {
  visible: boolean;
  onCancel: () => void;
  /** Called with `undefined` when the field is left empty (optional mileage). */
  onSubmit: (totalMileageKm: number | undefined) => void;
  submitting: boolean;
  initialMileage?: string | null;
}

export default function SubmitForQaModal({
  visible,
  onCancel,
  onSubmit,
  submitting,
  initialMileage,
}: SubmitForQaModalProps) {
  const [mileageText, setMileageText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setMileageText(initialMileage != null && String(initialMileage).trim() !== '' ? String(initialMileage).trim() : '');
      setLocalError(null);
    }
  }, [visible, initialMileage]);

  const handleSubmit = () => {
    setLocalError(null);
    const trimmed = mileageText.trim();
    if (trimmed === '') {
      onSubmit(undefined);
      return;
    }
    const n = parseFloat(trimmed.replace(',', '.'));
    if (!Number.isFinite(n)) {
      setLocalError('Enter a valid number or leave blank.');
      return;
    }
    if (n < 0) {
      setLocalError('Mileage cannot be negative.');
      return;
    }
    onSubmit(n);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={submitting ? undefined : onCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View style={styles.card}>
            <Text style={styles.title}>Submit for QA</Text>
            <Text style={styles.body}>
              Are you sure you want to submit this survey for QA review? This action will submit the completed survey for
              quality assurance.
            </Text>

            <TextInput
              label="Total Mileage (km)"
              value={mileageText}
              onChangeText={setMileageText}
              mode="outlined"
              keyboardType="decimal-pad"
              editable={!submitting}
              dense
            />
            <Text style={styles.helper}>Optional. Stored against the main risk assessment for this order.</Text>

            {localError ? <Text style={styles.error}>{localError}</Text> : null}

            <View style={styles.row}>
              <Button mode="outlined" onPress={onCancel} disabled={submitting} style={styles.cancelBtn}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting}>
                Submit for QA
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
