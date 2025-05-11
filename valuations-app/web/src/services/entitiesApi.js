import axios from 'axios';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../authConfig';

// Define the API endpoint for entities
const API_BASE_URL = process.env.REACT_APP_ENTITIES_API_URL || 'http://localhost:5010/api';

// Create MSAL instance for authentication
const msalInstance = new PublicClientApplication(msalConfig);

// Create axios instance with default config
const entitiesApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
entitiesApi.interceptors.request.use(async (config) => {
  try {
    const account = msalInstance.getActiveAccount();
    if (account) {
      const response = await msalInstance.acquireTokenSilent({
        scopes: ['api://c75f9388-4a96-4f8b-9232-4b031bf5db0c/access_as_user']
      });
      config.headers.Authorization = `Bearer ${response.accessToken}`;
    }
    return config;
  } catch (error) {
    console.error('Error acquiring token:', error);
    return Promise.reject(error);
  }
});

// Add response interceptor for better error handling
entitiesApi.interceptors.response.use(
  response => response,
  error => {
    console.error('Entities API request failed:', error);
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }
);

// Get customer by ID
const getCustomerById = async (id) => {
  if (!id) {
    console.error('Customer ID is required for lookup');
    return { 
      id: 0,
      name: 'Unknown',
      email: '',
      phone: '',
      address: '' 
    };
  }

  console.log(`ENTITIES API: Looking up customer with ID: ${id}`);
  
  try {
    // First approach: Try getting customer data from direct entities endpoint
    try {
      console.log(`Trying entities endpoint for customer ${id}`);
      const response = await entitiesApi.get(`/entities/${id}`);
      
      if (response.data && response.data.name && typeof response.data.name === 'string') {
        console.log(`Success! Found customer name from entities endpoint: ${response.data.name}`);
        return {
          id: id,
          name: response.data.name,
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || ''
        };
      }
    } catch (error) {
      console.log(`Entities endpoint failed for customer ${id}: ${error.message}`);
    }
    
    // Second approach: Try the client endpoint from order-form API
    try {
      console.log(`Trying order-form client endpoint for customer ${id}`);
      const response = await entitiesApi.get(`/api/order-form/client/${id}`);
      
      if (response.data && response.data.clientsname && typeof response.data.clientsname === 'string') {
        console.log(`Success! Found customer name from order-form client endpoint: ${response.data.clientsname}`);
        return {
          id: id,
          name: response.data.clientsname,
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || ''
        };
      }
    } catch (error) {
      console.log(`Order-form client endpoint failed for customer ${id}: ${error.message}`);
    }
    
    // Third approach: Try a direct lookup in the orders table
    // This is a fallback since we should already have the customer data via the first two approaches
    try {
      console.log(`Trying to find customer ${id} in orders data`);
      const response = await entitiesApi.get(`/api/order-form?customerId=${id}`);
      
      if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const orderData = response.data.data[0];
        let customerName = orderData.clientsname || orderData.ClientName;
        
        if (customerName && typeof customerName === 'string') {
          console.log(`Success! Found customer name from orders: ${customerName}`);
          return {
            id: id,
            name: customerName,
            email: '',
            phone: '',
            address: ''
          };
        }
      }
    } catch (error) {
      console.log(`Order lookup failed for customer ${id}: ${error.message}`);
    }
    
    // If all approaches failed, return a generic name
    console.warn(`All customer lookup approaches failed for ID ${id}`);
    return {
      id: id,
      name: 'Unknown',
      email: '',
      phone: '',
      address: ''
    };
  } catch (error) {
    console.error(`Error in customer lookup for ${id}:`, error);
    return {
      id: id,
      name: 'Unknown',
      email: '',
      phone: '',
      address: ''
    };
  }
};

// Get all customers
const getAllCustomers = async () => {
  try {
    console.log('Fetching all customers');
    
    // Try the entities endpoint first
    try {
      const response = await entitiesApi.get('/entities');
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(customer => ({
          id: customer.id || customer.Id,
          name: customer.name || customer.Name || 'Unknown',
          email: customer.email || customer.Email || '',
          phone: customer.phone || customer.Phone || '',
          address: customer.address || customer.Address || ''
        }));
      }
    } catch (error) {
      console.warn(`Could not get customers from entities endpoint: ${error.message}`);
    }
    
    // Then try the order-form clients endpoint
    try {
      const response = await entitiesApi.get('/api/order-form/clients');
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(client => ({
          id: client.clientid || client.ClientId,
          name: client.clientsname || client.ClientName || 'Unknown',
          email: client.email || client.Email || '',
          phone: client.phone || client.Phone || '',
          address: client.address || client.Address || ''
        }));
      }
    } catch (error) {
      console.warn(`Could not get customers from order-form clients endpoint: ${error.message}`);
    }
    
    // If all APIs fail, return empty array
    console.warn('No customer data available from any endpoint');
    return [];
    
  } catch (error) {
    console.error('Error fetching all customers:', error);
    return [];
  }
};

// Get customer cache - maintains a local cache of customer data to reduce API calls
const customerCache = new Map();

// Get customer by ID with caching
const getCustomerByIdCached = async (id) => {
  if (!id) {
    console.warn('No customer ID provided to getCustomerByIdCached');
    return { id: 0, name: 'Unknown', email: '', phone: '', address: '' };
  }
  
  // If customer is in cache, return cached data
  if (customerCache.has(id)) {
    console.log(`Using cached data for customer ${id}`);
    const cachedCustomer = customerCache.get(id);
    
    // Don't use cached data if it has "Client" in the name
    if (cachedCustomer && cachedCustomer.name && 
        !cachedCustomer.name.includes('Client') && 
        !cachedCustomer.name.includes('Unknown')) {
      return cachedCustomer;
    } else {
      console.log("Cached data had invalid name, re-fetching");
      // Invalid cached data, clear and continue to fetch
      customerCache.delete(id);
    }
  }

  // Otherwise fetch from API and cache the result
  try {
    console.log(`Fetching and caching data for customer ${id}`);
    const customer = await getCustomerById(id);
    
    // Only cache if we got a real name
    if (customer && customer.name && 
        typeof customer.name === 'string' && 
        !customer.name.includes('Client') &&
        !customer.name.includes('Unknown')) {
      customerCache.set(id, customer);
    }
    
    return customer;
  } catch (error) {
    console.error(`Error fetching customer ${id} with caching:`, error);
    // Return a placeholder object if API fails
    return { 
      id, 
      name: 'Unknown', 
      email: '', 
      phone: '', 
      address: '' 
    };
  }
};

// Clear cache - useful when you know data has been updated
const clearCustomerCache = () => {
  console.log('Clearing customer cache');
  customerCache.clear();
};

// Create an entitiesService object to export
const entitiesService = {
  getCustomerById,
  getAllCustomers,
  getCustomerByIdCached,
  clearCustomerCache
};

// Export the service
export default entitiesService; 