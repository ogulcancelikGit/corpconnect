import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return
    fetchUnreadCount()
  }, [isAuthenticated])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('corpconnect_access_token')}`,
          },
        }
      )
      const data = await response.json()
      setUnreadCount(data?.data?.count || 0)
    } catch (err) {
      console.error(err)
    }
  }

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        setNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}

export default NotificationContext