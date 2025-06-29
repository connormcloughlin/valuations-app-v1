# Dynamic UI Configuration Design

## Overview
This document outlines a flexible configuration system to dynamically control UI behavior based on Risk Template → Section → Category combinations using your existing table structure. The system supports field visibility, grouping strategies, dropdown options, and custom behaviors.

## Existing Table Structure Analysis

Your current database already has the perfect foundation for this configuration system:

```
Risk_Template (Assessment/Template Types)
├── Risk_Template_Section (Sections within a template)
│   ├── Risk_Template_Category (Categories within a section)
│   │   ├── risk_template_category_type_fields (Field configurations)
│   │   └── Risk_Template_Item (Predefined items/prompts)
```

## Current Tables Review

### 1. Risk_Template (Template/Assessment Types)
```sql
[RiskTemplateID] [int] NOT NULL,
[TemplateName] [varchar](500) NULL,    -- e.g., "Contents Insurance", "Building Insurance"
[Prefix] [varchar](50) NULL            -- e.g., "CI", "BI"
```

### 2. Risk_Template_Section (Sections)
```sql
[RiskTemplateSectionID] [int] NOT NULL,
[RiskTemplateID] [int] NULL,           -- FK to Risk_Template
[SectionName] [varchar](500) NULL,     -- e.g., "Agreed Value Items", "Specified Items"
[Rank] [int] NULL                      -- Display order
```

### 3. Risk_Template_Category (Categories)
```sql
[RiskTemplateCategoryID] [int] NOT NULL,
[RiskTemplateSectionID] [int] NULL,    -- FK to Risk_Template_Section
[CategoryName] [varchar](500) NULL,    -- e.g., "Furniture", "Domestic Appliances"
[Rank] [int] NULL                      -- Display order
```

### 4. risk_template_category_type_fields (Field Configuration)
```sql
[riskfieldid] [bigint] IDENTITY(1,1) NOT NULL,
[RiskTemplateCategoryID] [int] NOT NULL,  -- FK to Risk_Template_Category
[item_fields] [varchar](255) NOT NULL,    -- Field name: 'type', 'description', 'room', etc.
[field_label] [varchar](100) NULL,        -- Display label
[display_on_ui] [int] NOT NULL            -- 1=visible, 0=hidden
```

### 5. Risk_Template_Item (Predefined Items/Templates)
```sql
[RiskTemplateItemID] [int] NOT NULL,
[RiskTemplateCategoryID] [int] NULL,      -- FK to Risk_Template_Category
[ItemPrompt] [varchar](500) NULL,         -- The predefined item type/prompt
[ItemType] [int] NULL,                    -- Type classification
[Rank] [int] NULL,                        -- Display order
[CommaSeparatedList] [varchar](8000) NULL, -- Additional data (could be dropdown options)
[AssessmentRegisterTypeID] [int] NULL     -- Additional classification
```

## Required New Tables

To support the advanced features you want, we need to add these tables:

### 1. Field Type Configuration (NEW)
```sql
CREATE TABLE [dbo].[risk_template_field_types](
    [field_type_id] [bigint] IDENTITY(1,1) NOT NULL,
    [riskfieldid] [bigint] NOT NULL,          -- FK to risk_template_category_type_fields
    [field_type] [varchar](50) NOT NULL,      -- 'text', 'number', 'dropdown', 'textarea', 'location_group'
    [is_required] [bit] DEFAULT 0,
    [placeholder] [varchar](200) NULL,
    [validation_rules] [varchar](max) NULL,   -- JSON string for validation
    [display_order] [int] DEFAULT 0,
 CONSTRAINT [PK_risk_template_field_types] PRIMARY KEY CLUSTERED 
(
    [field_type_id] ASC
)
)
```

