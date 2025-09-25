import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/apiConfig';
import connectionUtils from '../utils/connectionUtils';
import transportClient from '../core/transport/transportClient';
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
  private cachePrefix = 'dynamic_ui_config_';
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor() {
    // No longer need axios instance - using transportClient instead
  }

  /**
   * Get complete category configuration including fields, grouping strategy, and location template
   * Now uses prefetched all category configurations for better performance
   */
  async getCategoryConfiguration(categoryId: number, riskTemplateCategoryId?: number): Promise<CategoryConfiguration | null> {
    try {
      console.log(`🔄 ConfigurationService: Fetching complete configuration for category ${categoryId}`);
      
      // First, try to get from SQLite (app startup loaded data)
      const prefetchService = await import('./prefetchService');
      
      // Safety check: ensure category configurations are loaded
      await prefetchService.default.ensureCategoryConfigurationsLoaded();
      
      const sqliteConfig = await prefetchService.default.getCategoryConfigurationByIdFromSQLite(categoryId);
      
      if (sqliteConfig) {
        console.log('✅ Using SQLite category configuration (loaded on app startup)');
        return this.convertPrefetchedConfigToCategoryConfiguration(sqliteConfig);
      }
      
      // Fallback to cache - this includes pre-cached data from order endpoint
      const cachedConfig = await this.getCachedConfiguration(categoryId);
      if (cachedConfig && !this.isCacheExpired(cachedConfig)) {
        console.log('✅ Using cached category configuration (includes pre-cached data from order endpoint)');
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

      // If we have cached config but it's expired, we should still use it as fallback
      // and only make API calls if absolutely necessary
      if (cachedConfig) {
        console.log('⚠️ Using expired cached configuration as fallback');
        return cachedConfig;
      }

      // Only proceed with individual API calls if we have no cached data at all
      console.log('🔄 No cached data available, proceeding with individual API calls');
      
      let finalRiskTemplateCategoryId = riskTemplateCategoryId;

      if (!finalRiskTemplateCategoryId) {
        // Step 1: Only fetch category details if riskTemplateCategoryId wasn't provided
        console.log('🔄 Step 1: Fetching category details to get RiskTemplateCategoryID');
        
        // Call debug method to get detailed information
        await this.debugCategoryConfiguration(categoryId);
        
        // Use transport client with JWT authentication
        const categoryResponse = await transportClient.get('config.category-details', `/risk-assessment-categories/${categoryId}`);
        
        // Transport client returns data directly
        console.log('🔍 Raw category response data:', JSON.stringify(categoryResponse, null, 2));
        
        // Check if response has success/data wrapper or is direct data
        const hasSuccessWrapper = categoryResponse?.success !== undefined;
        const hasDataWrapper = categoryResponse?.data !== undefined;
        
        console.log('🔍 Has success wrapper:', hasSuccessWrapper);
        console.log('🔍 Has data wrapper:', hasDataWrapper);
        
        let categoryData;
        if (hasSuccessWrapper && hasDataWrapper) {
          // API returns { success: true, data: {...} }
          if (!categoryResponse.success || !categoryResponse.data) {
            console.error('❌ Failed to fetch category details:', categoryResponse?.message);
            return null;
          }
          categoryData = categoryResponse.data;
        } else {
          // API returns data directly
          if (!categoryResponse) {
            console.error('❌ Failed to fetch category details: No data received');
            return null;
          }
          categoryData = categoryResponse;
        }
        console.log('📝 Category data received:', JSON.stringify(categoryData, null, 2));
        
        // Try different possible field name variations
        finalRiskTemplateCategoryId = categoryData.RiskTemplateCategoryID || 
                                      categoryData.risktemplatecategoryid ||
                                      categoryData.riskTemplateCategoryId ||
                                      categoryData.risk_template_category_id;
        
        if (!finalRiskTemplateCategoryId) {
          console.error('❌ No RiskTemplateCategoryID found in category data');
          console.error('Available fields:', Object.keys(categoryData));
          return null;
        }

        console.log('✅ Step 1 Complete: Found RiskTemplateCategoryID', finalRiskTemplateCategoryId);
      } else {
        console.log('✅ Using provided RiskTemplateCategoryID:', finalRiskTemplateCategoryId);
        console.log('⚡ Skipping duplicate API call - RiskTemplateCategoryID already available');
      }

      // Step 2: Use new composite endpoint to fetch complete configuration
      console.log('🔄 Step 2: Fetching complete configuration using composite endpoint');
      
      const endpoint = `/mobile/config/category/${finalRiskTemplateCategoryId}/complete`;
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      
      console.log('🌐 === COMPOSITE API REQUEST DEBUG ===');
      console.log('🌐 Base URL:', API_BASE_URL);
      console.log('🌐 Endpoint:', endpoint);
      console.log('🌐 Full URL:', fullUrl);
      console.log('🌐 Method: GET');
      console.log('🌐 RiskTemplateCategoryID:', finalRiskTemplateCategoryId);
      console.log('🌐 Original CategoryID:', categoryId);
      
      const configResponse = await transportClient.get('config.category-complete', endpoint);

      // Transport client returns data directly
      if (!configResponse.success || !configResponse.data) {
        console.error('❌ Failed to fetch complete configuration:', configResponse.message);
        return null;
      }

      const completeConfig = configResponse.data;
      console.log('📝 Complete config data from backend:', JSON.stringify(completeConfig, null, 2));

      // Map backend field names to UI field names
      const fieldNameMapping: { [key: string]: string } = {
        'Description': 'description',
        'Model': 'model', 
        'Qty': 'quantity',
        'Price': 'price',
        'Location': 'room',
        'Notes': 'notes',
        'HasPhoto': 'photos',
        'ItemPrompt': 'type'
      };

      // Map backend data structure to our expected format
      const mappedFields: FieldConfiguration[] = completeConfig.fields.map((field: any) => {
        const backendFieldName = field.fieldName || field.fieldLabel || '';
        const uiFieldName = fieldNameMapping[backendFieldName] || backendFieldName.toLowerCase();
        
        console.log(`🔧 Field mapping: "${backendFieldName}" -> "${uiFieldName}"`);
        
        // Use backend field type if provided, with special handling for photos
        let fieldType = field.fieldType || 'text';
        console.log(`🔧 Field "${backendFieldName}": Backend fieldType="${field.fieldType}"`);
        
        if (uiFieldName === 'photos') {
          fieldType = 'photo'; // Special handling for photo fields
          console.log(`🔧 Field "${backendFieldName}": Overriding to "photo" for photos field`);
        }
        // If backend doesn't provide fieldType, infer from field name
        else if (!field.fieldType) {
          console.log(`🔧 Field "${backendFieldName}": No fieldType from backend, inferring...`);
          if (uiFieldName === 'quantity') {
            fieldType = 'number';
          } else if (uiFieldName === 'price') {
            fieldType = 'currency';
          } else if (uiFieldName === 'notes') {
            fieldType = 'textarea';
          }
        }
        
        console.log(`🔧 Field "${backendFieldName}": Final fieldType="${fieldType}"`);
        console.log(`🔧 Field "${backendFieldName}": Has dropdownOptions=${field.dropdownOptions ? field.dropdownOptions.length : 0} options`);
        console.log(`🔧 Field "${backendFieldName}": isVisible=${field.isVisible}`);
        console.log('🔧 Raw field from backend:', JSON.stringify(field, null, 2));

        return {
          riskfieldid: parseInt(field.riskfieldid) || 0,
          riskTemplateCategoryID: finalRiskTemplateCategoryId,
          item_fields: uiFieldName,
          field_label: field.fieldLabel || field.fieldName || '',
          display_on_ui: field.isVisible ? 1 : 0, // Use isVisible from new API
          field_type: fieldType,
          is_required: field.isRequired || false,
          placeholder: field.placeholder || '',
          validation_rules: field.validationRules || null,
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

      // Process grouping strategy from the new API response
      const groupingStrategy = completeConfig.groupingStrategy ? {
        grouping_strategy_id: completeConfig.groupingStrategy.grouping_strategy_id,
        RiskTemplateCategoryID: finalRiskTemplateCategoryId,
        strategy_type: completeConfig.groupingStrategy.strategy_type,
        strategy_name: completeConfig.groupingStrategy.strategy_name,
        strategy_config: completeConfig.groupingStrategy.strategy_config, // Keep as object - no need to stringify
        is_active: completeConfig.groupingStrategy.is_active,
        display_order: completeConfig.groupingStrategy.display_order
      } : undefined;
      
      // Process and enhance the configuration
      const categoryConfig: CategoryConfiguration = {
        categoryId: finalRiskTemplateCategoryId, // Use the RiskTemplateCategoryID as the categoryId
        categoryName: completeConfig.category.categoryName,
        fields: await this.processFields(mappedFields),
        groupingStrategy: groupingStrategy,
        locationTemplate: undefined, // TODO: Process locationTemplates when needed
        // Parse the strategy config for easier use
        parsedStrategyConfig: completeConfig.groupingStrategy?.strategy_config
      };

      // Cache the result (use original categoryId for cache key)
      await this.cacheConfiguration(categoryId, categoryConfig);
      
      console.log('✅ Step 2 Complete: Complete configuration fetched and cached successfully');
      console.log('📊 Configuration summary:', completeConfig.summary);
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
      const response = await transportClient.get('config.field-options', `/mobile/config/field/${fieldId}/options`);

      // Transport client returns data directly
      if (!response.success || !response.data) {
        return [];
      }

      // Sort options by display order
      return response.data.sort((a: any, b: any) => a.display_order - b.display_order);
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
      const response = await transportClient.get('config.template-categories', `/mobile/config/template/${templateId}/categories`);

      // Transport client returns data directly
      if (!response.success || !response.data) {
        return [];
      }

      return response.data;
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
      
      // Handle new cache format from order endpoint pre-loading
      if (parsed.data) {
        console.log(`📦 Found pre-cached configuration for category ${categoryId} from order endpoint`);
        const categoryConfig = parsed.data;
        
        // Convert the order endpoint format to our expected CategoryConfiguration format
        return {
          categoryId: categoryConfig.category?.categoryId || categoryId,
          categoryName: categoryConfig.category?.categoryName || 'Unknown Category',
          fields: categoryConfig.fields || [],
          groupingStrategy: categoryConfig.groupingStrategy || null,
          locationTemplate: categoryConfig.locationTemplate || null
        };
      }
      
      // Handle old cache format
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
   * Cache field configurations from order endpoint
   */
  async cacheOrderFieldConfigurations(orderId: string, configData: any): Promise<void> {
    try {
      console.log(`🚀 Caching field configurations for order ${orderId}`);
      
      if (!configData?.categories) {
        console.log('❌ No categories data to cache');
        return;
      }
      
      // Cache each category's configuration individually for fast lookup
      for (const categoryConfig of configData.categories) {
        const categoryId = categoryConfig.category?.categoryId;
        if (categoryId) {
          const cacheKey = `${this.cachePrefix}${categoryId}`;
          const cacheData = {
            data: categoryConfig,
            timestamp: Date.now(),
            orderId: orderId
          };
          
          await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
          console.log(`📦 Cached config for category ${categoryId}`);
        }
      }
      
      console.log(`✅ Successfully cached configurations for ${configData.categories.length} categories`);
    } catch (error) {
      console.error('❌ Error caching field configurations:', error);
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
      const categoryResponse = await transportClient.get('config.category-details', `/risk-assessment-categories/${categoryId}`);
      
      // Transport client returns data directly
      console.log('🔍 Category API Response Data:', JSON.stringify(categoryResponse, null, 2));
      
      // Check if response has success/data wrapper or is direct data
      const hasSuccessWrapper = categoryResponse?.success !== undefined;
      const hasDataWrapper = categoryResponse?.data !== undefined;
      
      console.log('🔍 Has success wrapper:', hasSuccessWrapper);
      console.log('🔍 Has data wrapper:', hasDataWrapper);
      
      let categoryData;
      if (hasSuccessWrapper && hasDataWrapper) {
        // API returns { success: true, data: {...} }
        if (!categoryResponse.success || !categoryResponse.data) {
          console.log('🔍 API returned success=false or no data');
          return;
        }
        categoryData = categoryResponse.data;
      } else {
        // API returns data directly
        if (!categoryResponse) {
          console.log('🔍 API returned no data');
          return;
        }
        categoryData = categoryResponse;
      }
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
            const configResponse = await transportClient.get('config.category-fields', `/mobile/config/category/${riskTemplateCategoryId}/fields`);
            // Transport client returns data directly
            console.log('🔍 Config API Response Data:', JSON.stringify(configResponse, null, 2));
          } catch (configError: any) {
            console.error('🔍 Config API Error:', configError.message);
            if (configError.response) {
              console.error('🔍 Config API Error Status:', configError.response.status);
              console.error('🔍 Config API Error Data:', configError.response.data);
            }
          }
        } else {
          console.log('🔍 No RiskTemplateCategoryID found in category data');
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
   * Convert prefetched category configuration to CategoryConfiguration format
   */
  private convertPrefetchedConfigToCategoryConfiguration(prefetchedConfig: any): CategoryConfiguration {
    try {
      const category = prefetchedConfig.category;
      const fields = prefetchedConfig.fields || [];
      
      // Map backend field names to UI field names
      const fieldNameMapping: { [key: string]: string } = {
        'Description': 'description',
        'Model': 'model', 
        'Qty': 'quantity',
        'Price': 'price',
        'Location': 'room',
        'Notes': 'notes',
        'HasPhoto': 'photos',
        'ItemPrompt': 'type'
      };

      // Map backend data structure to our expected format
      const mappedFields: FieldConfiguration[] = fields.map((field: any) => {
        const backendFieldName = field.fieldName || field.fieldLabel || '';
        const uiFieldName = fieldNameMapping[backendFieldName] || backendFieldName.toLowerCase();
        
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
          riskTemplateCategoryID: category.categoryId,
          item_fields: uiFieldName,
          field_label: field.fieldLabel || field.fieldName || '',
          display_on_ui: field.isVisible ? 1 : 0,
          field_type: fieldType,
          is_required: field.isRequired || false,
          placeholder: field.placeholder || '',
          validation_rules: field.validationRules || null,
          display_order: field.displayOrder || 0,
          dropdownOptions: field.dropdownOptions || []
        };
      });

      // Process grouping strategy from the prefetched config
      const groupingStrategy = prefetchedConfig.groupingStrategy ? {
        grouping_strategy_id: prefetchedConfig.groupingStrategy.grouping_strategy_id,
        RiskTemplateCategoryID: category.categoryId,
        strategy_type: prefetchedConfig.groupingStrategy.strategy_type,
        strategy_name: prefetchedConfig.groupingStrategy.strategy_name,
        strategy_config: prefetchedConfig.groupingStrategy.strategy_config,
        is_active: prefetchedConfig.groupingStrategy.is_active,
        display_order: prefetchedConfig.groupingStrategy.display_order
      } : undefined;

      return {
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        fields: mappedFields.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
        groupingStrategy: groupingStrategy,
        locationTemplate: prefetchedConfig.locationTemplates?.[0] || undefined,
        parsedStrategyConfig: prefetchedConfig.groupingStrategy?.strategy_config
      };
    } catch (error) {
      console.error('Error converting prefetched config to CategoryConfiguration:', error);
      return this.getDefaultConfiguration(prefetchedConfig.category?.categoryId || 0, prefetchedConfig.category?.categoryName || 'Unknown');
    }
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