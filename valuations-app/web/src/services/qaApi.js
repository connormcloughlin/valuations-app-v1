import apiClient from './apiClient';

const qaApi = {
  getSurveys: (params) => apiClient.get('/qa/surveys', { params }),
  getSurveyDetails: (id) => apiClient.get(`/qa/surveys/${id}`),
  assignSurvey: (id, data) => apiClient.post(`/qa/surveys/${id}/assign`, data),
  reviewSurvey: (id, data) => apiClient.post(`/qa/surveys/${id}/review`, data),
  getMetrics: () => apiClient.get('/qa/metrics'),
};

export default qaApi; 