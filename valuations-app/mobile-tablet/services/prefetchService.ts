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
    // Check if we already have data for this appointment
    const cachedData = await this.checkPrefetchedData(appointmentId);
    if (cachedData) {
      console.log(`✅ Data already prefetched for appointment ${appointmentId} - skipping prefetch`);
      return true;
    }

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
      // First check SQLite for risk assessment items specific to this appointment
      const db = await waitForDatabase();
      const results = await db.getAllAsync(
        'SELECT COUNT(*) as count FROM risk_assessment_items WHERE appointmentid = ?',
        [appointmentId]
      );
      
      if (results && results.length > 0 && typeof results[0] === 'object' && results[0] !== null && 'count' in results[0]) {
        const count = (results[0] as { count: number }).count;
        if (count > 0) {
          console.log(`✅ Found ${count} items in SQLite for appointment ${appointmentId}`);
          return true;
        }
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
      
      const fullUrl = `${API_BASE_URL}/mobile/risk-assessment/${orderNumber}/complete-hierarchy`;
      const fieldConfigUrl = `${API_BASE_URL}/mobile/config/order/${orderNumber}/categories/complete`;
      console.log(`🌐 COMPOSITE API - FULL URL: ${fullUrl}`);
      console.log(`🌐 FIELD CONFIG API - FULL URL: ${fieldConfigUrl}`);
      
      // Get authentication token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('❌ COMPOSITE API - No auth token available, skipping prefetch');
        return false;
      }
      
      console.log(`🔑 COMPOSITE API - AUTH TOKEN: ${token ? `Bearer ${token.substring(0, 20)}...` : 'NO TOKEN'}`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      // Fetch both hierarchy and field configurations in parallel
      const [hierarchyResponse, fieldConfigResponse] = await Promise.all([
        fetch(fullUrl, { method: 'GET', headers }),
        fetch(fieldConfigUrl, { method: 'GET', headers })
      ]);
      
      console.log(`📡 COMPOSITE API - Response status: ${hierarchyResponse.status} ${hierarchyResponse.statusText}`);
      console.log(`📡 FIELD CONFIG API - Response status: ${fieldConfigResponse.status} ${fieldConfigResponse.statusText}`);
      
      // Handle authentication errors
      if (hierarchyResponse.status === 401 || hierarchyResponse.status === 403) {
        console.log(`❌ COMPOSITE API - Authentication required, skipping...`);
        return false;
      }
      
      if (!hierarchyResponse.ok) {
        console.log(`❌ COMPOSITE API - Failed with status ${hierarchyResponse.status}`);
        return false;
      }
      
      const hierarchyData = await hierarchyResponse.json();
      const fieldConfigData = fieldConfigResponse.ok ? await fieldConfigResponse.json() : null;
      
      console.log(`📦 COMPOSITE API - Response data structure:`, {
        success: hierarchyData?.success,
        hasAssessmentMasters: !!hierarchyData?.data?.assessmentMasters,
        mastersCount: hierarchyData?.data?.assessmentMasters?.length || 0,
        totalSections: hierarchyData?.data?.assessmentMasters?.reduce((sum: number, master: any) => 
          sum + (master.sections?.length || 0), 0) || 0,
        totalCategories: hierarchyData?.data?.assessmentMasters?.reduce((sum: number, master: any) => 
          sum + master.sections?.reduce((sectionSum: number, section: any) => 
            sectionSum + (section.categories?.length || 0), 0), 0) || 0,
        totalItems: hierarchyData?.data?.assessmentMasters?.reduce((sum: number, master: any) => 
          sum + master.sections?.reduce((sectionSum: number, section: any) => 
            sectionSum + section.categories?.reduce((categorySum: number, category: any) => 
              categorySum + (category.items?.length || 0), 0), 0), 0) || 0
      });
      
      if (fieldConfigData) {
        console.log(`📦 FIELD CONFIG API - Response data structure:`, {
          success: fieldConfigData?.success,
          totalCategories: fieldConfigData?.data?.summary?.totalCategories || 0,
          totalFields: fieldConfigData?.data?.summary?.totalFields || 0
        });
        
        // Cache field configurations if available
        if (fieldConfigData?.success && fieldConfigData?.data?.categories) {
          console.log(`🚀 Pre-loading field configurations for ${fieldConfigData.data.categories.length} categories`);
          
          // Store field configurations in a format that can be used by ConfigurationService
          const configurationService = await import('./configurationService');
          await configurationService.default.cacheOrderFieldConfigurations(orderNumber, fieldConfigData.data);
        }
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
      
      for (const master of assessmentMasters) {
        console.log(`📝 Processing master: ${master.templateName || master.assessmenttypename} (ID: ${master.riskassessmentid})`);
        
        if (!master.sections) {
          console.log(`⚠️ No sections found for master ${master.riskassessmentid}`);
          continue;
        }
        
        for (const section of master.sections) {
          console.log(`📂 Processing section: ${section.sectionName || section.sectionname} (ID: ${section.riskassessmentsectionid})`);
          
          if (!section.categories) {
            console.log(`⚠️ No categories found for section ${section.riskassessmentsectionid}`);
            continue;
          }
          
          for (const category of section.categories) {
            const categoryId = category.riskassessmentcategoryid || category.categoryId;
            const priority = this.getCategoryPriority(category, master.assessmenttypename || master.templateName);
            
            console.log(`📋 Adding category task: ${category.categoryName || category.categoryname} (ID: ${categoryId}, Priority: ${priority})`);
            
            const task: PrefetchTask = {
              id: `category-${categoryId}`,
              type: 'category',
              categoryId: categoryId.toString(),
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
            await this.prefetchFieldConfiguration(task.categoryData.riskassessmentcategoryid || task.categoryData.categoryId);
            this.emitCategoryCompleted(task.categoryData.riskassessmentcategoryid || task.categoryData.categoryId);
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
    const categoryId = category.riskassessmentcategoryid || category.categoryId;
    console.log(`📦 PREFETCH - Processing category ${categoryId} from composite API data`);
    
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

    // Process items from composite API data
    const items = category.items || [];
    console.log(`📦 PREFETCH - Processing ${items.length} items for category ${categoryId} from composite API`);
    
    if (items.length === 0) {
      console.log(`ℹ️ PREFETCH - No items found for category ${categoryId} in composite API data`);
      return;
    }

    // Prepare all items for batch insert
    const sqliteItems: RiskAssessmentItem[] = items.map((item: any, index: number) => {
      console.log(`📝 PREFETCH - Preparing item ${index + 1}/${items.length}:`, {
        riskassessmentitemid: item.riskassessmentitemid,
        riskassessmentcategoryid: item.riskassessmentcategoryid,
        itemprompt: item.itemprompt,
        itemtype: item.itemtype,
        rank: item.rank
      });
      
      return {
        riskassessmentitemid: Number(item.riskassessmentitemid),
        riskassessmentcategoryid: Number(item.riskassessmentcategoryid),
        itemprompt: item.itemprompt || '',
        itemtype: Number(item.itemtype) || 0,
        rank: Number(item.rank) || 0,
        commaseparatedlist: item.commaseparatedlist || '',
        selectedanswer: item.selectedanswer || '',
        qty: Number(item.qty) || 1,
        price: Number(item.price) || 0,
        description: item.description || '',
        model: item.model || '',
        location: item.location || '',
        assessmentregisterid: Number(item.assessmentregisterid) || 0,
        assessmentregistertypeid: Number(item.assessmentregistertypeid) || 0,
        datecreated: item.datecreated || new Date().toISOString(),
        createdbyid: item.createdbyid || '',
        dateupdated: item.dateupdated || new Date().toISOString(),
        updatedbyid: item.updatedbyid || '',
        issynced: Number(item.issynced) || 0,
        syncversion: Number(item.syncversion) || 0,
        deviceid: item.deviceid || '',
        syncstatus: item.syncstatus || '',
        synctimestamp: item.synctimestamp || new Date().toISOString(),
        hasphoto: Number(item.hasphoto) || 0,
        latitude: Number(item.latitude) || 0,
        longitude: Number(item.longitude) || 0,
        notes: item.notes || '',
        appointmentid: this.currentStats?.appointmentId || ''
      };
    });
    
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

      // Fetch from API - requires authentication
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('❌ PREFETCH - No auth token available for field configuration, skipping...');
        return;
      }

      const axios = await import('axios');
      const axiosInstance = axios.default.create({
        baseURL: API_BASE_URL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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

    const categoryName = category.categoryname?.toLowerCase() || '';
    
    if (highPriorityCategories.some(hpc => categoryName.includes(hpc))) {
      return 'high';
    }
    
    const templateSpecific = templatePriorities[templateType.toLowerCase()] || [];
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