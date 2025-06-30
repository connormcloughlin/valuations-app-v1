// Dynamic UI Configuration Types
export interface DropdownOption {
  dropdown_option_id?: string;
  option_value: string;
  option_label: string;
  display_order: number;
  is_active?: boolean; // Optional - defaults to true if not provided
  parent_option_id?: number;
  option_icon?: string | null;
  option_group?: string | null;
  option_color?: string | null;
  option_description?: string | null;
  children?: DropdownOption[];
}

export interface FieldConfiguration {
  riskfieldid: number;
  riskTemplateCategoryID: number;
  item_fields: string; // Field name like 'type', 'description', 'room'
  field_label: string; // Display label
  display_on_ui: number; // 1=visible, 0=hidden
  field_type?: string; // 'text', 'number', 'dropdown', 'textarea', 'location_group'
  is_required?: boolean;
  placeholder?: string;
  validation_rules?: any;
  display_order?: number;
  dropdownOptions?: DropdownOption[];
}

export interface GroupingStrategy {
  grouping_strategy_id: number;
  RiskTemplateCategoryID: number;
  strategy_type: 'by_location' | 'by_type' | 'by_brand' | 'by_value_range' | 'custom';
  strategy_name: string;
  strategy_config: string; // JSON string
  is_active: boolean;
  display_order: number;
}

export interface LocationTemplate {
  location_template_id: number;
  template_name: string;
  description: string;
  template_type: 'residential' | 'commercial' | 'industrial';
  locations_json: string; // JSON array of location names
  is_default: boolean;
  is_active: boolean;
}

export interface CategoryConfiguration {
  categoryId: number;
  categoryName: string;
  fields: FieldConfiguration[];
  groupingStrategy?: GroupingStrategy;
  locationTemplate?: LocationTemplate;
  parsedLocations?: string[]; // Parsed from locations_json
  parsedStrategyConfig?: any; // Parsed from strategy_config
}

export interface TemplateConfiguration {
  templateId: number;
  templateName: string;
  categories: CategoryConfiguration[];
}

// API Response Types
export interface MobileConfigResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
  fromCache?: boolean;
}

// Field validation error type
export interface FieldValidationError {
  fieldName: string;
  message: string;
}

// Grouping result type for items
export interface GroupedItems<T = any> {
  [groupName: string]: T[];
}

// Configuration cache info
export interface ConfigCacheInfo {
  categoryId: number;
  lastFetched: string;
  expiry: string;
} 