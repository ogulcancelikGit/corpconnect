import api from './api.service'

const getMessages = (conversationId, params) =>
  api.get(`/conversations/${conversationId}/messages`, { params }).then((r) => r.data)

const sendMessage = (conversationId, data) =>
  api.post(`/conversations/${conversationId}/messages`, data).then((r) => r.data)

const updateMessage = (conversationId, msgId, content) =>
  api.put(`/conversations/${conversationId}/messages/${msgId}`, { content }).then((r) => r.data)

const deleteMessage = (conversationId, msgId) =>
  api.delete(`/conversations/${conversationId}/messages/${msgId}`).then((r) => r.data)

const markAsRead = (conversationId) =>
  api.patch(`/conversations/${conversationId}/read`).then((r) => r.data)

const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/files/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

const toggleReaction = (conversationId, msgId, emoji) =>
  api.post(`/conversations/${conversationId}/messages/${msgId}/reactions`, { emoji }).then((r) => r.data)

const searchMessages = (conversationId, q) =>
  api.get(`/conversations/${conversationId}/messages/search`, { params: { q } }).then((r) => r.data)

const pinMessage = (conversationId, msgId) =>
  api.patch(`/conversations/${conversationId}/messages/${msgId}/pin`).then((r) => r.data)

const getPinnedMessages = (conversationId) =>
  api.get(`/conversations/${conversationId}/pinned`).then((r) => r.data)

const forwardMessage = (targetConvId, messageId) =>
  api.post(`/conversations/${targetConvId}/messages/forward`, { messageId }).then((r) => r.data)

export default { getMessages, sendMessage, updateMessage, deleteMessage, markAsRead, uploadFile, toggleReaction, searchMessages, pinMessage, getPinnedMessages, forwardMessage }