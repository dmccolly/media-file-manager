import { useState, useEffect } from 'react'
import { Upload, Grid, List, Search, FolderOpen, Sun, Moon, Folder, Plus, Filter, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { XanoService, type XanoFileRecord } from '@/services/XanoService'
import { AdvancedSearch } from '@/components/AdvancedSearch'
import { BulkOperationsPanel } from '@/components/BulkOperationsPanel'
import { FolderTree } from '@/components/FolderTree'



// MediaFile interface for internal use
interface MediaFile {
  id: string
  title: string
  description: string
  url: string
  thumbnail?: string
  type: string
  category: string
  size: number
  filename: string
  tags: string
  uploadedBy: string
  uploadDate: string
  folder_path: string
  metadata?: {
    originalRecord: XanoFileRecord
  }
}

// Helper function to convert XanoFileRecord to MediaFile format
function convertXanoToMediaFile(xanoFile: XanoFileRecord): MediaFile {
  const type = xanoFile.file_type?.split('/')[0] || 'other'
  return {
    id: xanoFile.id,
    title: xanoFile.title,
    description: xanoFile.description || '',
    url: xanoFile.media_url,
    thumbnail: xanoFile.thumbnail,
    type,
    category: xanoFile.category,
    size: xanoFile.file_size,
    filename: xanoFile.title,
    tags: Array.isArray(xanoFile.tags) ? xanoFile.tags.join(', ') : String(xanoFile.tags || ''),
    uploadedBy: xanoFile.author || xanoFile.submitted_by || '',
    uploadDate: xanoFile.created_at,
    folder_path: xanoFile.folder_path || '/',
    metadata: { originalRecord: xanoFile }
  }
}

function FileCard({ file, onEdit, onDelete, onPreview, viewMode = 'grid', isSelected, onSelect }: {
  file: MediaFile
  onEdit: (file: MediaFile) => void
  onDelete: (id: string) => void
  onPreview: (file: MediaFile) => void
  viewMode?: 'grid' | 'list'
  isSelected?: boolean
  onSelect?: (id: string) => void
}) {
  if (viewMode === 'list') {
    return (
      <div className="glass-panel flex items-center space-x-4 p-4 interactive-element">
        {onSelect && (
          <button
            onClick={() => onSelect(file.id)}
            className="flex-shrink-0"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-blue-600" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </button>
        )}
        <div className="flex-shrink-0">
          <img 
            src={file.thumbnail || '/placeholder-image.jpg'} 
            alt={file.title}
            className="w-16 h-16 rounded-lg object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">{file.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{file.description}</p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="secondary">{file.type}</Badge>
            <Badge variant="outline">{file.category}</Badge>
            {file.folder_path && file.folder_path !== '/' && (
              <Badge variant="outline">{file.folder_path}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onPreview(file)}>
            Preview
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(file)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(file.id)}>
            Delete
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="glass-panel interactive-element">
      <CardHeader className="relative">
        {onSelect && (
          <button
            onClick={() => onSelect(file.id)}
            className="absolute top-2 left-2 z-10 bg-white rounded-full p-1 shadow-md"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
        <img 
          src={file.thumbnail || '/placeholder-image.jpg'} 
          alt={file.title}
          className="w-full h-48 object-cover rounded-lg"
        />
      </CardHeader>
      <CardContent>
        <CardTitle className="text-lg mb-2">{file.title}</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{file.description}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary">{file.type}</Badge>
          <Badge variant="outline">{file.category}</Badge>
          {file.folder_path && file.folder_path !== '/' && (
            <Badge variant="outline">{file.folder_path}</Badge>
          )}
        </div>
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => onPreview(file)}>
            Preview
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(file)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(file.id)}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FileEditModal({ file, isOpen, onClose, onSave }: {
  file: MediaFile | null
  isOpen: boolean
  onClose: () => void
  onSave: (file: MediaFile) => void
}) {
  const [formData, setFormData] = useState<MediaFile | null>(file)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFormData(file)
    setError(null)
  }, [file])

  const handleSave = async () => {
    if (!formData) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!formData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tags</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Enter tags separated by commas"
            />
          </div>
          <div>
            <Label>Folder</Label>
            <Input
              value={formData.folder_path || '/'}
              onChange={(e) => setFormData({ ...formData, folder_path: e.target.value })}
              placeholder="/folder/subfolder"
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <div className="flex space-x-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PreviewContent({ file }: { file: MediaFile }) {
  if (file.type === 'image') {
    return (
      <img 
        src={file.url} 
        alt={file.title}
        className="w-full h-auto max-h-96 object-contain rounded-lg"
      />
    )
  }

  if (file.type === 'video') {
    return (
      <video controls className="w-full max-h-96 rounded-lg">
        <source src={file.url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    )
  }

  if (file.type === 'audio') {
    return (
      <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <audio controls className="w-full max-w-md">
          <source src={file.url} type="audio/mpeg" />
          Your browser does not support the audio tag.
        </audio>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded mb-4 flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400 text-xs">File</span>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-2">Preview Not Available</p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
        This {file.type || file.category} file cannot be previewed in the browser.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => window.open(file.url, '_blank')}>
          Open File
        </Button>
        <Button variant="outline" onClick={() => {
          const link = document.createElement('a')
          link.href = file.url
          link.download = file.filename || file.title
          link.click()
        }}>
          Download
        </Button>
      </div>
    </div>
  )
}

function MediaFileManager() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedFolder, setSelectedFolder] = useState<string>('/')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [fileToEdit, setFileToEdit] = useState<MediaFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [folders, setFolders] = useState<string[]>(['/', '/projects', '/clients', '/personal'])
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showBulkOperations, setShowBulkOperations] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [showFolderTree, setShowFolderTree] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']))
  const [advancedSearchFilters, setAdvancedSearchFilters] = useState({
    fileType: 'all',
    category: 'all',
    dateFrom: '',
    dateTo: '',
    sizeMin: '',
    sizeMax: '',
    author: '',
    tags: ''
  })

  // Use real XanoService - you have full Xano backend with Netlify functions
  const xanoService = new XanoService()

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
    }
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  useEffect(() => {
    loadFiles()
  }, [selectedFolder])

  useEffect(() => {
    filterFiles()
  }, [files, searchTerm, selectedCategory, selectedFolder, advancedSearchFilters])

  const loadFiles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const xanoFiles = await xanoService.fetchAllFiles()
      const convertedFiles = xanoFiles.map(convertXanoToMediaFile)
      
      // Filter by selected folder
      const folderFilteredFiles = selectedFolder === '/' 
        ? convertedFiles 
        : convertedFiles.filter((file: MediaFile) => file.folder_path === selectedFolder)
      
      setFiles(folderFilteredFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
      console.error('Error loading files:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filterFiles = () => {
    let filtered = files

    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.tags.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(file => file.category === selectedCategory)
    }

    // Advanced search filters
    if (advancedSearchFilters.fileType !== 'all') {
      filtered = filtered.filter(file => file.type === advancedSearchFilters.fileType)
    }

    if (advancedSearchFilters.category !== 'all') {
      filtered = filtered.filter(file => file.category === advancedSearchFilters.category)
    }

    if (advancedSearchFilters.dateFrom) {
      filtered = filtered.filter(file => new Date(file.uploadDate) >= new Date(advancedSearchFilters.dateFrom))
    }

    if (advancedSearchFilters.dateTo) {
      filtered = filtered.filter(file => new Date(file.uploadDate) <= new Date(advancedSearchFilters.dateTo))
    }

    if (advancedSearchFilters.sizeMin) {
      const minSize = parseFloat(advancedSearchFilters.sizeMin) * 1024 * 1024 // Convert MB to bytes
      filtered = filtered.filter(file => file.size >= minSize)
    }

    if (advancedSearchFilters.sizeMax) {
      const maxSize = parseFloat(advancedSearchFilters.sizeMax) * 1024 * 1024 // Convert MB to bytes
      filtered = filtered.filter(file => file.size <= maxSize)
    }

    if (advancedSearchFilters.author) {
      filtered = filtered.filter(file => 
        file.uploadedBy.toLowerCase().includes(advancedSearchFilters.author.toLowerCase())
      )
    }

    if (advancedSearchFilters.tags) {
      filtered = filtered.filter(file => 
        file.tags.toLowerCase().includes(advancedSearchFilters.tags.toLowerCase())
      )
    }

    setFilteredFiles(filtered)
  }

  const handleEdit = (file: MediaFile) => {
    setFileToEdit(file)
    setIsEditModalOpen(true)
  }

  const handleSave = async (updatedFile: MediaFile) => {
    try {
      const originalRecord = updatedFile.metadata?.originalRecord
      if (!originalRecord) {
        throw new Error('Original record not found')
      }

      const updatedXanoFile = {
        ...originalRecord,
        title: updatedFile.title,
        description: updatedFile.description,
        category: updatedFile.category,
        tags: updatedFile.tags.split(',').map(tag => tag.trim()),
        folder_path: updatedFile.folder_path || '/'
      }

      await xanoService.updateFile(originalRecord.id, updatedXanoFile)
      
      const updatedFiles = files.map(f => 
        f.id === updatedFile.id ? updatedFile : f
      )
      setFiles(updatedFiles)
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update file')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      await xanoService.deleteFile(id)
      setFiles(files.filter(f => f.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
      console.error('Error deleting file:', err)
    }
  }

  const handlePreview = (file: MediaFile) => {
    setSelectedFile(file)
  }

  // Note: handleUpload and handleCreateFolder functions are intentionally unused
  // They are kept for future implementation when upload functionality is added

  const handleFolderSelect = (folderPath: string) => {
    setSelectedFolder(folderPath)
  }

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(filteredFiles.map(f => f.id))
    }
  }

  const handleAdvancedSearchFiltersChange = (filters: any) => {
    setAdvancedSearchFilters(filters)
  }

  const handleClearAdvancedFilters = () => {
    setAdvancedSearchFilters({
      fileType: 'all',
      category: 'all',
      dateFrom: '',
      dateTo: '',
      sizeMin: '',
      sizeMax: '',
      author: '',
      tags: ''
    })
  }

  const categories = ['all', 'image', 'video', 'audio', 'document', 'other']

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Media File Manager
          </h1>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Folder Navigation */}
        <div className="glass-panel p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Folders</h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setIsCreateFolderModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                New Folder
              </Button>
              <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {folders.map(folder => (
              <Button
                key={folder}
                variant={selectedFolder === folder ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFolderSelect(folder)}
              >
                <Folder className="w-4 h-4 mr-1" />
                {folder}
              </Button>
            ))}
          </div>
        </div>

        {/* Advanced Search Controls */}
        <div className="glass-panel p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Search &amp; Filter</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  {showAdvancedSearch ? 'Simple Search' : 'Advanced Search'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFolderTree(!showFolderTree)}
                >
                  <Folder className="w-4 h-4 mr-1" />
                  {showFolderTree ? 'Hide Tree' : 'Folder Tree'}
                </Button>
              </div>
            </div>

            {showAdvancedSearch ? (
              <AdvancedSearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={advancedSearchFilters}
                onFiltersChange={handleAdvancedSearchFiltersChange}
                onClearFilters={handleClearAdvancedFilters}
                categories={categories.filter(c => c !== 'all')}
              />
            ) : (
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {filteredFiles.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedFiles.length === filteredFiles.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
                {selectedFiles.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkOperations(!showBulkOperations)}
                  >
                    Bulk Actions ({selectedFiles.length})
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Operations Panel */}
        {showBulkOperations && selectedFiles.length > 0 && (
          <div className="glass-panel p-6 mb-6">
            <BulkOperationsPanel
              selectedFiles={files.filter(f => selectedFiles.includes(f.id)).map(f => f.metadata?.originalRecord).filter(Boolean) as XanoFileRecord[]}
              onComplete={() => {
                setShowBulkOperations(false)
                setSelectedFiles([])
                loadFiles()
              }}
            />
          </div>
        )}

        {/* Folder Tree */}
        {showFolderTree && (
          <div className="glass-panel p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Folder Structure</h3>
            <div className="max-h-96 overflow-y-auto">
              <FolderTree
                tree={[
                  {
                    path: '/',
                    name: 'Root',
                    children: [
                      { path: '/projects', name: 'Projects', children: [], fileCount: files.filter(f => f.folder_path === '/projects').length },
                      { path: '/clients', name: 'Clients', children: [], fileCount: files.filter(f => f.folder_path === '/clients').length },
                      { path: '/personal', name: 'Personal', children: [], fileCount: files.filter(f => f.folder_path === '/personal').length }
                    ],
                    fileCount: files.filter(f => f.folder_path === '/').length
                  }
                ]}
                currentPath={selectedFolder}
                expandedFolders={expandedFolders}
                onFolderClick={handleFolderSelect}
                onToggleExpand={(path) => {
                  const newExpanded = new Set(expandedFolders)
                  if (newExpanded.has(path)) {
                    newExpanded.delete(path)
                  } else {
                    newExpanded.add(path)
                  }
                  setExpandedFolders(newExpanded)
                }}
                onDrop={(path) => {
                  // Handle drag and drop file moving
                  console.log('Drop files to', path)
                }}
                onDeleteFolder={(path) => {
                  if (confirm(`Delete folder ${path}? Files will be moved to root.`)) {
                    setFolders(prev => prev.filter(f => f !== path))
                    if (selectedFolder === path) {
                      setSelectedFolder('/')
                    }
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Files Display */}
        {!isLoading && filteredFiles.length > 0 && (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredFiles.map(file => (
              <FileCard
                key={file.id}
                file={file}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPreview={handlePreview}
                viewMode={viewMode}
                isSelected={selectedFiles.includes(file.id)}
                onSelect={handleFileSelect}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {files.length === 0 ? 'No files in this folder' : 'No files match your search'}
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              {files.length === 0 ? 'Upload files to get started' : 'Try adjusting your search criteria'}
            </p>
          </div>
        )}

        {/* Modals */}
        <FileEditModal
          file={fileToEdit}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSave}
        />

        {selectedFile && (
          <Dialog open={true} onOpenChange={() => setSelectedFile(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{selectedFile.title}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <PreviewContent file={selectedFile} />
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={isCreateFolderModalOpen} onOpenChange={() => setIsCreateFolderModalOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div>
                <Label>Folder Name</Label>
                <Input
                  placeholder="Enter folder name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newFolder = e.currentTarget.value.trim()
                      if (!folders.includes(newFolder)) {
                        setFolders(prev => [...prev, newFolder])
                        setIsCreateFolderModalOpen(false)
                      }
                    }
                  }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isUploadModalOpen} onOpenChange={() => setIsUploadModalOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload to Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div>
                <Label>Target Folder</Label>
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map(folder => (
                      <SelectItem key={folder} value={folder}>{folder}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default MediaFileManager