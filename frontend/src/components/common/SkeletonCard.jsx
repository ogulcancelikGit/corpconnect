const StatSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
    <div className="w-8 h-8 bg-gray-100 rounded-md mb-4" />
    <div className="h-7 w-12 bg-gray-100 rounded mb-2" />
    <div className="h-3 w-20 bg-gray-100 rounded" />
  </div>
)

const RowSkeleton = () => (
  <div className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
    <div className="w-1.5 h-1.5 bg-gray-200 rounded-full shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3.5 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  </div>
)

const CardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
    <div className="flex items-center gap-2 mb-3">
      <div className="h-5 w-14 bg-gray-100 rounded-full" />
      <div className="h-5 w-12 bg-gray-100 rounded-full" />
    </div>
    <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
    <div className="h-3 w-full bg-gray-100 rounded mb-1.5" />
    <div className="h-3 w-2/3 bg-gray-100 rounded mb-4" />
    <div className="flex justify-between">
      <div className="h-3 w-20 bg-gray-100 rounded" />
      <div className="h-3 w-16 bg-gray-100 rounded" />
    </div>
  </div>
)

const SkeletonCard = ({ variant = 'stat' }) => {
  if (variant === 'row') return <RowSkeleton />
  if (variant === 'card') return <CardSkeleton />
  return <StatSkeleton />
}

export default SkeletonCard
