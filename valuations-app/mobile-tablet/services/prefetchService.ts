import api from '../api';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/apiConfig';
import {
  insertRiskAssessmentItem,
  getAllRiskAssessmentItems,
  RiskAssessmentItem,
  waitForDatabase,
  isDatabaseReady
} from '../utils/db';

// Types
interface PrefetchTask {
  id: string;
  type: 'category' | 'section' | 'template';
  categoryId?: string;
  sectionId?: string;
  assessmentId?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed';
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

      // Start processing queue in background
      this.processQueueInBackground();
      return true;

    } catch (error) {
      console.error('❌ Error starting prefetch:', error);
      this.cleanup();
      return false;
    }
  }

  // Build prefetch queue based on appointment/order data
  private async buildPrefetchQueue(appointmentId: string, orderNumber?: string): Promise<boolean> {
    try {
      console.log(`📋 Building prefetch queue for appointment ${appointmentId}`);
      
      let templates: any[] = [];

      // Try to get templates from order number if available
      if (orderNumber) {
        console.log(`🔍 Fetching templates for order: ${orderNumber}`);
        const templatesResponse = await this.fetchTemplatesByOrderId(orderNumber);
        if (templatesResponse.success && templatesResponse.data) {
          templates = templatesResponse.data;
        }
      }

      // If no templates found, try to get from appointment
      if (templates.length === 0) {
        console.log(`🔍 No order templates found, trying appointment-based templates`);
        // You might need to implement this based on your API structure
        templates = await this.getDefaultTemplates();
      }

      // Build tasks for each template
      for (const template of templates) {
        const assessmentId = template.riskassessmentid || template.assessmentid;
        if (!assessmentId) continue;

        console.log(`📝 Processing template: ${template.assessmenttypename} (ID: ${assessmentId})`);
        
        // Get sections for this template
        const sections = await this.getTemplateSections(assessmentId);
        
        for (const section of sections) {
          // Get categories for this section
          const categories = await this.getSectionCategories(section.riskassessmentsectionid);
          
          for (const category of categories) {
            const priority = this.getCategoryPriority(category, template.assessmenttypename);
            
            const task: PrefetchTask = {
              id: `category-${category.riskassessmentcategoryid}`,
              type: 'category',
              categoryId: category.riskassessmentcategoryid.toString(),
              priority,
              status: 'pending'
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

      console.log(`✅ Built prefetch queue with ${this.queue.length} tasks`);
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
      console.error('❌ Error building prefetch queue:', error);
      return false;
    }
  }

  // Process queue in background with controlled batching
  private async processQueueInBackground() {
    console.log(`🚀 Starting background processing of ${this.queue.length} tasks`);
    
    // Rate limiting: Process max 3 requests concurrently with delays
    const MAX_CONCURRENT = 3;
    const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches
    const DELAY_BETWEEN_REQUESTS = 500; // 500ms between individual requests
    
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
          if (task.categoryId) {
            await this.prefetchCategoryItems(task.categoryId);
            this.emitCategoryCompleted(task.categoryId);
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

  // Prefetch items for a specific category
  private async prefetchCategoryItems(categoryId: string): Promise<void> {
    // Ensure database is ready before proceeding
    if (!isDatabaseReady()) {
      console.log(`⏳ Database not ready, waiting for initialization...`);
      await waitForDatabase();
      console.log(`✅ Database ready, proceeding with category ${categoryId}`);
    }
    
    // Check if already cached
    const existingItems = await getAllRiskAssessmentItems();
    const categoryItems = existingItems.filter(item => 
      String(item.riskassessmentcategoryid) === String(categoryId)
    );

    if (categoryItems.length > 0) {
      console.log(`📦 PREFETCH - Category ${categoryId} already cached (${categoryItems.length} items)`);
      return;
    }

    console.log(`📡 PREFETCH - Fetching items for category ${categoryId}`);
    
    const response = await api.getRiskAssessmentItems(categoryId);
    
    console.log(`🔍 PREFETCH DEBUG - API Response:`, {
      success: response?.success,
      status: response?.status,
      fromCache: response?.fromCache,
      dataType: typeof response?.data,
      isArray: Array.isArray(response?.data),
      dataLength: Array.isArray(response?.data) ? response.data.length : 'N/A'
    });
    
    if (response?.success && response?.data) {
      let itemsToProcess = [];
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        itemsToProcess = response.data;
        console.log(`📋 PREFETCH - Direct array structure with ${itemsToProcess.length} items`);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        itemsToProcess = response.data.data;
        console.log(`📋 PREFETCH - Nested data structure with ${itemsToProcess.length} items`);
      } else {
        console.error(`❌ PREFETCH - Unexpected data structure:`, response.data);
        throw new Error(`Unexpected data structure for category ${categoryId}`);
      }
      
      console.log(`💾 PREFETCH - Processing ${itemsToProcess.length} items for category ${categoryId}`);
      console.log(`🔍 PREFETCH - Full items array:`, JSON.stringify(itemsToProcess, null, 2));
      
      // Store each item in SQLite
      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];
        console.log(`📝 PREFETCH - Processing item ${i + 1}/${itemsToProcess.length}:`, {
          riskassessmentitemid: item.riskassessmentitemid,
          riskassessmentcategoryid: item.riskassessmentcategoryid,
          itemprompt: item.itemprompt,
          itemtype: item.itemtype,
          rank: item.rank
        });
        
        const sqliteItem: RiskAssessmentItem = {
          riskassessmentitemid: Number(item.riskassessmentitemid),
          riskassessmentcategoryid: Number(item.riskassessmentcategoryid),
          itemprompt: item.itemprompt || '',
          itemtype: Number(item.itemtype) || 0,
          rank: Number(item.rank) || 0,
          commaseparatedlist: item.commaseparatedlist || '',
          selectedanswer: item.selectedanswer || '',
          qty: Number(item.qty) || 0,
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
          pending_sync: 0
        };
        
        //console.log(`💽 PREFETCH - Converted SQLite item ${i + 1}:`, sqliteItem);
        
        try {
          await insertRiskAssessmentItem(sqliteItem);
          console.log(`✅ PREFETCH - Successfully inserted item ${i + 1} (ID: ${sqliteItem.riskassessmentitemid})`);
        } catch (insertError) {
          console.error(`❌ PREFETCH - Failed to insert item ${i + 1}:`, insertError);
          console.error(`❌ PREFETCH - Failed item data:`, sqliteItem);
          throw insertError;
        }
      }
      
      // Verify the insertion by counting items in the category
      const verifyItems = await getAllRiskAssessmentItems();
      const verifyCount = verifyItems.filter(item => 
        String(item.riskassessmentcategoryid) === String(categoryId)
      ).length;
      
      console.log(`🔍 PREFETCH - Verification: ${verifyCount} items now in SQLite for category ${categoryId}`);
      
    } else {
      console.error(`❌ PREFETCH - Failed API response for category ${categoryId}:`, response);
      throw new Error(`Failed to fetch items for category ${categoryId}`);
    }
  }

  // Helper methods
  private async fetchTemplatesByOrderId(orderId: string): Promise<any> {
    try {
      const fullUrl = `${API_BASE_URL}/risk-assessment-master/by-order/${orderId}?page=1&pageSize=20`;
      console.log(`🌐 PREFETCH SERVICE - FULL URL: ${fullUrl}`);
      
      // Get authentication token
      const token = await AsyncStorage.getItem('authToken');
      console.log(`🔑 PREFETCH SERVICE - AUTH TOKEN: ${token ? `Bearer ${token.substring(0, 20)}...` : 'NO TOKEN'}`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
      });
      
      console.log(`📡 PREFETCH SERVICE - Response status: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      console.log(`📦 PREFETCH SERVICE - Response data: ${JSON.stringify(data, null, 2)}`);
      
      return {
        success: response.ok,
        data: Array.isArray(data) ? data : data.data || []
      };
    } catch (error) {
      console.error(`❌ PREFETCH SERVICE - Error fetching templates:`, error);
      return { success: false, data: [] };
    }
  }

  private async getDefaultTemplates(): Promise<any[]> {
    // Implement based on your default template logic
    return [];
  }

  private async getTemplateSections(assessmentId: string): Promise<any[]> {
    const response = await api.getRiskAssessmentSections(assessmentId);
    return response?.success && response.data ? response.data : [];
  }

  private async getSectionCategories(sectionId: string): Promise<any[]> {
    const response = await api.getRiskAssessmentCategories(sectionId);
    return response?.success && response.data ? response.data : [];
  }

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