import { useState, useEffect } from 'react'
import { Upload, Grid, List, Search, Edit, Trash2, Eye, FolderOpen, Sun, Moon } from 'lucide-react'
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
  onDelete: (id: string) => void
  onPreview: (file: MediaFile) => void
  viewMode?: 'grid' | 'list'
}) {
  if (viewMode === 'list') {
    return (
      <div className="glass-panel flex items-center space-x-4 p-4 interactive-element">
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
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onPreview(file)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(file)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(file.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="glass-panel interactive-element">
      <CardHeader>
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
        </div>
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => onPreview(file)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(file)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(file.id)}>
            <Trash2 className="w-4 h-4" />
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

function MediaFileManager() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [fileToEdit, setFileToEdit] = useState<MediaFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

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
  }, [])

  useEffect(() => {
    filterFiles()
  }, [files, searchTerm, selectedCategory])

  const loadFiles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const xanoFiles = await xanoService.fetchAllFiles()
      const convertedFiles = xanoFiles.map(convertXanoToMediaFile)
      setFiles(convertedFiles)
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
        tags: updatedFile.tags.split(',').map(tag => tag.trim())
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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      const uploadedFile = await xanoService.saveFile({ file })
      const convertedFile = convertXanoToMediaFile(uploadedFile)
      setFiles([...files, convertedFile])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
      console.error('Error uploading file:', err)
    } finally {
      setIsLoading(false)
    }
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

        {/* Controls */}
        <div className="glass-panel p-6 mb-6">
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
            <div className="relative">
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleUpload}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              />
            </div>
          </div>
        </div>

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
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {files.length === 0 ? 'No files uploaded yet' : 'No files match your search'}
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              {files.length === 0 ? 'Upload your first file to get started' : 'Try adjusting your search criteria'}
            </p>
          </div>
        )}

        {/* Edit Modal */}
        <FileEditModal
          file={fileToEdit}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSave}
        />

        {/* Preview Modal */}
        {selectedFile && (
          <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{selectedFile.title}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <img 
                  src={selectedFile.url} 
                  alt={selectedFile.title}
                  className="w-full h-auto max-h-96 object-contain rounded-lg"
                />
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedFile.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge>{selectedFile.type}</Badge>
                    <Badge variant="outline">{selectedFile.category}</Badge>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

export default MediaFileManager