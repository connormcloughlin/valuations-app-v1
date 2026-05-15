import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FieldConfiguration, FieldValidationError } from '../../../../types/dynamicUI';
import DynamicFieldRenderer from '../../../../app/survey/items/components/DynamicFieldRenderer';
import {
  applySelectedAnswerEnhancements,
  buildLayoutCells,
  buildPairedRows,
  ItemViewModel,
  validateItemFields,
} from './dynamicItemLogic';
import { PersistedItemField, toPersistedFieldName } from './itemFieldMapping';

interface DynamicItemFormProps {
  item: ItemViewModel;
  fields: FieldConfiguration[];
  values: Record<string, any>;
  itemPhotos: { [key: string]: any[] };
  isPhone?: boolean;
  onChange: (itemId: string, fieldName: PersistedItemField, value: any) => void;
  onSave: (item: ItemViewModel, values: Record<string, any>) => Promise<void>;
  onDelete: (item: ItemViewModel) => Promise<void>;
  onDuplicate: (item: ItemViewModel) => void;
  onTakePhoto: (itemId: string) => void;
}

const immediateTypes = new Set(['dropdown', 'radio_group', 'multiselect', 'switch', 'checkbox']);

export default function DynamicItemForm({
  item,
  fields,
  values,
  itemPhotos,
  isPhone = false,
  onChange,
  onSave,
  onDelete,
  onDuplicate,
  onTakePhoto,
}: DynamicItemFormProps) {
  const [errors, setErrors] = useState<FieldValidationError[]>([]);
  const [saving, setSaving] = useState(false);
  const latestValuesRef = useRef(values);

  useEffect(() => {
    latestValuesRef.current = values;
  }, [values]);

  const hasKnownDraftType = item.isDraft && String(values.type || '').trim().length > 0;

  const preparedFields = useMemo(
    () =>
      fields
        .filter(field => !(hasKnownDraftType && toPersistedFieldName(field.item_fields) === 'type'))
        .map(field => applySelectedAnswerEnhancements(field, item)),
    [fields, hasKnownDraftType, item]
  );

  const rows = useMemo(() => {
    const cells = buildLayoutCells(preparedFields);
    if (isPhone) {
      return cells.map(cell => [cell]);
    }
    return buildPairedRows(cells);
  }, [preparedFields, isPhone]);

  const validate = () => {
    const validationFields = preparedFields.reduce<FieldConfiguration[]>((acc, field) => {
        const persisted = toPersistedFieldName(field.item_fields);
        if (persisted) {
          acc.push({ ...field, item_fields: persisted });
        }
        return acc;
      }, []);
    const currentValues = latestValuesRef.current;
    const next = validateItemFields(validationFields, currentValues);
    if (!currentValues.type || String(currentValues.type).trim() === '') {
      next.unshift({ fieldName: 'type', message: 'Item type is required' });
    }
    setErrors(next);
    return next.length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(item, latestValuesRef.current);
    } finally {
      setSaving(false);
    }
  };

  const errorFor = (fieldName: string) => {
    const mapped = toPersistedFieldName(fieldName) || fieldName;
    return errors.find(error => error.fieldName === mapped || error.fieldName === fieldName);
  };

  const renderField = (field: FieldConfiguration, key: string) => {
    const persistedName = toPersistedFieldName(field.item_fields);
    if (!persistedName) return null;
    const fieldType = String(field.field_type || '').toLowerCase().replace(/-/g, '_');
    const value = values[persistedName] ?? '';
    return (
      <View key={key} style={[styles.fieldSegment, isPhone && styles.fieldSegmentPhone]}>
        <Text style={[styles.fieldLabel, isPhone && styles.fieldLabelPhone]} numberOfLines={2}>
          {field.field_label || persistedName}
          {field.is_required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        <View style={styles.fieldControl}>
          <DynamicFieldRenderer
            field={{ ...field, item_fields: persistedName }}
            value={value}
            validationError={errorFor(field.item_fields)}
            hideLabel
            itemId={item.id}
            itemPhotos={itemPhotos}
            onTakePhoto={(id) => {
              if (item.isDraft) {
                Alert.alert('Save Item First', 'Save the new item before adding photos.');
                return;
              }
              onTakePhoto(id);
            }}
            onChange={(_, nextValue) => {
              const nextValues = { ...latestValuesRef.current, [persistedName]: nextValue };
              latestValuesRef.current = nextValues;
              onChange(item.id, persistedName, nextValue);
              if (!item.isDraft && immediateTypes.has(fieldType)) {
                void onSave(item, nextValues);
              }
            }}
            onBlur={() => {
              if (!item.isDraft && !immediateTypes.has(fieldType)) {
                void onSave(item, latestValuesRef.current);
              }
            }}
          />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.formWrap, isPhone && styles.formWrapPhone]}
    >
      {item.isDraft && !hasKnownDraftType ? (
        <View style={styles.draftBanner}>
          <Text style={styles.draftLabel}>New Item</Text>
          <TextInput
            style={[styles.itemTypeInput, errorFor('type') && styles.inputError]}
            value={String(values.type || '')}
            onChangeText={(text) => {
              latestValuesRef.current = { ...latestValuesRef.current, type: text };
              onChange(item.id, 'type', text);
            }}
            placeholder="Item type"
            placeholderTextColor="#8a98a8"
          />
          {errorFor('type') ? <Text style={styles.errorText}>{errorFor('type')?.message}</Text> : null}
        </View>
      ) : null}

      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.formRow, isPhone && styles.formRowPhone]}>
          {row.map((cell, cellIndex) => {
            if (cell.kind === 'answerWithNotes') {
              return (
                <View key={`bundle-${rowIndex}-${cellIndex}`} style={styles.bundle}>
                  {renderField(cell.answerField, `answer-${rowIndex}`)}
                  {renderField(cell.notesField, `notes-${rowIndex}`)}
                </View>
              );
            }
            return renderField(cell.field, `${rowIndex}-${cellIndex}`);
          })}
        </View>
      ))}

      <View style={[styles.actions, isPhone && styles.actionsPhone]}>
        {item.isDraft ? (
          <TouchableOpacity
            style={[styles.saveButton, isPhone && styles.saveButtonPhone, saving && styles.disabledButton]}
            onPress={save}
            disabled={saving}
          >
            <MaterialCommunityIcons name="content-save" size={18} color="#fff" />
            <Text style={styles.saveButtonText}>Save New Item</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.duplicateButton, isPhone && styles.duplicateButtonPhone]}
            onPress={() => onDuplicate(item)}
          >
            <MaterialCommunityIcons name="content-duplicate" size={20} color="#4a90e2" />
            <Text style={styles.duplicateButtonText} numberOfLines={1}>
              Add Another {values.type || item.type}
            </Text>
          </TouchableOpacity>
        )}
        {!item.isDraft ? (
          <TouchableOpacity
            style={[styles.deleteButton, isPhone && styles.deleteButtonPhone]}
            onPress={() => onDelete(item)}
          >
            <MaterialCommunityIcons name="delete-outline" size={18} color="#c0392b" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  formWrap: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  formWrapPhone: {
    padding: 12,
  },
  draftBanner: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f7fbff',
    borderWidth: 1,
    borderColor: '#cfe3f8',
    borderRadius: 6,
  },
  draftLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#49657f',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  itemTypeInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 4,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  formRowPhone: {
    flexDirection: 'column',
    gap: 0,
    marginBottom: 10,
  },
  fieldSegment: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldSegmentPhone: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 4,
  },
  fieldLabel: {
    width: 92,
    textAlign: 'right',
    color: '#6c757d',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fieldLabelPhone: {
    width: '100%',
    textAlign: 'left',
    fontSize: 11,
  },
  required: {
    color: '#e74c3c',
  },
  fieldControl: {
    flex: 1,
    minWidth: 0,
  },
  bundle: {
    flex: 1,
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  actionsPhone: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  saveButton: {
    height: 42,
    minWidth: 160,
    borderRadius: 8,
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  saveButtonPhone: {
    width: '100%',
    minWidth: 0,
    height: 46,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  disabledButton: {
    opacity: 0.6,
  },
  duplicateButton: {
    height: 42,
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a90e2',
    backgroundColor: '#f0f4f7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  duplicateButtonPhone: {
    flex: 0,
    width: '100%',
    height: 46,
  },
  duplicateButtonText: {
    flexShrink: 1,
    color: '#4a90e2',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0c7c1',
    backgroundColor: '#fff8f7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  deleteButtonPhone: {
    width: '100%',
    height: 44,
  },
  deleteButtonText: {
    color: '#c0392b',
    fontWeight: '700',
    fontSize: 13,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
});
