import apiClient from './apiClient';

const pricingApi = {
  getElectronics: (params) => apiClient.get('/pricing/electronics', { params }),
  getElectronicsById: (id) => apiClient.get(`/pricing/electronics/${id}`),
  evaluateElectronics: (data) => apiClient.post('/pricing/electronics/evaluate', data),
  getArtwork: (params) => apiClient.get('/pricing/artwork', { params }),
  evaluateArtwork: (data) => apiClient.post('/pricing/artwork/evaluate', data),
  getMarketTrends: (params) => apiClient.get('/pricing/market-trends', { params }),
};

export default pricingApi; 