import axios from 'axios';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../authConfig';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to add auth token
api.interceptors.request.use(async (config) => {
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

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Handle specific error status codes
            switch (error.response.status) {
                case 401:
                    // Handle unauthorized access
                    msalInstance.logoutRedirect();
                    break;
                case 403:
                    // Handle forbidden access
                    console.error('Access forbidden');
                    break;
                case 404:
                    // Handle not found
                    console.error('Resource not found');
                    break;
                default:
                    console.error('API Error:', error.response.data);
            }
        }
        return Promise.reject(error);
    }
);

// Mock data
const mockCustomers = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+44 20 7123 4567',
    address: '123 High Street, London, UK',
    properties: [1, 2],
    orders: [1, 2]
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '+44 20 7123 4568',
    address: '456 Park Lane, London, UK',
    properties: [3],
    orders: [3]
  } ,
  {
    id: 3,
    name: 'Connor McLoughlin',
    email: 'connor@example.com',
    phone: '+44 10 7123 4568',
    address: '456 House Lane, London, UK',
    properties: [3],
    orders: [3]
  }
];

const mockProperties = [
  {
    id: 1,
    customerId: 1,
    address: '123 High Street, London, UK',
    postcode: 'SW1A 1AA',
    type: 'residential',
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1500,
    yearBuilt: 1990,
    status: 'active'
  },
  {
    id: 2,
    customerId: 1,
    address: '789 Oxford Street, London, UK',
    postcode: 'W1D 2HG',
    type: 'commercial',
    squareFootage: 2500,
    yearBuilt: 1985,
    status: 'active'
  },
  {
    id: 3,
    customerId: 2,
    address: '456 Park Lane, London, UK',
    postcode: 'W1K 7AA',
    type: 'residential',
    bedrooms: 4,
    bathrooms: 3,
    squareFootage: 2000,
    yearBuilt: 2000,
    status: 'active'
  }
];

const mockOrders = [
  {
    id: 1,
    customerId: 1,
    propertyId: 1,
    type: 'building',
    orderDate: '2024-03-01',
    dueDate: '2024-03-15',
    priority: 'normal',
    status: 'pending',
    brokerReference: 'BROK123',
    insurerReference: 'INS456',
    notes: 'Standard residential valuation required'
  },
  {
    id: 2,
    customerId: 1,
    propertyId: 2,
    type: 'both',
    orderDate: '2024-03-05',
    dueDate: '2024-03-20',
    priority: 'high',
    status: 'in_progress',
    brokerReference: 'BROK124',
    insurerReference: 'INS457',
    notes: 'Urgent commercial valuation needed'
  },
  {
    id: 3,
    customerId: 2,
    propertyId: 3,
    type: 'building',
    orderDate: '2024-03-10',
    dueDate: '2024-03-25',
    priority: 'normal',
    status: 'completed',
    brokerReference: 'BROK125',
    insurerReference: 'INS458',
    notes: 'Luxury residential valuation'
  }
];

const mockAppointments = [
  {
    id: 1,
    orderId: 1,
    date: '2024-03-10',
    time: '10:00',
    status: 'scheduled',
    notes: 'Initial property inspection'
  },
  {
    id: 2,
    orderId: 2,
    date: '2024-03-12',
    time: '14:00',
    status: 'completed',
    notes: 'Commercial property assessment'
  }
];

const mockBilling = [
  {
    id: 1,
    orderId: 1,
    amount: 250.00,
    status: 'pending',
    dueDate: '2024-03-20',
    invoiceNumber: 'INV001'
  },
  {
    id: 2,
    orderId: 2,
    amount: 350.00,
    status: 'paid',
    dueDate: '2024-03-25',
    invoiceNumber: 'INV002'
  }
];

const mockReports = [
  {
    id: 1,
    orderId: 1,
    type: 'building',
    status: 'draft',
    createdAt: '2024-03-05',
    updatedAt: '2024-03-05'
  },
  {
    id: 2,
    orderId: 2,
    type: 'both',
    status: 'completed',
    createdAt: '2024-03-08',
    updatedAt: '2024-03-10'
  }
];

