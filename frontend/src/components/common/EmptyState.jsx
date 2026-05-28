// eslint-disable-next-line no-unused-vars
const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
    {Icon && (
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mb-3">
        <Icon size={18} strokeWidth={1.75} />
      </div>
    )}
    <p className="text-sm font-medium text-gray-700">{title}</p>
    {description && (
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    )}
  </div>
)

export default EmptyState
