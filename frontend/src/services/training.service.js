import api from './api.service'

const getTrainings = async (params) => {
  const response = await api.get('/training', { params })
  return response.data
}

const getTrainingById = async (id) => {
  const response = await api.get(`/training/${id}`)
  return response.data
}

const markAsViewed = async (id) => {
  const response = await api.post(`/training/${id}/view`)
  return response.data
}

const createTraining = async (data) => {
  const response = await api.post('/training', data)
  return response.data
}

const updateTraining = async (id, data) => {
  const response = await api.put(`/training/${id}`, data)
  return response.data
}

const deleteTraining = async (id) => {
  const response = await api.delete(`/training/${id}`)
  return response.data
}

const getCategories = async () => {
  const response = await api.get('/training/categories')
  return response.data
}

export default { getTrainings, getTrainingById, markAsViewed, createTraining, updateTraining, deleteTraining, getCategories }
