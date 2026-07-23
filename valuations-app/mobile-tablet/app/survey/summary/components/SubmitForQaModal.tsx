import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Checkbox, TextInput } from 'react-native-paper';

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
    marginBottom: 8,
  },
  valuationHelper: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 0,
    marginBottom: 16,
  },
  valuationSection: {
    marginTop: 4,
    marginBottom: 4,
  },
  checkboxItem: {
    paddingHorizontal: 0,
    marginLeft: -8,
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

export interface SubmitForQaPayload {
  totalMileageKm?: number;
  electronicsPricing: boolean;
  artValuation: boolean;
}

export interface SubmitForQaModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (payload: SubmitForQaPayload) => void;
  submitting: boolean;
  initialMileage?: string | null;
  /** Show Pricing valuations toggle when electronics_pricing is allowed. */
  allowElectronicsPricing?: boolean;
  /** Show Art valuations toggle when art_valuation is allowed. */
  allowArtValuation?: boolean;
  /** True while allowed-task-types are loading. */
  loadingAllowedTypes?: boolean;
}

export default function SubmitForQaModal({
  visible,
  onCancel,
  onSubmit,
  submitting,
  initialMileage,
  allowElectronicsPricing = false,
  allowArtValuation = false,
  loadingAllowedTypes = false,
}: SubmitForQaModalProps) {
  const [mileageText, setMileageText] = useState('');
  const [electronicsPricing, setElectronicsPricing] = useState(false);
  const [artValuation, setArtValuation] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setMileageText(initialMileage != null && String(initialMileage).trim() !== '' ? String(initialMileage).trim() : '');
      setElectronicsPricing(false);
      setArtValuation(false);
      setLocalError(null);
    }
  }, [visible, initialMileage]);

  useEffect(() => {
    if (!allowElectronicsPricing) setElectronicsPricing(false);
    if (!allowArtValuation) setArtValuation(false);
  }, [allowElectronicsPricing, allowArtValuation]);

  const showValuationSection = allowElectronicsPricing || allowArtValuation;

  const handleSubmit = () => {
    setLocalError(null);
    const trimmed = mileageText.trim();
    let totalMileageKm: number | undefined;
    if (trimmed !== '') {
      const n = parseFloat(trimmed.replace(',', '.'));
      if (!Number.isFinite(n)) {
        setLocalError('Enter a valid number or leave blank.');
        return;
      }
      if (n < 0) {
        setLocalError('Mileage cannot be negative.');
        return;
      }
      totalMileageKm = n;
    }
    onSubmit({
      totalMileageKm,
      electronicsPricing: allowElectronicsPricing && electronicsPricing,
      artValuation: allowArtValuation && artValuation,
    });
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

            {showValuationSection ? (
              <View style={styles.valuationSection}>
                {allowElectronicsPricing ? (
                  <Checkbox.Item
                    label="Electronics pricing required?"
                    status={electronicsPricing ? 'checked' : 'unchecked'}
                    onPress={() => !submitting && setElectronicsPricing((v) => !v)}
                    disabled={submitting || loadingAllowedTypes}
                    position="leading"
                    style={styles.checkboxItem}
                    color="#674FA3"
                  />
                ) : null}
                {allowArtValuation ? (
                  <Checkbox.Item
                    label="Art valuations required?"
                    status={artValuation ? 'checked' : 'unchecked'}
                    onPress={() => !submitting && setArtValuation((v) => !v)}
                    disabled={submitting || loadingAllowedTypes}
                    position="leading"
                    style={styles.checkboxItem}
                    color="#674FA3"
                  />
                ) : null}
                <Text style={styles.valuationHelper}>
                  Creates office workflow tasks for the AI agent / specialists. QA still proceeds in parallel.
                </Text>
              </View>
            ) : null}

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
