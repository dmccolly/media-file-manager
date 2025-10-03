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
        className="flex items-center gap-1 px-2 py-1 hover:bg-blue-500 rounded text-white transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>All Files</span>
      </button>
      
      {parts.map((part, idx) => {
        const path = '/' + parts.slice(0, idx + 1).join('/')
        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-blue-200" />
            <button
              onClick={() => onNavigate(path)}
              className="px-2 py-1 hover:bg-blue-500 rounded text-white transition-colors"
            >
              {part}
            </button>
          </div>
        )
      })}
    </div>
  )
}
