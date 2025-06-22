/**
 * Simple connection status utility that doesn't rely on external packages
 */

// Remove unused NetInfo import - we'll use direct fetch for connection testing

let isConnected = true;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 10000; // 10 seconds

// Enhanced connection check with multiple fallbacks
const checkConnection = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Skip frequent checks
  if (now - lastConnectionCheck < CONNECTION_CHECK_INTERVAL) {
    return isConnected;
  }
  
  try {
    // Method 1: Try a simple HEAD request to a reliable endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for connection check
    
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        isConnected = true;
        lastConnectionCheck = now;
        return true;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.log('Primary connection check failed, trying backup...');
    }
    
    // Method 2: Try backup connection check
    const backupController = new AbortController();
    const backupTimeoutId = setTimeout(() => backupController.abort(), 3000); // 3s timeout for backup
    
    try {
      const backupResponse = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: backupController.signal,
        cache: 'no-cache'
      });
      clearTimeout(backupTimeoutId);
      
      if (backupResponse.ok) {
        isConnected = true;
        lastConnectionCheck = now;
        return true;
      }
    } catch (backupError) {
      clearTimeout(backupTimeoutId);
      console.log('Backup connection check failed');
    }
    
    // Method 3: Try a DNS lookup as final fallback
    try {
      const dnsCheck = await Promise.race([
        fetch('https://1.1.1.1', { method: 'HEAD', cache: 'no-cache' }),
        new Promise<Response>((_, reject) => {
          setTimeout(() => reject(new Error('DNS timeout')), 2000); // 2s timeout for DNS
        })
      ]);
      
      if (dnsCheck.ok) {
        isConnected = true;
        lastConnectionCheck = now;
        return true;
      }
    } catch (dnsError) {
      console.log('DNS connection check failed');
    }
    
    // All methods failed
    isConnected = false;
    lastConnectionCheck = now;
    return false;
    
  } catch (error) {
    console.error('Connection check error:', error);
    isConnected = false;
    lastConnectionCheck = now;
    return false;
  }
};

const connectionUtils = {
  isConnected: () => isConnected,
  
  checkConnection,
  
  // Force a fresh connection check
  forceCheck: async (): Promise<boolean> => {
    lastConnectionCheck = 0; // Reset cache
    return await checkConnection();
  },
  
  // Get connection status with automatic check if needed
  getStatus: async (): Promise<boolean> => {
    return await checkConnection();
  }
};

export default connectionUtils; 