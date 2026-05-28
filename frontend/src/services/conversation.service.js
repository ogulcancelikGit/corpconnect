import api from './api.service'

const getConversations = async (params) => {
  const response = await api.get('/conversations', { params })
  return response.data
}

const getConversationById = async (id) => {
  const response = await api.get(`/conversations/${id}`)
  return response.data
}

const createConversation = async (data) => {
  const response = await api.post('/conversations', data)
  return response.data
}

const updateConversation = async (id, data) => {
  const response = await api.put(`/conversations/${id}`, data)
  return response.data
}

const leaveConversation = async (id) => {
  const response = await api.delete(`/conversations/${id}`)
  return response.data
}

const getMembers = async (id) => {
  const response = await api.get(`/conversations/${id}/members`)
  return response.data
}

const addMember = async (id, memberIds) => {
  const response = await api.post(`/conversations/${id}/members`, { memberIds })
  return response.data
}

const removeMember = async (id, userId) => {
  const response = await api.delete(`/conversations/${id}/members/${userId}`)
  return response.data
}

const updateMemberRole = async (id, userId, role) => {
  const response = await api.patch(`/conversations/${id}/members/${userId}/role`, { role })
  return response.data
}

const archiveConversation = async (id) => {
  const response = await api.patch(`/conversations/${id}/archive`)
  return response.data
}

export default {
  getConversations,
  getConversationById,
  createConversation,
  updateConversation,
  leaveConversation,
  getMembers,
  addMember,
  removeMember,
  updateMemberRole,
  archiveConversation,
}