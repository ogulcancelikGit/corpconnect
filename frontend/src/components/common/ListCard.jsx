import { Link } from 'react-router-dom'

const ListCard = ({ title, count, action, children, empty }) => {
  const showHeader = title || action
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {showHeader && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            {title && (
              <h2 className="text-sm font-semibold text-gray-900 truncate">{title}</h2>
            )}
            {count !== undefined && count > 0 && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 shrink-0">
                {count}
              </span>
            )}
          </div>
          {action && (
            action.to ? (
              <Link
                to={action.to}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors shrink-0"
              >
                {action.label} →
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors shrink-0"
              >
                {action.label}
              </button>
            )
          )}
        </div>
      )}

      {empty ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-gray-500">{empty}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">{children}</div>
      )}
    </div>
  )
}

export default ListCard
