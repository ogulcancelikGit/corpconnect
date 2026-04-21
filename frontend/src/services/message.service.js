import api from './api.service'

const getMessages = async (conversationId, params) => {
  const response = await api.get(`/conversations/${conversationId}/messages`, { params })
  return response.data
}

const sendMessage = async (conversationId, data) => {
  const response = await api.post(`/conversations/${conversationId}/messages`, data)
  return response.data
}

const updateMessage = async (conversationId, msgId, content) => {
  const response = await api.put(`/conversations/${conversationId}/messages/${msgId}`, { content })
  return response.data
}

const deleteMessage = async (conversationId, msgId) => {
  const response = await api.delete(`/conversations/${conversationId}/messages/${msgId}`)
  return response.data
}

const markAsRead = async (conversationId) => {
  const response = await api.patch(`/conversations/${conversationId}/read`)
  return response.data
}

export default { getMessages, sendMessage, updateMessage, deleteMessage, markAsRead }