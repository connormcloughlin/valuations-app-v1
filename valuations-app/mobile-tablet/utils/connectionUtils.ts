/**
 * Simple connection status utility that doesn't rely on external packages
 */

// Attempt to fetch a small resource to test connectivity
export const checkConnection = async (): Promise<boolean> => {
  try {
    // Try multiple endpoints to be more resilient
    // First try our own API server using the same endpoint that shows success elsewhere
    try {
      // Use the known API URL directly but only make a HEAD request to minimize traffic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout for API check
      
      const response = await fetch('http://192.168.0.102:5000/api/health', { 
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return true;
      }
    } catch (apiError) {
      console.log('API connection check failed, trying fallback:', apiError);
    }
    
    // Fallback to a public service if our API fails
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 5000); // Extended timeout
    });

    // Use a reliable public service as fallback
    const fetchPromise = fetch('https://www.google.com', { 
      method: 'HEAD',
      cache: 'no-store',
    });
    
    // Race the fetch against the timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    return response.ok;
  } catch (error) {
    console.log('All connection checks failed:', error);
    return false;
  }
};

// Global connection status and timing variables
let _isConnected = true;
let _lastCheckTime = 0;
let _checkInProgress = false;
let _lastCheckResult = true;
const CHECK_INTERVAL_MIN = 60000; // Increase to 60 seconds minimum between checks

// Update the global connection status with debouncing
export const updateConnectionStatus = async (): Promise<boolean> => {
  const now = Date.now();
  
  // If a check is already in progress, return the last known result
  if (_checkInProgress) {
    console.log('Connection check already in progress, returning cached status');
    return _lastCheckResult;
  }
  
  // If we've checked recently, don't check again
  if (now - _lastCheckTime < CHECK_INTERVAL_MIN) {
    console.log(`Skipping connection check - last check was ${(now - _lastCheckTime) / 1000}s ago`);
    return _isConnected;
  }
  
  try {
    _checkInProgress = true;
    _lastCheckTime = now;
    
    const status = await checkConnection();
    _lastCheckResult = status;
    
    // Only log if status changed
    if (_isConnected !== status) {
      console.log('Connection status changed to:', status ? 'Online' : 'Offline');
      _isConnected = status;
    }
    
    return status;
  } catch (e) {
    console.error('Connection update error:', e);
    _lastCheckResult = false;
    _isConnected = false;
    return false;
  } finally {
    _checkInProgress = false;
  }
};

// Get the last known connection status without making a network request
export const isConnected = (): boolean => {
  return _isConnected;
};

export default {
  checkConnection,
  updateConnectionStatus,
  isConnected,
}; 