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

interface MediaFile {
  id: string
  title: string
  description?: string
  url: string
  thumbnail?: string
  type: string
  category: string
  size?: number
  filename: string
  tags?: string
  uploadedBy?: string
  uploadDate?: string
  metadata?: any
}

class MediaService {
  private baseUrl = 'https://media-file-manager-1759033107-47e71840442b.herokuapp.com/api/media'

  async fetchFiles(): Promise<MediaFile[]> {
    try {
      const response = await fetch(this.baseUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return this.processRecords(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching files:', error)
      throw error
    }
  }

  private processRecords(records: any[]): MediaFile[] {
    return records
      .map(record => {
        const url = record.media_url || record.attachment || record.url || ''
        if (!url || url.trim() === '') return null

        const title = record.title || record.name || record.filename || 'Untitled'
        const type = this.detectFileType(url)
        const category = this.mapTypeToCategory(type)

        return {
          id: record.id?.toString() || Math.random().toString(),
          title,
          description: record.description || '',
          url,
          thumbnail: this.generateThumbnail(url, type),
          type,
          category,
          size: record.size || 0,
          filename: record.filename || title,
          tags: record.tags || '',
          uploadedBy: record.uploaded_by || record.user || '',
          uploadDate: record.created_at || record.upload_date || '',
          metadata: { originalRecord: record }
        }
      })
      .filter(Boolean) as MediaFile[]
  }

  private detectFileType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase() || ''
    const typeMap: Record<string, string> = {
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
      mp4: 'video', mov: 'video', avi: 'video', mkv: 'video', webm: 'video',
      mp3: 'audio', wav: 'audio', flac: 'audio', aac: 'audio', ogg: 'audio',
      pdf: 'pdf', doc: 'document', docx: 'document', txt: 'text',
      xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet',
      ppt: 'presentation', pptx: 'presentation',
      zip: 'archive', rar: 'archive', '7z': 'archive'
    }
    return typeMap[extension] || 'other'
  }

  private mapTypeToCategory(type: string): string {
    const categoryMap: Record<string, string> = {
      image: 'Images', video: 'Video', audio: 'Audio',
      pdf: 'Documents', document: 'Documents', text: 'Documents',
      spreadsheet: 'Documents', presentation: 'Documents',
      archive: 'Other', other: 'Other'
    }
    return categoryMap[type] || 'Other'
  }

  private generateThumbnail(url: string, type: string): string {
    if (type === 'image') return url
    if (type === 'video') return url.replace(/\.[^.]+$/, '.jpg')
    return `/placeholder-${type}.png`
  }
}

function FileCard({ file, onEdit, onDelete, onPreview }: {
  file: MediaFile
  onEdit: (file: MediaFile) => void
  onDelete: (file: MediaFile) => void
  onPreview: (file: MediaFile) => void
}) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
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
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
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
                <SelectItem value="Images">Images</SelectItem>
                <SelectItem value="Video">Video</SelectItem>
                <SelectItem value="Audio">Audio</SelectItem>
                <SelectItem value="Documents">Documents</SelectItem>
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

  const mediaService = new MediaService()

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedFiles = await mediaService.fetchFiles()
      setFiles(fetchedFiles)
      console.log(`✅ Loaded ${fetchedFiles.length} files successfully`)
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

  const handleDelete = (file: MediaFile) => {
    if (confirm(`Are you sure you want to delete "${file.title}"?`)) {
      setFiles(prev => prev.filter(f => f.id !== file.id))
    }
  }

  const handlePreview = (file: MediaFile) => {
    setPreviewFile(file)
  }

  const handleSave = (file: MediaFile, updates: Partial<MediaFile>) => {
    setFiles(prev => prev.map(f => f.id === file.id ? { ...f, ...updates } : f))
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
          category: file.type.startsWith('image/') ? 'Images' : 
                   file.type.startsWith('video/') ? 'Video' :
                   file.type.startsWith('audio/') ? 'Audio' : 'Documents',
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">Media File Manager</h1>
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
                : 'space-y-2'
              }>
                {sortedFiles.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
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