const mockInsurerBrokers = [
  {
    id: 1,
    name: 'ABC Insurance Ltd',
    type: 'insurer',
    contactEmail: 'contact@abcinsurance.com',
    contactPhone: '+44 20 7123 4567',
    address: '1 Insurance Square, London, EC1A 1AA'
  },
  {
    id: 2,
    name: 'XYZ Insurance Group',
    type: 'insurer',
    contactEmail: 'info@xyzinsurance.com',
    contactPhone: '+44 20 7123 4568',
    address: '2 Insurance Street, London, EC2A 2BB'
  },
  {
    id: 3,
    name: 'Global Insurance Solutions',
    type: 'insurer',
    contactEmail: 'support@globalinsurance.com',
    contactPhone: '+44 20 7123 4569',
    address: '3 Insurance Avenue, London, EC3A 3CC'
  },
  {
    id: 4,
    name: 'First Choice Brokers',
    type: 'broker',
    contactEmail: 'enquiries@firstchoice.com',
    contactPhone: '+44 20 7123 4570',
    address: '4 Broker Lane, London, EC4A 4DD'
  },
  {
    id: 5,
    name: 'Premier Insurance Brokers',
    type: 'broker',
    contactEmail: 'contact@premierbrokers.com',
    contactPhone: '+44 20 7123 4571',
    address: '5 Broker Street, London, EC5A 5EE'
  },
  {
    id: 6,
    name: 'Elite Insurance Services',
    type: 'broker',
    contactEmail: 'info@eliteinsurance.com',
    contactPhone: '+44 20 7123 4572',
    address: '6 Broker Square, London, EC6A 6FF'
  }
];

const mockContentsValuations = [
  {
    id: 1,
    orderId: 1,
    assessmentType: 'INVENTORY',
    assessmentNumber: '1812/0157/1',
    quantifier: 'Nicole Ellis',
    surveyDate: '2024-03-15',
    surveyReason: 'New Policy',
    capturer: 'Mavis Malemba',
    insurer: 'SANTAM',
    broker: 'PINION INSURANCE',
    status: 'COMPLETE',
    totalAssetsValue: 2187399.00,
    negotiatedAmount: 0.00,
    surname: 'MCLOUGHLIN',
    title: 'Mr',
    initials: 'CG',
    telWork: '0112916291',
    telHome: '',
    cell: '0833064047',
    email: 'cmcloughlin@investec.co.za',
    officeUse: '',
    requestedBy: 'PINION INSURANCE',
    lastUpdated: '2025/04/28',
    received: '2015/05/12',
    sent: '',
    comments: '',
    billingTemplate: 'Bulk fees 2018',
    riskAddress: '123 Sample Street, Sandton',
    postalAddress: 'PO Box 123, Sandton, 2146',
    signedClientDocuments: true,
    contents: [
      {
        categoryId: 1,
        items: [
          {
            id: 1,
            type: 'Suits',
            description: 'Designer suit',
            model: 'Armani',
            selection: 'Black',
            price: 25000.00,
            location: 'Main Bedroom'
          }
        ]
      }
    ]
  }
];

