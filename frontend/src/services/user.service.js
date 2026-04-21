import api from './api.service'

const getMe = async () => {
  const response = await api.get('/users/me')
  return response.data
}

const updateMe = async (data) => {
  const response = await api.put('/users/me', data)
  return response.data
}

const uploadAvatar = async (file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  const response = await api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

const deleteAvatar = async () => {
  const response = await api.delete('/users/me/avatar')
  return response.data
}

const getUsers = async (params) => {
  const response = await api.get('/users', { params })
  return response.data
}

const searchUsers = async (q) => {
  const response = await api.get('/users/search', { params: { q } })
  return response.data
}

const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`)
  return response.data
}

const updateUser = async (id, data) => {
  const response = await api.put(`/users/${id}`, data)
  return response.data
}

const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`)
  return response.data
}

const updateUserRole = async (id, role) => {
  const response = await api.patch(`/users/${id}/role`, { role })
  return response.data
}

const updateUserStatus = async (id, isActive) => {
  const response = await api.patch(`/users/${id}/status`, { isActive })
  return response.data
}

export default {
  getMe,
  updateMe,
  uploadAvatar,
  deleteAvatar,
  getUsers,
  searchUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
}