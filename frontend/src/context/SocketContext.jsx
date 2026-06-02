import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { getAccessToken } from '../utils/storage'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }

    const token = getAccessToken()
    if (!token) return

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    })

    // Bağlanır bağlanmaz o an online olan herkesin listesini al
    newSocket.on('user:online:list', (userIds) => {
      setOnlineUsers((prev) => [...new Set([...prev, ...(userIds || [])])])
    })

    newSocket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => [...new Set([...prev, userId])])
    })

    newSocket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId))
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [isAuthenticated])

  const joinConversation = (conversationId) => {
    socket?.emit('conversation:join', conversationId)
  }

  const leaveConversation = (conversationId) => {
    socket?.emit('conversation:leave', conversationId)
  }

  const sendTypingStart = (conversationId) => {
    socket?.emit('typing:start', { conversationId })
  }

  const sendTypingStop = (conversationId) => {
    socket?.emit('typing:stop', { conversationId })
  }

  const isUserOnline = (userId) => onlineUsers.includes(userId)

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        joinConversation,
        leaveConversation,
        sendTypingStart,
        sendTypingStop,
        isUserOnline,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) throw new Error('useSocket must be used within SocketProvider')
  return context
}

export default SocketContext