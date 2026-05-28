import { Link } from 'react-router-dom'
import { BarChart2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const ActivePollsWidget = ({ polls }) => {
  if (!polls || polls.length === 0) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Oyunuzu Bekleyen Anketler</h2>
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
            {polls.length}
          </span>
        </div>
        <Link
          to="/polls"
          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          Tümü →
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {polls.map((p) => (
          <Link
            key={p.id}
            to="/polls"
            className="group flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-700 shrink-0">
              <BarChart2 size={14} strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {p.question}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {p.totalVotes} oy · {formatDistanceToNow(new Date(p.endDate), { addSuffix: true, locale: tr })} bitiyor
              </p>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-gray-700 transition-colors shrink-0">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ActivePollsWidget
