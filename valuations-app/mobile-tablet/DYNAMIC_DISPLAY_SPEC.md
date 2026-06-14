# Dynamic Display System Specification

## Overview

The Dynamic Display System is a sophisticated field rendering and grouping mechanism that provides flexible, configurable UI for risk assessment items. It supports both dynamic field configuration and intelligent grouping strategies, with comprehensive fallback mechanisms.

## Architecture Components

### 1. DynamicFieldRenderer.tsx
The core field rendering component that handles multiple field types and configurations.

### 2. PredefinedItemsList.tsx
The main container component that manages grouping, field visibility, and data flow.

## Field Types and Rendering Logic

### Supported Field Types

| Field Type | Description | Rendering Behavior |
|------------|-------------|-------------------|
| `text` | Standard text input | Single-line TextInput with placeholder |
| `textarea` | Multi-line text input | Multi-line TextInput with 3+ lines |
| `number` | Numeric input | TextInput with numeric keyboard |
| `currency` | Currency input | TextInput with "R" prefix and numeric keyboard |
| `dropdown` | Selection dropdown | Modal-based dropdown with sorted options |
| `combobox` | Searchable dropdown | TextInput with filtered suggestions |
| `auto_suggest` | Auto-complete field | Same as combobox |
| `auto_suggest_box` | Auto-complete field | Same as combobox |
| `photo` | Photo capture field | Camera/gallery integration |
| `location_group` | Location selection | Grid-based location buttons |
| `checkbox` | Boolean toggle | Switch; value stored as `'true'` or `'false'` |
| `date` | Date value | TextInput with placeholder e.g. YYYY-MM-DD; stores string |
| `percentage` | Percentage (0–100) | TextInput with numeric keyboard; optional % in placeholder |
| `email` | Email address | TextInput with `keyboardType="email-address"`, `autoCapitalize="none"` |
| `phone` | Phone number | TextInput with `keyboardType="phone-pad"` |

### Field Type Fallback Logic

```typescript
// In DynamicFieldRenderer.tsx - renderFieldByType()
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
  case 'checkbox':
    return renderCheckboxField();
  case 'date':
    return renderDateField();
  case 'percentage':
    return renderPercentageField();
  case 'email':
    return renderEmailField();
  case 'phone':
    return renderPhoneField();
  default:
    console.log(`🎨 No match for field_type: "${field.field_type}" - using default text field`);
    return renderTextField(); // FALLBACK: Default to text field
}
```

## Grouping Strategies

### Grouping Strategy Types

#### 1. No Grouping (`null`)
- **Behavior**: Renders all items in a flat form without grouping
- **Use Case**: When no grouping strategy is configured
- **Rendering**: Single flat form with all fields for all items

#### 2. Single-Tier Grouping
- **Strategies**:
  - `by_type`: Groups by item type/ItemPrompt
  - `by_location`: Groups by room/location
  - `by_brand`: Groups by model/brand
  - `by_value_range`: Groups by price ranges
  - `custom`: Custom field-based grouping

#### 3. Two-Tier (Nested) Grouping
- **Configuration**: Uses `strategy_config` with `primary_group` and `secondary_group`
- **Example**: Primary by Location, Secondary by Model
- **Structure**: `{ [primaryKey]: { [secondaryKey]: Item[] } }`

### Grouping Strategy Detection

```typescript
// Helper function to check if grouping is nested (2-tier)
const isNestedGrouping = useCallback((groups: GroupedItemsType): groups is NestedGroups => {
  const strategyConfig = groupingStrategy?.strategy_config;
  let parsedConfig: any = null;
  try {
    parsedConfig = typeof strategyConfig === 'string' ? JSON.parse(strategyConfig) : strategyConfig;
  } catch (error) {
    parsedConfig = null;
  }
  return parsedConfig && parsedConfig.primary_group && parsedConfig.secondary_group;
}, [groupingStrategy]);
```

### Grouping Configuration Parsing

The system handles both string (legacy) and object (new) types for `strategy_config`:

```typescript
// Handle both string (legacy) and object (new) types for strategy_config
let parsedConfig: any = null;
try {
  parsedConfig = typeof strategyConfig === 'string' ? JSON.parse(strategyConfig) : strategyConfig;
} catch (error) {
  debugLog('Error parsing strategy config:', error);
  parsedConfig = null;
}
```

## Field Visibility Logic

