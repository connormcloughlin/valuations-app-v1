import apiClient from './apiClient';

const userApi = {
  getUsers: (params) => apiClient.get('/users', { params }),
  getUserById: (id) => apiClient.get(`/users/${id}`),
  createUser: (data) => apiClient.post('/users', data),
  updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
  getSurveyors: () => apiClient.get('/users/surveyors'),
  getRoles: () => apiClient.get('/users/roles'),
};

export default userApi; 