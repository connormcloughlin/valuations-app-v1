import { FieldConfiguration, FieldValidationError } from '../types/dynamicUI';

export class ValidationService {
  /**
   * Validate a single field based on its configuration
   */
  static validateField(field: FieldConfiguration, value: any): FieldValidationError | null {
    const fieldName = field.item_fields;
    
    // Check if required field is empty
    if (field.is_required && this.isEmpty(value)) {
      return {
        fieldName,
        message: `${field.field_label} is required`
      };
    }

    // If field is empty and not required, no validation needed
    if (this.isEmpty(value)) {
      return null;
    }

    // Validate by field type
    switch (field.field_type) {
      case 'number':
        return this.validateNumber(field, value);
      case 'dropdown':
        return this.validateDropdown(field, value);
      default:
        return null;
    }
  }

  /**
   * Validate all fields in a form data object
   */
  static validateAllFields(
    fields: FieldConfiguration[], 
    formData: {[key: string]: any}
  ): FieldValidationError[] {
    const errors: FieldValidationError[] = [];

    fields.forEach(field => {
      if (field.display_on_ui === 0) return; // Skip hidden fields
      
      const value = formData[field.item_fields];
      const error = this.validateField(field, value);
      
      if (error) {
        errors.push(error);
      }
    });

    return errors;
  }

  /**
   * Check if a value is considered empty
   */
  private static isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (typeof value === 'number') return false; // 0 is not empty for numbers
    return !value;
  }

  /**
   * Validate number fields
   */
  private static validateNumber(field: FieldConfiguration, value: any): FieldValidationError | null {
    const stringValue = String(value).trim();
    
    if (stringValue === '') {
      return null; // Empty is handled by required validation
    }

    const numValue = Number(stringValue);
    
    if (isNaN(numValue)) {
      return {
        fieldName: field.item_fields,
        message: `${field.field_label} must be a valid number`
      };
    }

    // Apply custom validation rules if they exist
    if (field.validation_rules) {
      try {
        const rules = typeof field.validation_rules === 'string' 
          ? JSON.parse(field.validation_rules) 
          : field.validation_rules;

        if (rules.min !== undefined && numValue < rules.min) {
          return {
            fieldName: field.item_fields,
            message: `${field.field_label} must be at least ${rules.min}`
          };
        }

        if (rules.max !== undefined && numValue > rules.max) {
          return {
            fieldName: field.item_fields,
            message: `${field.field_label} must be no more than ${rules.max}`
          };
        }

        if (rules.positive && numValue < 0) {
          return {
            fieldName: field.item_fields,
            message: `${field.field_label} must be a positive number`
          };
        }

      } catch (error) {
        console.error('Error parsing validation rules:', error);
      }
    }

    return null;
  }

  /**
   * Validate dropdown fields
   */
  private static validateDropdown(field: FieldConfiguration, value: any): FieldValidationError | null {
    if (!field.dropdownOptions || field.dropdownOptions.length === 0) {
      return null; // No validation if no options available
    }

    const stringValue = String(value);
    const validOptions = field.dropdownOptions
      .filter(option => option.is_active)
      .map(option => option.option_value);

    if (stringValue && !validOptions.includes(stringValue)) {
      return {
        fieldName: field.item_fields,
        message: `Please select a valid ${field.field_label}`
      };
    }

    return null;
  }

  /**
   * Apply custom validation rules from configuration
   */
  private static applyValidationRules(rules: any, value: any, fieldLabel: string): FieldValidationError | null {
    try {
      const validationRules = typeof rules === 'string' ? JSON.parse(rules) : rules;

      // String length validation
      if (validationRules.minLength && String(value).length < validationRules.minLength) {
        return {
          fieldName: '',
          message: `${fieldLabel} must be at least ${validationRules.minLength} characters long`
        };
      }

      if (validationRules.maxLength && String(value).length > validationRules.maxLength) {
        return {
          fieldName: '',
          message: `${fieldLabel} must be no more than ${validationRules.maxLength} characters long`
        };
      }

      // Pattern validation (regex)
      if (validationRules.pattern) {
        const regex = new RegExp(validationRules.pattern);
        if (!regex.test(String(value))) {
          return {
            fieldName: '',
            message: validationRules.patternMessage || `${fieldLabel} format is invalid`
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error applying validation rules:', error);
      return null;
    }
  }

  /**
   * Get validation summary for display
   */
  static getValidationSummary(errors: FieldValidationError[]): string | null {
    if (errors.length === 0) return null;
    
    if (errors.length === 1) {
      return errors[0].message;
    }
    
    return `Please fix ${errors.length} validation errors`;
  }

  /**
   * Check if form is valid (no validation errors)
   */
  static isFormValid(
    fields: FieldConfiguration[], 
    formData: {[key: string]: any}
  ): boolean {
    const errors = this.validateAllFields(fields, formData);
    return errors.length === 0;
  }

  /**
   * Get required fields that are empty
   */
  static getMissingRequiredFields(
    fields: FieldConfiguration[], 
    formData: {[key: string]: any}
  ): string[] {
    return fields
      .filter(field => 
        field.display_on_ui === 1 && 
        field.is_required && 
        this.isEmpty(formData[field.item_fields])
      )
      .map(field => field.field_label);
  }
}

export default ValidationService; 