### Dynamic Field Configuration Priority

1. **Dynamic Field Config** (Primary)
   - Uses `dynamicFieldConfig` array
   - Respects `display_on_ui` flag
   - Sorts by `display_order`
   - Excludes grouping fields

2. **Legacy Field Config** (Fallback)
   - Uses `fieldConfig` array
   - Maps UI field names to API field names
   - Respects `display_on_ui` flag

3. **Default Behavior** (Final Fallback)
   - Shows all fields when no configuration is provided
   - Used when `useCustomFields` is false or config is empty

### Field Visibility Check

```typescript
const isFieldVisible = useCallback((fieldName: string) => {
  // Try dynamic field configuration first
  if (dynamicFieldConfig && dynamicFieldConfig.length > 0) {
    const fieldConfig = dynamicFieldConfig.find(f => f.item_fields === fieldName);
    const isVisible = fieldConfig && fieldConfig.display_on_ui === 1;
    return isVisible;
  }
  
  // Fall back to legacy field configuration
  if (!useCustomFields || !fieldConfig || fieldConfig.length === 0) {
    return true; // Show all fields
  }
  
  // Map UI field names to API field names
  const fieldNameMapping: { [key: string]: string } = {
    'description': 'Description',
    'model': 'Model',
    'quantity': 'Qty',
    'price': 'Price',
    'room': 'Location',
    'notes': 'Notes',
    'photos': 'HasPhoto'
  };
  
  const apiFieldName = fieldNameMapping[fieldName.toLowerCase()];
  const fieldConfigItem = fieldConfig.find((config: any) => 
    config.item_fields && config.item_fields.toLowerCase() === apiFieldName.toLowerCase()
  );
  
  return fieldConfigItem && fieldConfigItem.display_on_ui === 1;
}, [useCustomFields, fieldConfig, dynamicFieldConfig]);
```

## Grouping Field Exclusion Logic

### Automatic Grouping Field Exclusion

When a grouping strategy is active, fields used for grouping are automatically excluded from editing:

```typescript
const getGroupingFields = (): string[] => {
  if (!groupingStrategy) {
    return []; // No exclusions when no grouping strategy is configured
  }
  
  const fields: string[] = [];
  
  // Handle 2-tier grouping
  const strategyConfig = groupingStrategy.strategy_config;
  let parsedConfig: any = null;
  try {
    parsedConfig = typeof strategyConfig === 'string' ? JSON.parse(strategyConfig) : strategyConfig;
  } catch (error) {
    parsedConfig = null;
  }
  
  if (parsedConfig && parsedConfig.primary_group && parsedConfig.secondary_group) {
    // 2-tier grouping: exclude both primary and secondary fields
    const primaryFieldMap: { [key: string]: string } = {
      'ItemPrompt': 'type',
      'Location': 'room',
      'Model': 'model',
      'Price': 'price'
    };
    const secondaryFieldMap: { [key: string]: string } = {
      'ItemPrompt': 'type',
      'Location': 'room', 
      'Model': 'model',
      'Price': 'price'
    };
    
    if (primaryFieldMap[parsedConfig.primary_group]) fields.push(primaryFieldMap[parsedConfig.primary_group]);
    if (secondaryFieldMap[parsedConfig.secondary_group]) fields.push(secondaryFieldMap[parsedConfig.secondary_group]);
  } else {
    // Single-tier grouping
    switch (effectiveStrategy) {
      case 'by_type':
        fields.push('type'); // ItemPrompt field
        break;
      case 'by_location':
        fields.push('room'); // Location field
        break;
      case 'by_brand':
        fields.push('model'); // Model field
        break;
      case 'by_value_range':
        fields.push('price'); // Price field
        break;
    }
  }
  
  return fields;
};
```

## Special Field Processing

### SelectedAnswer Field Enhancement

The `selectedanswer` field has special processing for comma-separated lists:

```typescript
// Process commaseparatedlist for selectedanswer field
if (fieldName === 'selectedanswer' && item.commaseparatedlist) {
  // Parse the comma-separated list and create dropdown options
  const commaSeparatedOptions = item.commaseparatedlist.split(',').map(option => option.trim()).filter(option => option.length > 0);
  
  if (commaSeparatedOptions.length > 0) {
    // Create dropdown options from the comma-separated list and sort alphabetically
    const dropdownOptions = commaSeparatedOptions
      .map((option, index) => ({
        option_value: option,
        option_label: option,
        is_active: true
      }))
      .sort((a, b) => (a.option_label || '').localeCompare(b.option_label || ''));
    
    // Create a new field configuration with the dropdown options
    const enhancedField = {
      ...field,
      dropdownOptions: dropdownOptions,
      field_type: 'dropdown' // Use dropdown to match InlineDropdown
    };
    
    // Use the enhanced field for rendering
    field = enhancedField;
  }
}
```