### 2. Grouping Strategies (NEW)
```sql
CREATE TABLE [dbo].[risk_template_grouping_strategies](
    [grouping_strategy_id] [bigint] IDENTITY(1,1) NOT NULL,
    [RiskTemplateCategoryID] [int] NOT NULL,     -- FK to Risk_Template_Category
    [strategy_type] [varchar](50) NOT NULL,      -- 'by_type', 'by_location', 'by_brand', 'by_value_range'
    [strategy_config] [varchar](max) NOT NULL,   -- JSON configuration
    [is_active] [bit] DEFAULT 1,
 CONSTRAINT [PK_risk_template_grouping_strategies] PRIMARY KEY CLUSTERED 
(
    [grouping_strategy_id] ASC
)
)
```

### 3. Dropdown Options (NEW)
```sql
CREATE TABLE [dbo].[risk_template_dropdown_options](
    [dropdown_option_id] [bigint] IDENTITY(1,1) NOT NULL,
    [riskfieldid] [bigint] NOT NULL,          -- FK to risk_template_category_type_fields
    [option_value] [varchar](200) NOT NULL,
    [option_label] [varchar](200) NOT NULL,
    [display_order] [int] DEFAULT 0,
    [is_active] [bit] DEFAULT 1,
    [parent_option_id] [bigint] NULL,         -- For hierarchical dropdowns
 CONSTRAINT [PK_risk_template_dropdown_options] PRIMARY KEY CLUSTERED 
(
    [dropdown_option_id] ASC
)
)
```

### 4. Location Templates (NEW)
```sql
CREATE TABLE [dbo].[risk_template_location_templates](
    [location_template_id] [bigint] IDENTITY(1,1) NOT NULL,
    [template_name] [varchar](100) NOT NULL,
    [description] [varchar](500) NULL,
    [locations_json] [varchar](max) NOT NULL,  -- JSON array of locations
    [is_default] [bit] DEFAULT 0,
 CONSTRAINT [PK_risk_template_location_templates] PRIMARY KEY CLUSTERED 
(
    [location_template_id] ASC
)
)
```

### 5. Category Location Mappings (NEW)
```sql
CREATE TABLE [dbo].[risk_template_category_locations](
    [category_location_id] [bigint] IDENTITY(1,1) NOT NULL,
    [RiskTemplateCategoryID] [int] NOT NULL,     -- FK to Risk_Template_Category
    [location_template_id] [bigint] NOT NULL,    -- FK to risk_template_location_templates
 CONSTRAINT [PK_risk_template_category_locations] PRIMARY KEY CLUSTERED 
(
    [category_location_id] ASC
)
)
```

## Configuration Examples Using Your Structure

### Example 1: Furniture with Location Grouping

**1. Set up the category in existing tables:**
```sql
-- Risk_Template
INSERT INTO Risk_Template (RiskTemplateID, TemplateName, Prefix) 
VALUES (1, 'Contents Insurance', 'CI')

-- Risk_Template_Section  
INSERT INTO Risk_Template_Section (RiskTemplateSectionID, RiskTemplateID, SectionName, Rank)
VALUES (101, 1, 'Agreed Value Items', 1)

-- Risk_Template_Category
INSERT INTO Risk_Template_Category (RiskTemplateCategoryID, RiskTemplateSectionID, CategoryName, Rank)
VALUES (1001, 101, 'Furniture', 1)
```

**2. Configure fields:**
```sql
-- Field configurations
INSERT INTO risk_template_category_type_fields (RiskTemplateCategoryID, item_fields, field_label, display_on_ui)
VALUES 
(1001, 'type', 'Furniture Type', 1),
(1001, 'room', 'Room/Location', 1),
(1001, 'description', 'Description', 1),
(1001, 'quantity', 'Quantity', 1),
(1001, 'price', 'Estimated Value', 1)

-- Field types
INSERT INTO risk_template_field_types (riskfieldid, field_type, is_required, placeholder)
VALUES 
(1, 'text', 1, 'e.g., Sofa, Dining Table, Wardrobe'),
(2, 'dropdown', 1, 'Select room'),
(3, 'textarea', 0, 'Detailed description'),
(4, 'number', 0, 'Enter quantity'),
(5, 'number', 0, 'Enter estimated value')
```

