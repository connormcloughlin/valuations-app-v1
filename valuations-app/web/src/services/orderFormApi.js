import axios from 'axios';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../authConfig';
import entitiesApi from './entitiesApi';

// Define the new API endpoint for order forms
const API_BASE_URL = process.env.REACT_APP_ORDER_FORM_API_URL || 'http://localhost:5010/api';

// Create MSAL instance for authentication
const msalInstance = new PublicClientApplication(msalConfig);

// Create axios instance with default config
const orderFormApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
orderFormApi.interceptors.request.use(async (config) => {
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
orderFormApi.interceptors.response.use(
  response => response,
  error => {
    console.error('API request failed:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }
);

// Helper functions for mapping data
const mapOrderResponseToOrder = (orderData) => {
  // Map from new API format to application's internal format
  if (!orderData) {
    console.error('Invalid order data received:', orderData);
    return {
      id: 0,
      customerId: null,
      customerName: 'Unknown',
      type: 'unknown',
      orderDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      priority: 'normal'
    };
  }
  
  // Extract the client ID - this is critical for customer name lookup
  const clientId = orderData.clientid || orderData.ClientId;
  
  console.log(`Mapping order response, clientId extracted: ${clientId}`, orderData);
  
  // Store the original data for potential customer name extraction
  const originalData = { ...orderData };
  
  // Customer name will be looked up via the entities API using the client ID
  return {
    id: orderData.orderid || orderData.OrderId || 0,
    customerId: clientId, // This is the key field used for customer name lookup
    customerName: null, // Will be populated by entities API lookup
    type: getOrderTypeFromValue(orderData.ordertype || orderData.OrderType),
    orderDate: orderData.datereceived ? new Date(orderData.datereceived).toISOString().split('T')[0] : 
               orderData.DateReceived ? new Date(orderData.DateReceived).toISOString().split('T')[0] : 
               new Date().toISOString().split('T')[0],
    dueDate: orderData.datecompleted ? new Date(orderData.datecompleted).toISOString().split('T')[0] : 
             orderData.DateCompleted ? new Date(orderData.DateCompleted).toISOString().split('T')[0] : 
             '',
    status: getOrderStatusFromValue(orderData.orderstatus || orderData.OrderStatus),
    priority: 'normal', // Default value, adjust based on your needs
    brokerReference: orderData.brokerid || orderData.BrokerId || '',
    insurerReference: orderData.underwriterid || orderData.UnderwriterId || '',
    notes: orderData.specialinstructions || orderData.SpecialInstructions || '',
    propertyAddress: orderData.partypostal1 || orderData.PropertyAddress || '',
    contentsSumInsured: orderData.contentssuminsured || orderData.ContentsSumInsured || 0,
    currentHouseowners: orderData.currenthouseowners || orderData.CurrentHouseowners || '',
    brokerName: orderData.brokername || orderData.BrokerName || '',
    insurerName: orderData.underwritername || orderData.UnderwriterName || '',
    policyNumber: orderData.clientspolicynumber || orderData.PolicyNumber || '',
    surveyorId: orderData.surveyorid || orderData.SurveyorId,
    riskAssessmentId: orderData.risk_assessment_id || orderData.RiskAssessmentId,
    occupierName: orderData.OccupierName || '',
    occupierPhoneNumber: orderData.OccupierPhone || '',
    occupierEmail: orderData.OccupierEmail || '',
    propertyType: orderData.PropertyType || '',
    yearBuilt: orderData.YearBuilt || '',
    numberOfBedrooms: orderData.NumBedrooms || 0,
    buildingSumInsured: orderData.BuildingsSumInsured || 0,
    originalData: originalData // Store the original data
  };
};

// Enhance order data with customer information from the entities API
const enrichOrderWithCustomerData = async (order) => {
  if (!order) {
    console.error('Cannot enrich null or undefined order');
    return { 
      id: 0,
      customerName: 'Unknown Client',
      type: 'unknown',
      status: 'pending',
      priority: 'normal'
    };
  }
  
  // CRITICAL: Look up customer name using customerId
  if (order.customerId) {
    try {
      console.log(`Attempting to get customer name for ID: ${order.customerId} from entities API`);
      const customer = await entitiesApi.getCustomerByIdCached(order.customerId);
      
      if (customer && customer.name && 
          typeof customer.name === 'string' && 
          customer.name.trim() !== '' &&
          !customer.name.includes('Client') && 
          !customer.name.includes('Unknown')) {
        console.log(`Successfully retrieved customer name from entities API: ${customer.name} for ID ${order.customerId}`);
        return {
          ...order,
          customerName: customer.name
        };
      } else {
        console.warn(`Entities API returned invalid customer name for ID ${order.customerId}: ${customer?.name}`);
      }
    } catch (error) {
      console.error(`Error looking up customer name in entities API for customerId ${order.customerId}:`, error);
    }
  } else {
    console.warn(`Cannot look up customer name - order ${order.id} has no customerId`);
  }
  
  // If we get here, the entities API lookup failed or returned invalid data
  // Use order ID as a fallback
  return {
    ...order,
    customerName: `Order #${order.id || ''}`
  };
};

// Enhance multiple orders with customer information
const enrichOrdersWithCustomerData = async (orders) => {
  if (!orders || !Array.isArray(orders)) {
    console.error('Invalid orders array:', orders);
    return [];
  }
  
  try {
    const enrichedOrders = await Promise.all(
      orders.map(order => enrichOrderWithCustomerData(order))
    );
    return enrichedOrders;
  } catch (error) {
    console.error('Error enriching orders with customer data:', error);
    // Return original orders with default customer names if there's an error
    return orders.map(order => ({
      ...order,
      customerName: order.customerName || 'Unknown Customer'
    }));
  }
};

// Map order type to string representation
const getOrderTypeFromValue = (typeValue) => {
  // Implement logic based on your actual type values
  try {
    switch (typeValue) {
      case 1:
      case "1":
      case "Building": 
        return 'building';
      case 2:
      case "2":
      case "Contents": 
        return 'contents';
      case 3:
      case "3":
      case "Building and Contents": 
        return 'both';
      default: 
        return 'unknown';
    }
  } catch (error) {
    console.error('Error getting order type:', error);
    return 'unknown';
  }
};

// Map order status to string representation
const getOrderStatusFromValue = (statusValue) => {
  // Implement logic based on your actual status values
  try {
    switch (statusValue) {
      case 6540:
      case "6540":
      case "Pending": 
        return 'pending';
      case 7289:
      case "7289":
      case "Completed": 
        return 'completed';
      case 6541:
      case "6541":
      case "In Progress": 
        return 'in_progress';
      default: 
        return 'pending';
    }
  } catch (error) {
    console.error('Error getting order status:', error);
    return 'pending';
  }
};

// Map order object to API request format
const mapOrderToApiRequest = (order) => {
  try {
    return {
      orderid: order.id || 0,
      clientid: order.customerId,
      clientsname: order.customerName,
      clientspolicynumber: order.policyNumber || '',
      ordertype: getOrderTypeValue(order.type),
      orderstatus: getOrderStatusValue(order.status),
      brokerid: order.brokerReference || '',
      brokername: order.brokerName || '',
      underwriterid: order.insurerReference || '',
      underwritername: order.insurerName || '',
      contentssuminsured: parseFloat(order.contentsSumInsured) || 0,
      buildingssuminsured: parseFloat(order.buildingSumInsured) || 0,
      currenthouseowners: order.currentHouseowners || '',
      specialinstructions: order.notes || '',
      surveyorid: order.surveyorId || null,
      risk_assessment_id: order.riskAssessmentId || null,
      datereceived: new Date().toISOString(),
      datecompleted: order.dueDate ? new Date(order.dueDate).toISOString() : null,
      partypostal1: order.propertyAddress || '',
      occupiername: order.occupierName || '',
      occupierphone: order.occupierPhoneNumber || '',
      occupieremail: order.occupierEmail || '',
      propertytype: order.propertyType || '',
      yearbuilt: order.yearBuilt || '',
      numbedrooms: order.numberOfBedrooms || 0
    };
  } catch (error) {
    console.error('Error mapping order to API request:', error);
    throw error;
  }
};

// Get numeric value for order type
const getOrderTypeValue = (typeString) => {
  try {
    switch (typeString) {
      case 'building': return 1;
      case 'contents': return 2;
      case 'both': return 3;
      default: return 2;
    }
  } catch (error) {
    console.error('Error getting order type value:', error);
    return 2;
  }
};

// Get numeric value for order status
const getOrderStatusValue = (statusString) => {
  try {
    switch (statusString) {
      case 'pending': return 6540;
      case 'completed': return 7289;
      case 'in_progress': return 6541; 
      default: return 6540;
    }
  } catch (error) {
    console.error('Error getting order status value:', error);
    return 6540;
  }
};

// Helper function to normalize API response
const normalizeApiResponse = (responseData) => {
  // Check if the response has the expected structure
  if (!responseData) {
    console.error('No response data received');
    return {
      data: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1
    };
  }
  
  console.log('Response data structure:', Object.keys(responseData));
  
  // If responseData is an array, it's likely already the data we need
  if (Array.isArray(responseData)) {
    console.log('Response is an array with length:', responseData.length);
    return {
      data: responseData,
      totalCount: responseData.length,
      page: 1,
      pageSize: responseData.length,
      totalPages: 1
    };
  }
  
  // Handle different possible response formats
  const data = responseData.data || responseData.Data || responseData.items || responseData.Items || responseData;
  
  if (Array.isArray(data)) {
    console.log('Extracted data array with length:', data.length);
    return {
      data: data,
      totalCount: responseData.totalCount || responseData.TotalCount || data.length,
      page: responseData.page || responseData.Page || 1,
      pageSize: responseData.pageSize || responseData.PageSize || 20,
      totalPages: responseData.totalPages || responseData.TotalPages || 1
    };
  } else {
    console.error('Unable to extract data array from response, treating the entire response as a single item');
    // If data is not an array but might be a single object, wrap it in an array
    return {
      data: [responseData],
      totalCount: 1,
      page: 1,
      pageSize: 1,
      totalPages: 1
    };
  }
};

// API functions
// Get all orders with pagination
const getOrders = async (page = 1, pageSize = 20) => {
  try {
    console.log('Calling API to get orders with page:', page, 'pageSize:', pageSize);
    const response = await orderFormApi.get('/order-form', {
      params: { page, pageSize }
    });
    
    console.log('Raw API response:', response);
    
    // Normalize the response to handle different API formats
    const normalizedResponse = normalizeApiResponse(response.data);
    console.log('Normalized response:', normalizedResponse);
    
    if (normalizedResponse.data.length === 0) {
      console.warn('No orders returned from API');
      return {
        orders: [],
        totalCount: 0,
        currentPage: page,
        pageSize: pageSize,
        totalPages: 1
      };
    }
    
    const orders = normalizedResponse.data.map(order => mapOrderResponseToOrder(order));
    console.log('Mapped orders before enrichment:', orders);
    
    try {
      const enrichedOrders = await enrichOrdersWithCustomerData(orders);
      console.log('Enriched orders:', enrichedOrders);
      
      console.log('Raw API Response Data:', response.data);
      console.log('Normalized Response:', normalizedResponse);
      console.log('Mapped Orders (before enrichment):', orders);
      console.log('Enriched Orders (final):', enrichedOrders);
      
      return {
        orders: enrichedOrders,
        totalCount: normalizedResponse.totalCount,
        currentPage: normalizedResponse.page,
        pageSize: normalizedResponse.pageSize,
        totalPages: normalizedResponse.totalPages
      };
    } catch (enrichError) {
      console.error('Error enriching orders with customer data:', enrichError);
      // If enrichment fails, return orders without customer names
      return {
        orders: orders.map(order => ({
          ...order,
          customerName: `Customer ${order.customerId || 'Unknown'}`
        })),
        totalCount: normalizedResponse.totalCount,
        currentPage: normalizedResponse.page,
        pageSize: normalizedResponse.pageSize,
        totalPages: normalizedResponse.totalPages
      };
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    
    // Return an empty response with default values to prevent UI crashes
    return {
      orders: [],
      totalCount: 0,
      currentPage: page,
      pageSize: pageSize,
      totalPages: 1
    };
  }
};

// Get order by ID
const getOrderById = async (id) => {
  try {
    if (!id) {
      throw new Error('Order ID is required');
    }
    
    console.log('Fetching order details for ID:', id);
    const response = await orderFormApi.get(`/order-form/${id}`);
    console.log('Raw order details response:', response);
    
    const order = mapOrderResponseToOrder(response.data);
    console.log('Mapped order before enrichment:', order);
    
    const enrichedOrder = await enrichOrderWithCustomerData(order);
    console.log('Enriched order:', enrichedOrder);
    
    return enrichedOrder;
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    
    // Return a default order object to prevent UI crashes
    return {
      id: parseInt(id) || 0,
      customerName: 'Error loading customer',
      type: 'unknown',
      orderDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      priority: 'normal',
      error: true,
      errorMessage: error.message
    };
  }
};

// Create new order
const createOrder = async (orderData) => {
  try {
    if (!orderData) {
      throw new Error('Order data is required');
    }
    
    console.log('Creating new order with data:', orderData);
    const apiRequest = mapOrderToApiRequest(orderData);
    console.log('API request data:', apiRequest);
    
    const response = await orderFormApi.post('/order-form', apiRequest);
    console.log('Create order response:', response);
    
    const order = mapOrderResponseToOrder(response.data);
    const enrichedOrder = await enrichOrderWithCustomerData(order);
    
    return enrichedOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Update order
const updateOrder = async (id, orderData) => {
  try {
    if (!id) {
      throw new Error('Order ID is required');
    }
    
    if (!orderData) {
      throw new Error('Order data is required');
    }
    
    console.log(`Updating order ${id} with data:`, orderData);
    const apiRequest = mapOrderToApiRequest({ ...orderData, id });
    console.log('API request data:', apiRequest);
    
    const response = await orderFormApi.put(`/order-form/${id}`, apiRequest);
    console.log('Update order response:', response);
    
    const order = mapOrderResponseToOrder(response.data);
    const enrichedOrder = await enrichOrderWithCustomerData(order);
    
    return enrichedOrder;
  } catch (error) {
    console.error(`Error updating order ${id}:`, error);
    throw error;
  }
};

// Delete order
const deleteOrder = async (id) => {
  try {
    if (!id) {
      throw new Error('Order ID is required');
    }
    
    console.log(`Deleting order ${id}`);
    await orderFormApi.delete(`/order-form/${id}`);
    console.log(`Order ${id} deleted successfully`);
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting order ${id}:`, error);
    throw error;
  }
};

// Get orders by customer ID
const getOrdersByCustomerId = async (customerId, page = 1, pageSize = 20) => {
  try {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }
    
    console.log(`Fetching orders for customer ${customerId}`);
    const response = await orderFormApi.get('/order-form', {
      params: { customerId, page, pageSize }
    });
    console.log('Customer orders response:', response);
    
    // Normalize the response to handle different API formats
    const normalizedResponse = normalizeApiResponse(response.data);
    
    const orders = normalizedResponse.data.map(order => mapOrderResponseToOrder(order));
    const enrichedOrders = await enrichOrdersWithCustomerData(orders);
    
    return {
      orders: enrichedOrders,
      totalCount: normalizedResponse.totalCount,
      currentPage: normalizedResponse.page,
      pageSize: normalizedResponse.pageSize,
      totalPages: normalizedResponse.totalPages
    };
  } catch (error) {
    console.error(`Error fetching orders for customer ${customerId}:`, error);
    
    // Return an empty response with default values to prevent UI crashes
    return {
      orders: [],
      totalCount: 0,
      currentPage: page,
      pageSize: pageSize,
      totalPages: 1
    };
  }
};

// Create the service object before exporting
const orderFormService = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByCustomerId
};

// eslint-disable-next-line import/no-anonymous-default-export
export default orderFormService; 