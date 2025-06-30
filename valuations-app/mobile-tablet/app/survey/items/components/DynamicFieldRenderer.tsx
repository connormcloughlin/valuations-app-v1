import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FieldConfiguration, DropdownOption, FieldValidationError } from '../../../../types/dynamicUI';

interface DynamicFieldRendererProps {
  field: FieldConfiguration;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  validationError?: FieldValidationError;
  handwritingEnabled?: boolean;
  onOpenHandwriting?: (fieldName: string) => void;
  // Photo-specific props
  itemId?: string;
  itemPhotos?: { [key: string]: any[] };
  onTakePhoto?: (itemId: string) => void;
  // Layout props
  hideLabel?: boolean;
  // Save functionality
  onBlur?: () => void;
}

export default function DynamicFieldRenderer({
  field,
  value,
  onChange,
  validationError,
  handwritingEnabled = false,
  onOpenHandwriting,
  itemId,
  itemPhotos,
  onTakePhoto,
  hideLabel = false,
  onBlur
}: DynamicFieldRendererProps) {
  
  // Don't render if field is not visible
  if (field.display_on_ui === 0) {
    return null;
  }

  const fieldName = field.item_fields;
  const isRequired = field.is_required || false;
  const hasError = validationError?.fieldName === fieldName;

  const renderFieldByType = () => {
    // Special handling for photo fields
    if (fieldName === 'photos' && itemId && onTakePhoto) {
      return renderPhotoField();
    }
    
    switch (field.field_type) {
      case 'photo':
        return renderPhotoField();
      case 'dropdown':
        return renderDropdownField();
      case 'textarea':
        return renderTextAreaField();
      case 'number':
        return renderNumberField();
      case 'currency':
        return renderCurrencyField();
      case 'location_group':
        return renderLocationGroupField();
      default:
        return renderTextField();
    }
  };

  const renderTextField = () => (
    <View style={styles.inputContainer}>
      <TextInput
        style={[styles.input, hasError && styles.inputError]}
        value={value || ''}
        onChangeText={(text) => onChange(fieldName, text)}
        onBlur={onBlur}
        placeholder={field.placeholder || field.field_label}
        placeholderTextColor="#95a5a6"
      />
      {handwritingEnabled && onOpenHandwriting && (
        <TouchableOpacity
          style={styles.handwritingButton}
          onPress={() => onOpenHandwriting(fieldName)}
        >
          <MaterialCommunityIcons name="pencil" size={24} color="#4a90e2" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderNumberField = () => (
    <View style={styles.inputContainer}>
      <TextInput
        style={[styles.input, hasError && styles.inputError]}
        value={value ? String(value) : ''}
        onChangeText={(text) => onChange(fieldName, text)}
        onBlur={onBlur}
        placeholder={field.placeholder || field.field_label}
        placeholderTextColor="#95a5a6"
        keyboardType="numeric"
      />
      {handwritingEnabled && onOpenHandwriting && (
        <TouchableOpacity
          style={styles.handwritingButton}
          onPress={() => onOpenHandwriting(fieldName)}
        >
          <MaterialCommunityIcons name="pencil" size={24} color="#4a90e2" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCurrencyField = () => (
    <View style={styles.inputContainer}>
      <View style={styles.currencyContainer}>
        <Text style={styles.currencyPrefix}>R</Text>
        <TextInput
          style={[styles.currencyInput, hasError && styles.inputError]}
          value={value ? String(value) : ''}
          onChangeText={(text) => onChange(fieldName, text)}
          onBlur={onBlur}
          placeholder={field.placeholder || "0.00"}
          placeholderTextColor="#95a5a6"
          keyboardType="numeric"
        />
      </View>
      {handwritingEnabled && onOpenHandwriting && (
        <TouchableOpacity
          style={styles.handwritingButton}
          onPress={() => onOpenHandwriting(fieldName)}
        >
          <MaterialCommunityIcons name="pencil" size={24} color="#4a90e2" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTextAreaField = () => (
    <TextInput
      style={[styles.input, styles.textAreaInput, hasError && styles.inputError]}
      value={value || ''}
      onChangeText={(text) => onChange(fieldName, text)}
      onBlur={onBlur}
      placeholder={field.placeholder || field.field_label}
      placeholderTextColor="#95a5a6"
      multiline
      numberOfLines={3}
    />
  );

  const renderDropdownField = () => {
    if (!field.dropdownOptions || field.dropdownOptions.length === 0) {
      // Fallback to text input if no options available
      return renderTextField();
    }

    // For room field or location-based dropdowns, render as buttons
    if (fieldName === 'room' || field.field_type === 'location_group') {
      return renderLocationButtons();
    }

    // Render as picker for other dropdowns
    return (
      <View style={[styles.pickerContainer, hasError && styles.inputError]}>
        <Picker
          selectedValue={value || ''}
          onValueChange={(itemValue: any) => onChange(fieldName, itemValue)}
          style={styles.picker}
        >
          <Picker.Item 
            label={field.placeholder || `Select ${field.field_label}`} 
            value="" 
            color="#95a5a6"
          />
          {field.dropdownOptions
            .filter(option => option.is_active)
            .map((option) => (
              <Picker.Item
                key={option.option_value}
                label={option.option_label}
                value={option.option_value}
              />
            ))}
        </Picker>
      </View>
    );
  };

  const renderLocationButtons = () => (
    <View style={styles.locationButtonsContainer}>
      {field.dropdownOptions
        ?.filter(option => option.is_active)
        .map((option) => (
          <TouchableOpacity
            key={option.option_value}
            style={[
              styles.locationButton,
              value === option.option_value && styles.locationButtonSelected
            ]}
            onPress={() => onChange(fieldName, option.option_value)}
          >
            <Text
              style={[
                styles.locationButtonText,
                value === option.option_value && styles.locationButtonTextSelected
              ]}
            >
              {option.option_label}
            </Text>
          </TouchableOpacity>
        ))}
    </View>
  );

  const renderLocationGroupField = () => {
    // Similar to dropdown but specifically for location grouping
    return renderLocationButtons();
  };

  const renderPhotoField = () => {
    if (!itemId || !onTakePhoto) return null;
    
    const photoCount = itemPhotos?.[itemId]?.length || 0;
    
    return (
      <View style={styles.photoSection}>
        <TouchableOpacity
          style={styles.photoButton}
          onPress={() => onTakePhoto(itemId)}
        >
          <MaterialCommunityIcons 
            name={photoCount > 0 ? "image-multiple" : "camera"} 
            size={16} 
            color="#4a90e2" 
          />
          <Text style={styles.photoButtonText}>
            {photoCount > 0 
              ? `${photoCount} photo${photoCount !== 1 ? 's' : ''}`
              : 'Take Photo'
            }
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.fieldContainer}>
      {!hideLabel && (
        <Text style={[styles.label, hasError && styles.labelError]}>
          {field.field_label}
          {isRequired && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      {renderFieldByType()}
      
      {hasError && (
        <Text style={styles.errorText}>{validationError?.message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  labelError: {
    color: '#e74c3c',
  },
  required: {
    color: '#e74c3c',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  handwritingButton: {
    marginLeft: 8,
    padding: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  locationButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  locationButtonSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  locationButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#f0f4f7',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  photoButtonText: {
    fontSize: 12,
    color: '#4a90e2',
    marginLeft: 4,
    fontWeight: '500',
  },
  currencyContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  currencyPrefix: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  currencyInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 0, // Remove border since container has it
  },
}); 