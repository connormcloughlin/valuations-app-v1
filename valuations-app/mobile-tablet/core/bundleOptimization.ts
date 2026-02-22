/**
 * Bundle Optimization Service
 * Handles lazy loading and code splitting for better performance
 */

interface LazyModule {
  load: () => Promise<any>;
  loaded: boolean;
  loading: boolean;
}

class BundleOptimizationService {
  private modules = new Map<string, LazyModule>();
  private preloadQueue: string[] = [];

  /**
   * Register a lazy module
   */
  registerModule(name: string, loader: () => Promise<any>): void {
    this.modules.set(name, {
      load: loader,
      loaded: false,
      loading: false
    });
  }

  /**
   * Load a module with caching
   */
  async loadModule<T>(name: string): Promise<T> {
    const module = this.modules.get(name);
    
    if (!module) {
      throw new Error(`Module ${name} not registered`);
    }

    if (module.loaded) {
      console.log(`📦 Module ${name} already loaded`);
      return module.load() as Promise<T>;
    }

    if (module.loading) {
      console.log(`⏳ Module ${name} already loading, waiting...`);
      // Wait for the current load to complete
      while (module.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return module.load() as Promise<T>;
    }

    try {
      module.loading = true;
      console.log(`📦 Loading module ${name}...`);
      
      const result = await module.load();
      module.loaded = true;
      module.loading = false;
      
      console.log(`✅ Module ${name} loaded successfully`);
      return result;
    } catch (error) {
      module.loading = false;
      console.error(`❌ Failed to load module ${name}:`, error);
      throw error;
    }
  }

  /**
   * Preload modules in the background
   */
  async preloadModules(moduleNames: string[]): Promise<void> {
    console.log(`🚀 Preloading modules: ${moduleNames.join(', ')}`);
    
    const preloadPromises = moduleNames.map(async (name) => {
      try {
        await this.loadModule(name);
      } catch (error) {
        console.warn(`⚠️ Failed to preload module ${name}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log(`✅ Preloading completed`);
  }

  /**
   * Queue modules for preloading
   */
  queueForPreload(moduleNames: string[]): void {
    this.preloadQueue.push(...moduleNames);
  }

  /**
   * Process preload queue
   */
  async processPreloadQueue(): Promise<void> {
    if (this.preloadQueue.length === 0) return;
    
    const modulesToPreload = [...this.preloadQueue];
    this.preloadQueue = [];
    
    await this.preloadModules(modulesToPreload);
  }

  /**
   * Get module loading status
   */
  getModuleStatus(name: string): { loaded: boolean; loading: boolean } {
    const module = this.modules.get(name);
    return module ? { loaded: module.loaded, loading: module.loading } : { loaded: false, loading: false };
  }

  /**
   * Clear all modules (for testing)
   */
  clear(): void {
    this.modules.clear();
    this.preloadQueue = [];
  }
}

export const bundleOptimization = new BundleOptimizationService();

// Register critical modules for lazy loading
bundleOptimization.registerModule('prefetchService', () => import('../services/prefetchService'));
bundleOptimization.registerModule('apiConfig', () => import('../constants/apiConfig'));
bundleOptimization.registerModule('dbUtils', () => import('../utils/db'));
bundleOptimization.registerModule('requestDeduplication', () => import('./requestDeduplication'));
bundleOptimization.registerModule('cacheService', () => import('./cacheService'));

// Queue non-critical modules for preloading
bundleOptimization.queueForPreload(['prefetchService', 'apiConfig', 'requestDeduplication']);