## Data Flow and State Management

### State Hierarchy

1. **Props Items** (External data source)
2. **Local Items State** (Internal state with new/duplicate items)
3. **Edit Items State** (Current editing values)
4. **Auto-Saved Items State** (Items saved to database)

### Data Flow Diagram

```
Props Items → Local Items State → Edit Items State → Auto-Save → Database
     ↓              ↓                ↓                ↓
  Grouping    Field Visibility   Field Values    Sync Status
```

### Auto-Save Logic

```typescript
const handleEdit = (itemId: string, fieldName: string, value: string) => {
  setEditItems(prev => ({
    ...prev,
    [itemId]: {
      ...prev[itemId],
      [fieldName]: value,
    }
  }));

  // Debounced auto-save to prevent excessive saves
  const isDropdownField = fieldName === 'selectedanswer';
  if (!isDropdownField) {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveItem(itemId);
    }, 2000); // 2 second delay
  } else {
    // Immediate save for dropdowns
    autoSaveItem(itemId, { [fieldName]: value });
  }
};
```

## Rendering Modes

### 1. No Grouping Mode
- **Condition**: `groupedItems === null`
- **Layout**: Single flat form
- **Structure**: All fields for all items in sequence

### 2. Single-Tier Grouping Mode
- **Condition**: `!isNestedGrouping(groupedItems)`
- **Layout**: Collapsible groups with items
- **Structure**: Group headers → Item rows → Expanded details

### 3. Two-Tier Grouping Mode
- **Condition**: `isNestedGrouping(groupedItems)`
- **Layout**: Primary groups → Secondary groups → Items
- **Structure**: Primary headers → Secondary headers → Item rows → Expanded details

## Field Layout System

### Dynamic Field Layout

Fields are arranged in a responsive grid system:

```typescript
// Group fields into rows for 2-column layout (except notes which is full width)
const fieldRows: any[][] = [];
let currentRow: any[] = [];

visibleFields.forEach((field) => {
  // Notes and textarea fields get their own full-width row
  if (field.field_type === 'notes' || field.field_type === 'textarea') {
    if (currentRow.length > 0) {
      fieldRows.push([...currentRow]);
      currentRow = [];
    }
    fieldRows.push([field]);
  } else {
    // Add to current row
    currentRow.push(field);
    // If current row is full (2 fields), start a new row
    if (currentRow.length === 2) {
      fieldRows.push([...currentRow]);
      currentRow = [];
    }
  }
});

// Add any remaining fields in the current row
if (currentRow.length > 0) {
  fieldRows.push(currentRow);
}
```

### Layout Rules

1. **Notes/Textarea Fields**: Full width, own row
2. **Other Fields**: 2-column grid
3. **Responsive**: Adapts to screen size
4. **Grouping Context**: Different layouts based on grouping strategy

## Error Handling and Validation

### Validation Error Display

```typescript
{hasError && (
  <Text style={dynamicFieldRendererStyles.errorText}>{validationError?.message}</Text>
)}
```

### Field Error States

- **Input Error**: Red border on invalid fields
- **Label Error**: Red text for field labels with errors
- **Validation Service**: Centralized validation logic

## Performance Optimizations

### 1. Debounced Auto-Save
- 2-second delay for text fields
- Immediate save for dropdowns
- Prevents excessive database writes

### 2. Memoized Grouping
- `useMemo` for grouped items calculation
- Only depends on `items`, not `editItems`
- Prevents re-grouping during typing

### 3. Conditional Rendering
- Fields only render when visible
- Groups only render when expanded
- Lazy loading of field configurations

### 4. Focus Management
- Data attributes for focus restoration
- Pending focus restoration after auto-save
- Prevents focus loss during ID changes

## Fallback Mechanisms

### 1. Field Type Fallback
- Unknown field types → Text field
- Missing dropdown options → Text field
- Invalid configurations → Default behavior

