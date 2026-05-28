import { Link } from 'react-router-dom'
import { Calendar, MapPin } from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import { tr } from 'date-fns/locale'

const eventTypeLabels = {
  MEETING: 'Toplantı',
  DEADLINE: 'Termin',
  HOLIDAY: 'Tatil',
  REMINDER: 'Hatırlatma',
  OTHER: 'Diğer',
}

const formatWhen = (date) => {
  const d = new Date(date)
  if (isToday(d)) return `Bugün ${format(d, 'HH:mm')}`
  if (isTomorrow(d)) return `Yarın ${format(d, 'HH:mm')}`
  return format(d, 'd MMM EEE HH:mm', { locale: tr })
}

const UpcomingEventsWidget = ({ events }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Yaklaşan Etkinlikler</h2>
        <Link
          to="/calendar"
          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          Takvim →
        </Link>
      </div>
      {!events || events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <Calendar size={20} strokeWidth={1.5} className="mb-2" />
          <p className="text-sm">Yaklaşan etkinlik yok</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {events.map((ev) => {
            const label = eventTypeLabels[ev.type] || eventTypeLabels.OTHER
            return (
              <div key={ev.id} className="px-5 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                    {label}
                  </span>
                  <span className="text-xs text-gray-500 tabular-nums">{formatWhen(ev.startDate)}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                {ev.location && (
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin size={10} />
                    {ev.location}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default UpcomingEventsWidget
