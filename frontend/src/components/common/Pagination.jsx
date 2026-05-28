const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null

  const handlePrev = () => onPageChange(Math.max(1, pagination.page - 1))
  const handleNext = () => onPageChange(pagination.page + 1)

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={handlePrev}
        disabled={!pagination.hasPrev}
        className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        Önceki
      </button>
      <span className="text-xs text-gray-500 tabular-nums px-2">
        {pagination.page} / {pagination.totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={!pagination.hasNext}
        className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        Sonraki
      </button>
    </div>
  )
}

export default Pagination
