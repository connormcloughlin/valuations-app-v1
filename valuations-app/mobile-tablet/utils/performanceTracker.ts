/**
 * Simple performance tracker for React Native
 * Tracks component render counts and performance metrics
 */

interface RenderMetric {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  totalRenderTime: number;
}

class PerformanceTracker {
  private metrics: Map<string, RenderMetric> = new Map();
  private startTime: number = Date.now();

  /**
   * Track a component render
   */
  trackRender(componentName: string, renderTime: number = Date.now()): void {
    const existing = this.metrics.get(componentName);
    
    if (existing) {
      existing.renderCount += 1;
      existing.lastRenderTime = renderTime;
      existing.totalRenderTime += renderTime - existing.lastRenderTime;
    } else {
      this.metrics.set(componentName, {
        componentName,
        renderCount: 1,
        lastRenderTime: renderTime,
        totalRenderTime: 0
      });
    }
  }

  /**
   * Get render statistics for a component
   */
  getStats(componentName: string): RenderMetric | null {
    return this.metrics.get(componentName) || null;
  }

  /**
   * Get all render statistics
   */
  getAllStats(): RenderMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get performance summary
   */
  getSummary(): string {
    const stats = this.getAllStats();
    const totalRenders = stats.reduce((sum, stat) => sum + stat.renderCount, 0);
    const sessionTime = Date.now() - this.startTime;
    
    let summary = `📊 Performance Summary (${(sessionTime / 1000).toFixed(1)}s):\n`;
    summary += `Total Renders: ${totalRenders}\n`;
    summary += `Components: ${stats.length}\n\n`;
    
    // Sort by render count (highest first)
    const sortedStats = stats.sort((a, b) => b.renderCount - a.renderCount);
    
    summary += 'Top Components:\n';
    sortedStats.slice(0, 5).forEach(stat => {
      summary += `• ${stat.componentName}: ${stat.renderCount} renders\n`;
    });
    
    return summary;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.startTime = Date.now();
    console.log('📊 Performance Tracker: Reset all metrics');
  }

  /**
   * Log current performance status
   */
  logStatus(): void {
    console.log(this.getSummary());
  }

  /**
   * Check for performance issues
   */
  checkPerformanceIssues(): string[] {
    const issues: string[] = [];
    const stats = this.getAllStats();
    
    stats.forEach(stat => {
      // Flag components with high render counts
      if (stat.renderCount > 10) {
        issues.push(`${stat.componentName}: ${stat.renderCount} renders (high)`);
      }
      
      // Flag components with rapid re-renders
      if (stat.renderCount > 5 && stat.totalRenderTime < 1000) {
        issues.push(`${stat.componentName}: ${stat.renderCount} renders in ${stat.totalRenderTime}ms (rapid)`);
      }
    });
    
    return issues;
  }
}

// Global performance tracker instance
export const performanceTracker = new PerformanceTracker();

/**
 * Hook to track component renders
 */
export function usePerformanceTracking(componentName: string, logToConsole: boolean = true) {
  const renderTime = Date.now();
  
  // Track the render
  performanceTracker.trackRender(componentName, renderTime);
  
  // Log to console if enabled
  if (logToConsole && __DEV__) {
    const stats = performanceTracker.getStats(componentName);
    if (stats) {
      console.log(`🔄 ${componentName} rendered ${stats.renderCount} times`);
    }
  }
}

/**
 * Log performance summary
 */
export function logPerformanceSummary(): void {
  performanceTracker.logStatus();
}

/**
 * Check for performance issues
 */
export function checkPerformanceIssues(): void {
  const issues = performanceTracker.checkPerformanceIssues();
  
  if (issues.length > 0) {
    console.warn('⚠️ Performance Issues Detected:');
    issues.forEach(issue => console.warn(`  • ${issue}`));
  } else {
    console.log('✅ No performance issues detected');
  }
}

/**
 * Reset performance tracking
 */
export function resetPerformanceTracking(): void {
  performanceTracker.reset();
}





