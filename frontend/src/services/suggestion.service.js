import api from './api.service'

const suggestionService = {
  getMySuggestions: (params) => api.get('/suggestions/my', { params }),
  getAllSuggestions: (params) => api.get('/suggestions', { params }),
  getStats: () => api.get('/suggestions/stats'),
  create: (data) => api.post('/suggestions', data),
  review: (id, data) => api.put(`/suggestions/${id}/review`, data),
  delete: (id) => api.delete(`/suggestions/${id}`),
}

export default suggestionService
