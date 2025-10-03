import { ChevronRight, ChevronDown, Folder, FolderOpen, Trash2 } from 'lucide-react'

interface FolderNode {
  path: string
  name: string
  children: FolderNode[]
  fileCount: number
}

interface FolderTreeProps {
  tree: FolderNode[]
  currentPath: string
  expandedFolders: Set<string>
  onFolderClick: (path: string) => void
  onToggleExpand: (path: string) => void
  onDrop: (path: string, e: React.DragEvent) => void
  onDeleteFolder: (path: string) => void
}

export function FolderTree({ 
  tree, 
  currentPath, 
  expandedFolders, 
  onFolderClick, 
  onToggleExpand,
  onDrop,
  onDeleteFolder
}: FolderTreeProps) {
  const renderFolder = (node: FolderNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const isCurrent = currentPath === node.path
    
    return (
      <div key={node.path}>
        <div
          className={`group flex items-center gap-2 py-2 px-3 hover:bg-gray-100 cursor-pointer rounded-md transition-colors ${
            isCurrent ? 'bg-blue-50 text-blue-700 font-medium' : ''
          }`}
          style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
          onClick={() => onFolderClick(node.path)}
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.classList.add('bg-blue-100', 'border-blue-300')
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-blue-100', 'border-blue-300')
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove('bg-blue-100', 'border-blue-300')
            onDrop(node.path, e)
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand(node.path)
            }}
            className="p-0 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-600" />
          ) : (
            <Folder className="w-4 h-4 text-amber-600" />
          )}
          <span className="flex-1 text-sm">{node.name}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{node.fileCount}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteFolder(node.path)
            }}
            className="p-1 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Delete folder"
          >
            <Trash2 className="w-3 h-3 text-red-600" />
          </button>
        </div>
        {isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map(child => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-1">
      {tree.map(node => renderFolder(node))}
    </div>
  )
}