**3. Set up location template:**
```sql
-- Location template
INSERT INTO risk_template_location_templates (template_name, description, locations_json)
VALUES ('Standard Home Rooms', 'Standard residential room layout', 
'["Bedroom 1", "Bedroom 2", "Bedroom 3", "Master Bedroom", "Lounge", "Living Room", "Family Room", "Kitchen", "Dining Room", "Study", "Office", "Bathroom 1", "Bathroom 2", "Ensuite", "Garage", "Laundry", "Storage", "Basement", "Attic"]')

-- Link category to location template
INSERT INTO risk_template_category_locations (RiskTemplateCategoryID, location_template_id)
VALUES (1001, 1)
```

**4. Set up grouping strategy:**
```sql
-- Grouping by location
INSERT INTO risk_template_grouping_strategies (RiskTemplateCategoryID, strategy_type, strategy_config)
VALUES (1001, 'by_location', 
'{"primary_group": "room", "secondary_group": "type", "location_template_id": 1, "allow_custom_locations": true, "location_field": "room"}')
```

**5. Add dropdown options for rooms:**
```sql
-- Dropdown options for room field (riskfieldid = 2)
INSERT INTO risk_template_dropdown_options (riskfieldid, option_value, option_label, display_order)
VALUES 
(2, 'bedroom1', 'Bedroom 1', 1),
(2, 'bedroom2', 'Bedroom 2', 2),
(2, 'bedroom3', 'Bedroom 3', 3),
(2, 'master_bedroom', 'Master Bedroom', 4),
(2, 'lounge', 'Lounge', 5),
(2, 'living_room', 'Living Room', 6),
(2, 'kitchen', 'Kitchen', 7),
(2, 'dining_room', 'Dining Room', 8)
```

### Example 2: Domestic Appliances with Brand Dropdown

**1. Set up category:**
```sql
INSERT INTO Risk_Template_Category (RiskTemplateCategoryID, RiskTemplateSectionID, CategoryName, Rank)
VALUES (1002, 101, 'Domestic Appliances', 2)
```

**2. Configure fields:**
```sql
INSERT INTO risk_template_category_type_fields (RiskTemplateCategoryID, item_fields, field_label, display_on_ui)
VALUES 
(1002, 'type', 'Appliance Type', 1),
(1002, 'make', 'Brand/Make', 1),
(1002, 'model', 'Model', 1),
(1002, 'room', 'Location', 1),
(1002, 'price', 'Estimated Value', 1)

-- Field types
INSERT INTO risk_template_field_types (riskfieldid, field_type, is_required)
VALUES 
(6, 'dropdown', 1),  -- type
(7, 'dropdown', 1),  -- make  
(8, 'text', 0),      -- model
(9, 'dropdown', 0),  -- room
(10, 'number', 0)    -- price
```

**3. Add appliance type dropdown:**
```sql
INSERT INTO risk_template_dropdown_options (riskfieldid, option_value, option_label, display_order)
VALUES 
(6, 'refrigerator', 'Refrigerator', 1),
(6, 'washing_machine', 'Washing Machine', 2),
(6, 'dishwasher', 'Dishwasher', 3),
(6, 'oven', 'Oven', 4),
(6, 'microwave', 'Microwave', 5),
(6, 'dryer', 'Clothes Dryer', 6)
```

**4. Add brand dropdown:**
```sql
INSERT INTO risk_template_dropdown_options (riskfieldid, option_value, option_label, display_order)
VALUES 
(7, 'samsung', 'Samsung', 1),
(7, 'lg', 'LG', 2),
(7, 'whirlpool', 'Whirlpool', 3),
(7, 'bosch', 'Bosch', 4),
(7, 'miele', 'Miele', 5),
(7, 'electrolux', 'Electrolux', 6),
(7, 'fisher_paykel', 'Fisher & Paykel', 7)
```

