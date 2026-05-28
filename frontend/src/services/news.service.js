import api from './api.service'

const getNews = async (params) => {
  const response = await api.get('/news', { params })
  return response.data
}

const getNewsById = async (id) => {
  const response = await api.get(`/news/${id}`)
  return response.data
}

const markAsViewed = async (id) => {
  const response = await api.post(`/news/${id}/view`)
  return response.data
}

const createNews = async (data) => {
  const response = await api.post('/news', data)
  return response.data
}

const updateNews = async (id, data) => {
  const response = await api.put(`/news/${id}`, data)
  return response.data
}

const deleteNews = async (id) => {
  const response = await api.delete(`/news/${id}`)
  return response.data
}

const togglePin = async (id) => {
  const response = await api.patch(`/news/${id}/pin`)
  return response.data
}

export default { getNews, getNewsById, markAsViewed, createNews, updateNews, deleteNews, togglePin }
