import api from './api.service'

const getTasks = (params) => api.get('/tasks', { params }).then((r) => r.data)
const getTaskById = (id) => api.get(`/tasks/${id}`).then((r) => r.data)
const getAssignableUsers = () => api.get('/tasks/users').then((r) => r.data)
const createTask = (data) => api.post('/tasks', data).then((r) => r.data)
const updateTask = (id, data) => api.put(`/tasks/${id}`, data).then((r) => r.data)
const deleteTask = (id) => api.delete(`/tasks/${id}`).then((r) => r.data)
const addComment = (id, body) => api.post(`/tasks/${id}/comments`, { body }).then((r) => r.data)
const deleteComment = (id, commentId) => api.delete(`/tasks/${id}/comments/${commentId}`).then((r) => r.data)

const getStats = () => api.get('/tasks/stats').then((r) => r.data)

// Checklist
const addChecklistItem = (id, text) => api.post(`/tasks/${id}/checklist`, { text }).then((r) => r.data)
const updateChecklistItem = (id, itemId, data) => api.patch(`/tasks/${id}/checklist/${itemId}`, data).then((r) => r.data)
const deleteChecklistItem = (id, itemId) => api.delete(`/tasks/${id}/checklist/${itemId}`).then((r) => r.data)

// Labels
const getLabels = () => api.get('/labels').then((r) => r.data)
const createLabel = (data) => api.post('/labels', data).then((r) => r.data)
const deleteLabel = (id) => api.delete(`/labels/${id}`).then((r) => r.data)

export default {
  getTasks,
  getTaskById,
  getAssignableUsers,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  deleteComment,
  getStats,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  getLabels,
  createLabel,
  deleteLabel,
}
