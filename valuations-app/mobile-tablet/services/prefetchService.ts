import api from '../api';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/apiConfig';
import {
  insertRiskAssessmentItem,
  batchInsertRiskAssessmentItems,
  getAllRiskAssessmentItems,
  RiskAssessmentItem,
  waitForDatabase,
  isDatabaseReady
} from '../utils/db';
import offlineStorage from '../utils/offlineStorage';

// Types
interface PrefetchTask {
  id: string;
  type: 'category' | 'section' | 'template';
  categoryId?: string;
  sectionId?: string;
  assessmentId?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed';
  categoryData?: any; // Added for composite API data
}

interface PrefetchProgress {
  total: number;
  completed: number;
  failed: number;
  isActive: boolean;
  currentTask?: string;
}

interface PrefetchStats {
  appointmentId: string;
  totalCategories: number;
  completedCategories: number;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed';
}

// Event system for progress updates
type PrefetchEventListener = (progress: PrefetchProgress) => void;
type CategoryCompletedListener = (categoryId: string) => void;

class PrefetchService {
  private isActive = false;
  private queue: PrefetchTask[] = [];
  private currentStats: PrefetchStats | null = null;
  private progressListeners: PrefetchEventListener[] = [];
  private categoryListeners: CategoryCompletedListener[] = [];
  private abortController: AbortController | null = null;
  private completeHierarchyData: any | null = null; // Added for composite API data

  // Event subscription methods
  onProgress(listener: PrefetchEventListener): () => void {
    this.progressListeners.push(listener);
    return () => {
      this.progressListeners = this.progressListeners.filter(l => l !== listener);
    };
  }

  onCategoryCompleted(listener: CategoryCompletedListener): () => void {
    this.categoryListeners.push(listener);
    return () => {
      this.categoryListeners = this.categoryListeners.filter(l => l !== listener);
    };
  }

  // Emit progress updates
  private emitProgress() {
    if (!this.currentStats) return;
    
    const progress: PrefetchProgress = {
      total: this.queue.length,
      completed: this.queue.filter(t => t.status === 'completed').length,
      failed: this.queue.filter(t => t.status === 'failed').length,
      isActive: this.isActive,
      currentTask: this.queue.find(t => t.status === 'running')?.id
    };

    this.progressListeners.forEach(listener => listener(progress));
  }

  private emitCategoryCompleted(categoryId: string) {
    this.categoryListeners.forEach(listener => listener(categoryId));
  }

  // Main prefetch method for appointments
  async startAppointmentPrefetch(appointmentId: string, orderNumber?: string): Promise<boolean> {
    console.log(`🚀 PREFETCH SERVICE - Starting prefetch for appointment ${appointmentId}, order ${orderNumber}`);

    // Check if we're already running a prefetch for this appointment
    if (this.isActive && this.currentStats?.appointmentId === appointmentId) {
      console.log(`⏳ Prefetch already running for appointment ${appointmentId}`);
      return true;
    }

    if (this.isActive) {
      console.log('Prefetch already in progress, aborting previous and starting new');
      this.stopPrefetch();
    }

    console.log(`🚀 Starting prefetch for appointment: ${appointmentId}`);
    
    // Check if we already have data for this appointment BEFORE making any API calls
    const cachedData = await this.checkPrefetchedData(appointmentId);
    console.log(`🔍 PREFETCH SERVICE - checkPrefetchedData returned: ${cachedData} for appointment ${appointmentId}`);
    if (cachedData) {
      // Check if existing data has null category IDs (from old incorrect mapping)
      const { getAllRiskAssessmentItems } = await import('../utils/db');
      const existingItems = await getAllRiskAssessmentItems();
      const nullCategoryItems = existingItems.filter(item => 
        item.riskassessmentcategoryid === null &&
        String(item.appointmentid) === String(appointmentId)
      );

      if (nullCategoryItems.length > 0) {
        console.log(`⚠️ PREFETCH SERVICE - Found ${nullCategoryItems.length} items with null category IDs, forcing re-prefetch`);
        // Continue with prefetch to fix the data
      } else {
        console.log(`✅ PREFETCH SERVICE - Data already prefetched for appointment ${appointmentId} - skipping prefetch`);
        return true;
      }
    }
    
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('❌ No network connection, skipping prefetch');
      return false;
    }

    this.isActive = true;
    this.abortController = new AbortController();
    this.currentStats = {
      appointmentId,
      totalCategories: 0,
      completedCategories: 0,
      startTime: Date.now(),
      status: 'running'
    };

