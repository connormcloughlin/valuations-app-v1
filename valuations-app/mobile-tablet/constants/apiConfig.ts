import Constants from 'expo-constants';

// API base URL for the mobile-tablet app
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 
                           Constants.expoConfig?.extra?.apiBaseUrl || 
                           'https://ca-valuations-api-test.purplebeach-27e5a02b.uksouth.azurecontainerapps.io/api'; 