## API Queries to Get Configuration

### 1. Get Complete Configuration for a Category
```sql
-- Get all field configurations for a category
SELECT 
    rtc.CategoryName,
    rtctf.item_fields,
    rtctf.field_label,
    rtctf.display_on_ui,
    rtft.field_type,
    rtft.is_required,
    rtft.placeholder,
    rtft.validation_rules,
    rtft.display_order
FROM Risk_Template_Category rtc
JOIN risk_template_category_type_fields rtctf ON rtc.RiskTemplateCategoryID = rtctf.RiskTemplateCategoryID
LEFT JOIN risk_template_field_types rtft ON rtctf.riskfieldid = rtft.riskfieldid
WHERE rtc.RiskTemplateCategoryID = @CategoryID
AND rtctf.display_on_ui = 1
ORDER BY rtft.display_order
```

### 2. Get Dropdown Options for Fields
```sql
-- Get dropdown options for a specific field
SELECT 
    rtdo.option_value,
    rtdo.option_label,
    rtdo.display_order,
    rtdo.parent_option_id
FROM risk_template_dropdown_options rtdo
JOIN risk_template_category_type_fields rtctf ON rtdo.riskfieldid = rtctf.riskfieldid
WHERE rtctf.RiskTemplateCategoryID = @CategoryID
AND rtctf.item_fields = @FieldName
AND rtdo.is_active = 1
ORDER BY rtdo.display_order
```

### 3. Get Grouping Strategy
```sql
-- Get grouping strategy for a category
SELECT 
    strategy_type,
    strategy_config
FROM risk_template_grouping_strategies
WHERE RiskTemplateCategoryID = @CategoryID
AND is_active = 1
```

### 4. Get Location Template
```sql
-- Get location template for a category
SELECT 
    rtlt.template_name,
    rtlt.locations_json
FROM risk_template_location_templates rtlt
JOIN risk_template_category_locations rtcl ON rtlt.location_template_id = rtcl.location_template_id
WHERE rtcl.RiskTemplateCategoryID = @CategoryID
```

## Mobile App Implementation

### 1. Configuration Service
```typescript
export interface FieldConfiguration {
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'dropdown' | 'textarea' | 'location_group';
  isRequired: boolean;
  isVisible: boolean;
  placeholder?: string;
  validationRules?: any;
  displayOrder: number;
  dropdownOptions?: DropdownOption[];
}

export interface DropdownOption {
  value: string;
  label: string;
  displayOrder: number;
  parentOptionId?: number;
}

export interface GroupingStrategy {
  strategyType: 'by_type' | 'by_location' | 'by_brand' | 'by_value_range';
  config: any;
}

export interface CategoryConfiguration {
  categoryId: number;
  categoryName: string;
  fields: FieldConfiguration[];
  groupingStrategy?: GroupingStrategy;
  locationTemplate?: string[];
}

export class ConfigurationService {
  async getCategoryConfiguration(categoryId: number): Promise<CategoryConfiguration> {
    // Call your API to get configuration
    const response = await fetch(`/api/category-configuration/${categoryId}`);
    return response.json();
  }
}
```

