// Etiket çiplerini gösterir. labels: [{ id, name, color }]
// onRemove verilirse her çipte küçük bir × çıkar (düzenleme modu).
const hexToRgba = (hex, alpha) => {
  const h = hex?.replace('#', '') || '6b7280'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const LabelChips = ({ labels = [], onRemove, size = 'sm', className = '' }) => {
  if (!labels.length) return null
  const text = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {labels.map((l) => (
        <span
          key={l.id}
          className={`inline-flex items-center gap-1 ${text} font-medium px-1.5 py-0.5 rounded`}
          style={{ backgroundColor: hexToRgba(l.color, 0.14), color: l.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
          {l.name}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(l.id)}
              className="ml-0.5 opacity-60 hover:opacity-100"
              aria-label="Etiketi kaldır"
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

export default LabelChips