### 2. Configuration Fallback
- Dynamic config missing → Legacy config
- Legacy config missing → Show all fields
- No config → Default field set

### 3. Grouping Fallback
- Invalid grouping strategy → No grouping
- Missing strategy config → Flat layout
- Parse errors → Default grouping

### 4. Data Fallback
- Missing field values → Empty strings
- Invalid data types → String conversion
- Database errors → Local state preservation

## API Endpoints and Data Sources

### Primary Configuration Endpoints

#### 1. Complete Category Configuration API
**Endpoint:** `GET /api/mobile/config/category/{categoryId}/complete`

**Purpose:** Single composite endpoint that fetches all configuration data for a category including fields, dropdown options, grouping strategy, and location templates.

**Parameters:**
- `categoryId` (integer): Risk Template Category ID

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "category": {
      "categoryId": 123,
      "categoryName": "Electronics",
      "sectionName": "Contents",
      "templateName": "Standard Template",
      "categoryRank": 1,
      "isActive": true
    },
    "fields": [
      {
        "riskfieldid": 456,
        "fieldName": "Description",
        "fieldLabel": "Item Description",
        "fieldType": "text",
        "isRequired": true,
        "isVisible": true,
        "placeholder": "Enter description",
        "displayOrder": 1,
        "validationRules": {},
        "dropdownOptions": []
      }
    ],
    "groupingStrategy": {
      "grouping_strategy_id": 789,
      "strategy_type": "by_location",
      "strategy_name": "Group by Room",
      "strategy_config": {
        "primary_group": "Location",
        "secondary_group": "Model"
      },
      "is_active": true,
      "display_order": 1
    },
    "locationTemplates": [
      {
        "location_template_id": 101,
        "template_name": "Standard Rooms",
        "description": "Common household rooms",
        "locations_json": "[\"Living Room\", \"Kitchen\", \"Bedroom\"]"
      }
    ],
    "summary": {
      "totalFields": 8,
      "visibleFields": 6,
      "hasGroupingStrategy": true,
      "hasLocationTemplate": true
    }
  }
}
```

#### 2. Order-Level Field Configuration API
**Endpoint:** `GET /api/mobile/config/order/{orderId}/categories/complete`

**Purpose:** Pre-loads field configurations for all categories in an order to minimize individual API calls.

**Parameters:**
- `orderId` (string): Order ID or Order Number

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": { /* category info */ },
        "fields": [ /* field configurations */ ],
        "groupingStrategy": { /* grouping strategy */ },
        "locationTemplates": [ /* location templates */ ]
      }
    ],
    "summary": {
      "totalCategories": 15,
      "totalFields": 120,
      "categoriesWithGrouping": 8,
      "categoriesWithLocationTemplates": 12
    }
  }
}
```

#### 3. Category Details API (Fallback)
**Endpoint:** `GET /api/risk-assessment-categories/{categoryId}`

**Purpose:** Used when RiskTemplateCategoryID is not available to fetch category details and extract the template category ID.

**Parameters:**
- `categoryId` (integer): Category ID

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "CategoryID": 123,
    "RiskTemplateCategoryID": 456,
    "CategoryName": "Electronics",
    "SectionID": 789,
    "isActive": true
  }
}
```

### Secondary Configuration Endpoints

#### 4. Individual Field Options API
**Endpoint:** `GET /api/mobile/config/field/{fieldId}/options`

**Purpose:** Fetch dropdown options for a specific field (used when not included in composite response).

**Parameters:**
- `fieldId` (integer): Field ID

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "dropdown_option_id": 1,
      "option_value": "living_room",
      "option_label": "Living Room",
      "display_order": 1,
      "option_group": "rooms",
      "is_active": true
    }
  ]
}
```

#### 5. Template Configuration API
**Endpoint:** `GET /api/mobile/config/template/{templateId}/categories`

**Purpose:** Get all categories and their configurations for a specific template.

**Parameters:**
- `templateId` (integer): Template ID

### Data Flow and Caching Strategy

#### Configuration Service Flow
```typescript
// 1. Check cache first
const cachedConfig = await this.getCachedConfiguration(categoryId);
if (cachedConfig && !this.isCacheExpired(cachedConfig)) {
  return cachedConfig;
}

// 2. Fetch category details if RiskTemplateCategoryID not provided
if (!riskTemplateCategoryId) {
  const categoryResponse = await this.axiosInstance.get(`/risk-assessment-categories/${categoryId}`);
  riskTemplateCategoryId = categoryResponse.data.data.RiskTemplateCategoryID;
}

// 3. Fetch complete configuration using composite endpoint
const configResponse = await this.axiosInstance.get(`/mobile/config/category/${riskTemplateCategoryId}/complete`);

// 4. Cache the result
await this.cacheConfiguration(categoryId, categoryConfig);
```

