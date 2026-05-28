import { Link } from 'react-router-dom'
import { Cake, Award } from 'lucide-react'

const CelebrationsWidget = ({ items }) => {
  if (!items || items.length === 0) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Bugünkü Kutlamalar</h2>
        <Link
          to="/celebrations"
          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          Tümü →
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((c, i) => {
          const isBirthday = c.kind === 'BIRTHDAY'
          const Icon = isBirthday ? Cake : Award
          return (
            <div key={`${c.user.id}-${i}`} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-700 shrink-0">
                <Icon size={14} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {c.user.firstName} {c.user.lastName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isBirthday
                    ? 'Bugün doğum günü'
                    : `Bugün ${c.years}. iş yıldönümü`}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CelebrationsWidget
