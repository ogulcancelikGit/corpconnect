const PageHeader = ({ title, description, actions }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <h1 className="text-2xl text-gray-900 font-medium tracking-tight">{title}</h1>
      {description && (
        <p className="text-sm text-gray-500 mt-1.5">{description}</p>
      )}
    </div>
    {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
  </div>
)

export default PageHeader
