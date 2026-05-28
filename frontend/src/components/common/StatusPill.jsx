const STATUS_STYLES = {
  PENDING:      { label: 'Beklemede',     className: 'bg-orange-50 text-orange-700 border-orange-200' },
  APPROVED:     { label: 'Onaylandı',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED:     { label: 'Reddedildi',    className: 'bg-red-50 text-red-700 border-red-200' },
  UNDER_REVIEW: { label: 'İnceleniyor',   className: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_PROGRESS:  { label: 'Devam Ediyor',  className: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED:    { label: 'Tamamlandı',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DONE:         { label: 'Tamamlandı',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  TODO:         { label: 'Yapılacak',     className: 'bg-gray-50 text-gray-700 border-gray-200' },
  CANCELLED:    { label: 'İptal',         className: 'bg-gray-50 text-gray-600 border-gray-200' },
}

const PRIORITY_STYLES = {
  LOW:    { label: 'Düşük',  className: 'bg-gray-50 text-gray-600 border-gray-200' },
  NORMAL: { label: 'Normal', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  MEDIUM: { label: 'Orta',   className: 'bg-blue-50 text-blue-700 border-blue-200' },
  HIGH:   { label: 'Yüksek', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  URGENT: { label: 'Acil',   className: 'bg-red-50 text-red-700 border-red-200' },
}

const NEUTRAL_STYLE = 'bg-gray-50 text-gray-700 border-gray-200'

const StatusPill = ({ status, priority, label, className = '', tone }) => {
  let pillLabel = label
  let pillClass = NEUTRAL_STYLE

  if (status && STATUS_STYLES[status]) {
    pillLabel = pillLabel ?? STATUS_STYLES[status].label
    pillClass = STATUS_STYLES[status].className
  } else if (priority && PRIORITY_STYLES[priority]) {
    pillLabel = pillLabel ?? PRIORITY_STYLES[priority].label
    pillClass = PRIORITY_STYLES[priority].className
  } else if (tone === 'orange') {
    pillClass = 'bg-orange-50 text-orange-700 border-orange-200'
  } else if (tone === 'green') {
    pillClass = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  } else if (tone === 'red') {
    pillClass = 'bg-red-50 text-red-700 border-red-200'
  } else if (tone === 'blue') {
    pillClass = 'bg-blue-50 text-blue-700 border-blue-200'
  }

  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded border ${pillClass} ${className}`}
    >
      {pillLabel ?? status ?? priority}
    </span>
  )
}

export default StatusPill
