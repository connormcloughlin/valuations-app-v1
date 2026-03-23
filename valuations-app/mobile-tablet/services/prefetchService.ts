import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/apiConfig';
import transportClient from '../core/transport/transportClient';
import {
  insertRiskAssessmentItem,
  batchInsertRiskAssessmentItems,
  getAllRiskAssessmentItems,
  RiskAssessmentItem,
  waitForDatabase,
  isDatabaseReady,
  insertMediaFile,
  MediaFile
} from '../utils/db';
import imagePrefetchService from './imagePrefetchService';
import offlineStorage from '../utils/offlineStorage';
import {
  getAssessmentMastersFromHierarchyPayload,
  peelCompleteHierarchyInner
} from '../utils/completeHierarchyPayload';

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

    console.log(
      `🚀 Starting prefetch for appointment: ${appointmentId} (always building queue when online; per-category tasks skip if SQLite already has items)`
    );

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

  /**
   * Resolve assessment category id from composite/hierarchy category objects (API casing varies).
   */
  private resolveRiskAssessmentCategoryId(category: any): string | null {
    const raw =
      category?.riskAssessmentCategoryId ??
      category?.riskassessmentcategoryid ??
      category?.categoryId ??
      category?.CategoryId;
    if (raw === undefined || raw === null || raw === '') {
      return null;
    }
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      return String(n);
    }
    if (typeof raw === 'string' && raw.trim() !== '') {
      return raw.trim();
    }
    return null;
  }

  /**
   * complete-hierarchy: single or double-wrapped `{ data: { data: { assessmentMasters }}}` (see completeHierarchyPayload).
   */
  private normalizeHierarchyAssessmentMasters(hierarchyData: any): any[] {
    if (!hierarchyData) return [];
    const peeled = getAssessmentMastersFromHierarchyPayload(hierarchyData);
    if (peeled.length > 0) return peeled;
    const fromNested = hierarchyData.data?.assessmentMasters;
    const fromTop = hierarchyData.assessmentMasters;
    if (Array.isArray(fromNested)) return fromNested;
    if (Array.isArray(fromTop)) return fromTop;
    return [];
  }

  private hierarchyResponseIsUsable(hierarchyData: any): boolean {
    if (!hierarchyData) return false;
    if (hierarchyData.success === false) return false;
    return this.normalizeHierarchyAssessmentMasters(hierarchyData).length > 0;
  }

  /** Backend may omit items on hierarchy nodes; try common keys + PascalCase. */
  private extractEmbeddedCategoryItems(category: any): any[] {
    const raw =
      category?.items ??
      category?.Items ??
      category?.riskAssessmentItems ??
      category?.RiskAssessmentItems;
    return Array.isArray(raw) ? raw : [];
  }

  /** transportClient returns axios body — array or { data: [] }. */
  private normalizeItemsArrayResponse(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (response?.data != null && Array.isArray(response.data)) return response.data;
    return [];
  }

  private async fetchRiskAssessmentItemsFromApi(categoryId: number): Promise<any[]> {
    try {
      const response = await transportClient.get(
        'risk-assessments.items',
        `/risk-assessment-items/category/${categoryId}`
      );
      const list = this.normalizeItemsArrayResponse(response);
      console.log(`🌐 PREFETCH - Items API returned ${list.length} rows for category ${categoryId}`);
      return list;
    } catch (error) {
      console.error(`❌ PREFETCH - Items API failed for category ${categoryId}:`, error);
      return [];
    }
  }

  private mapItemPayloadToSqlite(
    item: any,
    categoryId: number,
    appointmentId: string
  ): RiskAssessmentItem | null {
    const id = Number(
      item?.riskAssessmentItemId ?? item?.riskassessmentitemid ?? item?.RiskAssessmentItemId
    );
    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }
    const itemTypeRaw = item.itemType ?? item.ItemType ?? 0;
    const itemType =
      typeof itemTypeRaw === 'string' && Number.isNaN(Number(itemTypeRaw))
        ? 0
        : Number(itemTypeRaw) || 0;

    return {
      riskassessmentitemid: id,
      riskassessmentcategoryid: categoryId,
      itemprompt: item.itemPrompt ?? item.itemprompt ?? item.ItemPrompt ?? '',
      itemtype: itemType,
      rank: Number(item.rank ?? item.Rank ?? 0) || 0,
      commaseparatedlist:
        item.commaSeparatedList ?? item.CommaseparatedList ?? item.comma_separated_list ?? '',
      selectedanswer: item.selectedAnswer ?? item.SelectedAnswer ?? '',
      qty: Number(item.qty ?? item.Qty ?? 0) || 0,
      price: Number(item.price ?? item.Price ?? 0) || 0,
      description: item.description ?? item.Description ?? '',
      model: item.model ?? item.Model ?? '',
      location: item.location ?? item.Location ?? '',
      assessmentregisterid: Number(item.assessmentRegisterId ?? item.AssessmentRegisterId ?? 0) || 0,
      assessmentregistertypeid:
        Number(item.assessmentRegisterTypeId ?? item.AssessmentRegisterTypeId ?? 0) || 0,
      datecreated: item.dateCreated ?? item.DateCreated ?? new Date().toISOString(),
      createdbyid: String(item.createdById ?? item.CreatedById ?? ''),
      dateupdated: item.dateUpdated ?? item.DateUpdated ?? new Date().toISOString(),
      updatedbyid: String(item.updatedById ?? item.UpdatedById ?? ''),
      issynced: Number(item.isSynced ?? item.IsSynced ?? 0) || 0,
      syncversion: Number(item.syncVersion ?? item.SyncVersion ?? 0) || 0,
      deviceid: String(item.deviceId ?? item.DeviceId ?? ''),
      syncstatus: String(item.syncStatus ?? item.SyncStatus ?? ''),
      synctimestamp: item.syncTimestamp ?? item.SyncTimestamp ?? new Date().toISOString(),
      hasphoto: Number(item.hasPhoto ?? item.HasPhoto ?? 0) || 0,
      latitude: Number(item.latitude ?? item.Latitude ?? 0) || 0,
      longitude: Number(item.longitude ?? item.Longitude ?? 0) || 0,
      notes: item.notes ?? item.Notes ?? '',
      appointmentid: appointmentId,
      excludefromreport: (item.excludeFromReport ?? item.ExcludeFromReport) ? 1 : 0
    };
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
      
      try {
        // Hierarchy + order categories/complete in parallel: order payload hydrates SQLite/AsyncStorage
        // so Dynamic UI offline data is available before per-category tasks (avoids N type-fields calls).
        const [hierarchyResponse, orderConfigHydrated] = await Promise.all([
          transportClient.get('risk-assessment.hierarchy', `/mobile/risk-assessment/${orderNumber}/complete-hierarchy`),
          this.fetchAndApplyOrderFieldConfigurationCaches(orderNumber)
        ]);

        console.log(`📡 COMPOSITE API - Response received`);
        console.log(
          `📡 FIELD CONFIG - Order categories/complete hydrate: ${orderConfigHydrated ? 'ok' : 'skipped or failed'} (SQLite + dynamic_ui_config)`
        );

        // Transport client returns data directly
        const hierarchyData = hierarchyResponse;

      const assessmentMasters = this.normalizeHierarchyAssessmentMasters(hierarchyData);
      console.log(`📦 COMPOSITE API - Found ${assessmentMasters.length} assessment masters`);

      const allCategoryConfigs = await this.getAllCategoryConfigurations();
      if (allCategoryConfigs) {
        console.log(`📦 FIELD CONFIG - AsyncStorage all_category_configurations: ${allCategoryConfigs.categories.length} categories`);
      } else {
        console.log(`📦 FIELD CONFIG - No AsyncStorage all_category_configurations blob (optional)`);
      }
      
      if (!this.hierarchyResponseIsUsable(hierarchyData)) {
        console.log('❌ COMPOSITE API - Invalid response format or no assessment masters', {
          success: hierarchyData?.success,
          masterCount: assessmentMasters.length
        });
        return false;
      }

      // Process the composite response and build tasks
      console.log(`✅ COMPOSITE API - Processing ${assessmentMasters.length} assessment masters`);
      
      // Single flat snapshot for offline helpers (peel double-wrapped envelopes)
      const peeled = peelCompleteHierarchyInner(hierarchyData);
      this.completeHierarchyData =
        peeled && typeof peeled === 'object'
          ? { ...peeled, assessmentMasters }
          : { assessmentMasters };
      
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
            const categoryId = this.resolveRiskAssessmentCategoryId(category);

            if (!categoryId) {
              console.log(`⚠️ PREFETCH - Skipping category without valid ID:`, {
                riskAssessmentCategoryId: category.riskAssessmentCategoryId,
                riskassessmentcategoryid: category.riskassessmentcategoryid,
                categoryId: category.categoryId,
                categoryName: category.categoryName
              });
              continue;
            }

            const numericCategoryId = Number(categoryId);
            const normalizedCategory = {
              ...category,
              riskAssessmentCategoryId: Number.isFinite(numericCategoryId)
                ? numericCategoryId
                : (category.riskAssessmentCategoryId ?? categoryId)
            };

            const priority = this.getCategoryPriority(category, master.assessmenttypename || master.templateName);

            const task: PrefetchTask = {
              id: `category-${categoryId}`,
              type: 'category',
              categoryId: String(categoryId),
              priority,
              status: 'pending',
              categoryData: normalizedCategory
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
            // Field UI config: order hydrate + SQLite (above); type-fields only as rare online fallback
            await this.ensureFieldConfigurationForCategory(task.categoryData);
            if (task.categoryId) {
              this.emitCategoryCompleted(task.categoryId);
            }
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
    const categoryIdStr = this.resolveRiskAssessmentCategoryId(category);
    if (!categoryIdStr) {
      console.log(`⚠️ PREFETCH - processCategoryFromCompositeAPI: missing category id`, {
        categoryName: category.categoryName
      });
      return;
    }
    const categoryId = Number(categoryIdStr);
    if (!Number.isFinite(categoryId)) {
      console.log(`⚠️ PREFETCH - processCategoryFromCompositeAPI: non-numeric category id "${categoryIdStr}"`);
      return;
    }

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

    // Items: hierarchy often omits them for size — fall back to per-category items API
    let items = this.extractEmbeddedCategoryItems(category);
    console.log(
      `📦 PREFETCH - ${items.length} embedded items for category ${categoryId} in complete-hierarchy payload`
    );

    if (items.length === 0) {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        console.log(
          `🌐 PREFETCH - Fetching items via API for category ${categoryId} (hierarchy had no item list)`
        );
        items = await this.fetchRiskAssessmentItemsFromApi(categoryId);
      }
    }

    if (items.length === 0) {
      console.log(
        `ℹ️ PREFETCH - No items for category ${categoryId} after hierarchy + optional items API`
      );
      return;
    }

    const appointmentId = String(this.currentStats?.appointmentId || '');
    const sqliteItems: RiskAssessmentItem[] = items
      .map((item: any) => this.mapItemPayloadToSqlite(item, categoryId, appointmentId))
      .filter((row): row is RiskAssessmentItem => row !== null);

    if (sqliteItems.length === 0) {
      console.log(
        `⚠️ PREFETCH - Category ${categoryId}: ${items.length} raw rows but none mapped to valid SQLite items (missing IDs?)`
      );
      return;
    }

    // Add focused logging before batch insert
    console.log(`🔍 PREFETCH - About to insert ${sqliteItems.length} items for category ${categoryId}`);
    
    // Batch insert all items at once
    await batchInsertRiskAssessmentItems(sqliteItems);
    console.log(`✅ PREFETCH - Successfully stored ${sqliteItems.length} items for category ${categoryId}`);

    // Process media files for items in this category
    await this.processMediaFilesForItems(items);
    
  }

  /**
   * Ensure field configuration exists for offline Dynamic UI.
   * Primary source: SQLite from order `categories/complete` (same keys as configurationService: assessment or template category id).
   * Legacy fallback: GET risk-assessment-category-type-fields (only when SQLite misses and online).
   */
  private async ensureFieldConfigurationForCategory(category: any): Promise<void> {
    const assessmentId = Number(
      category.riskAssessmentCategoryId ?? category.riskassessmentcategoryid ?? category.categoryId
    );
    if (!assessmentId || Number.isNaN(assessmentId)) {
      console.log(`⚠️ PREFETCH - ensureFieldConfigurationForCategory: no assessment category id`, category);
      return;
    }

    const rawTemplateId =
      category.riskTemplateCategoryId ??
      category.risktemplatecategoryid ??
      category.RiskTemplateCategoryID;
    const templateId =
      rawTemplateId !== undefined && rawTemplateId !== null && rawTemplateId !== ''
        ? Number(rawTemplateId)
        : NaN;

    console.log(`📋 PREFETCH - Field config check for category ${assessmentId} (template ${Number.isFinite(templateId) ? templateId : 'n/a'})`);

    if (!isDatabaseReady()) {
      await waitForDatabase();
    }

    let sqliteConfig = await this.getCategoryConfigurationByIdFromSQLite(assessmentId);
    if (!sqliteConfig && Number.isFinite(templateId) && templateId !== assessmentId) {
      sqliteConfig = await this.getCategoryConfigurationByIdFromSQLite(templateId);
    }

    if (sqliteConfig) {
      console.log(`📦 PREFETCH - Field configuration in SQLite for category ${assessmentId}`);
      return;
    }

    const { getFieldConfiguration, storeFieldConfiguration } = offlineStorage;
    const legacyKey = String(assessmentId);
    const legacyCached = await getFieldConfiguration(legacyKey);
    if (legacyCached && legacyCached.data) {
      console.log(`📦 PREFETCH - Legacy field_config cache hit for ${legacyKey}`);
      return;
    }

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log(
        `📱 PREFETCH - Offline: no SQLite field config for ${assessmentId}, skipping type-fields fallback`
      );
      return;
    }

    console.log(`🚀 PREFETCH - SQLite miss for ${assessmentId}, fallback GET type-fields...`);
    try {
      const response = await transportClient.get(
        'config.field-config',
        `/risk-assessment-category-type-fields/category/${assessmentId}?pageSize=30`
      );
      if (response) {
        console.log(`💾 PREFETCH - Legacy cache type-fields for category ${assessmentId}`);
        await storeFieldConfiguration(legacyKey, response);
      }
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.response?.status === 204) {
        console.log(`ℹ️ PREFETCH - No type-fields for category ${assessmentId} (${error?.response?.status})`);
        return;
      }
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log(`❌ PREFETCH - Auth error on type-fields for ${assessmentId}, skipping`);
        return;
      }
      console.error(`❌ PREFETCH - Error fetching type-fields for category ${assessmentId}:`, error);
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
      
      console.log('🚀 PREFETCH - Using transport client for all category configurations...');
      const response = await transportClient.get('config.categories-all', '/api/mobile/config/categories/all/complete', {}, {
        timeout: 30000 // Longer timeout for large data
      });
      
      // Transport client returns data directly
      const configData = response;
      
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
      
      console.log('🚀 FETCHING - Using transport client for all category configurations...');
      const response = await transportClient.get('config.categories-all', '/mobile/config/categories/all/complete', {}, {
        timeout: 30000 // Longer timeout for large data
      });
      
      // Transport client returns data directly
      const configData = response;
      
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
          lastUpdated TEXT,
          itemFieldConfigs TEXT
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

        // Build per-item field config map (Option B: only items with fields; support alternate API shapes)
        const itemFieldConfigsMap: Record<string, any[]> = {};
        const categoryItems = categoryConfig.items ?? categoryConfig.templateItems ?? categoryConfig.riskTemplateItems ?? [];
        for (const item of categoryItems) {
          const itemFields = item.fields ?? item.fieldConfig ?? item.effectiveFields ?? [];
          if (Array.isArray(itemFields) && itemFields.length > 0) {
            const key = String(item.itemPrompt ?? item.item_prompt ?? item.name ?? '').toLowerCase().trim();
            if (key) {
              itemFieldConfigsMap[key] = itemFields;
            }
          }
        }
        const itemFieldConfigsJson = Object.keys(itemFieldConfigsMap).length > 0
          ? JSON.stringify(itemFieldConfigsMap)
          : null;
        
        await runSql(`
          INSERT INTO category_configurations (
            categoryId, categoryName, sectionName, templateName, categoryRank, isActive,
            fields, groupingStrategy, locationTemplates, summary, lastUpdated, itemFieldConfigs
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          new Date().toISOString(),
          itemFieldConfigsJson
        ]);
      }
      
      console.log(`✅ SQLITE - Successfully stored ${configData.categories.length} category configurations`);
    } catch (error) {
      console.error('❌ SQLITE - Error storing category configurations:', error);
      throw error;
    }
  }

  /**
   * Persist order config to SQLite (upsert). Does not delete existing rows.
   * Use when order config is fetched so getCategoryConfiguration reads per-category
   * config with itemFieldConfigs from SQLite.
   */
  async storeOrderCategoryConfigurationsInSQLite(configData: { categories: any[] }): Promise<void> {
    if (!configData?.categories?.length) {
      console.log('📦 SQLITE - No categories in order config, skipping store');
      return;
    }
    try {
      const { runSql, waitForDatabase } = await import('../utils/db');
      await waitForDatabase();

      for (const categoryConfig of configData.categories) {
        const category = categoryConfig.category;
        if (!category?.categoryId) continue;

        const fields = categoryConfig.fields || [];
        const groupingStrategy = categoryConfig.groupingStrategy;
        const locationTemplates = categoryConfig.locationTemplates || [];

        const itemFieldConfigsMap: Record<string, any[]> = {};
        const categoryItems = categoryConfig.items ?? categoryConfig.templateItems ?? categoryConfig.riskTemplateItems ?? [];
        for (const item of categoryItems) {
          const itemFields = item.fields ?? item.fieldConfig ?? item.effectiveFields ?? [];
          if (Array.isArray(itemFields) && itemFields.length > 0) {
            const key = String(item.itemPrompt ?? item.item_prompt ?? item.name ?? '').toLowerCase().trim();
            if (key) {
              itemFieldConfigsMap[key] = itemFields;
            }
          }
        }
        const itemFieldConfigsJson = Object.keys(itemFieldConfigsMap).length > 0
          ? JSON.stringify(itemFieldConfigsMap)
          : null;

        await runSql(
          `INSERT OR REPLACE INTO category_configurations (
            categoryId, categoryName, sectionName, templateName, categoryRank, isActive,
            fields, groupingStrategy, locationTemplates, summary, lastUpdated, itemFieldConfigs
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
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
            new Date().toISOString(),
            itemFieldConfigsJson
          ]
        );
      }

      console.log(`✅ SQLITE - Upserted ${configData.categories.length} category configs from order`);
    } catch (error) {
      console.error('❌ SQLITE - Error storing order category configurations:', error);
      throw error;
    }
  }

  /**
   * Persist order `GET .../categories/complete` payload to AsyncStorage (`dynamic_ui_config_*`) and SQLite.
   * Shared by SurveyDataProvider, RiskAssessmentTemplates, and prefetch (after fetch).
   */
  async applyOrderFieldConfigurationCaches(orderId: string, configData: { categories: any[] }): Promise<void> {
    if (!configData?.categories?.length) {
      console.log('📦 Order field config: no categories in payload, skipping cache hydrate');
      return;
    }
    const configurationService = (await import('./configurationService')).default;
    await configurationService.cacheOrderFieldConfigurations(orderId, configData);
    await this.storeOrderCategoryConfigurationsInSQLite(configData);
    console.log(`✅ Order field configuration caches applied for ${orderId} (${configData.categories.length} categories)`);
  }

  /**
   * Fetch order field configuration and apply to AsyncStorage + SQLite.
   * Runs at prefetch queue build so per-category type-fields calls are not needed for offline UI.
   * @returns true if categories were cached
   */
  async fetchAndApplyOrderFieldConfigurationCaches(orderNumber: string): Promise<boolean> {
    try {
      const { getOrderCategoryFieldConfigurations } = await import('../api/hierarchy');
      const response = await getOrderCategoryFieldConfigurations(orderNumber);
      if (!response?.success || !response?.data?.categories?.length) {
        console.log(
          `⚠️ PREFETCH - Order field config unavailable for ${orderNumber} (success=${response?.success}, categories=${response?.data?.categories?.length ?? 0})`
        );
        return false;
      }
      await this.applyOrderFieldConfigurationCaches(orderNumber, response.data);
      return true;
    } catch (error) {
      console.error(`❌ PREFETCH - Error fetching order field configuration for ${orderNumber}:`, error);
      return false;
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
        summary: JSON.parse(config.summary || '{}'),
        itemFieldConfigs: JSON.parse(config.itemFieldConfigs || '{}')
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
        summary: JSON.parse(config.summary || '{}'),
        itemFieldConfigs: JSON.parse(config.itemFieldConfigs || '{}')
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

  // Process media files for items in a category
  private async processMediaFilesForItems(items: any[]): Promise<void> {
    console.log(`📸 PREFETCH - Processing media files for ${items.length} items`);
    
    let totalMediaFiles = 0;
    const entitiesToPrefetch: Array<{ entityName: string; entityID: number }> = [];
    
    for (const item of items) {
      const mediaFiles =
        item.mediaFiles ?? item.MediaFiles ?? item.mediafiles ?? [];
      const itemEntityId = Number(
        item.riskAssessmentItemId ?? item.riskassessmentitemid ?? item.RiskAssessmentItemId
      );
      if (mediaFiles.length > 0) {
        console.log(`📸 PREFETCH - Found ${mediaFiles.length} media files for item ${itemEntityId}`);
        
        // Track entities that have media files for image prefetching
        if (Number.isFinite(itemEntityId)) {
          entitiesToPrefetch.push({
            entityName: 'riskAssessmentItem',
            entityID: itemEntityId
          });
        }
        
        for (const mediaFile of mediaFiles) {
          try {
            const sqliteMediaFile: MediaFile = {
              // Persist the backend media ID so the app fetches via proxy with correct ID
              BackendMediaID: Number(mediaFile.mediaId ?? mediaFile.MediaId),
              FileName: mediaFile.fileName ?? mediaFile.FileName ?? '',
              FileType: mediaFile.fileType ?? mediaFile.FileType ?? '',
              BlobURL: mediaFile.blobUrl ?? mediaFile.BlobURL ?? '',
              EntityName: 'riskAssessmentItem',
              EntityID: itemEntityId,
              UploadedAt: mediaFile.uploadedAt ?? mediaFile.UploadedAt ?? '',
              UploadedBy: mediaFile.uploadedBy ?? mediaFile.UploadedBy,
              IsDeleted: 0,
              Metadata: mediaFile.metadata ?? mediaFile.Metadata,
              pending_sync: 0 // Already synced from server
            };
            
            await insertMediaFile(sqliteMediaFile);
            totalMediaFiles++;
            console.log(`📸 PREFETCH - Inserted media file ${mediaFile.mediaId} for item ${itemEntityId}`);
          } catch (error) {
            console.error(`📸 PREFETCH - Error inserting media file ${mediaFile.mediaId}:`, error);
          }
        }
      }
    }
    
    if (totalMediaFiles > 0) {
      console.log(`✅ PREFETCH - Successfully processed ${totalMediaFiles} media files`);
      
      // Now prefetch the actual images for offline capability
      if (entitiesToPrefetch.length > 0) {
        console.log(`📸 PREFETCH - Starting image prefetch for ${entitiesToPrefetch.length} entities`);
        try {
          const prefetchResult = await imagePrefetchService.prefetchImagesForEntities(entitiesToPrefetch);
          console.log(`📸 PREFETCH - Image prefetch completed: ${prefetchResult.downloaded} downloaded, ${prefetchResult.failed} failed, ${(prefetchResult.totalSize / 1024 / 1024).toFixed(2)}MB total`);
        } catch (error) {
          console.error(`📸 PREFETCH - Error during image prefetch:`, error);
        }
      }
    } else {
      console.log(`ℹ️ PREFETCH - No media files found for any items in this category`);
    }
  }
}

// Export singleton instance
export const prefetchService = new PrefetchService();
export default prefetchService; 