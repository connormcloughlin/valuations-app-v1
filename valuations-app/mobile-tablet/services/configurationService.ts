import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants/apiConfig';
import connectionUtils from '../utils/connectionUtils';
import {
  CategoryConfiguration,
  FieldConfiguration,
  DropdownOption,
  GroupingStrategy,
  LocationTemplate,
  MobileConfigResponse,
  ConfigCacheInfo
} from '../types/dynamicUI';

class ConfigurationService {
  private axiosInstance;
  private cachePrefix = 'dynamic_ui_config_';
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth token interceptor
    this.axiosInstance.interceptors.request.use(async (config) => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
      return config;
    });
  }

  /**
   * Get complete category configuration including fields, grouping strategy, and location template
   */
  async getCategoryConfiguration(categoryId: number, riskTemplateCategoryId?: number): Promise<CategoryConfiguration | null> {
    try {
      console.log(`🔄 ConfigurationService: Fetching configuration for category ${categoryId}`);
      
      // Check cache first
      const cachedConfig = await this.getCachedConfiguration(categoryId);
      if (cachedConfig && !this.isCacheExpired(cachedConfig)) {
        console.log('✅ Using cached category configuration');
        return cachedConfig;
      }

      // Check if we're online
      const isOnline = connectionUtils.isConnected();
      if (!isOnline && cachedConfig) {
        console.log('📱 Offline: Using cached configuration');
        return cachedConfig;
      }

      if (!isOnline) {
        console.log('❌ Offline and no cached configuration available');
        return null;
      }

      let finalRiskTemplateCategoryId = riskTemplateCategoryId;
      let categoryData: any = { riskassessmentcategoryid: categoryId, categoryname: 'Unknown Category' };

      if (!finalRiskTemplateCategoryId) {
        // Step 1: Only fetch category details if riskTemplateCategoryId wasn't provided
        console.log('🔄 Step 1: Fetching category details to get RiskTemplateCategoryID');
        const categoryResponse = await this.axiosInstance.get(`/api/risk-assessment-categories/${categoryId}`);
        
        if (!categoryResponse.data?.success || !categoryResponse.data?.data) {
          console.error('❌ Failed to fetch category details:', categoryResponse.data?.message);
          return cachedConfig; // Return cached if available
        }

        categoryData = categoryResponse.data.data;
        console.log('📝 Category data received:', JSON.stringify(categoryData, null, 2));
        
        // Try different possible field name variations
        finalRiskTemplateCategoryId = categoryData.RiskTemplateCategoryID || 
                                      categoryData.risktemplatecategoryid ||
                                      categoryData.riskTemplateCategoryId ||
                                      categoryData.risk_template_category_id;
        
        if (!finalRiskTemplateCategoryId) {
          console.error('❌ No RiskTemplateCategoryID found in category data');
          console.error('Available fields:', Object.keys(categoryData));
          console.log('Full category data:', JSON.stringify(categoryData, null, 2));
          return cachedConfig; // Return cached if available
        }

        console.log('✅ Step 1 Complete: Found RiskTemplateCategoryID', finalRiskTemplateCategoryId);
      } else {
        console.log('✅ Using provided RiskTemplateCategoryID:', finalRiskTemplateCategoryId);
        console.log('⚡ Skipping duplicate API call - RiskTemplateCategoryID already available');
      }

      // Step 2: Use RiskTemplateCategoryID to fetch dynamic field configuration
      console.log('🔄 Step 2: Fetching dynamic field configuration using RiskTemplateCategoryID');
      
      const endpoint = `/mobile/config/category/${finalRiskTemplateCategoryId}/fields`;
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      
      console.log('🌐 === CONFIGURATION API REQUEST DEBUG ===');
      console.log('🌐 Base URL:', API_BASE_URL);
      console.log('🌐 Endpoint:', endpoint);
      console.log('🌐 Full URL:', fullUrl);
      console.log('🌐 Method: GET');
      console.log('🌐 RiskTemplateCategoryID:', finalRiskTemplateCategoryId);
      console.log('🌐 Original CategoryID:', categoryId);
      console.log('🌐 Headers:', this.axiosInstance.defaults.headers);
      
      const configResponse = await this.axiosInstance.get(endpoint);

      if (!configResponse.data.success || !configResponse.data.data) {
        console.error('❌ Failed to fetch dynamic field configuration:', configResponse.data.message);
        return cachedConfig; // Return cached if available
      }

      const rawConfigData = configResponse.data.data;
      console.log('📝 Raw config data from backend:', JSON.stringify(rawConfigData, null, 2));

      // Map backend field names to UI field names
      const fieldNameMapping: { [key: string]: string } = {
        'Description': 'description',
        'Model': 'model', 
        'Qty': 'quantity',
        'Price': 'price',
        'Location': 'room',
        'Notes': 'notes',
        'HasPhoto': 'photos'
      };

      // Map backend data structure to our expected format
      const mappedFields: FieldConfiguration[] = rawConfigData.fields.map((field: any) => {
        const backendFieldName = field.fieldName || field.fieldLabel || '';
        const uiFieldName = fieldNameMapping[backendFieldName] || backendFieldName.toLowerCase();
        
        console.log(`🔧 Field mapping: "${backendFieldName}" -> "${uiFieldName}"`);
        
        // Use backend field type if provided, with special handling for photos
        let fieldType = field.fieldType || 'text';
        if (uiFieldName === 'photos') {
          fieldType = 'photo'; // Special handling for photo fields
        }
        // If backend doesn't provide fieldType, infer from field name
        else if (!field.fieldType) {
          if (uiFieldName === 'quantity') {
            fieldType = 'number';
          } else if (uiFieldName === 'price') {
            fieldType = 'currency';
          } else if (uiFieldName === 'notes') {
            fieldType = 'textarea';
          }
        }

        return {
          riskfieldid: parseInt(field.riskfieldid) || 0,
          riskTemplateCategoryID: finalRiskTemplateCategoryId,
          item_fields: uiFieldName,
          field_label: field.fieldLabel || field.fieldName || '',
          display_on_ui: 1, // Assume all fields are visible since backend doesn't provide this
          field_type: fieldType,
          is_required: field.isRequired || false,
          placeholder: field.placeholder || '',
          validation_rules: null,
          display_order: field.displayOrder || 0,
          dropdownOptions: field.dropdownOptions || []
        };
      });

      console.log('🔧 Mapped fields:', JSON.stringify(mappedFields, null, 2));
      
      // Debug: Show which fields will be visible
      console.log('🔍 Field visibility check:');
      mappedFields.forEach(field => {
        console.log(`  - Field "${field.item_fields}": ${field.display_on_ui === 1 ? 'VISIBLE' : 'HIDDEN'}`);
      });

      const configData = {
        categoryId: rawConfigData.categoryId,
        categoryName: rawConfigData.categoryName,
        fields: mappedFields,
        groupingStrategy: undefined, // Backend doesn't provide this yet
        locationTemplate: undefined   // Backend doesn't provide this yet
      };
      
      // Process and enhance the configuration
      const categoryConfig: CategoryConfiguration = {
        categoryId: finalRiskTemplateCategoryId, // Use the RiskTemplateCategoryID as the categoryId
        categoryName: configData.categoryName,
        fields: await this.processFields(configData.fields),
        groupingStrategy: configData.groupingStrategy,
        locationTemplate: configData.locationTemplate,
        // Note: Backend doesn't provide complex locationTemplate/groupingStrategy yet
        // parsedLocations and parsedStrategyConfig will be undefined for now
      };

      // Cache the result (use original categoryId for cache key)
      await this.cacheConfiguration(categoryId, categoryConfig);
      
      console.log('✅ Step 2 Complete: Dynamic field configuration fetched and cached successfully');
      return categoryConfig;

    } catch (error: any) {
      console.error('❌ === CONFIGURATION API ERROR DEBUG ===');
      console.error('❌ Error Message:', error.message);
      console.error('❌ Error Status:', error.response?.status);
      console.error('❌ Error Status Text:', error.response?.statusText);
      console.error('❌ Error Response Headers:', error.response?.headers);
      console.error('❌ Error Response Data:', error.response?.data);
      console.error('❌ Error Config URL:', error.config?.url);
      console.error('❌ Error Config Base URL:', error.config?.baseURL);
      console.error('❌ Error Config Method:', error.config?.method);
      console.error('❌ Full Axios Error:', error);
      console.error('❌ === END ERROR DEBUG ===');
      
      // Try to return cached configuration as fallback
      const cachedConfig = await this.getCachedConfiguration(categoryId);
      if (cachedConfig) {
        console.log('🔄 Using cached configuration as fallback');
        return cachedConfig;
      }
      
      return null;
    }
  }

  /**
   * Process fields and enhance field configuration
   */
  private async processFields(fields: FieldConfiguration[]): Promise<FieldConfiguration[]> {
    // No need to fetch dropdown options separately - they're already included in the main API response
    // Just sort fields by display order and return them
    return fields.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  /**
   * Get dropdown options for a specific field
   */
  async getDropdownOptions(fieldId: number): Promise<DropdownOption[]> {
    try {
      const response = await this.axiosInstance.get<MobileConfigResponse<DropdownOption[]>>(
        `/mobile/config/field/${fieldId}/options`
      );

      if (!response.data.success || !response.data.data) {
        return [];
      }

      // Sort options by display order
      return response.data.data.sort((a, b) => a.display_order - b.display_order);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
      return [];
    }
  }

  /**
   * Get all categories and their configurations for a template
   */
  async getTemplateConfiguration(templateId: number): Promise<CategoryConfiguration[]> {
    try {
      const response = await this.axiosInstance.get<MobileConfigResponse<CategoryConfiguration[]>>(
        `/mobile/config/template/${templateId}/categories`
      );

      if (!response.data.success || !response.data.data) {
        return [];
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching template configuration:', error);
      return [];
    }
  }

  /**
   * Cache configuration data
   */
  private async cacheConfiguration(categoryId: number, config: CategoryConfiguration): Promise<void> {
    try {
      const cacheKey = `${this.cachePrefix}${categoryId}`;
      const cacheData = {
        config,
        timestamp: Date.now(),
        expiry: Date.now() + this.cacheExpiry
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching configuration:', error);
    }
  }

  /**
   * Get cached configuration
   */
  private async getCachedConfiguration(categoryId: number): Promise<CategoryConfiguration | null> {
    try {
      const cacheKey = `${this.cachePrefix}${categoryId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) return null;
      
      const parsed = JSON.parse(cachedData);
      return parsed.config;
    } catch (error) {
      console.error('Error reading cached configuration:', error);
      return null;
    }
  }

  /**
   * Check if cache is expired
   */
  private isCacheExpired(config: CategoryConfiguration): boolean {
    // For now, we'll implement a simple time-based expiry
    // In a real implementation, you might want to check cache metadata
    return false; // Placeholder - implement based on your cache strategy
  }

  /**
   * Clear cached configuration
   */
  async clearCache(categoryId?: number): Promise<void> {
    try {
      if (categoryId) {
        const cacheKey = `${this.cachePrefix}${categoryId}`;
        await AsyncStorage.removeItem(cacheKey);
      } else {
        // Clear all configuration cache
        const keys = await AsyncStorage.getAllKeys();
        const configKeys = keys.filter(key => key.startsWith(this.cachePrefix));
        await AsyncStorage.multiRemove(configKeys);
      }
    } catch (error) {
      console.error('Error clearing configuration cache:', error);
    }
  }

  /**
   * Debug method to test the configuration flow
   */
  async debugCategoryConfiguration(categoryId: number): Promise<void> {
    console.log('🔍 === DEBUG: Testing Configuration Flow ===');
    console.log('🔍 Category ID:', categoryId);
    
    try {
      // Step 1: Test category API call
      console.log('🔍 Step 1: Testing category API call...');
      const categoryResponse = await this.axiosInstance.get(`/api/risk-assessment-categories/${categoryId}`);
      
      console.log('🔍 Category API Response Status:', categoryResponse.status);
      console.log('🔍 Category API Response Data:', JSON.stringify(categoryResponse.data, null, 2));
      
      if (categoryResponse.data?.success && categoryResponse.data?.data) {
        const categoryData = categoryResponse.data.data;
        console.log('🔍 Available fields in category data:', Object.keys(categoryData));
        
        // Try to find RiskTemplateCategoryID
        const possibleFields = [
          'RiskTemplateCategoryID',
          'risktemplatecategoryid', 
          'riskTemplateCategoryId',
          'risk_template_category_id'
        ];
        
        console.log('🔍 Searching for RiskTemplateCategoryID field...');
        possibleFields.forEach(field => {
          if (categoryData[field] !== undefined) {
            console.log(`🔍 Found field "${field}":`, categoryData[field]);
          } else {
            console.log(`🔍 Field "${field}": not found`);
          }
        });
        
        const riskTemplateCategoryId = categoryData.RiskTemplateCategoryID || 
                                      categoryData.risktemplatecategoryid ||
                                      categoryData.riskTemplateCategoryId ||
                                      categoryData.risk_template_category_id;
        
        if (riskTemplateCategoryId) {
          console.log('🔍 Step 2: Testing config API call with RiskTemplateCategoryID:', riskTemplateCategoryId);
          try {
            const configResponse = await this.axiosInstance.get(`/mobile/config/category/${riskTemplateCategoryId}/fields`);
            console.log('🔍 Config API Response Status:', configResponse.status);
            console.log('🔍 Config API Response Data:', JSON.stringify(configResponse.data, null, 2));
          } catch (configError: any) {
            console.error('🔍 Config API Error:', configError.message);
            if (configError.response) {
              console.error('🔍 Config API Error Status:', configError.response.status);
              console.error('🔍 Config API Error Data:', configError.response.data);
            }
          }
        }
      }
      
    } catch (error: any) {
      console.error('🔍 Debug Error:', error.message);
      if (error.response) {
        console.error('🔍 Debug Error Status:', error.response.status);
        console.error('🔍 Debug Error Data:', error.response.data);
      }
    }
    
    console.log('🔍 === END DEBUG ===');
  }

  /**
   * Get default configuration as fallback
   */
  getDefaultConfiguration(categoryId: number, categoryName: string): CategoryConfiguration {
    return {
      categoryId,
      categoryName,
      fields: [
        {
          riskfieldid: 0,
          riskTemplateCategoryID: categoryId,
          item_fields: 'description',
          field_label: 'Description',
          display_on_ui: 1,
          field_type: 'text',
          is_required: true,
          display_order: 1,
          placeholder: 'Enter item description'
        },
        {
          riskfieldid: 0,
          riskTemplateCategoryID: categoryId,
          item_fields: 'quantity',
          field_label: 'Quantity',
          display_on_ui: 1,
          field_type: 'number',
          is_required: false,
          display_order: 2,
          placeholder: '1'
        },
        {
          riskfieldid: 0,
          riskTemplateCategoryID: categoryId,
          item_fields: 'price',
          field_label: 'Price (R)',
          display_on_ui: 1,
          field_type: 'number',
          is_required: false,
          display_order: 3,
          placeholder: '0.00'
        },
        {
          riskfieldid: 0,
          riskTemplateCategoryID: categoryId,
          item_fields: 'room',
          field_label: 'Room',
          display_on_ui: 1,
          field_type: 'text',
          is_required: false,
          display_order: 4,
          placeholder: 'Enter room location'
        },
        {
          riskfieldid: 0,
          riskTemplateCategoryID: categoryId,
          item_fields: 'notes',
          field_label: 'Notes',
          display_on_ui: 1,
          field_type: 'textarea',
          is_required: false,
          display_order: 5,
          placeholder: 'Enter any additional notes'
        }
      ]
    };
  }
}

export default new ConfigurationService(); 