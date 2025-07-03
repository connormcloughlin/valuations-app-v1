import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Modal } from 'react-native';
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
  // Focus restoration props
  dataAttributes?: { [key: string]: string };
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
  onBlur,
  dataAttributes
}: DynamicFieldRendererProps) {
  
  // Don't render if field is not visible
  if (field.display_on_ui === 0) {
    return null;
  }

  const fieldName = field.item_fields;
  const isRequired = field.is_required || false;
  const hasError = validationError?.fieldName === fieldName;

  const renderFieldByType = () => {
    console.log(`🎨 DynamicFieldRenderer: Rendering field "${fieldName}" with type "${field.field_type}"`);
    console.log(`🎨 Field config:`, JSON.stringify(field, null, 2));
    
    // Special handling for photo fields
    if (fieldName === 'photos' && itemId && onTakePhoto) {
      console.log(`🎨 Rendering special photos field for ${fieldName}`);
      return renderPhotoField();
    }
    
    switch (field.field_type) {
      case 'photo':
        console.log(`🎨 Matched field_type: photo`);
        return renderPhotoField();
      case 'dropdown':
        console.log(`🎨 Matched field_type: dropdown`);
        return renderDropdownField();
      case 'combobox':
        console.log(`🎨 Matched field_type: combobox`);
        return renderComboboxField();
      case 'auto_suggest':
      case 'auto_suggest_box':
        console.log(`🎨 Matched field_type: auto_suggest/auto_suggest_box`);
        return renderAutoSuggestField();
      case 'textarea':
        console.log(`🎨 Matched field_type: textarea`);
        return renderTextAreaField();
      case 'number':
        console.log(`🎨 Matched field_type: number`);
        return renderNumberField();
      case 'currency':
        console.log(`🎨 Matched field_type: currency`);
        return renderCurrencyField();
      case 'location_group':
        console.log(`🎨 Matched field_type: location_group - rendering location group field!`);
        return renderLocationGroupField();
      default:
        console.log(`🎨 No match for field_type: "${field.field_type}" - using default text field`);
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
        {...(dataAttributes || {})}
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
        {...(dataAttributes || {})}
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
          {...(dataAttributes || {})}
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
      {...(dataAttributes || {})}
    />
  );

  const renderDropdownField = () => {
    if (!field.dropdownOptions || field.dropdownOptions.length === 0) {
      // Fallback to text input if no options available
      return renderTextField();
    }

    // Render all dropdowns as picker/select lists
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
            .filter(option => option.is_active !== false) // Include undefined values
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
        ?.filter(option => option.is_active !== false) // Include undefined values
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
    if (!field.dropdownOptions || field.dropdownOptions.length === 0) {
      // Fallback to text input if no location templates available
      return renderTextField();
    }

    return (
      <View style={styles.locationGroupContainer}>
        {/* Header with MapPin icon */}
        <View style={styles.locationGroupHeader}>
          <MaterialCommunityIcons 
            name="map-marker" 
            size={20} 
            color="#4a90e2" 
          />
          <Text style={styles.locationGroupHeaderText}>
            Select Room/Location
          </Text>
        </View>
        
        {/* Location options grid */}
        <View style={styles.locationGroupGrid}>
          {field.dropdownOptions
            .filter(option => option.is_active !== false)
            .map((option) => (
              <TouchableOpacity
                key={option.option_value}
                style={[
                  styles.locationGroupButton,
                  value === option.option_value && styles.locationGroupButtonSelected
                ]}
                onPress={() => {
                  onChange(fieldName, option.option_value);
                  onBlur?.();
                }}
              >
                <View style={styles.locationGroupButtonContent}>
                  <MaterialCommunityIcons 
                    name="home-outline" 
                    size={18} 
                    color={value === option.option_value ? "#fff" : "#4a90e2"} 
                  />
                                     <Text
                     style={[
                       styles.locationGroupButtonText,
                       value === option.option_value && styles.locationGroupButtonTextSelected,
                       { textAlign: 'center' }
                     ]}
                     numberOfLines={2}
                  >
                    {option.option_label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
        </View>
        
        {/* Selected location indicator */}
        {value && (
          <View style={styles.selectedLocationIndicator}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={16} 
              color="#27ae60" 
            />
            <Text style={styles.selectedLocationText}>
              Selected: {field.dropdownOptions?.find(opt => opt.option_value === value)?.option_label || value}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderComboboxField = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [inputText, setInputText] = useState(value || '');

    if (!field.dropdownOptions || field.dropdownOptions.length === 0) {
      // Fallback to text input if no options available
      return renderTextField();
    }

    const handleSelectOption = (optionValue: string) => {
      setInputText(optionValue);
      onChange(fieldName, optionValue);
      setShowDropdown(false);
      onBlur?.();
    };

    const handleTextChange = (text: string) => {
      setInputText(text);
      onChange(fieldName, text);
    };

    return (
      <View style={styles.comboboxContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, hasError && styles.inputError]}
            value={inputText}
            onChangeText={handleTextChange}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => {
              setTimeout(() => setShowDropdown(false), 200); // Delay to allow option selection
              onBlur?.();
            }}
            placeholder={field.placeholder || field.field_label}
            placeholderTextColor="#95a5a6"
            {...(dataAttributes || {})}
          />
          <TouchableOpacity
            style={styles.dropdownToggle}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <MaterialCommunityIcons 
              name={showDropdown ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#4a90e2" 
            />
          </TouchableOpacity>
        </View>
        
        {showDropdown && (
          <View style={styles.dropdownList}>
            <FlatList
              data={field.dropdownOptions.filter(option => option.is_active !== false)}
              keyExtractor={(item) => item.option_value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleSelectOption(item.option_value)}
                >
                  <Text style={styles.dropdownItemText}>{item.option_label}</Text>
                </TouchableOpacity>
              )}
              style={styles.dropdownContent}
              nestedScrollEnabled={true}
            />
          </View>
        )}
      </View>
    );
  };

  const renderAutoSuggestField = () => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [inputText, setInputText] = useState(value || '');
    const [filteredOptions, setFilteredOptions] = useState<DropdownOption[]>([]);

    useEffect(() => {
      if (!field.dropdownOptions || inputText.length === 0) {
        setFilteredOptions([]);
        return;
      }

      const filtered = field.dropdownOptions
        .filter(option => 
          option.is_active !== false && 
          option.option_label.toLowerCase().includes(inputText.toLowerCase())
        )
        .slice(0, 5); // Limit to 5 suggestions

      setFilteredOptions(filtered);
    }, [inputText, field.dropdownOptions]);

    const handleTextChange = (text: string) => {
      setInputText(text);
      onChange(fieldName, text);
      setShowSuggestions(text.length > 0 && filteredOptions.length > 0);
    };

    const handleSelectSuggestion = (optionValue: string) => {
      setInputText(optionValue);
      onChange(fieldName, optionValue);
      setShowSuggestions(false);
      onBlur?.();
    };

    return (
      <View style={styles.autoSuggestContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, hasError && styles.inputError]}
            value={inputText}
            onChangeText={handleTextChange}
            onFocus={() => setShowSuggestions(inputText.length > 0 && filteredOptions.length > 0)}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200); // Delay to allow suggestion selection
              onBlur?.();
            }}
            placeholder={field.placeholder || field.field_label}
            placeholderTextColor="#95a5a6"
            {...(dataAttributes || {})}
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
        
        {showSuggestions && filteredOptions.length > 0 && (
          <View style={styles.suggestionsList}>
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.option_value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item.option_value)}
                >
                  <Text style={styles.suggestionItemText}>{item.option_label}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsContent}
              nestedScrollEnabled={true}
            />
          </View>
        )}
      </View>
    );
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
  // Combobox styles
  comboboxContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownToggle: {
    marginLeft: 8,
    padding: 8,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 200,
    zIndex: 1001,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownContent: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  // Auto-suggest styles
  autoSuggestContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  suggestionsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 150,
    zIndex: 1001,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionsContent: {
    maxHeight: 150,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionItemText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  // Location group styles
  locationGroupContainer: {
    marginBottom: 8,
  },
  locationGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  locationGroupHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  locationGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  locationGroupButton: {
    minWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4a90e2',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  locationGroupButtonSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  locationGroupButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationGroupButtonText: {
    fontSize: 12,
    color: '#4a90e2',
    fontWeight: '500',
    marginTop: 4,
  },
  locationGroupButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedLocationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fff8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  selectedLocationText: {
    fontSize: 14,
    color: '#27ae60',
    marginLeft: 8,
    fontWeight: '500',
  },
}); 