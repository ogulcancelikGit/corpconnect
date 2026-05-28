import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Newspaper, BarChart2, MessageSquare, Settings, CalendarOff,
  CheckSquare, Receipt, Lightbulb, PartyPopper, AtSign, GraduationCap,
  Calendar as CalendarIcon, X,
} from 'lucide-react'
import notificationService from '../../services/notification.service'
import { useNotifications } from '../../context/NotificationContext'
import { formatTimeAgo } from '../../utils/dateFormat'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import SkeletonCard from '../../components/common/SkeletonCard'
import EmptyState from '../../components/common/EmptyState'

const TYPE_CONFIG = {
  NEWS:        { label: 'Haber',     icon: Newspaper },
  POLL:        { label: 'Anket',     icon: BarChart2 },
  MESSAGE:     { label: 'Mesaj',     icon: MessageSquare },
  SYSTEM:      { label: 'Sistem',    icon: Settings },
  LEAVE:       { label: 'İzin',      icon: CalendarOff },
  TASK:        { label: 'Görev',     icon: CheckSquare },
  EXPENSE:     { label: 'Masraf',    icon: Receipt },
  SUGGESTION:  { label: 'Öneri',     icon: Lightbulb },
  CELEBRATION: { label: 'Kutlama',   icon: PartyPopper },
  MENTION:     { label: 'Bahsetme',  icon: AtSign },
  TRAINING:    { label: 'Eğitim',    icon: GraduationCap },
  CALENDAR:    { label: 'Etkinlik',  icon: CalendarIcon },
}

const NotificationsPage = () => {
  const navigate = useNavigate()
  const { fetchUnreadCount } = useNotifications()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [filterType, setFilterType] = useState(null)

  const fetchNotifications = async (pageNum, append = false, type = filterType) => {
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const params = { page: pageNum, limit: 20 }
      if (type) params.type = type
      const res = await notificationService.getNotifications(params)
      if (append) {
        setNotifications((prev) => [...prev, ...(res.data || [])])
      } else {
        setNotifications(res.data || [])
      }
      setMeta(res.meta)
    } catch {
      toast.error('Bildirimler yüklenemedi')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchNotifications(1, false, filterType)
  }, [filterType])

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        )
        fetchUnreadCount()
      } catch {
        // sessizce geç
      }
    }
    if (notif.link) navigate(notif.link)
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      fetchUnreadCount()
      toast.success('Tüm bildirimler okundu olarak işaretlendi')
    } catch {
      toast.error('İşlem başarısız')
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await notificationService.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      fetchUnreadCount()
    } catch {
      toast.error('Bildirim silinemedi')
    }
  }

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    fetchNotifications(next, true, filterType)
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const hasMore = meta && notifications.length < meta.total

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Bildirimler"
        description={unreadCount > 0 ? `${unreadCount} okunmamış` : 'Tüm bildirimlerin'}
        actions={unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Tümünü okundu işaretle
          </button>
        )}
      />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setFilterType(null)}
          className={`shrink-0 px-3 py-1.5 text-xs rounded-md border transition-colors ${
            filterType === null
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          Tümü
        </button>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const Icon = cfg.icon
          const active = filterType === type
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                active
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon size={12} strokeWidth={1.75} />
              {cfg.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} variant="row" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState
            icon={Bell}
            title={filterType ? 'Bu tipte bildirim yok' : 'Henüz bildirim yok'}
            description={filterType ? 'Farklı bir tip seçmeyi dene.' : 'Yeni bildirimlerin burada görünecek.'}
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
          {notifications.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.SYSTEM
            const Icon = cfg.icon
            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`group flex items-start gap-3 px-5 py-3.5 transition-colors ${
                  notif.link ? 'cursor-pointer' : 'cursor-default'
                } ${
                  notif.isRead ? 'hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-50/60'
                }`}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-700 shrink-0">
                  <Icon size={14} strokeWidth={1.75} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${notif.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                  {notif.body && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.body}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">
                    {cfg.label} · {formatTimeAgo(notif.createdAt)}
                  </p>
                </div>

                <button
                  onClick={(e) => handleDelete(notif.id, e)}
                  className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Sil"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            )
          })}

          {hasMore && (
            <div className="text-center py-3">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? 'Yükleniyor...' : 'Daha fazla göster'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