### 2. Dynamic Field Renderer
```typescript
export function DynamicFieldRenderer({ 
  field, 
  value, 
  onChange 
}: {
  field: FieldConfiguration;
  value: any;
  onChange: (fieldName: string, value: any) => void;
}) {
  switch (field.fieldType) {
    case 'dropdown':
      return (
        <DropdownField
          label={field.fieldLabel}
          options={field.dropdownOptions || []}
          value={value}
          onChange={(val) => onChange(field.fieldName, val)}
          placeholder={field.placeholder}
          required={field.isRequired}
        />
      );
    
    case 'textarea':
      return (
        <TextAreaField
          label={field.fieldLabel}
          value={value}
          onChange={(val) => onChange(field.fieldName, val)}
          placeholder={field.placeholder}
          required={field.isRequired}
        />
      );
    
    case 'number':
      return (
        <NumberField
          label={field.fieldLabel}
          value={value}
          onChange={(val) => onChange(field.fieldName, val)}
          placeholder={field.placeholder}
          required={field.isRequired}
        />
      );
    
    case 'location_group':
      return (
        <LocationGroupField
          label={field.fieldLabel}
          value={value}
          onChange={(val) => onChange(field.fieldName, val)}
          locations={field.dropdownOptions?.map(o => o.label) || []}
          required={field.isRequired}
        />
      );
    
    default: // 'text'
      return (
        <TextField
          label={field.fieldLabel}
          value={value}
          onChange={(val) => onChange(field.fieldName, val)}
          placeholder={field.placeholder}
          required={field.isRequired}
        />
      );
  }
}
```

## Web Frontend Configuration Pages

### 1. Category Field Configuration
```typescript
// Page: /admin/categories/{categoryId}/fields
export function CategoryFieldConfiguration({ categoryId }: { categoryId: number }) {
  const [fields, setFields] = useState<FieldConfiguration[]>([]);
  
  const addField = () => {
    // Add new field configuration
  };
  
  const updateField = (fieldId: number, updates: Partial<FieldConfiguration>) => {
    // Update field configuration
  };
  
  const toggleFieldVisibility = (fieldId: number) => {
    // Toggle display_on_ui in database
  };
  
  return (
    <div>
      <h2>Configure Fields for Category</h2>
      {fields.map(field => (
        <FieldConfigurationRow 
          key={field.fieldName}
          field={field}
          onUpdate={(updates) => updateField(field.fieldName, updates)}
          onToggleVisibility={() => toggleFieldVisibility(field.fieldName)}
        />
      ))}
      <button onClick={addField}>Add New Field</button>
    </div>
  );
}
```

### 2. Dropdown Options Management
```typescript
// Page: /admin/categories/{categoryId}/dropdowns
export function DropdownOptionsManager({ categoryId }: { categoryId: number }) {
  const [fields, setFields] = useState<FieldConfiguration[]>([]);
  
  return (
    <div>
      <h2>Manage Dropdown Options</h2>
      {fields.filter(f => f.fieldType === 'dropdown').map(field => (
        <DropdownFieldEditor 
          key={field.fieldName}
          field={field}
          onUpdateOptions={(options) => updateDropdownOptions(field.fieldName, options)}
        />
      ))}
    </div>
  );
}
```

## Migration Strategy

### Phase 1: Basic Field Configuration (Week 1-2)
1. Create the new tables
2. Migrate existing `risk_template_category_type_fields` data
3. Add basic field type support (text, number, textarea)
4. Implement field visibility/invisibility

### Phase 2: Dropdown Support (Week 3-4)
1. Implement dropdown field type
2. Create dropdown options management UI
3. Add hierarchical dropdown support

### Phase 3: Location Grouping (Week 5-6)
1. Implement location templates
2. Add location-based grouping strategy
3. Create location template management UI

### Phase 4: Advanced Features (Week 7-8)
1. Add value-range grouping
2. Implement conditional field visibility
3. Add validation rules support

## Benefits of This Approach

1. **Uses Existing Structure**: Builds on your current table design
2. **Minimal Changes**: Only adds new tables, doesn't modify existing ones
3. **Backwards Compatible**: Existing data continues to work
4. **Scalable**: Easy to add new field types and grouping strategies
5. **Configurable**: Complete control via web frontend
6. **Performance**: Can cache configurations locally in mobile app

This design leverages your existing Risk Template structure while adding the flexibility you need for dynamic UI configuration.
