const SectionLabel = ({ children, count }) => (
  <div className="flex items-center gap-2 mb-3">
    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {children}
    </h2>
    {count !== undefined && count > 0 && (
      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
        {count}
      </span>
    )}
    <div className="h-px flex-1 bg-gray-200" />
  </div>
)

export default SectionLabel
