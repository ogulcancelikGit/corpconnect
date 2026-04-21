const ACCESS_TOKEN_KEY = 'corpconnect_access_token'
const REFRESH_TOKEN_KEY = 'corpconnect_refresh_token'
const USER_KEY = 'corpconnect_user'

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)
export const setAccessToken = (token) => localStorage.setItem(ACCESS_TOKEN_KEY, token)
export const removeAccessToken = () => localStorage.removeItem(ACCESS_TOKEN_KEY)

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)
export const setRefreshToken = (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token)
export const removeRefreshToken = () => localStorage.removeItem(REFRESH_TOKEN_KEY)

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}
export const setUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user))
export const removeUser = () => localStorage.removeItem(USER_KEY)

export const clearStorage = () => {
  removeAccessToken()
  removeRefreshToken()
  removeUser()
}