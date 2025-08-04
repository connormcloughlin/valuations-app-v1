import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Modal, ScrollView, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FieldConfiguration, DropdownOption, FieldValidationError } from '../../../../types/dynamicUI';
// Import centralized styles
import { dynamicFieldRendererStyles } from '../../../GlobalStyles';

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

interface ModalDropdownProps {
  value: any;
  onChange: (fieldName: string, value: any) => void;
  field: FieldConfiguration;
  hasError: boolean;
  onBlur?: () => void;
  dataAttributes?: { [key: string]: string };
}

function ModalDropdown({ value, onChange, field, hasError, onBlur, dataAttributes }: ModalDropdownProps) {
  const [showModal, setShowModal] = useState(false);

  if (!field.dropdownOptions || field.dropdownOptions.length === 0) {
    return null;
  }

  const selectedOption = field.dropdownOptions.find((option: DropdownOption) => option.option_value === value);
  const displayText = selectedOption ? selectedOption.option_label : (field.placeholder || field.field_label);

  const handleSelectOption = (optionValue: string) => {
    onChange(field.item_fields, optionValue);
    setShowModal(false);
    onBlur?.();
  };

  return (
    <View style={dynamicFieldRendererStyles.modalDropdownContainer}>
      <TouchableOpacity
        style={[dynamicFieldRendererStyles.input, dynamicFieldRendererStyles.dropdownButton, hasError && dynamicFieldRendererStyles.inputError]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <Text style={[
          dynamicFieldRendererStyles.dropdownButtonText,
          !selectedOption && dynamicFieldRendererStyles.dropdownButtonPlaceholder
        ]}>
          {displayText}
        </Text>
        <MaterialCommunityIcons 
          name="chevron-down" 
          size={24} 
          color="#4a90e2" 
        />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={dynamicFieldRendererStyles.modalOverlay}>
          <View style={dynamicFieldRendererStyles.modalContent}>
            <View style={dynamicFieldRendererStyles.modalHeader}>
              <Text style={dynamicFieldRendererStyles.modalTitle}>{field.field_label}</Text>
              <TouchableOpacity
                style={dynamicFieldRendererStyles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={dynamicFieldRendererStyles.modalScrollView} showsVerticalScrollIndicator={true}>
              {field.dropdownOptions.map((item: DropdownOption) => (
                <TouchableOpacity
                  key={item.option_value}
                  style={[
                    dynamicFieldRendererStyles.modalDropdownItem,
                    value === item.option_value && dynamicFieldRendererStyles.modalDropdownItemSelected
                  ]}
                  onPress={() => handleSelectOption(item.option_value)}
                >
                  <Text style={[
                    dynamicFieldRendererStyles.modalDropdownItemText,
                    value === item.option_value && dynamicFieldRendererStyles.modalDropdownItemTextSelected
                  ]}>
                    {item.option_label}
                  </Text>
                  {value === item.option_value && (
                    <MaterialCommunityIcons 
                      name="check" 
                      size={20} 
                      color="#4a90e2" 
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
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
    // Special handling for photo fields
    if (fieldName === 'photos' && itemId && onTakePhoto) {
      return renderPhotoField();
    }
    
    // Special debugging for selectedanswer field
    if (fieldName === 'selectedanswer') {
      console.log(`🎯 selectedanswer field in DynamicFieldRenderer:`, {
        fieldType: field.field_type,
        dropdownOptions: field.dropdownOptions,
        dropdownOptionsLength: field.dropdownOptions?.length || 0,
        hasDropdownOptions: !!field.dropdownOptions && field.dropdownOptions.length > 0
      });
    }
    
    switch (field.field_type) {
      case 'photo':
        return renderPhotoField();
      case 'dropdown':
        return renderDropdownField();
      case 'combobox':
        return renderComboboxField();
      case 'auto_suggest':
      case 'auto_suggest_box':
        return renderAutoSuggestField();
      case 'text':
        return renderTextField();
      case 'textarea':
        return renderTextAreaField();
      case 'number':
        return renderNumberField();
      case 'currency':
        return renderCurrencyField();
      case 'location_group':
        return renderLocationGroupField();
      default:
        console.log(`🎨 No match for field_type: "${field.field_type}" - using default text field`);
        return renderTextField();
    }
  };

  const renderTextField = () => (
    <View style={dynamicFieldRendererStyles.inputContainer}>
      <TextInput
        style={[dynamicFieldRendererStyles.input, hasError && dynamicFieldRendererStyles.inputError]}
        value={value || ''}
        onChangeText={(text) => onChange(fieldName, text)}
        onBlur={onBlur}
        placeholder={field.placeholder || field.field_label}
        placeholderTextColor="#95a5a6"
        {...(dataAttributes || {})}
      />
      {handwritingEnabled && onOpenHandwriting && (
        <TouchableOpacity
          style={dynamicFieldRendererStyles.handwritingButton}
          onPress={() => onOpenHandwriting(fieldName)}
        >
          <MaterialCommunityIcons name="pencil" size={24} color="#4a90e2" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderNumberField = () => (
    <View style={dynamicFieldRendererStyles.inputContainer}>
      <TextInput
        style={[dynamicFieldRendererStyles.input, hasError && dynamicFieldRendererStyles.inputError]}
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
          style={dynamicFieldRendererStyles.handwritingButton}
          onPress={() => onOpenHandwriting(fieldName)}
        >
          <MaterialCommunityIcons name="pencil" size={24} color="#4a90e2" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCurrencyField = () => (
    <View style={dynamicFieldRendererStyles.inputContainer}>
      <View style={dynamicFieldRendererStyles.currencyContainer}>
        <Text style={dynamicFieldRendererStyles.currencyPrefix}>R</Text>
        <TextInput
          style={[dynamicFieldRendererStyles.currencyInput, hasError && dynamicFieldRendererStyles.inputError]}
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
          style={dynamicFieldRendererStyles.handwritingButton}
          onPress={() => onOpenHandwriting(fieldName)}
        >
          <MaterialCommunityIcons name="pencil" size={24} color="#4a90e2" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTextAreaField = () => (
    <TextInput
      style={[dynamicFieldRendererStyles.input, dynamicFieldRendererStyles.textAreaInput, hasError && dynamicFieldRendererStyles.inputError]}
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
      return renderTextField();
    }
    return (
      <ModalDropdown
        value={value}
        onChange={onChange}
        field={field}
        hasError={hasError}
        onBlur={onBlur}
        dataAttributes={dataAttributes}
      />
    );
  };

  const renderLocationButtons = () => (
    <View style={dynamicFieldRendererStyles.locationButtonsContainer}>
      {field.dropdownOptions
        ?.filter(option => option.is_active !== false) // Include undefined values
        .map((option) => (
          <TouchableOpacity
            key={option.option_value}
            style={[
              dynamicFieldRendererStyles.locationButton,
              value === option.option_value && dynamicFieldRendererStyles.locationButtonSelected
            ]}
            onPress={() => onChange(fieldName, option.option_value)}
          >
            <Text
              style={[
                dynamicFieldRendererStyles.locationButtonText,
                value === option.option_value && dynamicFieldRendererStyles.locationButtonTextSelected
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
      <View style={dynamicFieldRendererStyles.locationGroupContainer}>
        {/* Header with MapPin icon */}
        <View style={dynamicFieldRendererStyles.locationGroupHeader}>
          <MaterialCommunityIcons 
            name="map-marker" 
            size={20} 
            color="#4a90e2" 
          />
          <Text style={dynamicFieldRendererStyles.locationGroupHeaderText}>
            Select Room/Location
          </Text>
        </View>
        
        {/* Location options grid */}
        <View style={dynamicFieldRendererStyles.locationGroupGrid}>
          {field.dropdownOptions
            .filter(option => option.is_active !== false)
            .map((option) => (
              <TouchableOpacity
                key={option.option_value}
                style={[
                  dynamicFieldRendererStyles.locationGroupButton,
                  value === option.option_value && dynamicFieldRendererStyles.locationGroupButtonSelected
                ]}
                onPress={() => {
                  onChange(fieldName, option.option_value);
                  onBlur?.();
                }}
              >
                <View style={dynamicFieldRendererStyles.locationGroupButtonContent}>
                  <MaterialCommunityIcons 
                    name="home-outline" 
                    size={18} 
                    color={value === option.option_value ? "#fff" : "#4a90e2"} 
                  />
                                     <Text
                     style={[
                       dynamicFieldRendererStyles.locationGroupButtonText,
                       value === option.option_value && dynamicFieldRendererStyles.locationGroupButtonTextSelected,
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
          <View style={dynamicFieldRendererStyles.selectedLocationIndicator}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={16} 
              color="#27ae60" 
            />
            <Text style={dynamicFieldRendererStyles.selectedLocationText}>
              Selected: {field.dropdownOptions?.find(opt => opt.option_value === value)?.option_label || value}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderComboboxField = () => {
    if (!field.dropdownOptions || field.dropdownOptions.length === 0) {
      return renderTextField();
    }

    const [inputText, setInputText] = useState(value || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState(field.dropdownOptions);
    const selectingOption = useRef(false);

    const handleTextChange = (text: string) => {
      setInputText(text);
      onChange(fieldName, text);
      
      // Filter options based on input
      const filtered = field.dropdownOptions?.filter((option: DropdownOption) =>
        option.option_label.toLowerCase().includes(text.toLowerCase())
      ) || [];
      setFilteredOptions(filtered);
      setShowSuggestions(text.length > 0 && filtered.length > 0);
    };

    const handleSelectSuggestion = (optionValue: string) => {
      const selectedOption = field.dropdownOptions?.find((option: DropdownOption) => option.option_value === optionValue);
      const displayText = selectedOption ? selectedOption.option_label : optionValue;
      setInputText(displayText);
      onChange(fieldName, optionValue);
      setShowSuggestions(false);
    };

    // Only close suggestions on blur if not selecting an option
    const handleBlur = () => {
      setTimeout(() => {
        if (!selectingOption.current) {
          setShowSuggestions(false);
        }
        onBlur?.();
      }, 100);
    };

    return (
      <View style={dynamicFieldRendererStyles.comboboxContainer}>
        <View style={dynamicFieldRendererStyles.inputContainer}>
          <TextInput
            style={[dynamicFieldRendererStyles.input, hasError && dynamicFieldRendererStyles.inputError]}
            value={inputText}
            onChangeText={handleTextChange}
            onFocus={() => {
              if (inputText.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={handleBlur}
            placeholder={field.placeholder || field.field_label}
            placeholderTextColor="#95a5a6"
            {...(dataAttributes || {})}
          />
          {handwritingEnabled && onOpenHandwriting && (
            <TouchableOpacity
              style={dynamicFieldRendererStyles.handwritingButton}
              onPress={() => onOpenHandwriting(fieldName)}
            >
              <MaterialCommunityIcons name="pencil" size={24} color="#4a90e2" />
            </TouchableOpacity>
          )}
        </View>
        {showSuggestions && (
          <View style={dynamicFieldRendererStyles.suggestionsContainer}>
            <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
              {filteredOptions.map((item: DropdownOption) => (
                <TouchableOpacity
                  key={item.option_value}
                  style={dynamicFieldRendererStyles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item.option_value)}
                  onPressIn={() => { selectingOption.current = true; }}
                  onPressOut={() => { setTimeout(() => { selectingOption.current = false; }, 150); }}
                >
                  <Text style={dynamicFieldRendererStyles.suggestionText}>{item.option_label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderAutoSuggestField = () => {
    // Auto-suggest is similar to combobox but with different behavior
    return renderComboboxField();
  };

  const renderPhotoField = () => {
    if (!itemId || !onTakePhoto) return null;
    
    const photoCount = itemPhotos?.[itemId]?.length || 0;
    
    return (
      <View style={dynamicFieldRendererStyles.photoSection}>
        <TouchableOpacity
          style={dynamicFieldRendererStyles.photoButton}
          onPress={() => onTakePhoto(itemId)}
        >
          <MaterialCommunityIcons 
            name={photoCount > 0 ? "image-multiple" : "camera"} 
            size={16} 
            color="#4a90e2" 
          />
          <Text style={dynamicFieldRendererStyles.photoButtonText}>
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
    <View style={dynamicFieldRendererStyles.fieldContainer}>
      {!hideLabel && (
        <Text style={[dynamicFieldRendererStyles.label, hasError && dynamicFieldRendererStyles.labelError]}>
          {field.field_label}
          {isRequired && <Text style={dynamicFieldRendererStyles.required}> *</Text>}
        </Text>
      )}
      
      {renderFieldByType()}
      
      {hasError && (
        <Text style={dynamicFieldRendererStyles.errorText}>{validationError?.message}</Text>
      )}
    </View>
  );
} 