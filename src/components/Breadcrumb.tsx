import { Home, ChevronRight } from 'lucide-react'

interface BreadcrumbProps {
  currentPath: string
  onNavigate: (path: string) => void
}

export function Breadcrumb({ currentPath, onNavigate }: BreadcrumbProps) {
  const parts = currentPath.split('/').filter(Boolean)
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => onNavigate('')}
        className={`flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded transition-colors ${
          currentPath === '' ? 'bg-blue-50 text-blue-700 font-medium' : ''
        }`}
      >
        <Home className="w-4 h-4" />
        <span>All Files</span>
      </button>
      
      {parts.map((part, idx) => {
        const path = '/' + parts.slice(0, idx + 1).join('/')
        const isLast = idx === parts.length - 1
        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => onNavigate(path)}
              className={`px-3 py-1.5 hover:bg-gray-100 rounded transition-colors ${
                isLast ? 'bg-blue-50 text-blue-700 font-medium' : ''
              }`}
            >
              {part}
            </button>
          </div>
        )
      })}
    </div>
  )
}
