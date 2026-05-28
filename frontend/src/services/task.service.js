import api from './api.service'

const getTasks = (params) => api.get('/tasks', { params }).then((r) => r.data)
const getAssignableUsers = () => api.get('/tasks/users').then((r) => r.data)
const createTask = (data) => api.post('/tasks', data).then((r) => r.data)
const updateTask = (id, data) => api.put(`/tasks/${id}`, data).then((r) => r.data)
const deleteTask = (id) => api.delete(`/tasks/${id}`).then((r) => r.data)

export default { getTasks, getAssignableUsers, createTask, updateTask, deleteTask }
