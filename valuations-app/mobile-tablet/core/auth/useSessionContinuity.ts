/**
 * Session Continuity Hook
 * 
 * Provides UI instrumentation for session continuity features including:
 * - Time remaining until soft/hard expiry
 * - Current refresh status
 * - Number of queued requests
 * - Continuity event handling
 */

import { useState, useEffect, useCallback } from 'react';
import sessionService from './sessionService';

interface SessionContinuityState {
  timeToSoftExpiry: number; // milliseconds
  timeToHardExpiry: number; // milliseconds
  refreshStatus: 'idle' | 'refreshing' | 'success' | 'temporary-failure' | 'hard-failure';
  queuedRequests: number;
  isInSoftWindow: boolean;
  isInHardWindow: boolean;
  metrics: {
    refreshCount: number;
    refreshFailureCount: number;
    queuedRequestsCount: number;
    deduplicatedRequestsCount: number;
  };
}

interface SessionContinuityActions {
  refreshNow: () => Promise<boolean>;
  clearQueue: () => void;
  addEventListener: (listener: (event: string, data?: any) => void) => void;
  removeEventListener: (listener: (event: string, data?: any) => void) => void;
}

export function useSessionContinuity(): SessionContinuityState & SessionContinuityActions {
  const [state, setState] = useState<SessionContinuityState>({
    timeToSoftExpiry: 0,
    timeToHardExpiry: 0,
    refreshStatus: 'idle',
    queuedRequests: 0,
    isInSoftWindow: false,
    isInHardWindow: false,
    metrics: {
      refreshCount: 0,
      refreshFailureCount: 0,
      queuedRequestsCount: 0,
      deduplicatedRequestsCount: 0
    }
  });

  // Update state from session service
  const updateState = useCallback(async () => {
    try {
      const session = await sessionService.getCurrentSession();
      const metrics = sessionService.getMetrics();
      
      const now = Date.now();
      const timeToSoftExpiry = session ? Math.max(0, session.softExpiry - now) : 0;
      const timeToHardExpiry = session ? Math.max(0, session.hardExpiry - now) : 0;
      
      setState(prev => ({
        ...prev,
        timeToSoftExpiry,
        timeToHardExpiry,
        isInSoftWindow: timeToSoftExpiry === 0 && timeToHardExpiry > 0,
        isInHardWindow: timeToHardExpiry === 0,
        metrics
      }));
    } catch (error) {
      console.error('❌ Error updating session continuity state:', error);
    }
  }, []);

  // Event listener for continuity events
  const handleContinuityEvent = useCallback((event: string, data?: any) => {
    console.log('📡 Session continuity event received:', event, data);
    
    setState(prev => {
      switch (event) {
        case 'session:refresh-started':
          return { ...prev, refreshStatus: 'refreshing' };
        case 'session:refresh-success':
          return { ...prev, refreshStatus: 'success' };
        case 'session:refresh-temporary-failure':
          return { ...prev, refreshStatus: 'temporary-failure' };
        case 'session:refresh-hard-failure':
          return { ...prev, refreshStatus: 'hard-failure' };
        case 'session:queue-drained':
          return { 
            ...prev, 
            queuedRequests: 0,
            refreshStatus: 'idle'
          };
        default:
          return prev;
      }
    });
    
    // Update state after event
    setTimeout(updateState, 100);
  }, [updateState]);

  // Actions
  const refreshNow = useCallback(async (): Promise<boolean> => {
    try {
      return await sessionService.refreshIfStale();
    } catch (error) {
      console.error('❌ Error refreshing session:', error);
      return false;
    }
  }, []);

  const clearQueue = useCallback(() => {
    // This would require exposing a clearQueue method from sessionService
    console.log('🧹 Queue clear requested (not implemented in sessionService)');
  }, []);

  const addEventListener = useCallback((listener: (event: string, data?: any) => void) => {
    sessionService.addEventListener(listener);
  }, []);

  const removeEventListener = useCallback((listener: (event: string, data?: any) => void) => {
    sessionService.removeEventListener(listener);
  }, []);

  // Set up event listeners and periodic updates
  useEffect(() => {
    // Add our event listener
    sessionService.addEventListener(handleContinuityEvent);
    
    // Initial state update
    updateState();
    
    // Update state every 5 seconds
    const interval = setInterval(updateState, 5000);
    
    return () => {
      sessionService.removeEventListener(handleContinuityEvent);
      clearInterval(interval);
    };
  }, [handleContinuityEvent, updateState]);

  return {
    ...state,
    refreshNow,
    clearQueue,
    addEventListener,
    removeEventListener
  };
}

export default useSessionContinuity;
