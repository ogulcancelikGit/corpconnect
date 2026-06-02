import { useState, useEffect, useRef, useCallback } from 'react'
import conversationService from '../../services/conversation.service'
import messageService from '../../services/message.service'
import userService from '../../services/user.service'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { formatRelative, formatTime } from '../../utils/dateFormat'
import { formatFileSize, isImage } from '../../utils/fileSize'
import toast from 'react-hot-toast'
import useDebounce from '../../hooks/useDebounce'
import {
  Send, Paperclip, X, Info, LogOut, Plus, Search, Users,
  MessageSquare, Edit2, Trash2, Copy, CornerUpLeft, ChevronDown,
  Check, CheckCheck, UserPlus, UserMinus, Pin, Forward, Archive, ArchiveRestore,
} from 'lucide-react'

const FILE_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
const fileUrl  = (path) => `${FILE_BASE}/${path}`

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isSameDay = (a, b) => {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

const dateLabel = (d) => {
  const now = new Date(), day = new Date(d)
  const diff = Math.floor((now - day) / 86400000)
  if (diff === 0) return 'Bugün'
  if (diff === 1) return 'Dün'
  return day.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const initials = (first = '', last = '') => `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()

// ─── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ firstName = '', lastName = '', size = 'md', online = false, group = false }) => {
  const sizes = { sm: 'w-6 h-6 text-[9px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm', xl: 'w-14 h-14 text-base' }
  const dotSizes = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-2.5 h-2.5', xl: 'w-3 h-3' }
  return (
    <div className="relative shrink-0">
      <div className={`${sizes[size]} ${group ? 'bg-gradient-to-br from-violet-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'} rounded-full flex items-center justify-center text-white font-semibold`}>
        {initials(firstName, lastName)}
      </div>
      {online && (
        <span className={`absolute bottom-0 right-0 ${dotSizes[size]} bg-emerald-400 rounded-full border-2 border-white`} />
      )}
    </div>
  )
}

// ─── Image lightbox ───────────────────────────────────────────────────────────
const Lightbox = ({ src, name, onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <button className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors" onClick={onClose}>
      <X size={18} />
    </button>
    <img src={src} alt={name} className="max-w-full max-h-full rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
  </div>
)

// ─── File attachment ──────────────────────────────────────────────────────────
const FileAttachment = ({ file, isMe, onLightbox }) => {
  const f = file.file || file
  const url = fileUrl(f.filePath)
  if (isImage(f.mimeType)) {
    return (
      <button onClick={() => onLightbox(url, f.originalName)} className="block mt-1.5 rounded-xl overflow-hidden ring-1 ring-black/10 hover:ring-2 hover:ring-white/40 transition-all">
        <img src={url} alt={f.originalName} className="max-w-[200px] max-h-[200px] object-cover block" />
      </button>
    )
  }
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className={`flex items-center gap-2.5 mt-1.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${isMe ? 'bg-white/15 hover:bg-white/25' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-blue-100'}`}>
        <Paperclip size={14} className={isMe ? 'text-white' : 'text-blue-600'} />
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-xs max-w-[150px]">{f.originalName}</p>
        <p className={`text-[10px] ${isMe ? 'text-white/60' : 'text-slate-400'}`}>{formatFileSize(f.fileSize)}</p>
      </div>
    </a>
  )
}

// ─── Reply quote block ────────────────────────────────────────────────────────
const parseReply = (content) => {
  if (!content?.startsWith('↩ ')) return null
  const nl = content.indexOf('\n')
  if (nl === -1) return null
  return { quote: content.slice(2, nl), text: content.slice(nl + 1) }
}

const QuoteBlock = ({ quote, senderName, isMe }) => (
  <div className={`border-l-2 pl-2 mb-1.5 text-xs rounded-sm ${isMe ? 'border-white/50 text-white/70' : 'border-blue-400 text-slate-500'}`}>
    {senderName && <p className={`font-semibold text-[10px] mb-0.5 ${isMe ? 'text-white/60' : 'text-blue-500'}`}>{senderName}</p>}
    <p className="truncate">{quote}</p>
  </div>
)

// ─── Mention renderer ──────────────────────────────────────────────────────────
const renderContent = (content, members) => {
  if (!content || !content.includes('@[')) return content
  const parts = content.split(/(@\[\d+\])/g)
  return parts.map((part, i) => {
    const m = part.match(/^@\[(\d+)\]$/)
    if (m) {
      const uid = parseInt(m[1])
      const member = members?.find((mb) => mb.user?.id === uid || mb.id === uid)
      const name = member ? `@${member.user?.firstName || member.firstName || 'Kullanıcı'}` : '@Biri'
      return <span key={i} className="text-purple-500 font-medium">{name}</span>
    }
    return part
  })
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({
  msg, isMe, isGroup, showSender, prevSameUser,
  onEdit, onDelete, onReply, onCopy, onLightbox, onReaction, onPin, onForward,
  editingId, editContent, setEditContent, saveEdit, cancelEdit,
  members,
}) => {
  const [emojiOpen, setEmojiOpen] = useState(false)
  const emojiRef = useRef(null)

  useEffect(() => {
    if (!emojiOpen) return
    const handler = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setEmojiOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [emojiOpen])

  const isDeleted = !!msg.deletedAt
  const legacyParsed = !msg.replyTo ? parseReply(msg.content) : null
  const displayContent = legacyParsed ? legacyParsed.text : msg.content

  const reactionGroups = (msg.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = acc[r.emoji] || { emoji: r.emoji, count: 0, users: [], isMine: false }
    acc[r.emoji].count++
    acc[r.emoji].users.push(r.user?.firstName || '')
    if (r.userId === msg._currentUserId) acc[r.emoji].isMine = true
    return acc
  }, {})

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${prevSameUser ? 'mt-0.5' : 'mt-3'}`}>
      {/* Sender name in group */}
      {showSender && isGroup && !isMe && (
        <span className="text-[11px] text-slate-400 mb-1 px-1 font-medium">
          {msg.sender?.firstName} {msg.sender?.lastName}
        </span>
      )}

      <div className={`flex items-end gap-1.5 group ${isMe ? 'flex-row-reverse' : ''}`}>
        {/* Avatar (groups only, other user) */}
        {isGroup && !isMe && (
          <div className="w-7 shrink-0 self-end mb-0.5">
            {showSender && <Avatar firstName={msg.sender?.firstName} lastName={msg.sender?.lastName} size="sm" />}
          </div>
        )}

        {/* Hover action bar */}
        <div className={`hidden group-hover:flex items-center gap-0.5 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          {!isDeleted && (
            <>
              {/* Emoji toggle button + floating popup */}
              <div className="relative" ref={emojiRef}>
                <button
                  onClick={() => setEmojiOpen((p) => !p)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-yellow-500 hover:bg-yellow-50 transition-colors text-sm"
                  title="Reaksiyon ekle"
                >
                  😊
                </button>
                {emojiOpen && (
                  <div className={`absolute bottom-8 z-20 flex gap-0.5 bg-white border border-slate-200 rounded-xl px-2 py-1.5 shadow-lg ${isMe ? 'right-0' : 'left-0'}`}>
                    {EMOJIS.map((em) => (
                      <button key={em} onClick={() => { onReaction(msg.id, em); setEmojiOpen(false) }}
                        className="text-base hover:scale-125 transition-transform px-0.5" title={em}>
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => onReply(msg)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Yanıtla">
                <CornerUpLeft size={13} />
              </button>
              <button onClick={() => onCopy(displayContent || '')}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Kopyala">
                <Copy size={13} />
              </button>
              {isMe && !msg.files?.length && (
                <button onClick={() => onEdit(msg)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Düzenle">
                  <Edit2 size={13} />
                </button>
              )}
              <button onClick={() => onPin(msg.id)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${msg.pinnedAt ? 'text-yellow-500 bg-yellow-50' : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'}`} title={msg.pinnedAt ? 'Sabitlemeyi Kaldır' : 'Sabitle'}>
                <Pin size={13} />
              </button>
              <button onClick={() => onForward(msg)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-green-500 hover:bg-green-50 transition-colors" title="İlet">
                <Forward size={13} />
              </button>
              {isMe && (
                <button onClick={() => onDelete(msg.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Sil">
                  <Trash2 size={13} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Bubble */}
        <div className="flex flex-col">
          {editingId === msg.id ? (
            <div className="flex flex-col gap-1.5 w-64">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }
                  if (e.key === 'Escape') cancelEdit()
                }}
                rows={2} autoFocus
                className="border border-blue-400 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
              <div className="flex gap-1.5 justify-end">
                <button onClick={saveEdit} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">Kaydet</button>
                <button onClick={cancelEdit} className="px-3 py-1 border border-slate-200 text-xs rounded-lg hover:bg-slate-50">İptal</button>
              </div>
            </div>
          ) : (
            <div className={`max-w-[320px] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm ${
              isMe
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm'
                : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100'
            } ${isDeleted ? 'opacity-40 italic' : ''}`}>
              {/* Forwarded badge */}
              {msg.forwardedFromId && (
                <div className={`flex items-center gap-1 text-[10px] mb-1 ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                  <Forward size={10} />
                  <span>İletildi</span>
                </div>
              )}
              {/* DB-based reply */}
              {msg.replyTo && !msg.replyTo.deletedAt && (
                <QuoteBlock
                  quote={msg.replyTo.content || '📎 Dosya'}
                  senderName={`${msg.replyTo.sender?.firstName || ''} ${msg.replyTo.sender?.lastName || ''}`.trim()}
                  isMe={isMe}
                />
              )}
              {/* Legacy text-hack reply */}
              {legacyParsed && <QuoteBlock quote={legacyParsed.quote} isMe={isMe} />}
              {displayContent && (
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {renderContent(displayContent, members)}
                </p>
              )}
              {msg.files?.map((f, fi) => (
                <FileAttachment key={fi} file={f} isMe={isMe} onLightbox={onLightbox} />
              ))}
              {msg.isEdited && !isDeleted && (
                <span className={`text-[10px] mt-0.5 block ${isMe ? 'text-white/50' : 'text-slate-400'}`}>(düzenlendi)</span>
              )}
            </div>
          )}

          {/* Reaction chips */}
          {Object.values(reactionGroups).length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {Object.values(reactionGroups).map((rg) => (
                <button key={rg.emoji} onClick={() => onReaction(msg.id, rg.emoji)}
                  title={rg.users.join(', ')}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                    rg.isMine ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  <span>{rg.emoji}</span>
                  <span className="font-medium">{rg.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timestamp + status */}
      <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
        <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
        {isMe && !isDeleted && (
          msg.status === 'READ'
            ? <CheckCheck size={12} className="text-blue-400" />
            : <Check size={12} className="text-slate-300" />
        )}
      </div>
    </div>
  )
}

// ─── Date separator ───────────────────────────────────────────────────────────
const DateSeparator = ({ date }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-slate-200" />
    <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-3 py-0.5 rounded-full whitespace-nowrap">
      {dateLabel(date)}
    </span>
    <div className="flex-1 h-px bg-slate-200" />
  </div>
)

// ─── Main ──────────────────────────────────────────────────────────────────────
const MessagingPage = () => {
  const { user } = useAuth()
  const { socket, joinConversation, leaveConversation, sendTypingStart, sendTypingStop, isUserOnline } = useSocket()

  const [conversations, setConversations]   = useState([])
  const [convSearch, setConvSearch]         = useState('')
  const [loading, setLoading]               = useState(true)
  const [selectedConv, setSelectedConv]     = useState(null)
  const [messages, setMessages]             = useState([])
  const [msgLoading, setMsgLoading]         = useState(false)
  const [typingUsers, setTypingUsers]       = useState([])
  const [newMessage, setNewMessage]         = useState('')
  const [sending, setSending]               = useState(false)
  const [pendingFile, setPendingFile]       = useState(null)
  const [fileUploading, setFileUploading]   = useState(false)
  const [replyingTo, setReplyingTo]         = useState(null)
  const [editingMsg, setEditingMsg]         = useState(null)
  const [editContent, setEditContent]       = useState('')
  const [showInfo, setShowInfo]             = useState(false)
  const [convMembers, setConvMembers]       = useState([])
  const [showNewDirect, setShowNewDirect]   = useState(false)
  const [showNewGroup, setShowNewGroup]     = useState(false)
  const [directSearch, setDirectSearch]     = useState('')
  const [directResults, setDirectResults]   = useState([])
  const [groupName, setGroupName]           = useState('')
  const [groupSearch, setGroupSearch]       = useState('')
  const [groupResults, setGroupResults]     = useState([])
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([])
  const [creatingGroup, setCreatingGroup]   = useState(false)
  const [showAddMember, setShowAddMember]   = useState(false)
  const [addSearch, setAddSearch]           = useState('')
  const [addResults, setAddResults]         = useState([])
  const [lightbox, setLightbox]             = useState(null)
  const [showScrollBtn, setShowScrollBtn]   = useState(false)
  const [mentionSearch, setMentionSearch]   = useState(null)   // null = kapalı, string = arama
  const [mentionCandidates, setMentionCandidates] = useState([])
  const [mentionIndex, setMentionIndex]     = useState(0)

  // Infinite scroll
  const [msgPage, setMsgPage]           = useState(1)
  const [hasMoreMsgs, setHasMoreMsgs]   = useState(false)
  const [loadingMore, setLoadingMore]   = useState(false)

  // Search
  const [showSearch, setShowSearch]     = useState(false)
  const [searchQuery, setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]       = useState(false)

  // Archive
  const [showArchived, setShowArchived] = useState(false)

  // Pin
  const [pinnedMessages, setPinnedMessages] = useState([])
  const [showPinnedPanel, setShowPinnedPanel] = useState(false)

  // Forward
  const [forwardingMsg, setForwardingMsg] = useState(null)
  const [forwardSearch, setForwardSearch] = useState('')

  const isTypingRef    = useRef(false)
  const typingTimer    = useRef(null)
  const messagesEndRef = useRef(null)
  const messagesBoxRef = useRef(null)
  const fileInputRef   = useRef(null)
  const inputRef       = useRef(null)
  const loadingMoreRef  = useRef(false)
  const showArchivedRef = useRef(false)

  const debouncedDirect  = useDebounce(directSearch, 350)
  const debouncedGroup   = useDebounce(groupSearch, 350)
  const debouncedAdd     = useDebounce(addSearch, 350)
  const debouncedSearch  = useDebounce(searchQuery, 400)

  // ── Fetch conversations ────────────────────────────────────────────────────
  const fetchConversations = useCallback(async (archived = false) => {
    try {
      const res = await conversationService.getConversations(archived ? { archived: true } : {})
      setConversations(res.data || [])
    } catch {
      toast.error('Konuşmalar getirilemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    showArchivedRef.current = showArchived
    fetchConversations(showArchived)
  }, [fetchConversations, showArchived])

  // ── Socket ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !selectedConv) return
    const onReceive = (msg) => {
      if (msg.conversationId === selectedConv.id) {
        setMessages((p) => p.some((m) => m.id === msg.id) ? p : [...p, msg])
        scrollToBottom()
        messageService.markAsRead(selectedConv.id)
      }
      fetchConversations(showArchivedRef.current)
    }
    const onEdit   = (msg) => setMessages((p) => p.map((m) => m.id === msg.id ? { ...m, ...msg } : m))
    const onDelete = ({ id }) => setMessages((p) => p.map((m) => m.id === id ? { ...m, deletedAt: new Date(), content: 'Bu mesaj silindi' } : m))
    const onReaction = ({ messageId, reactions }) =>
      setMessages((p) => p.map((m) => m.id === messageId ? { ...m, reactions } : m))
    const onPin = ({ messageId, pinnedAt }) => {
      setMessages((p) => p.map((m) => m.id === messageId ? { ...m, pinnedAt } : m))
      if (pinnedAt) {
        setPinnedMessages((p) => p.some((m) => m.id === messageId) ? p : [...p, { id: messageId, pinnedAt }])
      } else {
        setPinnedMessages((p) => p.filter((m) => m.id !== messageId))
      }
    }
    const onTypingStart = ({ userId, conversationId }) => {
      if (userId !== user.id && Number(conversationId) === Number(selectedConv.id))
        setTypingUsers((p) => [...new Set([...p, userId])])
    }
    const onTypingStop = ({ userId, conversationId }) => {
      if (Number(conversationId) === Number(selectedConv.id))
        setTypingUsers((p) => p.filter((id) => id !== userId))
    }
    socket.on('message:receive', onReceive)
    socket.on('message:edit', onEdit)
    socket.on('message:delete', onDelete)
    socket.on('message:reaction', onReaction)
    socket.on('message:pin', onPin)
    socket.on('typing:start', onTypingStart)
    socket.on('typing:stop', onTypingStop)
    return () => {
      socket.off('message:receive', onReceive)
      socket.off('message:edit', onEdit)
      socket.off('message:delete', onDelete)
      socket.off('message:reaction', onReaction)
      socket.off('message:pin', onPin)
      socket.off('typing:start', onTypingStart)
      socket.off('typing:stop', onTypingStop)
    }
  }, [socket, selectedConv, user.id, fetchConversations])

  // ── User searches ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showNewDirect) { setDirectResults([]); return }
    userService.searchUsers(debouncedDirect).then((r) => setDirectResults(r.data || [])).catch(() => setDirectResults([]))
  }, [debouncedDirect, showNewDirect])

  useEffect(() => {
    if (!showNewGroup) { setGroupResults([]); return }
    userService.searchUsers(debouncedGroup)
      .then((r) => setGroupResults((r.data || []).filter((u) => u.id !== user.id && !selectedGroupUsers.find((s) => s.id === u.id))))
      .catch(() => setGroupResults([]))
  }, [debouncedGroup, selectedGroupUsers, user.id, showNewGroup])

  useEffect(() => {
    if (debouncedAdd.length >= 2)
      userService.searchUsers(debouncedAdd)
        .then((r) => setAddResults((r.data || []).filter((u) => !convMembers.find((m) => m.user.id === u.id))))
        .catch(() => {})
    else setAddResults([])
  }, [debouncedAdd, convMembers])

  // ── Scroll ─────────────────────────────────────────────────────────────────
  const scrollToBottom = (smooth = true) =>
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })

  useEffect(() => { scrollToBottom() }, [messages])

  const handleScroll = () => {
    const el = messagesBoxRef.current
    if (!el) return
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200)
    if (el.scrollTop < 80 && hasMoreMsgs && !loadingMore) loadOlderMessages()
  }

  // ── Select conversation ────────────────────────────────────────────────────
  const selectConversation = async (conv) => {
    if (selectedConv) leaveConversation(selectedConv.id)
    setSelectedConv(conv)
    setMessages([])
    setTypingUsers([])
    setEditingMsg(null)
    setReplyingTo(null)
    setShowInfo(false)
    setConvMembers([])
    setMsgPage(1)
    setHasMoreMsgs(false)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
    setPinnedMessages([])
    setShowPinnedPanel(false)
    joinConversation(conv.id)
    setMsgLoading(true)
    try {
      const [msgRes, memberRes, pinnedRes] = await Promise.all([
        messageService.getMessages(conv.id, { page: 1, limit: 30 }),
        conversationService.getMembers(conv.id),
        messageService.getPinnedMessages(conv.id),
      ])
      const msgs = msgRes.data || []
      setMessages(msgs)
      setHasMoreMsgs(msgRes.pagination ? msgRes.pagination.totalPages > 1 : false)
      setConvMembers(memberRes.data || [])
      setPinnedMessages(pinnedRes.data || [])
      await messageService.markAsRead(conv.id)
      fetchConversations(showArchived)
      setTimeout(() => scrollToBottom(false), 50)
    } catch {
      toast.error('Mesajlar getirilemedi')
    } finally {
      setMsgLoading(false)
    }
  }

  const loadOlderMessages = useCallback(async () => {
    if (!selectedConv || loadingMoreRef.current || !hasMoreMsgs) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    const box = messagesBoxRef.current
    const prevScrollHeight = box?.scrollHeight || 0
    try {
      const nextPage = msgPage + 1
      const res = await messageService.getMessages(selectedConv.id, { page: nextPage, limit: 30 })
      const older = res.data || []
      if (older.length > 0) {
        setMessages((p) => {
          const existingIds = new Set(p.map((m) => m.id))
          return [...older.filter((m) => !existingIds.has(m.id)), ...p]
        })
        setMsgPage(nextPage)
        setHasMoreMsgs(res.pagination ? nextPage < res.pagination.totalPages : false)
        requestAnimationFrame(() => {
          if (box) box.scrollTop = box.scrollHeight - prevScrollHeight
        })
      } else {
        setHasMoreMsgs(false)
      }
    } catch {
      toast.error('Eski mesajlar yüklenemedi')
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [selectedConv, hasMoreMsgs, msgPage])

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if ((!newMessage.trim() && !pendingFile) || !selectedConv) return
    setSending(true)
    try {
      let fileIds = []
      if (pendingFile) {
        setFileUploading(true)
        const uploadRes = await messageService.uploadFile(pendingFile)
        fileIds = [uploadRes.data.id]
        setFileUploading(false)
        setPendingFile(null)
      }
      const content = newMessage.trim() || null
      await messageService.sendMessage(selectedConv.id, {
        content,
        fileIds: fileIds.length ? fileIds : undefined,
        replyToId: replyingTo?.id ?? undefined,
      })
      setNewMessage('')
      setReplyingTo(null)
      setMentionSearch(null)
      sendTypingStop(selectedConv.id)
      isTypingRef.current = false
    } catch {
      toast.error('Mesaj gönderilemedi')
    } finally {
      setSending(false)
      setFileUploading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (mentionSearch !== null && mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex((i) => (i + 1) % mentionCandidates.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex((i) => (i - 1 + mentionCandidates.length) % mentionCandidates.length)
        return
      }
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
        e.preventDefault()
        selectMention(mentionCandidates[mentionIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMentionSearch(null)
        setMentionCandidates([])
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    if (e.key === 'Escape') { setReplyingTo(null); cancelEdit() }
  }

  const handleTyping = (e) => {
    const val = e.target.value
    setNewMessage(val)
    if (!selectedConv) return
    if (!isTypingRef.current) { isTypingRef.current = true; sendTypingStart(selectedConv.id) }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => { isTypingRef.current = false; sendTypingStop(selectedConv.id) }, 2000)
    // Mention detection
    const cursor = e.target.selectionStart
    const before = val.slice(0, cursor)
    const mentionMatch = before.match(/@(\w*)$/)
    if (mentionMatch) {
      const q = mentionMatch[1].toLowerCase()
      setMentionSearch(q)
      setMentionCandidates(
        convMembers.filter((m) =>
          m.user.id !== user.id &&
          (`${m.user.firstName} ${m.user.lastName}`).toLowerCase().includes(q)
        ).slice(0, 5)
      )
      setMentionIndex(0)
    } else {
      setMentionSearch(null)
      setMentionCandidates([])
    }
  }

  const selectMention = (member) => {
    const textarea = inputRef.current
    const pos = textarea.selectionStart
    const before = newMessage.slice(0, pos)
    const atMatch = before.match(/@\w*$/)
    const atStart = atMatch ? pos - atMatch[0].length : pos
    const after = newMessage.slice(pos)
    setNewMessage(newMessage.slice(0, atStart) + `@[${member.user.id}] ` + after)
    setMentionSearch(null)
    setMentionCandidates([])
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // ── Reactions ──────────────────────────────────────────────────────────────
  const handleReaction = async (msgId, emoji) => {
    try {
      await messageService.toggleReaction(selectedConv.id, msgId, emoji)
    } catch {
      toast.error('Reaksiyon güncellenemedi')
    }
  }

  // ── Pin ────────────────────────────────────────────────────────────────────
  const handlePin = async (msgId) => {
    try {
      await messageService.pinMessage(selectedConv.id, msgId)
    } catch {
      toast.error('Sabitleme başarısız')
    }
  }

  // ── Forward ────────────────────────────────────────────────────────────────
  const handleForward = async (targetConvId) => {
    if (!forwardingMsg) return
    try {
      await messageService.forwardMessage(targetConvId, forwardingMsg.id)
      setForwardingMsg(null)
      setForwardSearch('')
      toast.success('Mesaj iletildi')
    } catch {
      toast.error('Mesaj iletilemedi')
    }
  }

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2 || !selectedConv) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await messageService.searchMessages(selectedConv.id, q.trim())
      setSearchResults(res.data || [])
    } catch {
      toast.error('Arama başarısız')
    } finally {
      setSearching(false)
    }
  }, [selectedConv])

  useEffect(() => { if (showSearch) handleSearch(debouncedSearch) }, [debouncedSearch, showSearch, handleSearch])

  const scrollToMessage = (msgId) => {
    const el = document.querySelector(`[data-msg-id="${msgId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-blue-400', 'rounded-xl')
      setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400', 'rounded-xl'), 2000)
    }
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  // ── Archive ────────────────────────────────────────────────────────────────
  const handleArchive = async () => {
    if (!selectedConv) return
    try {
      const isArchived = !!selectedConv.archivedAt
      await conversationService.archiveConversation(selectedConv.id)
      toast.success(isArchived ? 'Arşivden çıkarıldı' : 'Konuşma arşivlendi')
      setSelectedConv(null)
      setMessages([])
      fetchConversations(showArchived)
    } catch {
      toast.error('İşlem başarısız')
    }
  }

  // ── Edit / Delete / Reply / Copy ───────────────────────────────────────────
  const startEdit  = (msg) => { setEditingMsg(msg); setEditContent(msg.content || '') }
  const cancelEdit = () => { setEditingMsg(null); setEditContent('') }

  const saveEdit = async () => {
    if (!editContent.trim() || !editingMsg) return
    try {
      await messageService.updateMessage(selectedConv.id, editingMsg.id, editContent.trim())
      cancelEdit()
    } catch { toast.error('Mesaj güncellenemedi') }
  }

  const handleDelete = async (msgId) => {
    if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) return
    try { await messageService.deleteMessage(selectedConv.id, msgId) }
    catch { toast.error('Mesaj silinemedi') }
  }

  const handleReply = (msg) => {
    setReplyingTo(msg)
    inputRef.current?.focus()
  }

  const handleCopy = async (content) => {
    try { await navigator.clipboard.writeText(content || ''); toast.success('Kopyalandı', { duration: 1200 }) }
    catch { toast.error('Kopyalanamadı') }
  }

  // ── Conversations ──────────────────────────────────────────────────────────
  const startDirect = async (targetUser) => {
    try {
      const res = await conversationService.createConversation({ type: 'DIRECT', memberIds: [targetUser.id] })
      setShowNewDirect(false); setDirectSearch('')
      await fetchConversations(false)
      selectConversation(res.data)
    } catch { toast.error('Konuşma başlatılamadı') }
  }

  const createGroup = async () => {
    if (!groupName.trim()) { toast.error('Grup adı zorunludur'); return }
    if (selectedGroupUsers.length < 1) { toast.error('En az 1 kişi seçin'); return }
    setCreatingGroup(true)
    try {
      const res = await conversationService.createConversation({
        type: 'GROUP', name: groupName.trim(),
        memberIds: selectedGroupUsers.map((u) => u.id),
      })
      setShowNewGroup(false); setGroupName(''); setSelectedGroupUsers([]); setGroupSearch('')
      await fetchConversations(false)
      selectConversation(res.data)
    } catch { toast.error('Grup oluşturulamadı') }
    finally { setCreatingGroup(false) }
  }

  const addMember = async (targetUser) => {
    try {
      await conversationService.addMember(selectedConv.id, [targetUser.id])
      const res = await conversationService.getMembers(selectedConv.id)
      setConvMembers(res.data || [])
      setShowAddMember(false); setAddSearch('')
      toast.success(`${targetUser.firstName} eklendi`)
    } catch { toast.error('Üye eklenemedi') }
  }

  const removeMember = async (targetUserId) => {
    if (!confirm('Bu üyeyi gruptan çıkarmak istediğinizden emin misiniz?')) return
    try {
      await conversationService.removeMember(selectedConv.id, targetUserId)
      setConvMembers((p) => p.filter((m) => m.user.id !== targetUserId))
    } catch { toast.error('Üye çıkarılamadı') }
  }

  const leaveConv = async () => {
    if (!confirm('Bu konuşmadan ayrılmak istediğinizden emin misiniz?')) return
    try {
      await conversationService.leaveConversation(selectedConv.id)
      leaveConversation(selectedConv.id)
      setSelectedConv(null); setMessages([])
      fetchConversations(showArchived)
      toast.success('Konuşmadan ayrıldınız')
    } catch { toast.error('İşlem başarısız') }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getConvName   = (conv) => {
    if (conv.type === 'GROUP') return conv.name || 'Grup'
    const other = conv.members?.find((m) => m.user.id !== user.id)
    return other ? `${other.user.firstName} ${other.user.lastName}` : 'Bilinmiyor'
  }
  const getOtherUser  = (conv) => conv.members?.find((m) => m.user.id !== user.id)?.user
  const isOnline      = (conv) => {
    if (conv.type === 'GROUP') return false
    const other = getOtherUser(conv)
    return other ? isUserOnline(other.id) : false
  }
  const myMemberRole  = convMembers.find((m) => m.user.id === user.id)?.role

  const getUnreadCount = (conv) => {
    const myMember = conv.members?.find((m) => m.user.id === user.id)
    if (!myMember?.lastReadAt) return conv.messages?.length || 0
    return conv.messages?.filter((m) => new Date(m.createdAt) > new Date(myMember.lastReadAt) && m.sender?.id !== user.id).length || 0
  }

  const filteredConvs = conversations.filter((c) =>
    getConvName(c).toLowerCase().includes(convSearch.toLowerCase())
  )

  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all'

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-56px)] bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-200/60">

      {lightbox && <Lightbox src={lightbox.src} name={lightbox.name} onClose={() => setLightbox(null)} />}

      {/* Forward modal */}
      {forwardingMsg && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setForwardingMsg(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-80 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Forward size={15} className="text-green-500" />
                Mesajı İlet
              </h3>
              <button onClick={() => setForwardingMsg(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-2 border-b border-slate-100">
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 truncate">
                {forwardingMsg.content || '📎 Dosya'}
              </div>
            </div>
            <div className="px-4 py-2 border-b border-slate-100">
              <input
                autoFocus
                value={forwardSearch}
                onChange={(e) => setForwardSearch(e.target.value)}
                placeholder="Konuşma ara..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {conversations
                .filter((c) => c.id !== selectedConv?.id && getConvName(c).toLowerCase().includes(forwardSearch.toLowerCase()))
                .map((conv) => {
                  const isGroup = conv.type === 'GROUP'
                  const other = !isGroup ? getOtherUser(conv) : null
                  return (
                    <button key={conv.id} onClick={() => handleForward(conv.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 text-left transition-colors">
                      <Avatar
                        firstName={isGroup ? (conv.name || 'G') : (other?.firstName ?? '?')}
                        lastName={isGroup ? '' : (other?.lastName ?? '')}
                        size="sm"
                        group={isGroup}
                      />
                      <span className="text-sm text-slate-700 truncate">{getConvName(conv)}</span>
                    </button>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col bg-white border-r border-slate-200">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <MessageSquare size={15} className="text-blue-500" />
              Mesajlar
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setShowNewDirect((p) => !p); setShowNewGroup(false) }}
                title="Direkt mesaj"
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-xs font-bold ${showNewDirect ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => { setShowNewGroup((p) => !p); setShowNewDirect(false) }}
                title="Grup oluştur"
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${showNewGroup ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
              >
                <Users size={13} />
              </button>
            </div>
          </div>

          {/* Conversation search */}
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              placeholder="Konuşma ara..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* New Direct — takes over the list area */}
        {showNewDirect && (
          <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50 shrink-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Yeni Direkt Mesaj</p>
            <input autoFocus value={directSearch} onChange={(e) => setDirectSearch(e.target.value)}
              placeholder="İsim veya departman ara..." className={inputCls} />
          </div>
        )}

        {/* New Group */}
        {showNewGroup && (
          <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50 space-y-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Yeni Grup</p>
            <input autoFocus value={groupName} onChange={(e) => setGroupName(e.target.value)}
              placeholder="Grup adı *" className={inputCls} />
            <input value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)}
              placeholder="Üye ara..." className={inputCls} />
            {groupResults.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-2">Eklenecek kullanıcı yok</p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-0.5 border border-slate-200 rounded-lg bg-white p-1">
                {groupResults.map((u) => (
                  <button key={u.id} onClick={() => { setSelectedGroupUsers((p) => [...p, u]); setGroupSearch('') }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 rounded-md text-left transition-colors">
                    <Avatar firstName={u.firstName} lastName={u.lastName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{u.firstName} {u.lastName}</p>
                      {(u.profile?.department || u.profile?.position) && (
                        <p className="text-[10px] text-slate-400 truncate">
                          {[u.profile?.department, u.profile?.position].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <UserPlus size={11} className="text-blue-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}
            {selectedGroupUsers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedGroupUsers.map((u) => (
                  <span key={u.id} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {u.firstName}
                    <button onClick={() => setSelectedGroupUsers((p) => p.filter((s) => s.id !== u.id))} className="hover:text-blue-900">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <button onClick={createGroup} disabled={creatingGroup}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {creatingGroup ? 'Oluşturuluyor...' : 'Grubu Oluştur'}
            </button>
          </div>
        )}

        {/* Archive toggle */}
        {!showNewDirect && !showNewGroup && (
          <div className="px-4 py-1.5 border-b border-slate-100">
            <button
              onClick={() => { setShowArchived((p) => !p); setSelectedConv(null); setMessages([]) }}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${showArchived ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}>
              {showArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
              {showArchived ? 'Normal Konuşmalar' : 'Arşivi Göster'}
            </button>
          </div>
        )}

        {/* Conversation list / user search results */}
        <div className="flex-1 overflow-y-auto">
          {/* Direct search results — tam liste */}
          {showNewDirect && (
            directResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Search size={24} strokeWidth={1} className="mb-2" />
                <p className="text-xs">Kullanıcı bulunamadı</p>
              </div>
            ) : (
              <div className="py-1">
                <p className="text-[10px] text-slate-400 px-4 py-2 font-semibold uppercase tracking-widest border-b border-slate-100">
                  {directResults.length} sonuç
                </p>
                {directResults.map((u) => (
                  <button key={u.id} onClick={() => startDirect(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left border-b border-slate-50 transition-colors group">
                    <Avatar firstName={u.firstName} lastName={u.lastName} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-700">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {[u.profile?.department, u.profile?.position].filter(Boolean).join(' · ') || u.email}
                      </p>
                    </div>
                    <MessageSquare size={14} className="text-slate-300 group-hover:text-blue-400 shrink-0" />
                  </button>
                ))}
              </div>
            )
          )}

          {/* Normal conversation list — hidden when searching */}
          {!showNewDirect && loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
                  <div className="w-8 h-8 bg-slate-100 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !showNewDirect && filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <MessageSquare size={28} strokeWidth={1} className="mb-2" />
              <p className="text-xs">{convSearch ? 'Eşleşen konuşma yok' : 'Henüz konuşma yok'}</p>
            </div>
          ) : !showNewDirect && filteredConvs.map((conv) => {
            const isGroup   = conv.type === 'GROUP'
            const isActive  = selectedConv?.id === conv.id
            const unread    = getUnreadCount(conv)
            const other     = !isGroup ? getOtherUser(conv) : null
            return (
              <button key={conv.id} onClick={() => selectConversation(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-50 transition-all ${isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'}`}>
                <Avatar
                  firstName={isGroup ? (conv.name || 'G') : (other?.firstName ?? '?')}
                  lastName={isGroup ? '' : (other?.lastName ?? '')}
                  size="md"
                  group={isGroup}
                  online={isOnline(conv)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs truncate ${unread > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {getConvName(conv)}
                    </span>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">{formatRelative(conv.lastMessageAt)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-[11px] truncate max-w-[155px] ${unread > 0 ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                      {conv.messages?.[0]
                        ? (isGroup && conv.messages[0].sender?.id !== user.id ? `${conv.messages[0].sender?.firstName}: ` : '') + (conv.messages[0].content?.replace(/↩ .+\n/, '') || '📎 Dosya')
                        : <span className="italic">Konuşma başlat</span>
                      }
                    </p>
                    {unread > 0 && (
                      <span className="ml-1 shrink-0 min-w-[18px] h-[18px] bg-blue-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CHAT AREA ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <MessageSquare size={28} strokeWidth={1} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500">Bir konuşma seçin</p>
              <p className="text-xs mt-1">veya yeni bir sohbet başlatın</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-white shadow-sm">
              {(() => {
                const isGroup = selectedConv.type === 'GROUP'
                const other   = !isGroup ? getOtherUser(selectedConv) : null
                return (
                  <Avatar
                    firstName={isGroup ? (selectedConv.name || 'G') : (other?.firstName ?? '?')}
                    lastName={isGroup ? '' : (other?.lastName ?? '')}
                    size="md"
                    group={isGroup}
                    online={isOnline(selectedConv)}
                  />
                )
              })()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{getConvName(selectedConv)}</p>
                <p className="text-xs text-slate-400">
                  {selectedConv.type === 'GROUP'
                    ? `${convMembers.length} üye`
                    : isOnline(selectedConv)
                      ? <span className="text-emerald-500 font-medium">Çevrimiçi</span>
                      : 'Çevrimdışı'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setShowSearch((p) => !p); setSearchQuery(''); setSearchResults([]) }}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${showSearch ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                  title="Mesajlarda Ara">
                  <Search size={15} />
                </button>
                <button onClick={handleArchive}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                  title={selectedConv.archivedAt ? 'Arşivden Çıkar' : 'Arşivle'}>
                  {selectedConv.archivedAt ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                </button>
                {selectedConv.type === 'GROUP' && (
                  <button onClick={leaveConv}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Gruptan Ayrıl">
                    <LogOut size={15} />
                  </button>
                )}
                <button onClick={() => setShowInfo((p) => !p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${showInfo ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                  title="Bilgi">
                  <Info size={15} />
                </button>
              </div>
            </div>

            {/* Search dropdown */}
            {showSearch && (
              <div className="border-b border-slate-100 bg-white px-4 py-2 relative z-10">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Mesajlarda ara..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
                {searching && <p className="text-xs text-slate-400 mt-1.5 px-1">Aranıyor...</p>}
                {!searching && searchResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-0.5">
                    {searchResults.map((msg) => (
                      <button key={msg.id} onClick={() => scrollToMessage(msg.id)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                        <p className="text-[11px] font-semibold text-blue-600">{msg.sender?.firstName} {msg.sender?.lastName}</p>
                        <p className="text-xs text-slate-600 truncate">{msg.content}</p>
                      </button>
                    ))}
                  </div>
                )}
                {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1.5 px-1">Sonuç bulunamadı</p>
                )}
              </div>
            )}

            {/* Pinned messages bar */}
            {pinnedMessages.length > 0 && (
              <div className="border-b border-yellow-100 bg-yellow-50 px-4 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-yellow-100 transition-colors"
                onClick={() => setShowPinnedPanel((p) => !p)}>
                <Pin size={11} className="text-yellow-500 shrink-0" />
                <span className="text-xs font-medium text-yellow-700 flex-1">{pinnedMessages.length} sabitlenmiş mesaj</span>
                <ChevronDown size={12} className={`text-yellow-500 transition-transform ${showPinnedPanel ? 'rotate-180' : ''}`} />
              </div>
            )}
            {showPinnedPanel && pinnedMessages.length > 0 && (
              <div className="border-b border-yellow-100 bg-yellow-50/50 max-h-40 overflow-y-auto">
                {pinnedMessages.map((pm) => {
                  const fullMsg = messages.find((m) => m.id === pm.id)
                  if (!fullMsg) return null
                  return (
                    <button key={pm.id} onClick={() => { scrollToMessage(pm.id); setShowPinnedPanel(false) }}
                      className="w-full text-left px-4 py-2 hover:bg-yellow-100 transition-colors border-b border-yellow-100 last:border-0">
                      <p className="text-[11px] font-semibold text-yellow-700">{fullMsg.sender?.firstName} {fullMsg.sender?.lastName}</p>
                      <p className="text-xs text-slate-600 truncate">{fullMsg.content || '📎 Dosya'}</p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Messages */}
            <div
              ref={messagesBoxRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-5 py-4 bg-slate-50/60"
            >
              {/* Load more spinner */}
              {loadingMore && (
                <div className="flex justify-center py-3">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!loadingMore && hasMoreMsgs && messages.length > 0 && (
                <div className="flex justify-center py-2">
                  <button onClick={loadOlderMessages} className="text-xs text-blue-500 hover:underline">Daha eski mesajları yükle</button>
                </div>
              )}
              {msgLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-16">
                  <MessageSquare size={36} strokeWidth={1} className="mb-3" />
                  <p className="text-sm font-medium">Henüz mesaj yok</p>
                  <p className="text-xs mt-1">İlk mesajı sen gönder!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe         = msg.sender?.id === user.id
                  const prevMsg      = messages[i - 1]
                  const prevSameUser = prevMsg?.sender?.id === msg.sender?.id
                  const showSender   = !prevSameUser
                  const showDate     = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt)
                  return (
                    <div key={msg.id} data-msg-id={msg.id}>
                      {showDate && <DateSeparator date={msg.createdAt} />}
                      <MessageBubble
                        msg={{ ...msg, _currentUserId: user.id }}
                        isMe={isMe}
                        isGroup={selectedConv.type === 'GROUP'}
                        showSender={showSender}
                        prevSameUser={prevSameUser}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                        onReply={handleReply}
                        onCopy={handleCopy}
                        onLightbox={(src, name) => setLightbox({ src, name })}
                        onReaction={handleReaction}
                        onPin={handlePin}
                        onForward={(msg) => { setForwardingMsg(msg); setForwardSearch('') }}
                        editingId={editingMsg?.id}
                        editContent={editContent}
                        setEditContent={setEditContent}
                        saveEdit={saveEdit}
                        cancelEdit={cancelEdit}
                        members={convMembers}
                      />
                    </div>
                  )
                })
              )}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 mt-3 pl-1">
                  <div className="flex gap-1">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">
                    {typingUsers.map((id) => convMembers.find((m) => m.user.id === id)?.user.firstName || 'Biri').join(', ')} yazıyor...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollBtn && (
              <button
                onClick={() => scrollToBottom()}
                className="absolute bottom-24 right-6 w-9 h-9 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all z-10"
              >
                <ChevronDown size={16} />
              </button>
            )}

            {/* Input area */}
            <div className="px-4 py-3 border-t border-slate-100 bg-white">

              {/* Mention dropdown */}
              {mentionSearch !== null && mentionCandidates.length > 0 && (
                <div className="mb-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {mentionCandidates.map((m, i) => (
                    <button
                      key={m.user.id}
                      onClick={() => selectMention(m)}
                      onMouseEnter={() => setMentionIndex(i)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors text-sm ${
                        i === mentionIndex ? 'bg-blue-50' : 'hover:bg-blue-50'
                      }`}
                    >
                      <Avatar firstName={m.user.firstName} lastName={m.user.lastName} size="sm" />
                      <span className="font-medium text-slate-700">{m.user.firstName} {m.user.lastName}</span>
                      {m.user.profile?.department && <span className="text-xs text-slate-400 ml-auto">{m.user.profile.department}</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Reply preview */}
              {replyingTo && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                  <CornerUpLeft size={12} className="text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-blue-700 text-[11px]">
                      {replyingTo.sender?.firstName} {replyingTo.sender?.lastName}'a yanıt
                    </p>
                    <p className="text-slate-500 truncate">{replyingTo.content?.replace(/↩ .+\n/, '') || '📎 Dosya'}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* File preview */}
              {pendingFile && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <Paperclip size={12} className="text-slate-400 shrink-0" />
                  <span className="flex-1 text-slate-600 truncate font-medium">{pendingFile.name}</span>
                  <span className="text-slate-400">{formatFileSize(pendingFile.size)}</span>
                  <button onClick={() => setPendingFile(null)} className="text-slate-400 hover:text-red-500">
                    <X size={13} />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors shrink-0" title="Dosya ekle">
                  <Paperclip size={17} />
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPendingFile(f); e.target.value = '' }} />

                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyDown={handleKeyDown}
                    placeholder={replyingTo ? 'Yanıtınızı yazın...' : 'Mesaj yazın... (Enter = Gönder, Shift+Enter = Yeni satır)'}
                    rows={1}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none max-h-32 overflow-y-auto transition-all leading-relaxed"
                    style={{ minHeight: '42px' }}
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={sending || fileUploading || (!newMessage.trim() && !pendingFile)}
                  className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-40 transition-all shadow-sm shadow-blue-500/20 shrink-0"
                >
                  {(sending || fileUploading)
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send size={16} />
                  }
                </button>
              </div>

              <p className="text-[10px] text-slate-400 mt-1.5 px-1">
                <kbd className="font-mono bg-slate-100 px-1 rounded">Enter</kbd> gönder &nbsp;·&nbsp;
                <kbd className="font-mono bg-slate-100 px-1 rounded">Shift+Enter</kbd> yeni satır &nbsp;·&nbsp;
                <kbd className="font-mono bg-slate-100 px-1 rounded">Esc</kbd> iptal
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT INFO PANEL ──────────────────────────────────────────────── */}
      {showInfo && selectedConv && (
        <div className="w-64 shrink-0 border-l border-slate-200 flex flex-col bg-white overflow-y-auto">
          <div className="px-4 py-5 border-b border-slate-100 text-center">
            {(() => {
              const isGroup = selectedConv.type === 'GROUP'
              const other   = !isGroup ? getOtherUser(selectedConv) : null
              return (
                <>
                  <div className="flex justify-center mb-3">
                    <Avatar
                      firstName={isGroup ? (selectedConv.name || 'G') : (other?.firstName ?? '?')}
                      lastName={isGroup ? '' : (other?.lastName ?? '')}
                      size="xl"
                      group={isGroup}
                      online={isOnline(selectedConv)}
                    />
                  </div>
                  <p className="text-sm font-bold text-slate-800">{getConvName(selectedConv)}</p>
                  {isGroup
                    ? <p className="text-xs text-slate-400 mt-0.5">{convMembers.length} üye · Grup</p>
                    : <p className="text-xs text-slate-400 mt-0.5">{isOnline(selectedConv) ? '🟢 Çevrimiçi' : '⚫ Çevrimdışı'}</p>
                  }
                </>
              )
            })()}
          </div>

          {/* Direct: user info */}
          {selectedConv.type === 'DIRECT' && (() => {
            const other = getOtherUser(selectedConv)
            if (!other) return null
            const rows = [
              { label: 'Departman', value: other.profile?.department },
              { label: 'Pozisyon', value: other.profile?.position },
              { label: 'Telefon', value: other.profile?.phone },
              { label: 'E-posta', value: other.email },
            ].filter((r) => r.value)
            return rows.length > 0 ? (
              <div className="px-4 py-4 space-y-3 border-b border-slate-100">
                {rows.map((r) => (
                  <div key={r.label}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{r.label}</p>
                    <p className="text-xs text-slate-700 mt-0.5 font-medium">{r.value}</p>
                  </div>
                ))}
              </div>
            ) : null
          })()}

          {/* Group: members */}
          {selectedConv.type === 'GROUP' && (
            <div className="px-3 py-3 flex-1">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Üyeler ({convMembers.length})</p>
                {myMemberRole === 'ADMIN' && (
                  <button onClick={() => setShowAddMember((p) => !p)}
                    className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${showAddMember ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}>
                    <UserPlus size={12} />
                  </button>
                )}
              </div>

              {showAddMember && (
                <div className="mb-3 space-y-1.5">
                  <input autoFocus value={addSearch} onChange={(e) => setAddSearch(e.target.value)}
                    placeholder="Kullanıcı ara..." className={inputCls} />
                  {addResults.map((u) => (
                    <button key={u.id} onClick={() => addMember(u)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg text-left transition-colors">
                      <Avatar firstName={u.firstName} lastName={u.lastName} size="sm" />
                      <span className="text-xs text-slate-700 truncate">{u.firstName} {u.lastName}</span>
                      <UserPlus size={11} className="ml-auto text-blue-500 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-0.5">
                {convMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-slate-50 group transition-colors">
                    <Avatar
                      firstName={m.user.firstName}
                      lastName={m.user.lastName}
                      size="sm"
                      online={isUserOnline(m.user.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {m.user.firstName} {m.user.lastName}
                        {m.user.id === user.id && <span className="text-slate-400 font-normal"> (ben)</span>}
                      </p>
                      {m.role === 'ADMIN' && (
                        <p className="text-[10px] text-violet-500 font-medium">Yönetici</p>
                      )}
                    </div>
                    {myMemberRole === 'ADMIN' && m.user.id !== user.id && (
                      <button onClick={() => removeMember(m.user.id)}
                        className="hidden group-hover:flex w-6 h-6 items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                        <UserMinus size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MessagingPage