// Mock API functions
const mockApi = {
  get: async (url) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url.includes('/customers')) {
      if (url.includes('/orders')) {
        const customerId = parseInt(url.split('/')[2]);
        return mockOrders.filter(order => order.customerId === customerId);
      }
      if (url.includes('/properties')) {
        const customerId = parseInt(url.split('/')[2]);
        return mockProperties.filter(property => property.customerId === customerId);
      }
      const customerId = parseInt(url.split('/').pop());
      if (customerId) {
        return mockCustomers.find(customer => customer.id === customerId);
      }
      return mockCustomers;
    }
    
    if (url.includes('/properties')) {
      const propertyId = parseInt(url.split('/').pop());
      if (propertyId) {
        return mockProperties.find(property => property.id === propertyId);
      }
      return mockProperties;
    }
    
    if (url.includes('/orders')) {
      const orderId = parseInt(url.split('/').pop());
      if (orderId) {
        return mockOrders.find(order => order.id === orderId);
      }
      return mockOrders;
    }
    
    if (url.includes('/appointments')) {
      return mockAppointments;
    }
    
    if (url.includes('/billing')) {
      return mockBilling;
    }
    
    if (url.includes('/reports')) {
      return mockReports;
    }
    
    if (url.includes('/insurer-brokers')) {
      if (url.includes('?type=')) {
        const type = url.split('?type=')[1];
        return mockInsurerBrokers.filter(item => item.type === type);
      }
      const id = parseInt(url.split('/').pop());
      if (id) {
        return mockInsurerBrokers.find(item => item.id === id);
      }
      return mockInsurerBrokers;
    }
    
    if (url.includes('/contents-valuations')) {
      if (url.includes('/orders/')) {
        const orderId = parseInt(url.split('/orders/')[1]);
        return mockContentsValuations.find(cv => cv.orderId === orderId);
      }
      const valuationId = parseInt(url.split('/').pop());
      if (valuationId) {
        return mockContentsValuations.find(cv => cv.id === valuationId);
      }
      return mockContentsValuations;
    }
    
    return null;
  },

  post: async (url, data) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url.includes('/customers')) {
      const newCustomer = {
        id: mockCustomers.length + 1,
        ...data
      };
      mockCustomers.push(newCustomer);
      return newCustomer;
    }
    
    if (url.includes('/properties')) {
      const newProperty = {
        id: mockProperties.length + 1,
        ...data
      };
      mockProperties.push(newProperty);
      return newProperty;
    }
    
    if (url.includes('/orders')) {
      const newOrder = {
        id: mockOrders.length + 1,
        ...data
      };
      mockOrders.push(newOrder);
      return newOrder;
    }
    
    if (url.includes('/insurer-brokers')) {
      const newItem = {
        id: mockInsurerBrokers.length + 1,
        ...data
      };
      mockInsurerBrokers.push(newItem);
      return newItem;
    }
    
    if (url.includes('/contents-valuations')) {
      const newValuation = {
        id: mockContentsValuations.length + 1,
        ...data
      };
      mockContentsValuations.push(newValuation);
      return newValuation;
    }
    
    return null;
  },

  put: async (url, data) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url.includes('/customers')) {
      const customerId = parseInt(url.split('/')[2]);
      const index = mockCustomers.findIndex(c => c.id === customerId);
      if (index !== -1) {
        mockCustomers[index] = { ...mockCustomers[index], ...data };
        return mockCustomers[index];
      }
    }
    
    if (url.includes('/properties')) {
      const propertyId = parseInt(url.split('/').pop());
      const index = mockProperties.findIndex(p => p.id === propertyId);
      if (index !== -1) {
        mockProperties[index] = { ...mockProperties[index], ...data };
        return mockProperties[index];
      }
    }
    
    if (url.includes('/orders')) {
      const orderId = parseInt(url.split('/').pop());
      const index = mockOrders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        mockOrders[index] = { ...mockOrders[index], ...data };
        return mockOrders[index];
      }
    }
    
    if (url.includes('/insurer-brokers')) {
      const id = parseInt(url.split('/').pop());
      const index = mockInsurerBrokers.findIndex(item => item.id === id);
      if (index !== -1) {
        mockInsurerBrokers[index] = { ...mockInsurerBrokers[index], ...data };
        return mockInsurerBrokers[index];
      }
    }
    
    if (url.includes('/contents-valuations')) {
      const valuationId = parseInt(url.split('/').pop());
      const index = mockContentsValuations.findIndex(cv => cv.id === valuationId);
      if (index !== -1) {
        mockContentsValuations[index] = { ...mockContentsValuations[index], ...data };
        return mockContentsValuations[index];
      }
    }
    
    return null;
  },

  delete: async (url) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url.includes('/customers')) {
      const customerId = parseInt(url.split('/').pop());
      const index = mockCustomers.findIndex(c => c.id === customerId);
      if (index !== -1) {
        mockCustomers.splice(index, 1);
        return { success: true };
      }
    }
    
    if (url.includes('/properties')) {
      const propertyId = parseInt(url.split('/').pop());
      const index = mockProperties.findIndex(p => p.id === propertyId);
      if (index !== -1) {
        mockProperties.splice(index, 1);
        return { success: true };
      }
    }
    
    if (url.includes('/orders')) {
      const orderId = parseInt(url.split('/').pop());
      const index = mockOrders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        mockOrders.splice(index, 1);
        return { success: true };
      }
    }
    
    if (url.includes('/insurer-brokers')) {
      const id = parseInt(url.split('/').pop());
      const index = mockInsurerBrokers.findIndex(item => item.id === id);
      if (index !== -1) {
        mockInsurerBrokers.splice(index, 1);
        return { success: true };
      }
    }
    
    if (url.includes('/contents-valuations')) {
      const valuationId = parseInt(url.split('/').pop());
      const index = mockContentsValuations.findIndex(cv => cv.id === valuationId);
      if (index !== -1) {
        mockContentsValuations.splice(index, 1);
        return { success: true };
      }
    }
    
    return { success: false };
  }
};

