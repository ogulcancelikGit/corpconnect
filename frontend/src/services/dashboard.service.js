import api from './api.service'

const getStats = async () => {
  const response = await api.get('/dashboard/stats')
  return response.data
}

const getRecentNews = async () => {
  const response = await api.get('/dashboard/recent-news')
  return response.data
}

const getActivePolls = async () => {
  const response = await api.get('/dashboard/active-polls')
  return response.data
}

export default { getStats, getRecentNews, getActivePolls }