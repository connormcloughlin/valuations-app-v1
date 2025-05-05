import NetInfo from '@react-native-community/netinfo';

// Global connectivity status
let isConnected = true;

// Initialize network listener
export const initNetworkListener = () => {
  // Subscribe to network state updates
  const unsubscribe = NetInfo.addEventListener(state => {
    isConnected = state.isConnected ?? false;
    console.log('Network connection status:', isConnected ? 'Connected' : 'Disconnected');
  });

  return unsubscribe;
};

// Check if the device is currently connected to the internet
export const checkConnection = async (): Promise<boolean> => {
  try {
    const networkState = await NetInfo.fetch();
    isConnected = networkState.isConnected ?? false;
    return isConnected;
  } catch (error) {
    console.error('Error checking network connection:', error);
    return false;
  }
};

// Get current connection status without checking (uses cached value)
export const isNetworkConnected = (): boolean => {
  return isConnected;
};

export default {
  initNetworkListener,
  checkConnection,
  isNetworkConnected,
}; 