#### Prefetch Service Integration
```typescript
// Pre-load configurations for all categories in an order
const [hierarchyResponse, fieldConfigResponse] = await Promise.all([
  api.getRiskAssessmentCompleteHierarchy(orderNumber),
  api.getOrderCategoryFieldConfigurations(orderNumber)
]);

// Cache field configurations for fast lookup
await configurationService.cacheOrderFieldConfigurations(orderNumber, fieldConfigResponse.data);
```

### Fallback Mechanisms

#### 1. Cache Fallback
- **Primary Cache**: AsyncStorage with 24-hour expiry
- **Cache Key Format**: `dynamic_ui_config_{categoryId}`
- **Cache Structure**: Includes timestamp and expiry information

#### 2. Offline Fallback
- **Condition**: When `connectionUtils.isConnected()` returns false
- **Behavior**: Use cached configuration if available
- **Graceful Degradation**: Return null if no cached data

#### 3. Default Configuration Fallback
```typescript
getDefaultConfiguration(categoryId: number, categoryName: string): CategoryConfiguration {
  return {
    categoryId,
    categoryName,
    fields: [
      {
        item_fields: 'description',
        field_label: 'Description',
        field_type: 'text',
        display_on_ui: 1,
        is_required: true,
        display_order: 1
      },
      // ... additional default fields
    ]
  };
}
```

### Error Handling

#### API Error Responses
```json
{
  "success": false,
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Category configuration not found",
    "details": "Category ID 123 does not exist or user lacks permission"
  },
  "timestamp": "2024-01-20T10:30:00Z"
}
```

#### Error Recovery Strategy
1. **API Failure**: Return cached configuration if available
2. **Cache Miss**: Return default configuration
3. **Complete Failure**: Return null and log error

### Integration Points

#### Database Integration
- SQLite for local storage
- Risk assessment items table
- Media files table
- Sync status tracking

#### State Management
- React Context for global state
- Local state for component-specific data
- AsyncStorage for persistence
- Redux-like patterns for complex state

## Configuration Schema

### Dynamic Field Configuration

```typescript
interface FieldConfiguration {
  item_fields: string;           // Field identifier
  field_label: string;           // Display label
  field_type: string;            // Field type (text, dropdown, etc.)
  display_on_ui: number;         // Visibility flag (0/1)
  display_order: number;         // Sort order
  is_required: boolean;          // Required field flag
  placeholder?: string;          // Placeholder text
  dropdownOptions?: DropdownOption[]; // For dropdown fields
}
```

### Grouping Strategy Configuration

```typescript
interface GroupingStrategy {
  strategy_type: string;         // Grouping type
  strategy_config: string | object; // Configuration data
}

// Single-tier config
{
  "strategy_type": "by_location"
}

// Two-tier config
{
  "strategy_type": "custom",
  "strategy_config": {
    "primary_group": "Location",
    "secondary_group": "Model"
  }
}
```

## Testing and Debugging

### Debug Logging
- Comprehensive logging throughout the system
- Field visibility checks
- Grouping strategy parsing
- Auto-save operations
- Focus management

### Development Tools
- Field configuration validation
- Grouping strategy testing
- Performance monitoring
- Error boundary handling

## Future Enhancements

### Planned Features
1. **Advanced Field Types**: Date pickers, sliders, file uploads
2. **Conditional Field Logic**: Show/hide based on other field values
3. **Custom Validation Rules**: Field-specific validation
4. **Theme Support**: Dark/light mode adaptation
5. **Accessibility**: Screen reader support, keyboard navigation

### Performance Improvements
1. **Virtual Scrolling**: For large item lists
2. **Field Caching**: Memoized field configurations
3. **Lazy Loading**: Progressive field rendering
4. **Optimistic Updates**: Immediate UI feedback

## Conclusion

The Dynamic Display System provides a robust, flexible foundation for rendering configurable forms with intelligent grouping and comprehensive fallback mechanisms. It supports both simple and complex use cases while maintaining performance and user experience standards.
