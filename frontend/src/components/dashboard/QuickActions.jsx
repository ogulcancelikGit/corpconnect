import { Link } from 'react-router-dom'
import { CalendarOff, Lightbulb, CheckSquare, CalendarPlus } from 'lucide-react'

const actions = [
  { to: '/leaves', icon: CalendarOff, label: 'İzin Talebi' },
  { to: '/suggestions', icon: Lightbulb, label: 'Öneri Gönder' },
  { to: '/tasks', icon: CheckSquare, label: 'Görev Oluştur' },
  { to: '/calendar', icon: CalendarPlus, label: 'Etkinlik Ekle' },
]

const QuickActions = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* eslint-disable-next-line no-unused-vars */}
      {actions.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          className="group flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <Icon size={15} strokeWidth={1.75} className="text-gray-500 group-hover:text-gray-900 transition-colors" />
          <span className="text-sm font-medium text-gray-900">{label}</span>
        </Link>
      ))}
    </div>
  )
}

export default QuickActions
