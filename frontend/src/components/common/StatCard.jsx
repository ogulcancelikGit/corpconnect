import { Link } from 'react-router-dom'

// eslint-disable-next-line no-unused-vars
const StatCard = ({ label, value, to, icon: Icon }) => {
  const inner = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-950">
          {Icon && <Icon size={15} strokeWidth={1.75} />}
        </div>
        {to && (
          <span className="text-xs text-gray-400 group-hover:text-gray-700 transition-colors">→</span>
        )}
      </div>
      <p className="text-3xl font-semibold text-gray-900 tabular-nums leading-none tracking-tight">
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-2.5 font-medium">{label}</p>
    </>
  )

  const className = to
    ? 'group block bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors'
    : 'block bg-white border border-gray-200 rounded-lg p-5'

  if (to) {
    return <Link to={to} className={className}>{inner}</Link>
  }
  return <div className={className}>{inner}</div>
}

export default StatCard
