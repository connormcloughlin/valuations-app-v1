import transportClient from './transportClient';
import { getAuthHeaders } from './headerProvider';

/**
 * Initialize transport client with authentication
 * This should be called during app startup
 */
export function initializeTransportClient(): void {
  // Set the header provider for authentication
  transportClient.setHeaderProvider(getAuthHeaders);
  
  console.log('🚀 Transport client initialized with authentication');
}

// Auto-initialize when this module is imported
initializeTransportClient();
