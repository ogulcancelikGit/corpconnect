import api from './api.service'

const getPolls = async (params) => {
  const response = await api.get('/polls', { params })
  return response.data
}

const getPollById = async (id) => {
  const response = await api.get(`/polls/${id}`)
  return response.data
}

const createPoll = async (data) => {
  const response = await api.post('/polls', data)
  return response.data
}

const updatePoll = async (id, data) => {
  const response = await api.put(`/polls/${id}`, data)
  return response.data
}

const deletePoll = async (id) => {
  const response = await api.delete(`/polls/${id}`)
  return response.data
}

const vote = async (pollId, optionId) => {
  const response = await api.post(`/polls/${pollId}/vote`, { optionId })
  return response.data
}

const getPollResults = async (id) => {
  const response = await api.get(`/polls/${id}/results`)
  return response.data
}

const getMyVote = async (id) => {
  const response = await api.get(`/polls/${id}/my-vote`)
  return response.data
}

export default { getPolls, getPollById, createPoll, updatePoll, deletePoll, vote, getPollResults, getMyVote }
