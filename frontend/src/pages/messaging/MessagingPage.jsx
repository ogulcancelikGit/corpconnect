import { useState, useEffect, useRef } from 'react'
import conversationService from '../../services/conversation.service'
import messageService from '../../services/message.service'
import userService from '../../services/user.service'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { formatRelative, formatTime } from '../../utils/dateFormat'
import toast from 'react-hot-toast'
import useDebounce from '../../hooks/useDebounce'

const MessagingPage = () => {
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [showNewConv, setShowNewConv] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const { user } = useAuth()
  const { socket, joinConversation, leaveConversation, sendTypingStart, sendTypingStop, isUserOnline } = useSocket()
  const debouncedSearch = useDebounce(searchUser, 400)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
  if (!socket || !selectedConv) return

  socket.on('message:receive', (message) => {
    if (message.conversationId === selectedConv.id) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
      scrollToBottom()
      messageService.markAsRead(selectedConv.id)
    }
    fetchConversations()
  })

  socket.on('message:edit', (message) => {
    setMessages((prev) => prev.map((m) => m.id === message.id ? { ...m, ...message } : m))
  })

  socket.on('message:delete', ({ id }) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, deletedAt: new Date(), content: 'Bu mesaj silindi' } : m))
  })

  socket.on('typing:start', ({ userId, conversationId }) => {
    if (userId !== user.id && conversationId === selectedConv.id) {
      setTypingUsers((prev) => [...new Set([...prev, userId])])
    }
  })

  socket.on('typing:stop', ({ userId, conversationId }) => {
    if (conversationId === selectedConv.id) {
      setTypingUsers((prev) => prev.filter((id) => id !== userId))
    }
  })

  return () => {
    socket.off('message:receive')
    socket.off('message:edit')
    socket.off('message:delete')
    socket.off('typing:start')
    socket.off('typing:stop')
  }
}, [socket, selectedConv])

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [debouncedSearch])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const res = await conversationService.getConversations()
      setConversations(res.data)
    } catch {
      toast.error('Konuşmalar getirilemedi')
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (conv) => {
    if (selectedConv) leaveConversation(selectedConv.id)
    setSelectedConv(conv)
    joinConversation(conv.id)
    setMsgLoading(true)
    try {
      const res = await messageService.getMessages(conv.id)
      setMessages(res.data)
      await messageService.markAsRead(conv.id)
      fetchConversations()
    } catch {
      toast.error('Mesajlar getirilemedi')
    } finally {
      setMsgLoading(false)
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv) return
    setSending(true)
    try {
      await messageService.sendMessage(selectedConv.id, { content: newMessage.trim() })
      setNewMessage('')
      sendTypingStop(selectedConv.id)
    } catch {
      toast.error('Mesaj gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const handleTyping = (e) => {
  setNewMessage(e.target.value)
  if (!selectedConv) return

  if (!isTyping) {
    setIsTyping(true)
    sendTypingStart(selectedConv.id)
  }

  clearTimeout(typingTimeoutRef.current)
  typingTimeoutRef.current = setTimeout(() => {
    setIsTyping(false)
    sendTypingStop(selectedConv.id)
    setTypingUsers([])
  }, 2000)
}

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const searchUsers = async () => {
    try {
      const res = await userService.searchUsers(debouncedSearch)
      setSearchResults(res.data)
    } catch {}
  }

  const startDirectConversation = async (targetUser) => {
    try {
      const res = await conversationService.createConversation({
        type: 'DIRECT',
        memberIds: [targetUser.id],
      })
      setShowNewConv(false)
      setSearchUser('')
      setSearchResults([])
      await fetchConversations()
      selectConversation(res.data)
    } catch {
      toast.error('Konuşma başlatılamadı')
    }
  }

  const getConvName = (conv) => {
    if (conv.type === 'GROUP') return conv.name || 'Grup'
    const other = conv.members?.find((m) => m.user.id !== user.id)
    return other ? `${other.user.firstName} ${other.user.lastName}` : 'Bilinmiyor'
  }

  const getConvAvatar = (conv) => {
    if (conv.type === 'GROUP') return null
    const other = conv.members?.find((m) => m.user.id !== user.id)
    return other?.user.profile?.avatar || null
  }

  const getConvOnline = (conv) => {
    if (conv.type === 'GROUP') return false
    const other = conv.members?.find((m) => m.user.id !== user.id)
    return other ? isUserOnline(other.user.id) : false
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="w-64 border-r border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={() => setShowNewConv(!showNewConv)}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700"
          >
            + Yeni Mesaj
          </button>
          {showNewConv && (
            <div className="mt-2">
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Kullanıcı ara..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {searchResults.length > 0 && (
                <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startDirectConversation(u)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                    >
                      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-gray-400">{u.profile?.department}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">Henüz konuşma yok</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 text-left border-b border-gray-100 ${
                  selectedConv?.id === conv.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {getConvName(conv)[0]}
                  </div>
                  {getConvOnline(conv) && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{getConvName(conv)}</div>
                  {conv.messages?.[0] && (
                    <div className="text-xs text-gray-400 truncate">{conv.messages[0].content}</div>
                  )}
                </div>
                {conv.lastMessageAt && (
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {formatRelative(conv.lastMessageAt)}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm">Bir konuşma seçin</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {getConvName(selectedConv)[0]}
                </div>
                {getConvOnline(selectedConv) && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{getConvName(selectedConv)}</div>
                <div className="text-xs text-gray-400">
                  {getConvOnline(selectedConv) ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="flex items-center justify-center h-20">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">Henüz mesaj yok</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender?.id === user.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 self-end">
                          {msg.sender?.firstName?.[0]}
                        </div>
                      )}
                      <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-3 py-2 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        } ${msg.deletedAt ? 'italic opacity-60' : ''}`}>
                          {msg.content}
                          {msg.isEdited && !msg.deletedAt && (
                            <span className="text-xs opacity-60 ml-1">(düzenlendi)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 px-1">
                          {formatTime(msg.createdAt)}
                          {isMe && msg.status === 'READ' && <span className="ml-1 text-blue-400">✓✓</span>}
                          {isMe && msg.status !== 'READ' && <span className="ml-1">✓</span>}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                  yazıyor...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  placeholder="Write a message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MessagingPage    