    try {
      // Build prefetch queue based on appointment data
      const success = await this.buildPrefetchQueue(appointmentId, orderNumber);
      if (!success) {
        console.log('❌ Failed to build prefetch queue');
        this.cleanup();
        return false;
      }

      // If queue is empty after building, we're done
      if (this.queue.length === 0) {
        console.log('✅ No items to prefetch - all data already cached');
        this.completePrefetch();
        return true;
      }

      // Start processing queue in background
      this.processQueueInBackground();
      return true;

    } catch (error) {
      console.error('❌ Error starting prefetch:', error);
      this.cleanup();
      return false;
    }
  }

  // Check if data is already prefetched
  private async checkPrefetchedData(appointmentId: string): Promise<boolean> {
    try {
      console.log(`🔍 PREFETCH SERVICE - Checking if data already exists for appointment ${appointmentId}`);
      
      // First check SQLite for risk assessment items specific to this appointment
      const db = await waitForDatabase();
      const results = await db.getAllAsync(
        'SELECT COUNT(*) as count FROM risk_assessment_items WHERE appointmentid = ?',
        [appointmentId]
      );
      
      console.log(`🔍 PREFETCH SERVICE - SQLite query results:`, results);
      
      if (results && results.length > 0 && typeof results[0] === 'object' && results[0] !== null && 'count' in results[0]) {
        const count = (results[0] as { count: number }).count;
        console.log(`🔍 PREFETCH SERVICE - Found ${count} items in SQLite for appointment ${appointmentId}`);
        if (count > 0) {
          console.log(`✅ PREFETCH SERVICE - Data already exists, skipping prefetch`);
          return true;
        } else {
          console.log(`❌ PREFETCH SERVICE - No items found in SQLite for appointment ${appointmentId}`);
        }
      } else {
        console.log(`❌ PREFETCH SERVICE - Invalid SQLite query results for appointment ${appointmentId}`);
      }

      // If no items in SQLite, check AsyncStorage as fallback
      const cachedCategories = await AsyncStorage.getItem(`assessment_categories_${appointmentId}`);
      const cachedSections = await AsyncStorage.getItem(`assessment_sections_${appointmentId}`);
      const cachedTemplates = await AsyncStorage.getItem(`assessment_templates_${appointmentId}`);

      if (cachedCategories || cachedSections || cachedTemplates) {
        console.log(`✅ Found cached data in AsyncStorage for appointment ${appointmentId}`);
        return true;
      }

      console.log(`❌ No prefetched data found for appointment ${appointmentId}`);
      return false;
    } catch (error) {
      console.error('Error checking prefetched data:', error);
      return false;
    }
  }

  // Build prefetch queue based on appointment/order data
  private async buildPrefetchQueue(appointmentId: string, orderNumber?: string): Promise<boolean> {
    try {
      console.log(`📋 Building prefetch queue for appointment ${appointmentId}`);
      
      if (!orderNumber) {
        console.log('❌ No order number available for composite API call');
        return false;
      }

      // Use composite hierarchy API instead of individual calls
      console.log(`🚀 Using composite hierarchy API for order: ${orderNumber}`);
      
            // Use the configured API client instead of manual fetch with JWT
      const apiClient = await import('../api/client');
      
      try {
        // Only fetch hierarchy - field configurations come from prefetched all categories
        const hierarchyResponse = await apiClient.default.get(`/mobile/risk-assessment/${orderNumber}/complete-hierarchy`);
        
        console.log(`📡 COMPOSITE API - Response status: ${hierarchyResponse.status}`);
        console.log(`📡 FIELD CONFIG - Using prefetched all category configurations (no order-specific call)`);
        
        // Handle authentication errors
        if (hierarchyResponse.status === 401 || hierarchyResponse.status === 403) {
          console.log(`❌ COMPOSITE API - Authentication required, skipping...`);
          return false;
        }
        
        if (hierarchyResponse.status !== 200) {
          console.log(`❌ COMPOSITE API - Failed with status ${hierarchyResponse.status}`);
          return false;
        }
        
        const hierarchyData = hierarchyResponse.data;
      
      const mastersCount = hierarchyData?.data?.assessmentMasters?.length || 0;
      console.log(`📦 COMPOSITE API - Found ${mastersCount} assessment masters`);
      
      // Check if we have prefetched all category configurations
      const allCategoryConfigs = await this.getAllCategoryConfigurations();
      if (allCategoryConfigs) {
        console.log(`📦 FIELD CONFIG - Using prefetched all category configurations (${allCategoryConfigs.categories.length} categories)`);
      } else {
        console.log(`⚠️ FIELD CONFIG - No prefetched all category configurations found, will use individual calls as fallback`);
      }
      
      if (!hierarchyData?.success || !hierarchyData?.data?.assessmentMasters) {
        console.log('❌ COMPOSITE API - Invalid response format or no assessment masters');
        return false;
      }

      // Process the composite response and build tasks
      const assessmentMasters = hierarchyData.data.assessmentMasters;
      console.log(`✅ COMPOSITE API - Processing ${assessmentMasters.length} assessment masters`);
      
      // Store the complete hierarchy data for processing
      this.completeHierarchyData = hierarchyData.data;
      
      // Debug: Log sample category structure
      if (assessmentMasters.length > 0 && assessmentMasters[0].sections && assessmentMasters[0].sections.length > 0) {
        const firstSection = assessmentMasters[0].sections[0];
        if (firstSection.categories && firstSection.categories.length > 0) {
          console.log(`🔍 PREFETCH - Sample category structure:`, firstSection.categories[0]);
        }
      }
      
      for (const master of assessmentMasters) {
        if (!master.sections) {
          continue;
        }
        
        for (const section of master.sections) {
          if (!section.categories) {
            continue;
          }
          
          for (const category of section.categories) {
            const categoryId = category.riskAssessmentCategoryId;
            
    // Skip categories without valid IDs
    if (!categoryId) {
      console.log(`⚠️ PREFETCH - Skipping category without valid ID:`, {
        riskAssessmentCategoryId: category.riskAssessmentCategoryId,
        categoryName: category.categoryName
      });
      continue;
    }
            
            const priority = this.getCategoryPriority(category, master.assessmenttypename || master.templateName);
            
            const task: PrefetchTask = {
              id: `category-${categoryId}`,
              type: 'category',
              categoryId: String(categoryId),
              priority,
              status: 'pending',
              // Store the category data from composite API
              categoryData: category
            };

            this.queue.push(task);
          }
        }
      }

      // Sort queue by priority
      this.queue.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      console.log(`✅ Built prefetch queue with ${this.queue.length} tasks from composite API`);
      console.log(`Priority breakdown:`, {
        high: this.queue.filter(t => t.priority === 'high').length,
        medium: this.queue.filter(t => t.priority === 'medium').length,
        low: this.queue.filter(t => t.priority === 'low').length
      });

      if (this.currentStats) {
        this.currentStats.totalCategories = this.queue.length;
      }

      return true;

    } catch (error) {
      console.error('❌ Error building prefetch queue with composite API:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error in prefetch with composite API:', error);
    return false;
  }
  }

  // Process queue in background with controlled batching
  private async processQueueInBackground() {
    console.log(`🚀 Starting background processing of ${this.queue.length} tasks`);
    
    // Rate limiting: Process max 3 requests concurrently with delays
    const MAX_CONCURRENT = 8;
    const DELAY_BETWEEN_BATCHES = 200; // 200ms between batches
    const DELAY_BETWEEN_REQUESTS = 50; // 50ms between individual requests
    
    let completed = 0;
    let failed = 0;
    
    // Process queue in smaller batches to avoid rate limiting
    for (let i = 0; i < this.queue.length; i += MAX_CONCURRENT) {
      if (!this.isActive) break;
      
      const batch = this.queue.slice(i, i + MAX_CONCURRENT);
      console.log(`📦 Processing batch ${Math.floor(i / MAX_CONCURRENT) + 1} (${batch.length} tasks)`);
      
      // Process batch with individual delays
      const batchPromises = batch.map(async (task, index) => {
        if (!this.isActive) return;
        
        // Add staggered delay to prevent burst requests
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS * index));
        }
        
        try {
          await this.executeTask(task);
          completed++;
        } catch (error) {
          console.error(`❌ Task failed: ${task.id}`, error);
          failed++;
          task.status = 'failed';
        }
        
        this.emitProgress();
      });
      
      // Wait for current batch to complete
      await Promise.allSettled(batchPromises);
      
      // Delay between batches to respect rate limits
      if (i + MAX_CONCURRENT < this.queue.length && this.isActive) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    console.log(`📊 Processing completed: ${completed} successful, ${failed} failed`);
    this.completePrefetch();
  }

  // Execute individual prefetch task
  private async executeTask(task: PrefetchTask): Promise<void> {
    if (!this.isActive || task.status !== 'pending') return;

    task.status = 'running';
    console.log(`⏳ Executing task: ${task.id} (priority: ${task.priority})`);

    try {
      switch (task.type) {
        case 'category':
          if (task.categoryData) {
            // Process category data from composite API instead of making individual API calls
            await this.processCategoryFromCompositeAPI(task.categoryData);
            await this.prefetchFieldConfiguration(task.categoryData.riskAssessmentCategoryId);
            this.emitCategoryCompleted(task.categoryData.riskAssessmentCategoryId);
          }
          break;
        // Add other task types as needed
      }

      task.status = 'completed';
      console.log(`✅ Task completed: ${task.id}`);
      
      if (this.currentStats) {
        this.currentStats.completedCategories++;
      }

    } catch (error) {
      task.status = 'failed';
      console.error(`❌ Task failed: ${task.id}`, error);
    }
  }

  // Process category data from composite API (no individual API calls)
  private async processCategoryFromCompositeAPI(category: any): Promise<void> {
    const categoryId = category.riskAssessmentCategoryId;
    console.log(`📦 PREFETCH - Processing category ${categoryId} from composite API data`);
    console.log(`🔍 PREFETCH - Category object:`, {
      riskAssessmentCategoryId: category.riskAssessmentCategoryId,
      categoryName: category.categoryName,
      resolved: categoryId
    });
    
    // Ensure database is ready before proceeding
    if (!isDatabaseReady()) {
      console.log(`⏳ Database not ready, waiting for initialization...`);
      await waitForDatabase();
      console.log(`✅ Database ready, proceeding with category ${categoryId}`);
    }
    
    // Check if already cached for this appointment
    const existingItems = await getAllRiskAssessmentItems();
    const categoryItems = existingItems.filter(item => 
      String(item.riskassessmentcategoryid) === String(categoryId) &&
      String(item.appointmentid) === String(this.currentStats?.appointmentId)
    );

    if (categoryItems.length > 0) {
      console.log(`📦 PREFETCH - Category ${categoryId} already cached for appointment ${this.currentStats?.appointmentId} (${categoryItems.length} items)`);
      return;
    }

    // Check if we have items with null category IDs (from old incorrect mapping)
    const nullCategoryItems = existingItems.filter(item => 
      item.riskassessmentcategoryid === null &&
      String(item.appointmentid) === String(this.currentStats?.appointmentId)
    );

    if (nullCategoryItems.length > 0) {
      console.log(`⚠️ PREFETCH - Found ${nullCategoryItems.length} items with null category IDs, forcing re-prefetch for category ${categoryId}`);
      // Don't return - continue with processing to fix the data
    }

    // Process items from composite API data
    const items = category.items || [];
    console.log(`📦 PREFETCH - Processing ${items.length} items for category ${categoryId} from composite API`);
    
    if (items.length === 0) {
      console.log(`ℹ️ PREFETCH - No items found for category ${categoryId} in composite API data`);
      return;
    }

    // Prepare all items for batch insert
    const sqliteItems: RiskAssessmentItem[] = items.map((item: any, index: number) => {
      
      return {
        riskassessmentitemid: Number(item.riskAssessmentItemId),
        riskassessmentcategoryid: Number(categoryId),
        itemprompt: item.itemPrompt || '',
        itemtype: Number(item.itemType) || 0,
        rank: Number(item.rank) || 0,
        commaseparatedlist: item.commaSeperatedList || '',
        selectedanswer: item.selectedAnswer || '',
        qty: Number(item.qty) || 0,
        price: Number(item.price) || 0,
        description: item.description || '',
        model: item.model || '',
        location: item.location || '',
        assessmentregisterid: Number(item.assessmentRegisterId) || 0,
        assessmentregistertypeid: Number(item.assessmentRegisterTypeId) || 0,
        datecreated: item.dateCreated || new Date().toISOString(),
        createdbyid: item.createdById || '',
        dateupdated: item.dateUpdated || new Date().toISOString(),
        updatedbyid: item.updatedById || '',
        issynced: Number(item.isSynced) || 0,
        syncversion: Number(item.syncVersion) || 0,
        deviceid: item.deviceId || '',
        syncstatus: item.syncStatus || '',
        synctimestamp: item.syncTimestamp || new Date().toISOString(),
        hasphoto: Number(item.hasPhoto) || 0,
        latitude: Number(item.latitude) || 0,
        longitude: Number(item.longitude) || 0,
        notes: item.notes || '',
        appointmentid: this.currentStats?.appointmentId || ''
      };
    });
    
    // Add focused logging before batch insert
    console.log(`🔍 PREFETCH - About to insert ${sqliteItems.length} items for category ${categoryId}`);
    
    // Batch insert all items at once
    await batchInsertRiskAssessmentItems(sqliteItems);
    console.log(`✅ PREFETCH - Successfully processed ${items.length} items for category ${categoryId} from composite API`);
    
  }

  // Prefetch field configuration for a specific category
  private async prefetchFieldConfiguration(categoryId: string): Promise<void> {
    console.log(`📋 PREFETCH - Fetching field configuration for category ${categoryId}`);
    
    try {
      // Check if already cached
      const { getFieldConfiguration, storeFieldConfiguration } = offlineStorage;
      const cachedConfig = await getFieldConfiguration(categoryId);
      
      if (cachedConfig && cachedConfig.data) {
        console.log(`📦 PREFETCH - Field configuration already cached for category ${categoryId}`);
        return;
      }

      // Fetch from API - requires API key authentication
      const { API_KEY, API_KEY_HEADER_NAME, USER_CONTEXT_HEADER_NAME } = await import('../constants/apiConfig');
      const userContext = await AsyncStorage.getItem('userContext');
      
      if (!API_KEY) {
        console.log('❌ PREFETCH - No API key available for field configuration, skipping...');
        return;
      }

      const axios = await import('axios');
      const axiosInstance = axios.default.create({
        baseURL: API_BASE_URL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          [API_KEY_HEADER_NAME]: API_KEY,
          ...(userContext && { [USER_CONTEXT_HEADER_NAME]: userContext })
        }
      });

      const response = await axiosInstance.get(`/risk-assessment-category-type-fields/category/${categoryId}?pageSize=30`);
      
      if (response.data) {
        console.log(`💾 PREFETCH - Caching field configuration for category ${categoryId}`);
        await storeFieldConfiguration(categoryId, response.data);
      }

    } catch (error: any) {
      // Handle 404 gracefully - not all categories have field configurations
      if (error?.response?.status === 404) {
        console.log(`ℹ️ PREFETCH - No field configuration found for category ${categoryId}`);
        return;
      }
      // Handle authentication errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log(`❌ PREFETCH - Authentication required for field configuration, skipping category ${categoryId}`);
        return;
      }
      console.error(`❌ PREFETCH - Error fetching field configuration for category ${categoryId}:`, error);
    }
  }

  /**
   * Prefetch all category configurations for the entire system
   * This replaces individual order-specific category config calls
   */
  async prefetchAllCategoryConfigurations(): Promise<boolean> {
    try {
      console.log('🚀 PREFETCH - Starting all category configurations prefetch...');
      
      const { API_BASE_URL } = await import('../constants/apiConfig');
      const fullUrl = `${API_BASE_URL}/api/mobile/config/categories/all/complete`;
      
      console.log('🌐 PREFETCH - All Categories Config URL:', fullUrl);
      
      // Fetch from API - requires API key authentication
      const { API_KEY, API_KEY_HEADER_NAME, USER_CONTEXT_HEADER_NAME } = await import('../constants/apiConfig');
      const userContext = await AsyncStorage.getItem('userContext');
      
      if (!API_KEY) {
        console.log('❌ PREFETCH - No API key available for all category configurations, skipping...');
        return false;
      }

      const axios = await import('axios');
      const axiosInstance = axios.default.create({
        baseURL: API_BASE_URL,
        timeout: 30000, // Longer timeout for large data
        headers: {
          'Content-Type': 'application/json',
          [API_KEY_HEADER_NAME]: API_KEY
        }
      });

      if (userContext) {
        axiosInstance.defaults.headers[USER_CONTEXT_HEADER_NAME] = userContext;
      }

      const response = await axiosInstance.get('/api/mobile/config/categories/all/complete');
      
      if (response.status !== 200) {
        console.log('❌ PREFETCH - All category config API returned status:', response.status);
        return false;
      }

      const configData = response.data;
      
      if (!configData?.success || !configData?.data?.categories) {
        console.log('❌ PREFETCH - Invalid response format from all category config API');
        return false;
      }

      // Cache the complete category configurations
      await this.cacheAllCategoryConfigurations(configData.data);
      
      console.log(`✅ PREFETCH - Successfully cached ${configData.data.categories.length} category configurations`);
      return true;

    } catch (error: any) {
      console.error('❌ PREFETCH - Error prefetching all category configurations:', error);
      return false;
    }
  }

  /**
   * Cache all category configurations for fast lookup
   */
  private async cacheAllCategoryConfigurations(configData: any): Promise<void> {
    try {
      console.log(`🚀 Caching all category configurations (${configData.categories.length} categories)`);
      
      // Cache the complete data structure
      const cacheKey = 'all_category_configurations';
      const cacheData = {
        data: configData,
        timestamp: Date.now(),
        totalCategories: configData.categories.length
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Also cache individual categories for backward compatibility
      for (const categoryConfig of configData.categories) {
        const categoryId = categoryConfig.category?.categoryId;
        if (categoryId) {
          const individualCacheKey = `dynamic_ui_config_${categoryId}`;
          const individualCacheData = {
            data: categoryConfig,
            timestamp: Date.now(),
            fromAllCategories: true
          };
          
          await AsyncStorage.setItem(individualCacheKey, JSON.stringify(individualCacheData));
        }
      }
      
      console.log(`✅ Successfully cached all category configurations`);
    } catch (error) {
      console.error('❌ Error caching all category configurations:', error);
    }
  }

  /**
   * Get cached all category configurations
   */
  async getAllCategoryConfigurations(): Promise<any | null> {
    try {
      const cacheKey = 'all_category_configurations';
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        console.log('📦 No cached all category configurations found');
        return null;
      }
      
      const parsed = JSON.parse(cachedData);
      console.log(`📦 Found cached all category configurations (${parsed.totalCategories} categories)`);
      return parsed.data;
    } catch (error) {
      console.error('❌ Error reading cached all category configurations:', error);
      return null;
    }
  }

  /**
   * Get category configuration by categoryId from cached all configurations
   */
  async getCategoryConfigurationById(categoryId: number): Promise<any | null> {
    try {
      const allConfigs = await this.getAllCategoryConfigurations();
      
      if (!allConfigs?.categories) {
        console.log('📦 No all category configurations available');
        return null;
      }
      
      const categoryConfig = allConfigs.categories.find(
        (config: any) => config.category?.categoryId === categoryId
      );
      
      if (categoryConfig) {
        console.log(`📦 Found category configuration for ID ${categoryId}: ${categoryConfig.category?.categoryName}`);
        return categoryConfig;
      } else {
        console.log(`📦 No category configuration found for ID ${categoryId}`);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting category configuration by ID:', error);
      return null;
    }
  }

  /**
   * Load all category configurations on app startup
   * This should be called once when the app starts
   */
  async loadAllCategoryConfigurationsOnStartup(): Promise<boolean> {
    try {
      console.log('🚀 APP STARTUP - Loading all category configurations...');
      
      // First check if we already have data in SQLite
      const existingData = await this.getAllCategoryConfigurationsFromSQLite();
      if (existingData && existingData.categories && existingData.categories.length > 0) {
        console.log(`✅ APP STARTUP - Found ${existingData.categories.length} categories in SQLite, skipping download`);
        return true;
      }
      
      // If no data in SQLite, fetch from API
      console.log('🔄 APP STARTUP - No data in SQLite, fetching from API...');
      return await this.fetchAndStoreAllCategoryConfigurations();
      
    } catch (error) {
      console.error('❌ APP STARTUP - Error loading all category configurations:', error);
      return false;
    }
  }

  /**
   * Fetch all category configurations from API and store in SQLite
   */
  private async fetchAndStoreAllCategoryConfigurations(): Promise<boolean> {
    try {
      console.log('🚀 FETCHING - All category configurations from API...');
      
      const { API_BASE_URL } = await import('../constants/apiConfig');
      const fullUrl = `${API_BASE_URL}/mobile/config/categories/all/complete`;
      
      console.log('🌐 FETCHING - All Categories Config URL:', fullUrl);
      
      // Fetch from API - requires API key authentication
      const { API_KEY, API_KEY_HEADER_NAME, USER_CONTEXT_HEADER_NAME } = await import('../constants/apiConfig');
      const userContext = await AsyncStorage.getItem('userContext');
      
      if (!API_KEY) {
        console.log('❌ FETCHING - No API key available for all category configurations, skipping...');
        return false;
      }

      const axios = await import('axios');
      const axiosInstance = axios.default.create({
        baseURL: API_BASE_URL,
        timeout: 30000, // Longer timeout for large data
        headers: {
          'Content-Type': 'application/json',
          [API_KEY_HEADER_NAME]: API_KEY
        }
      });

      if (userContext) {
        axiosInstance.defaults.headers[USER_CONTEXT_HEADER_NAME] = userContext;
      }

      const response = await axiosInstance.get('/mobile/config/categories/all/complete');
      
      if (response.status !== 200) {
        console.log('❌ FETCHING - All category config API returned status:', response.status);
        return false;
      }

      const configData = response.data;
      
      if (!configData?.success || !configData?.data?.categories) {
        console.log('❌ FETCHING - Invalid response format from all category config API');
        return false;
      }

      // Store in SQLite
      await this.storeAllCategoryConfigurationsInSQLite(configData.data);
      
      console.log(`✅ FETCHING - Successfully stored ${configData.data.categories.length} category configurations in SQLite`);
      return true;

    } catch (error: any) {
      console.error('❌ FETCHING - Error fetching all category configurations:', error);
      return false;
    }
  }

  /**
   * Store all category configurations in SQLite
   */
  private async storeAllCategoryConfigurationsInSQLite(configData: any): Promise<void> {
    try {
      console.log(`🚀 SQLITE - Storing ${configData.categories.length} category configurations...`);
      
      const { runSql, waitForDatabase } = await import('../utils/db');
      
      // Ensure database is ready
      await waitForDatabase();
      
      // Create table if it doesn't exist
      await runSql(`
        CREATE TABLE IF NOT EXISTS category_configurations (
          categoryId INTEGER PRIMARY KEY,
          categoryName TEXT NOT NULL,
          sectionName TEXT,
          templateName TEXT,
          categoryRank INTEGER DEFAULT 0,
          isActive INTEGER DEFAULT 1,
          fields TEXT,
          groupingStrategy TEXT,
          locationTemplates TEXT,
          summary TEXT,
          lastUpdated TEXT
        )
      `);
      
      // Clear existing data
      await runSql('DELETE FROM category_configurations');
      
      // Insert new data
      for (const categoryConfig of configData.categories) {
        const category = categoryConfig.category;
        const fields = categoryConfig.fields || [];
        const groupingStrategy = categoryConfig.groupingStrategy;
        const locationTemplates = categoryConfig.locationTemplates || [];
        
        await runSql(`
          INSERT INTO category_configurations (
            categoryId, categoryName, sectionName, templateName, categoryRank, isActive,
            fields, groupingStrategy, locationTemplates, summary, lastUpdated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          category.categoryId,
          category.categoryName,
          category.sectionName,
          category.templateName,
          category.categoryRank,
          category.isActive ? 1 : 0,
          JSON.stringify(fields),
          groupingStrategy ? JSON.stringify(groupingStrategy) : null,
          JSON.stringify(locationTemplates),
          JSON.stringify(categoryConfig.summary),
          new Date().toISOString()
        ]);
      }
      
      console.log(`✅ SQLITE - Successfully stored ${configData.categories.length} category configurations`);
    } catch (error) {
      console.error('❌ SQLITE - Error storing category configurations:', error);
      throw error;
    }
  }

  /**
   * Get all category configurations from SQLite
   */
  async getAllCategoryConfigurationsFromSQLite(): Promise<any | null> {
    try {
      const { runSql, waitForDatabase } = await import('../utils/db');
      
      // Ensure database is ready
      await waitForDatabase();
      
      const result = await runSql('SELECT * FROM category_configurations');
      
      if (!result.rows || result.rows.length === 0) {
        console.log('📦 SQLITE - No category configurations found in database');
        return null;
      }
      
      // Convert back to the expected format
      const categories = result.rows._array.map((config: any) => ({
        category: {
          categoryId: config.categoryId,
          categoryName: config.categoryName,
          sectionName: config.sectionName,
          templateName: config.templateName,
          categoryRank: config.categoryRank,
          isActive: config.isActive === 1
        },
        fields: JSON.parse(config.fields || '[]'),
        groupingStrategy: config.groupingStrategy ? JSON.parse(config.groupingStrategy) : null,
        locationTemplates: JSON.parse(config.locationTemplates || '[]'),
        summary: JSON.parse(config.summary || '{}')
      }));
      
      console.log(`📦 SQLITE - Retrieved ${categories.length} category configurations from database`);
      return { categories };
    } catch (error) {
      console.error('❌ SQLITE - Error reading category configurations:', error);
      return null;
    }
  }

  /**
   * Get category configuration by categoryId from SQLite
   */
  async getCategoryConfigurationByIdFromSQLite(categoryId: number): Promise<any | null> {
    try {
      const { runSql, waitForDatabase } = await import('../utils/db');
      
      // Ensure database is ready
      await waitForDatabase();
      
      const result = await runSql('SELECT * FROM category_configurations WHERE categoryId = ?', [categoryId]);
      
      if (!result.rows || result.rows.length === 0) {
        console.log(`📦 SQLITE - No category configuration found for ID ${categoryId}`);
        return null;
      }
      
      const config = result.rows._array[0];
      
      // Convert back to the expected format
      const categoryConfig = {
        category: {
          categoryId: config.categoryId,
          categoryName: config.categoryName,
          sectionName: config.sectionName,
          templateName: config.templateName,
          categoryRank: config.categoryRank,
          isActive: config.isActive === 1
        },
        fields: JSON.parse(config.fields || '[]'),
        groupingStrategy: config.groupingStrategy ? JSON.parse(config.groupingStrategy) : null,
        locationTemplates: JSON.parse(config.locationTemplates || '[]'),
        summary: JSON.parse(config.summary || '{}')
      };
      
      console.log(`📦 SQLITE - Found category configuration for ID ${categoryId}: ${categoryConfig.category.categoryName}`);
      return categoryConfig;
    } catch (error) {
      console.error('❌ SQLITE - Error reading category configuration by ID:', error);
      return null;
    }
  }

  /**
   * Clear all category configurations from SQLite (for development/testing)
   */
  async clearAllCategoryConfigurationsFromSQLite(): Promise<void> {
    try {
      console.log('🗑️ SQLITE - Clearing all category configurations...');
      
      const { runSql, waitForDatabase } = await import('../utils/db');
      
      // Ensure database is ready
      await waitForDatabase();
      await runSql('DELETE FROM category_configurations');
      
      console.log('✅ SQLITE - Successfully cleared all category configurations');
    } catch (error) {
      console.error('❌ SQLITE - Error clearing category configurations:', error);
    }
  }

  /**
   * Refresh all category configurations (for development/testing)
   */
  async refreshAllCategoryConfigurations(): Promise<boolean> {
    try {
      console.log('🔄 REFRESH - Refreshing all category configurations...');
      
      // Clear existing data
      await this.clearAllCategoryConfigurationsFromSQLite();
      
      // Fetch and store new data
      const success = await this.fetchAndStoreAllCategoryConfigurations();
      
      if (success) {
        console.log('✅ REFRESH - Successfully refreshed all category configurations');
      } else {
        console.log('❌ REFRESH - Failed to refresh category configurations');
      }
      
      return success;
    } catch (error) {
      console.error('❌ REFRESH - Error refreshing category configurations:', error);
      return false;
    }
  }

  /**
   * Check if category configurations table is empty and populate if needed
   * This is a safety check for when navigating to appointments
   */
  async ensureCategoryConfigurationsLoaded(): Promise<boolean> {
    try {
      console.log('🔍 SAFETY CHECK - Checking if category configurations are loaded...');
      
      const { runSql, waitForDatabase } = await import('../utils/db');
      
      // Ensure database is ready
      await waitForDatabase();
      
      // Check if table has any data
      const countResult = await runSql('SELECT COUNT(*) as count FROM category_configurations');
      const count = countResult.rows._array[0]?.count || 0;
      
      if (count === 0) {
        console.log('⚠️ SAFETY CHECK - Category configurations table is empty, loading now...');
        
        // Load all category configurations
        const success = await this.loadAllCategoryConfigurationsOnStartup();
        
        if (success) {
          console.log('✅ SAFETY CHECK - Category configurations loaded successfully');
        } else {
          console.log('❌ SAFETY CHECK - Failed to load category configurations');
        }
        
        return success;
      } else {
        console.log(`✅ SAFETY CHECK - Category configurations already loaded (${count} categories)`);
        return true;
      }
      
    } catch (error) {
      console.error('❌ SAFETY CHECK - Error checking category configurations:', error);
      return false;
    }
  }

  // Helper methods - REMOVED: No longer needed with composite API
  // private async fetchTemplatesByOrderId(orderId: string): Promise<any> { ... }
  // private async getDefaultTemplates(): Promise<any[]> { ... }
  // private async getTemplateSections(assessmentId: string): Promise<any[]> { ... }
  // private async getSectionCategories(sectionId: string): Promise<any[]> { ... }

  private getCategoryPriority(category: any, templateType: string): 'high' | 'medium' | 'low' {
    // High priority categories that users typically access first
    const highPriorityCategories = [
      'domestic-appliances',
      'jewellery', 
      'valuable-artworks',
      'electronics',
      'furniture'
    ];
    
    // Template-specific priorities
    const templatePriorities: Record<string, string[]> = {
      'contents-valuation': ['antiques', 'valuable-carpets', 'collectibles'],
      'high-risk-assessment': ['high-risk-items', 'firearms', 'valuable-items'],
      'standard-survey': ['domestic-appliances', 'electronics']
    };

    // Try different possible property names for category name
    const categoryName = (category.categoryname || category.categoryName || category.name || '').toLowerCase();
    
    if (highPriorityCategories.some(hpc => categoryName.includes(hpc))) {
      return 'high';
    }
    
    const templateSpecific = templatePriorities[templateType?.toLowerCase() || ''] || [];
    if (templateSpecific.some(tsc => categoryName.includes(tsc))) {
      return 'high';
    }
    
    return 'medium';
  }

  // Control methods
  stopPrefetch(): void {
    console.log('🛑 Stopping prefetch');
    this.isActive = false;
    if (this.abortController) {
      this.abortController.abort();
    }
    this.cleanup();
  }

  private completePrefetch(): void {
    console.log('🎉 Prefetch completed');
    if (this.currentStats) {
      this.currentStats.endTime = Date.now();
      this.currentStats.status = 'completed';
      
      const duration = (this.currentStats.endTime - this.currentStats.startTime) / 1000;
      console.log(`📊 Prefetch stats:`, {
        duration: `${duration.toFixed(1)}s`,
        completed: this.currentStats.completedCategories,
        total: this.currentStats.totalCategories,
        successRate: `${((this.currentStats.completedCategories / this.currentStats.totalCategories) * 100).toFixed(1)}%`
      });
    }
    
    this.cleanup();
  }

  private cleanup(): void {
    this.isActive = false;
    this.queue = [];
    this.abortController = null;
    this.emitProgress();
  }

  // Status methods
  isRunning(): boolean {
    return this.isActive;
  }

  getCurrentProgress(): PrefetchProgress {
    return {
      total: this.queue.length,
      completed: this.queue.filter(t => t.status === 'completed').length,
      failed: this.queue.filter(t => t.status === 'failed').length,
      isActive: this.isActive,
      currentTask: this.queue.find(t => t.status === 'running')?.id
    };
  }

  getStats(): PrefetchStats | null {
    return this.currentStats;
  }
}

// Export singleton instance
export const prefetchService = new PrefetchService();
export default prefetchService; 