// Customer API calls
export const customerApi = {
    getAll: () => mockApi.get('/customers'),
    getById: (id) => mockApi.get(`/customers/${id}`),
    create: (data) => mockApi.post('/customers', data),
    update: (id, data) => mockApi.put(`/customers/${id}`, data),
    delete: (id) => mockApi.delete(`/customers/${id}`),
    getProperties: (customerId) => mockApi.get(`/customers/${customerId}/properties`),
    getOrders: (customerId) => mockApi.get(`/customers/${customerId}/orders`),
    getOrderById: (customerId, orderId) => mockApi.get(`/customers/${customerId}/orders/${orderId}`),
    updateOrder: (customerId, orderId, data) => mockApi.put(`/customers/${customerId}/orders/${orderId}`, data),
    deleteOrder: (customerId, orderId) => mockApi.delete(`/customers/${customerId}/orders/${orderId}`)
};

// Property API calls
export const propertyApi = {
    getAll: () => mockApi.get('/properties'),
    getById: (id) => mockApi.get(`/properties/${id}`),
    create: (data) => mockApi.post('/properties', data),
    update: (id, data) => mockApi.put(`/properties/${id}`, data),
    delete: (id) => mockApi.delete(`/properties/${id}`)
};

// Order API calls
export const orderApi = {
    getAll: () => mockApi.get('/orders'),
    getById: (id) => mockApi.get(`/orders/${id}`),
    create: (data) => mockApi.post('/orders', data),
    update: (id, data) => mockApi.put(`/orders/${id}`, data),
    delete: (id) => mockApi.delete(`/orders/${id}`)
};

// Appointment API calls
export const appointmentApi = {
    getAll: () => mockApi.get('/appointments'),
    getById: (id) => mockApi.get(`/appointments/${id}`),
    create: (data) => mockApi.post('/appointments', data),
    update: (id, data) => mockApi.put(`/appointments/${id}`, data),
    delete: (id) => mockApi.delete(`/appointments/${id}`)
};

// Billing API calls
export const billingApi = {
    getAll: () => mockApi.get('/billing'),
    getById: (id) => mockApi.get(`/billing/${id}`),
    create: (data) => mockApi.post('/billing', data),
    update: (id, data) => mockApi.put(`/billing/${id}`, data),
    delete: (id) => mockApi.delete(`/billing/${id}`)
};

// Reports API calls
export const reportsApi = {
    getAll: () => mockApi.get('/reports'),
    getById: (id) => mockApi.get(`/reports/${id}`),
    create: (data) => mockApi.post('/reports', data),
    update: (id, data) => mockApi.put(`/reports/${id}`, data),
    delete: (id) => mockApi.delete(`/reports/${id}`)
};

// Dashboard API calls
export const dashboardApi = {
    getStats: () => ({
        totalCustomers: mockCustomers.length,
        totalProperties: mockProperties.length,
        totalOrders: mockOrders.length,
        pendingOrders: mockOrders.filter(o => o.status === 'pending').length,
        completedOrders: mockOrders.filter(o => o.status === 'completed').length,
        totalRevenue: mockBilling.reduce((sum, bill) => sum + bill.amount, 0)
    }),
    getRecentOrders: () => mockOrders.slice(-5).reverse(),
    getUpcomingAppointments: () => mockAppointments.filter(a => new Date(a.date) >= new Date())
};

const insurerBrokerApi = {
  getAll: () => mockApi.get('/insurer-brokers'),
  getById: (id) => mockApi.get(`/insurer-brokers/${id}`),
  create: (data) => mockApi.post('/insurer-brokers', data),
  update: (id, data) => mockApi.put(`/insurer-brokers/${id}`, data),
  delete: (id) => mockApi.delete(`/insurer-brokers/${id}`),
  getByType: (type) => mockApi.get(`/insurer-brokers?type=${type}`)
};

export {
  insurerBrokerApi
};

// Add new API object for contents valuations
export const contentsValuationApi = {
  getAll: () => mockApi.get('/contents-valuations'),
  getById: (id) => mockApi.get(`/contents-valuations/${id}`),
  getByOrderId: (orderId) => mockApi.get(`/contents-valuations/orders/${orderId}`),
  create: (data) => mockApi.post('/contents-valuations', data),
  update: (id, data) => mockApi.put(`/contents-valuations/${id}`, data),
  delete: (id) => mockApi.delete(`/contents-valuations/${id}`),
  addItem: (id, categoryId, item) => mockApi.post(`/contents-valuations/${id}/categories/${categoryId}/items`, item),
  updateItem: (id, categoryId, itemId, item) => mockApi.put(`/contents-valuations/${id}/categories/${categoryId}/items/${itemId}`, item),
  deleteItem: (id, categoryId, itemId) => mockApi.delete(`/contents-valuations/${id}/categories/${categoryId}/items/${itemId}`)
};

export default api; 