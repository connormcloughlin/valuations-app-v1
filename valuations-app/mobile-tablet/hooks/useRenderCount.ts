import { useEffect, useRef } from 'react';
import { usePerformanceTracking } from '../utils/performanceTracker';

/**
 * Hook to track component re-renders for performance monitoring
 * @param componentName - Name of the component for logging
 * @param logToConsole - Whether to log render counts to console
 */
export function useRenderCount(componentName: string, logToConsole: boolean = true) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;
    
    // Use performance tracker
    usePerformanceTracking(componentName, logToConsole);
    
    if (logToConsole && __DEV__) {
      console.log(`🔄 ${componentName} rendered ${renderCount.current} times (${timeSinceLastRender}ms since last render)`);
    }
  });
  
  return {
    renderCount: renderCount.current,
    resetRenderCount: () => {
      renderCount.current = 0;
      lastRenderTime.current = Date.now();
    }
  };
}

/**
 * Hook to track re-renders with detailed timing information
 * @param componentName - Name of the component
 * @param dependencies - Array of dependencies to track
 */
export function useRenderTracker(componentName: string, dependencies: any[] = []) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const lastDependencies = useRef(dependencies);
  
  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;
    
    // Check which dependencies changed
    const changedDependencies = dependencies.map((dep, index) => ({
      index,
      oldValue: lastDependencies.current[index],
      newValue: dep,
      changed: lastDependencies.current[index] !== dep
    })).filter(dep => dep.changed);
    
    console.log(`🔄 ${componentName} render #${renderCount.current}:`, {
      timeSinceLastRender: `${timeSinceLastRender}ms`,
      changedDependencies: changedDependencies.length > 0 ? changedDependencies : 'No changes',
      allDependencies: dependencies
    });
    
    lastDependencies.current = dependencies;
  });
  
  return {
    renderCount: renderCount.current,
    resetRenderCount: () => {
      renderCount.current = 0;
      lastRenderTime.current = Date.now();
    }
  };
}
