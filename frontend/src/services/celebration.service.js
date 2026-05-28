import api from './api.service'

const celebrationService = {
  getToday: () => api.get('/celebrations/today'),
  getUpcoming: (days = 30) => api.get('/celebrations/upcoming', { params: { days } }),
}

export default celebrationService
