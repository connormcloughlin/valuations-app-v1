import apiClient from './apiClient';

const analyticsApi = {
  getDashboard: () => apiClient.get('/analytics/dashboard'),
  getPerformance: () => apiClient.get('/analytics/performance'),
  getFinancial: () => apiClient.get('/analytics/financial'),
  getCustom: (params) => apiClient.get('/analytics/custom', { params }),
};

export default analyticsApi; 