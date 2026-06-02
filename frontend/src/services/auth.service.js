import api from './api.service'
import { setAccessToken, setRefreshToken, setUser, clearStorage } from '../utils/storage'

const login = async (data) => {
  const response = await api.post('/auth/login', data)
  const { user, accessToken, refreshToken } = response.data.data
  setAccessToken(accessToken)
  setRefreshToken(refreshToken)
  setUser(user)
  return response.data
}

const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('corpconnect_refresh_token')
    await api.post('/auth/logout', { refreshToken })
  } finally {
    clearStorage()
  }
}

const getMe = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email })
  return response.data
}

const resetPassword = async (data) => {
  const response = await api.post('/auth/reset-password', data)
  return response.data
}

const changePassword = async (data) => {
  const response = await api.post('/auth/change-password', data)
  return response.data
}

export default { login, logout, getMe, forgotPassword, resetPassword, changePassword }