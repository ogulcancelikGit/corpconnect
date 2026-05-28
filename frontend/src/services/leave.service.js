import api from './api.service'

const getMyLeaves = async (params) => {
  const response = await api.get('/leaves/my', { params })
  return response.data
}

const getAllLeaves = async (params) => {
  const response = await api.get('/leaves', { params })
  return response.data
}

const getLeaveStats = async () => {
  const response = await api.get('/leaves/stats')
  return response.data
}

const createLeave = async (data) => {
  const response = await api.post('/leaves', data)
  return response.data
}

const reviewLeave = async (id, data) => {
  const response = await api.put(`/leaves/${id}/review`, data)
  return response.data
}

const cancelLeave = async (id) => {
  const response = await api.delete(`/leaves/${id}`)
  return response.data
}

export default { getMyLeaves, getAllLeaves, getLeaveStats, createLeave, reviewLeave, cancelLeave }
