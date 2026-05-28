import { Link } from 'react-router-dom'
import {
  Activity, Newspaper, BarChart2, GraduationCap,
  Lightbulb, CalendarPlus, Megaphone,
} from 'lucide-react'
import { formatTimeAgo } from '../../utils/dateFormat'

const actionMap = {
  NEWS_CREATE: {
    label: 'yeni bir haber yayınladı',
    icon: Newspaper,
    href: (a) => `/news/${a.entityId}`,
  },
  POLL_CREATE: {
    label: 'yeni bir anket oluşturdu',
    icon: BarChart2,
    href: () => '/polls',
  },
  TRAINING_CREATE: {
    label: 'yeni bir eğitim ekledi',
    icon: GraduationCap,
    href: (a) => `/training/${a.entityId}`,
  },
  SUGGESTION_CREATE: {
    label: 'bir öneri gönderdi',
    icon: Lightbulb,
    href: () => '/suggestions',
  },
  EVENT_CREATE: {
    label: 'yeni bir etkinlik oluşturdu',
    icon: CalendarPlus,
    href: () => '/calendar',
  },
  BROADCAST: {
    label: 'toplu duyuru yaptı',
    icon: Megaphone,
    href: () => '/notifications',
  },
}

const ActivityFeedWidget = ({ items }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Şirket Akışı</h2>
      </div>
      {!items || items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <Activity size={20} strokeWidth={1.5} className="mb-2" />
          <p className="text-sm">Henüz aktivite yok</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((a) => {
            const meta = actionMap[a.action]
            if (!meta) return null
            const Icon = meta.icon
            const userName = a.user
              ? `${a.user.firstName} ${a.user.lastName}`
              : 'Sistem'
            return (
              <Link
                key={a.id}
                to={meta.href(a)}
                className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-700 shrink-0">
                  <Icon size={14} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{userName}</span>{' '}
                    <span className="text-gray-500">{meta.label}</span>
                  </p>
                  {a.detail && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">"{a.detail}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(a.createdAt)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ActivityFeedWidget
