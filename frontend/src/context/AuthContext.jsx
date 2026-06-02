import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/auth.service'
import { getUser, setUser, clearStorage } from '../utils/storage'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(getUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authService.getMe()
        const userData = response.data
        setUserState(userData)
        setUser(userData)
      } catch {
        clearStorage()
        setUserState(null)
      } finally {
        setLoading(false)
      }
    }

    if (getUser()) {
      initAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (data) => {
    const response = await authService.login(data)
    setUserState(response.data.user)
    return response
  }

  const logout = async () => {
    await authService.logout()
    setUserState(null)
  }

  const updateUser = (userData) => {
    setUserState(userData)
    setUser(userData)
  }

  const isAdmin = () => user?.role === 'ADMIN'
  const isManager = () => user?.role === 'MANAGER'
  const isEmployee = () => user?.role === 'EMPLOYEE'
  const hasRole = (...roles) => roles.includes(user?.role)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        isAdmin,
        isManager,
        isEmployee,
        hasRole,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export default AuthContext