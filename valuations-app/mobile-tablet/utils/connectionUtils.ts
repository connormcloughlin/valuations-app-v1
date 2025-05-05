/**
 * Simple connection status utility that doesn't rely on external packages
 */

// Attempt to fetch a small resource to test connectivity
export const checkConnection = async (): Promise<boolean> => {
  try {
    // Use a very fast endpoint to check connectivity
    // You might want to replace this with your own API endpoint
    const response = await fetch('https://httpbin.org/status/200', { 
      method: 'HEAD',
      // Short timeout to quickly determine if we're offline
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    
    return response.ok;
  } catch (error) {
    console.log('Connection check failed:', error);
    return false;
  }
};

// Global connection status for the app to reference
let _isConnected = true;

// Update the global connection status
export const updateConnectionStatus = async (): Promise<boolean> => {
  try {
    const status = await checkConnection();
    _isConnected = status;
    console.log('Connection status updated:', status ? 'Online' : 'Offline');
    return status;
  } catch (e) {
    _isConnected = false;
    return false;
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