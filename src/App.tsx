import { useState, useEffect } from 'react'
import { Upload, Grid, List, Search, Download, Edit, Trash2, Eye, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { XanoService, type XanoFileRecord } from '@/services/XanoService'

// Using XanoFileRecord as MediaFile interface
type MediaFile = {
  id: string
  title: string
  description: string
  url: string
  thumbnail?: string
  type: string
  category: string
  size?: number
  filename: string
  tags: string
  uploadedBy?: string
  uploadDate?: string
  metadata?: any
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
    metadata: { originalRecord: xanoFile }
  }
}

function FileCard({ file, onEdit, onDelete, onPreview, viewMode = 'grid' }: {
  file: MediaFile
  onEdit: (file: MediaFile) => void
  onDelete: (file: MediaFile) => void
  onPreview: (file: MediaFile) => void
  viewMode?: 'grid' | 'list'
}) {
  if (viewMode === 'list') {
    return (
      <div className="group glass-panel rounded-lg p-2 hover:shadow-md transition-shadow flex items-center gap-3">
        {/* Thumbnail */}
        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
          {file.type === 'image' ? (
            <img 
              src={file.thumbnail || file.url} 
              alt={file.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.png'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <FolderOpen className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm truncate">{file.title}</h3>
            <Badge variant="secondary" className="text-xs flex-shrink-0">{file.category}</Badge>
          </div>
          {file.description && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{file.description}</p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onPreview(file)}>
            <Eye className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onEdit(file)}>
            <Edit className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onDelete(file)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="aspect-square mb-3 glass-panel rounded-lg overflow-hidden">
          {file.type === 'image' ? (
            <img 
              src={file.thumbnail || file.url} 
              alt={file.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.png'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center glass-panel">
              <FolderOpen className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        <h3 className="font-medium text-sm mb-1 truncate">{file.title}</h3>
        <Badge variant="secondary" className="text-xs mb-2">{file.category}</Badge>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={() => onPreview(file)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(file)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(file)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}



function FilePreviewModal({ file, isOpen, onClose }: {
  file: MediaFile | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!file) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{file.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {file.type === 'image' && (
            <img src={file.url} alt={file.title} className="w-full rounded-lg" />
          )}
          {file.type === 'video' && (
            <video controls className="w-full rounded-lg">
              <source src={file.url} />
            </video>
          )}
          {file.type === 'audio' && (
            <audio controls className="w-full">
              <source src={file.url} />
            </audio>
          )}
          {file.type === 'pdf' && (
            <iframe src={file.url} className="w-full h-96 rounded-lg" />
          )}
          {!['image', 'video', 'audio', 'pdf'].includes(file.type) && (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Preview not available for this file type</p>
              <Button className="mt-4" onClick={() => window.open(file.url, '_blank')}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Category:</strong> {file.category}</div>
            <div><strong>Type:</strong> {file.type}</div>
            <div><strong>Size:</strong> {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</div>
            <div><strong>Uploaded:</strong> {file.uploadDate || 'Unknown'}</div>
          </div>
          {file.description && (
            <div>
              <strong>Description:</strong>
              <p className="mt-1 text-gray-600">{file.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FileEditModal({ file, isOpen, onClose, onSave }: {
  file: MediaFile | null
  isOpen: boolean
  onClose: () => void
  onSave: (file: MediaFile, updates: Partial<MediaFile>) => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    category: ''
  })

  useEffect(() => {
    if (file) {
      setFormData({
        title: file.title || '',
        description: file.description || '',
        tags: file.tags || '',
        category: file.category || ''
      })
    }
  }, [file])

  const handleSave = () => {
    if (file) {
      onSave(file, formData)
      onClose()
    }
  }

  if (!file) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Comma-separated tags"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Image">Image</SelectItem>
                <SelectItem value="Video">Video</SelectItem>
                <SelectItem value="Audio">Audio</SelectItem>
                <SelectItem value="Document">Document</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function App() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)
  const [editFile, setEditFile] = useState<MediaFile | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [sortBy, setSortBy] = useState<'title' | 'date' | 'size' | 'category'>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const xanoService = new XanoService()

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      setLoading(true)
      setError(null)
      const xanoFiles = await xanoService.fetchAllFiles()
      const mediaFiles = xanoFiles.map(convertXanoToMediaFile)
      setFiles(mediaFiles)
      console.log(`✅ Loaded ${mediaFiles.length} files successfully`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
      console.error('❌ Error loading files:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || file.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['All', ...Array.from(new Set(files.map(f => f.category)))]

  const handleEdit = (file: MediaFile) => {
    setEditFile(file)
  }

  const handleDelete = async (file: MediaFile) => {
    if (confirm(`Are you sure you want to delete "${file.title}"?`)) {
      try {
        await xanoService.deleteFile(file.id)
        setFiles(prev => prev.filter(f => f.id !== file.id))
        console.log('✅ File deleted successfully')
      } catch (error) {
        console.error('❌ Error deleting file:', error)
        setError('Failed to delete file')
      }
    }
  }

  const handlePreview = (file: MediaFile) => {
    setPreviewFile(file)
  }

  const handleSave = async (file: MediaFile, updates: Partial<MediaFile>) => {
    try {
      // Convert updates to Xano format
      const xanoUpdates = {
        title: updates.title,
        description: updates.description,
        category: updates.category,
        tags: updates.tags ? updates.tags.split(',').map(t => t.trim()) : []
      }
      
      await xanoService.updateFile(file.id, xanoUpdates)
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, ...updates } : f))
      console.log('✅ File updated successfully')
    } catch (error) {
      console.error('❌ Error updating file:', error)
      setError('Failed to update file')
    }
  }

  const handleUpload = async (uploadFiles: FileList) => {
    setUploading(true)
    try {
      for (const file of Array.from(uploadFiles)) {
        const newFile: MediaFile = {
          id: Math.random().toString(),
          title: file.name,
          description: '',
          url: URL.createObjectURL(file),
          thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : '/placeholder-file.png',
          type: file.type.split('/')[0] || 'other',
          category: file.type.startsWith('image/') ? 'Image' : 
                   file.type.startsWith('video/') ? 'Video' :
                   file.type.startsWith('audio/') ? 'Audio' : 'Document',
          size: file.size,
          filename: file.name,
          tags: '',
          uploadedBy: 'Current User',
          uploadDate: new Date().toISOString(),
          metadata: { file }
        }
        setFiles(prev => [newFile, ...prev])
      }
      setShowUploadModal(false)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleSort = (field: 'title' | 'date' | 'size' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let aVal: any, bVal: any
    switch (sortBy) {
      case 'title':
        aVal = a.title.toLowerCase()
        bVal = b.title.toLowerCase()
        break
      case 'date':
        aVal = new Date(a.uploadDate || 0).getTime()
        bVal = new Date(b.uploadDate || 0).getTime()
        break
      case 'size':
        aVal = a.size || 0
        bVal = b.size || 0
        break
      case 'category':
        aVal = a.category.toLowerCase()
        bVal = b.category.toLowerCase()
        break
      default:
        return 0
    }
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading files...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={loadFiles}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"}}>
      <header className="glass-panel m-4 rounded-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-white">Media File Manager</h1>
            <div className="flex items-center gap-4">
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <p className="text-gray-600">
                  {filteredFiles.length} of {files.length} files
                </p>
                <Select value={sortBy} onValueChange={(value: any) => handleSort(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {sortedFiles.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No files found</p>
                {files.length === 0 && !loading && (
                  <Button className="mt-4" onClick={() => setShowUploadModal(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First File
                  </Button>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                : 'space-y-1'
              }>
                {sortedFiles.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
                       viewMode={viewMode}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />

      <FileEditModal
        file={editFile}
        isOpen={!!editFile}
        onClose={() => setEditFile(null)}
        onSave={handleSave}
      />

      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">Drag and drop files here, or click to select</p>
              <input
                type="file"
                multiple
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Select Files
                </label>
              </Button>
            </div>
            {uploading && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Uploading files...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
