import React, { useState, useEffect } from 'react'
import { Upload, Search, Grid, List, Eye, Edit, Download, FolderOpen, File, Image, Video, Music, FileText, X, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CloudinaryService } from './services/CloudinaryService'
import { XanoService } from './services/XanoService'
// Import PreviewService relative to the current src directory. Previously this
// pointed to './src/services/PreviewService', which is incorrect when this file
// itself resides in src. Adjusting the path prevents build-time 'Cannot find
// module' errors.
import { PreviewService } from './services/PreviewService'
import { WebflowService } from './services/WebflowService'
import { FolderService } from './services/FolderService'
import { BulkOperationsPanel } from './components/BulkOperationsPanel'
import { UrlDisplay } from './components/UrlDisplay'

interface MediaFile {
  id: string
  title: string
  description: string
  media_url: string
  file_type: string
  file_size: number
  created_at: string
  tags: string[]
  category: string
  thumbnail?: string
  notes?: string
  station?: string
  author?: string
  folder_path?: string
}

const mockFiles: MediaFile[] = [
  {
    id: '1',
    title: 'Sample Image.jpg',
    description: 'A beautiful landscape photo',
    media_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    file_type: 'image/jpeg',
    file_size: 2048576,
    created_at: '2024-01-15T10:30:00Z',
    tags: ['landscape', 'nature'],
    category: 'images',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200'
  },
  {
    id: '2',
    title: 'Demo Video.mp4',
    description: 'Product demonstration video',
    media_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    file_type: 'video/mp4',
    file_size: 1048576,
    created_at: '2024-01-14T15:45:00Z',
    tags: ['demo', 'product'],
    category: 'videos'
  },
  {
    id: '3',
    title: 'Document.pdf',
    description: 'Important project documentation',
    media_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'application/pdf',
    file_size: 524288,
    created_at: '2024-01-13T09:15:00Z',
    tags: ['documentation', 'project'],
    category: 'documents'
  }
]

type CategoryKey = 'all' | 'images' | 'videos' | 'documents' | 'audio' | 'other'

const categories: CategoryKey[] = ['all', 'images', 'videos', 'documents', 'audio', 'other']

const categoryLabel: Record<CategoryKey, string> = {
  all: 'All Categories',
  images: 'Images',
  videos: 'Videos',
  documents: 'Documents',
  audio: 'Audio',
  other: 'Other'
}

const extractCloudinaryFolder = (mediaUrl: string): string | null => {
  if (!mediaUrl) return null
  try {
    // Extract everything after /upload/
    const match = mediaUrl.match(/\/upload\/(.+)$/)
    if (!match) return null
    
    let rest = match[1]
    
    const versionSegments = rest.match(/v\d+\//g)
    if (versionSegments && versionSegments.length > 0) {
      const lastVersion = versionSegments[versionSegments.length - 1]
      const versionIndex = rest.lastIndexOf(lastVersion)
      rest = rest.slice(versionIndex + lastVersion.length)
    }
    
    const lastSlash = rest.lastIndexOf('/')
    if (lastSlash === -1) return null // No folder, asset at root
    
    const folderPath = rest.slice(0, lastSlash)
    
    if (!folderPath.trim()) return null
    if (/^v\d+$/.test(folderPath)) return null // Version number, not a folder
    
    return folderPath
  } catch (error) {
    console.error('Error extracting Cloudinary folder:', error)
  }
  return null
}

const isImageResource = (url: string): boolean => {
  if (!url) return false
  return url.includes('/image/upload/')
}

const isVideoResource = (url: string): boolean => {
  if (!url) return false
  return url.includes('/video/upload/')
}

const getThumbnailUrl = (file: MediaFile): string | null => {
  if (file.thumbnail) return file.thumbnail
  
  if (isImageResource(file.media_url)) {
    return file.media_url
  }
  
  return null
}

// Radix Select treats an empty string as a special clearing value. If an
// option’s value is '' then selecting it will clear the Select and show the
// placeholder, which causes runtime errors (see Radix docs). To support an
// "Uncategorized" option we use a non‑empty sentinel for its value. When
// reading from state we convert '' to the sentinel and back again when
// updating the state.
const UNCATEGORIZED_VALUE = '__UNCATEGORIZED__';

function App() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [sharedMetadata, setSharedMetadata] = useState({
    description: '',
    category: 'documents',
    tags: '',
    author: ''
  })
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<MediaFile[]>([])
  const [showBatchPanel, setShowBatchPanel] = useState(false)
  const [contextMenu, setContextMenu] = useState<{show: boolean, x: number, y: number, file: MediaFile | null}>({
    show: false, x: 0, y: 0, file: null
  })
  // Folder management state
  const [folders, setFolders] = useState<any[]>([])
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderError, setFolderError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'title' | 'file_type' | 'file_size' | 'created_at'>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  // initialize search type to 'all' instead of empty string to avoid invalid Select item values
  const [searchFilters, setSearchFilters] = useState({
    type: 'all',
    dateFrom: '',
    dateTo: ''
  })
  
  // Folder Management State
  const [currentFolderPath, setCurrentFolderPath] = useState<string>('all')
  
  // Add Video URL State
  const [isAddVideoUrlOpen, setIsAddVideoUrlOpen] = useState(false)
  const [videoUrlData, setVideoUrlData] = useState({
    url: '',
    title: '',
    description: '',
    category: 'videos',
    tags: '',
    station: '',
    author: ''
  })

  const cloudinaryService = new CloudinaryService()
  const xanoService = new XanoService()
  const webflowService = new WebflowService()
  const folderService = new FolderService()

  useEffect(() => {
    loadFiles()
    loadFolders()
  }, [])

  useEffect(() => {
    let filtered = files

    console.log('📊 Filter Debug:', {
      totalFiles: files.length,
      currentFolderPath,
      selectedCategory,
      searchTerm: searchTerm ? `"${searchTerm}"` : 'none'
    })

    // Filter by current folder path - check both folder_path and extract from media_url
    if (currentFolderPath !== '' && currentFolderPath !== 'all') {
      filtered = filtered.filter(file => {
        if (file.folder_path === currentFolderPath) return true
        const cloudinaryFolder = extractCloudinaryFolder(file.media_url)
        return cloudinaryFolder === currentFolderPath
      })
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(file => file.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (file.author && file.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Only filter by type if a specific type (not 'all') is selected
    if (searchFilters.type && searchFilters.type !== 'all') {
      filtered = filtered.filter(file => file.file_type === searchFilters.type)
    }
    if (searchFilters.dateFrom) filtered = filtered.filter(file => new Date(file.created_at) >= new Date(searchFilters.dateFrom))
    if (searchFilters.dateTo) filtered = filtered.filter(file => new Date(file.created_at) <= new Date(searchFilters.dateTo))

    const sortedFiles = [...filtered].sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]
      if (sortField === 'file_size') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      } else if (sortField === 'created_at') {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      } else {
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    
    console.log('📊 Filtered Result:', {
      filteredCount: sortedFiles.length,
      showing: sortedFiles.length > 0 ? 'files visible' : 'NO FILES - check filters!'
    })
    
    setFilteredFiles(sortedFiles)
  }, [files, searchTerm, selectedCategory, searchFilters, sortField, sortDirection, currentFolderPath])

  const loadFiles = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 App: Loading files from Xano...')
      const loadedFiles = await xanoService.fetchAllFiles()
      console.log('✅ App: Loaded files:', loadedFiles)
      setFiles(loadedFiles)
    } catch (error) {
      console.error('❌ App: Error loading files:', error)
      setError('Failed to load files. Please try again.')
      setFiles(mockFiles)
    } finally {
      setLoading(false)
    }
  }

  const loadFolders = async () => {
    try {
      console.log('🔄 App: Loading folders from Cloudinary...')
      const cloudinaryFolders = await folderService.fetchCloudinaryFolders()
      console.log('✅ App: Loaded Cloudinary folders:', cloudinaryFolders)
      setFolders(cloudinaryFolders)
    } catch (error) {
      console.error('❌ App: Error loading folders:', error)
      setFolders([])
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setFolderError('Folder name is required')
      return
    }

    try {
      setFolderError(null)
      const parentPath = currentFolderPath && currentFolderPath !== 'all' ? currentFolderPath : '/'
      const folder = await folderService.createFolder(newFolderName, parentPath)
      if (folder) {
        await loadFolders()
        setNewFolderName('')
        setIsCreateFolderOpen(false)
        alert('Folder created successfully in Cloudinary!')
      }
    } catch (error) {
      console.error('❌ Error creating folder:', error)
      setFolderError(error instanceof Error ? error.message : 'Failed to create folder')
    }
  }

  const handleDeleteFolder = async (folderPath: string) => {
    // Confirm deletion with user
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the folder "${folderPath}"?\n\n` +
      `Note: Cloudinary only allows deleting empty folders. ` +
      `Please move or delete all files in this folder first.`
    )

    if (!confirmDelete) {
      return
    }

    try {
      console.log('🗑️ Attempting to delete folder:', folderPath)
      const result = await folderService.deleteFolder(folderPath)
      
      if (result.success) {
        // Remove folder from state
        setFolders(prev => prev.filter(f => f.path !== folderPath))
        console.log('✅ Folder deleted successfully:', folderPath)
        
        // If we're currently viewing this folder, switch to root
        if (currentFolderPath === folderPath) {
          setCurrentFolderPath('')
        }
      } else {
        // Show error message to user
        alert(`Failed to delete folder: ${result.error || 'Unknown error'}`)
        console.error('❌ Folder deletion failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Error deleting folder:', error)
      alert(`Error deleting folder: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />
    if (fileType.startsWith('audio/')) return <Music className="w-4 h-4" />
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleFileSelection = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const totalFiles = selectedFiles.length + fileArray.length
    if (totalFiles > 10) {
      alert('Maximum 10 files allowed per batch upload')
      return
    }
    setSelectedFiles(prev => [...prev, ...fileArray])
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files
    if (uploadedFiles) {
      handleFileSelection(uploadedFiles)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    const droppedFiles = event.dataTransfer.files
    if (droppedFiles) {
      handleFileSelection(droppedFiles)
    }
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const resetUploadModal = () => {
    setSelectedFiles([])
    setSharedMetadata({
      description: '',
      category: 'documents',
      tags: '',
      author: ''
    })
    setIsUploading(false)
  }

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0) return
    setIsUploading(true)
    setUploadProgress({})
    try {
      console.log('🔄 App: Starting batch upload for', selectedFiles.length, 'files')
      const targetFolder = currentFolderPath && currentFolderPath !== 'all' ? currentFolderPath : undefined
      console.log('📁 App: Uploading to folder:', targetFolder || 'HIBF_assets (default)')
      const result = await cloudinaryService.uploadMultipleFiles(
        selectedFiles,
        sharedMetadata,
        (_fileIndex: number, progress: number, fileName: string) => {
          setUploadProgress(prev => ({
            ...prev,
            [fileName]: progress
          }))
        },
        targetFolder
      )
      console.log('✅ App: Cloudinary upload complete:', result)
      const savePromises = result.successful.map(async (fileData: any) => {
        try {
          console.log('🔄 App: Saving file to Xano:', fileData.title)
          const fileDataWithFolder = {
            ...fileData,
            folder_path: targetFolder || ''
          }
          await xanoService.saveFile(fileDataWithFolder)
            
            // Sync to Webflow
            console.log("Syncing to Webflow:", fileData.title)
            try {
              const webflowFileData = {
                name: fileData.title,
                title: fileData.title,
                url: fileData.media_url,
                thumbnail: fileData.thumbnail,
                description: fileData.description || "",
                category: fileData.category,
                type: fileData.file_type?.split("/")[0] || "other",
                size: fileData.file_size,
                tags: fileData.tags?.join(",") || "",
                author: fileData.author || "Unknown",
                created_at: fileData.created_at
              }
              await webflowService.syncFileToWebflow(webflowFileData)
              console.log("File synced to Webflow:", fileData.title)
            } catch (webflowError) {
              console.error("Webflow sync failed (non-critical):", webflowError)
              // Do not throw - Webflow sync failure should not block the upload
            }
          console.log('✅ App: File saved to database:', fileData.title)
        } catch (error) {
          console.error('❌ App: Error saving file to database:', error)
          throw error
        }
      })
      await Promise.all(savePromises)
      if (result.failed.length > 0) {
        alert(`Upload complete! ${result.successful.length} files uploaded successfully, ${result.failed.length} failed.`)
      } else {
        alert(`All ${result.successful.length} files uploaded successfully!`)
      }
      await loadFiles()
      resetUploadModal()
      setIsUploadOpen(false)
    } catch (error: any) {
      console.error('❌ App: Upload failed:', error)
      alert('Upload failed: ' + (error?.message || 'Unknown error'))
    } finally {
      setIsUploading(false)
      setUploadProgress({})
    }
  }

  // Handler for adding video URL
  const handleAddVideoUrl = async () => {
    if (!videoUrlData.url || !videoUrlData.title) {
      alert('Please provide both URL and Title')
      return
    }
    
    setIsUploading(true)
    try {
      console.log('🔄 App: Adding video URL:', videoUrlData.url)
      
      // Generate thumbnail URL based on video platform
      let thumbnailUrl = ''
      const url = videoUrlData.url
      
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // Extract YouTube video ID
        let videoId = ''
        if (url.includes('youtube.com/watch?v=')) {
          videoId = url.split('v=')[1]?.split('&')[0]
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1]?.split('?')[0]
        } else if (url.includes('youtube.com/embed/')) {
          videoId = url.split('embed/')[1]?.split('?')[0]
        }
        if (videoId) {
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        }
      } else if (url.includes('vimeo.com')) {
        // Extract Vimeo video ID
        const match = url.match(/vimeo\.com\/(\d+)/)
        if (match && match[1]) {
          thumbnailUrl = `https://vumbnail.com/${match[1]}.jpg`
        }
      }
      
      // Create file data object with thumbnail
      const fileData = {
        title: videoUrlData.title,
        name: videoUrlData.title,
        description: videoUrlData.description,
        media_url: videoUrlData.url,
        thumbnail: thumbnailUrl || undefined,
        file_type: 'video',
        file_size: 0,
        category: videoUrlData.category,
        tags: videoUrlData.tags,
        station: videoUrlData.station,
        author: videoUrlData.author || 'Unknown',
        folder_path: currentFolderPath
      }
      
      // Save to Xano
      console.log('🔄 App: Saving video URL to Xano')
      await xanoService.saveFile(fileData)
      console.log('✅ App: Video URL saved to database')
      
      // Reload files
      await loadFiles()
      
      // Reset form and close dialog
      setVideoUrlData({
        url: '',
        title: '',
        description: '',
        category: 'videos',
        tags: '',
        station: '',
        author: ''
      })
      setIsAddVideoUrlOpen(false)
      alert('Video URL added successfully!')
    } catch (error: any) {
      console.error('❌ App: Failed to add video URL:', error)
      alert('Failed to add video URL: ' + (error?.message || 'Unknown error'))
    } finally {
      setIsUploading(false)
    }
  }

  // Modified to default tags to an empty array if undefined
  const handleEditFile = (file: MediaFile) => {
    // When editing a file, ensure optional properties are always defined. Without
    // these defaults, undefined values (particularly tags) can cause runtime
    // errors when the edit dialog attempts to join arrays or bind inputs.
    setEditingFile({
      ...file,
      tags: Array.isArray(file.tags) ? file.tags : [],
      notes: file.notes ?? '',
      station: file.station ?? '',
      author: file.author ?? ''
    })
    setIsEditOpen(true)
  }

  // Safely join tags and handle undefined
  const handleSaveEdit = async () => {
    if (!editingFile) return
    try {
      console.log('🔄 App: Updating file:', editingFile)
      const updates = {
        title: editingFile.title,
        description: editingFile.description,
        category: editingFile.category,
        tags: (editingFile.tags ?? []).join(', '),
        notes: editingFile.notes,
        station: editingFile.station
      }
      await xanoService.updateFile(editingFile.id, updates)
      console.log('✅ App: File updated successfully')
      setFiles(prev => prev.map(file =>
        file.id === editingFile.id ? editingFile : file
      ))
      setIsEditOpen(false)
      setEditingFile(null)
      alert('File updated successfully!')
    } catch (error: any) {
      console.error('❌ App: Error updating file:', error)
      alert('Error updating file: ' + (error?.message || 'Unknown error'))
    }
  }

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Are you sure you want to delete "${file.title}"?`)) return
    try {
      await xanoService.deleteFile(file.id)
      setFiles(prev => prev.filter(f => f.id !== file.id))
      alert('File deleted successfully!')
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Failed to delete file')
    }
  }

  const handlePreview = (file: MediaFile) => {
    setSelectedFile(file)
    setIsPreviewOpen(true)
  }

  const handleSort = (field: 'title' | 'file_type' | 'file_size' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const handleFileSelect = (file: MediaFile) => {
    setSelectedMediaFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id)
      const newSelection = isSelected
        ? prev.filter(f => f.id !== file.id)
        : [...prev, file]
      setShowBatchPanel(newSelection.length > 0)
      return newSelection
    })
  }

  const handleSelectAll = () => {
    setSelectedMediaFiles(filteredFiles)
    setShowBatchPanel(true)
  }

  const handleClearSelection = () => {
    setSelectedMediaFiles([])
    setShowBatchPanel(false)
  }

  const handleContextMenu = (e: React.MouseEvent, file: MediaFile) => {
    e.preventDefault()
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      file
    })
  }

  const handleContextAction = async (action: string, file: MediaFile) => {
    setContextMenu({ show: false, x: 0, y: 0, file: null })
    switch (action) {
      case 'view':
        handlePreview(file)
        break
      case 'edit':
        handleEditFile(file)
        break
      case 'download':
        window.open(file.media_url, '_blank')
        break
      case 'delete':
        if (confirm(`Are you sure you want to delete "${file.title}"?`)) {
          try {
            await xanoService.deleteFile(file.id)
            setFiles(prev => prev.filter(f => f.id !== file.id))
          } catch (error) {
            console.error('Error deleting file:', error)
            alert('Failed to delete file')
          }
        }
        break
    }
  }

  const handleBatchUpdate = async (updates: any) => {
    try {
      const batchUpdates = selectedMediaFiles.map(file => ({
        id: file.id,
        fields: updates
      }))
      await xanoService.batchUpdateFiles(batchUpdates)
      setFiles(prev => prev.map(file => {
        const selectedFile = selectedMediaFiles.find(sf => sf.id === file.id)
        return selectedFile ? { ...file, ...updates } : file
      }))
      handleClearSelection()
    } catch (error) {
      console.error('Error batch updating files:', error)
      alert('Failed to update files')
    }
  }

  const handleBatchDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedMediaFiles.length} files?`)) return
    try {
      const ids = selectedMediaFiles.map(f => f.id)
      await xanoService.batchDeleteFiles(ids)
      setFiles(prev => prev.filter(file => !ids.includes(file.id)))
      handleClearSelection()
    } catch (error) {
      console.error('Error batch deleting files:', error)
      alert('Failed to delete files')
    }
  }

  const renderPreview = (file: MediaFile) => {
    return PreviewService.renderPreview(file)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading files...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <p className="text-red-600 mb-4 text-lg">Error: {error}</p>
          <button
            onClick={loadFiles}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Media File Manager</h1>
          <p className="text-sm sm:text-base text-gray-600">Upload, organize, and manage your media files</p>
        </div>
        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-1">
            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={currentFolderPath === '' ? UNCATEGORIZED_VALUE : currentFolderPath}
              onValueChange={(value) => {
                if (value === UNCATEGORIZED_VALUE) {
                  setCurrentFolderPath('');
                } else {
                  setCurrentFolderPath(value);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📁 All Folders</SelectItem>
                <SelectItem value={UNCATEGORIZED_VALUE}>📁 Uncategorized</SelectItem>
                  {folders && folders.length > 0 && folders.map(folder => (
                    <SelectItem key={folder.id || folder.path} value={folder.path}>
                      📁 {folder.name}
                    </SelectItem>
                  ))}
                  {(!folders || folders.length === 0) && files && files.length > 0 && (() => {
                    // Extract unique Cloudinary folders from media_url
                    const cloudinaryFolders = new Set<string>()
                    files.forEach(f => {
                      const folder = extractCloudinaryFolder(f.media_url)
                      if (folder) cloudinaryFolders.add(folder)
                    })
                    
                    const isLikelyVersion = (s: string) => /^v\d{6,}$/.test(s)
                    const cleanedFolders = Array.from(cloudinaryFolders).filter(fp => {
                      const leaf = fp.split('/').pop() || ''
                      return !isLikelyVersion(leaf)
                    })
                    
                    return cleanedFolders.map(folderPath => {
                      const displayName = folderPath.includes('/') ? folderPath.split("/").pop() || folderPath : folderPath
                      return (
                        <SelectItem key={folderPath} value={folderPath}>
                          📁 {displayName}
                        </SelectItem>
                      )
                    })
                  })()}
                 </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {categoryLabel[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
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
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">New Folder</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 p-4">
                    <div>
                      <Label htmlFor="folder-name">Folder Name</Label>
                      <Input
                        id="folder-name"
                        placeholder="Enter folder name..."
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCreateFolder()
                          }
                        }}
                      />
                      {folderError && (
                        <p className="text-sm text-red-600 mt-2">{folderError}</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setIsCreateFolderOpen(false)
                        setNewFolderName("")
                        setFolderError(null)
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                        Create Folder
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            <Dialog open={isUploadOpen} onOpenChange={(open) => {
              setIsUploadOpen(open)
              if (!open) resetUploadModal()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Batch Upload Files (Max 10)</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* File Selection Area */}
                  <div className="space-y-4">
                    {/* Drag and Drop Zone */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragOver
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Drag and drop files here
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        or use the file picker below
                      </p>
                      <Label htmlFor="file-upload">
                        <Button variant="outline" asChild>
                          <span className="cursor-pointer">
                            <Plus className="w-4 h-4 mr-2" />
                            Choose Files
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Selected Files ({selectedFiles.length}/10)
                        </Label>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div className="flex items-center gap-2">
                                {getFileIcon(file.type)}
                                <span className="text-sm truncate">{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({formatFileSize(file.size)})
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeSelectedFile(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Shared Metadata Form */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">
                          📝 All selections will use the shared information you enter below
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="shared-description">Description</Label>
                        <Textarea
                          id="shared-description"
                          placeholder="Enter description for all files..."
                          value={sharedMetadata.description}
                          onChange={(e) => setSharedMetadata(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shared-category">Category</Label>
                        <Select
                          value={sharedMetadata.category}
                          onValueChange={(value) => setSharedMetadata(prev => ({
                            ...prev,
                            category: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.filter(cat => cat !== 'all').map(category => (
                              <SelectItem key={category} value={category}>
                                {categoryLabel[category]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="shared-tags">Tags (comma-separated)</Label>
                        <Input
                          id="shared-tags"
                          placeholder="tag1, tag2, tag3..."
                          value={sharedMetadata.tags}
                          onChange={(e) => setSharedMetadata(prev => ({
                            ...prev,
                            tags: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shared-author">Author/Submitted By</Label>
                        <Input
                          id="shared-author"
                          placeholder="Enter author name..."
                          value={sharedMetadata.author}
                          onChange={(e) => setSharedMetadata(prev => ({
                            ...prev,
                            author: e.target.value
                          }))}
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsUploadOpen(false)}
                          disabled={isUploading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleBatchUpload}
                          disabled={isUploading || selectedFiles.length === 0}
                        >
                          {isUploading ? 'Uploading...' : `Finalize Upload (${selectedFiles.length} files)`}
                        </Button>
                      </div>
                      {/* Upload Progress */}
                      {isUploading && Object.keys(uploadProgress).length > 0 && (
                        <div className="space-y-2 border-t pt-4">
                          <Label className="text-sm font-medium">Upload Progress</Label>
                          {Object.entries(uploadProgress).map(([fileName, progress]) => (
                            <div key={fileName} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="truncate">{fileName}</span>
                                <span>{progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddVideoUrlOpen} onOpenChange={(open) => {
              setIsAddVideoUrlOpen(open)
              if (!open) {
                setVideoUrlData({
                  url: '',
                  title: '',
                  description: '',
                  category: 'videos',
                  tags: '',
                  station: '',
                  author: ''
                })
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Video className="w-4 h-4 mr-2" />
                  Add Video URL
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Video URL (YouTube/Vimeo)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 p-4">
                  <div>
                    <Label htmlFor="video-url">Video URL *</Label>
                    <Input
                      id="video-url"
                      placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                      value={videoUrlData.url}
                      onChange={(e) => setVideoUrlData({...videoUrlData, url: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-title">Title *</Label>
                    <Input
                      id="video-title"
                      placeholder="Enter video title..."
                      value={videoUrlData.title}
                      onChange={(e) => setVideoUrlData({...videoUrlData, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-description">Description</Label>
                    <Textarea
                      id="video-description"
                      placeholder="Enter description..."
                      value={videoUrlData.description}
                      onChange={(e) => setVideoUrlData({...videoUrlData, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-category">Category</Label>
                    <Select
                      value={videoUrlData.category}
                      onValueChange={(value) => setVideoUrlData({...videoUrlData, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="videos">Videos</SelectItem>
                        <SelectItem value="images">Images</SelectItem>
                        <SelectItem value="documents">Documents</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="video-station">Station</Label>
                    <Input
                      id="video-station"
                      placeholder="e.g., KRVB, KIDO..."
                      value={videoUrlData.station}
                      onChange={(e) => setVideoUrlData({...videoUrlData, station: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-tags">Tags (comma-separated)</Label>
                    <Input
                      id="video-tags"
                      placeholder="e.g., interview, news, demo"
                      value={videoUrlData.tags}
                      onChange={(e) => setVideoUrlData({...videoUrlData, tags: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-author">Author/Submitted By</Label>
                    <Input
                      id="video-author"
                      placeholder="Enter author name..."
                      value={videoUrlData.author}
                      onChange={(e) => setVideoUrlData({...videoUrlData, author: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddVideoUrlOpen(false)}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddVideoUrl}
                      disabled={!videoUrlData.url || !videoUrlData.title || isUploading}
                    >
                      {isUploading ? 'Adding...' : 'Add Video'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Selection Controls */}
        {filteredFiles.length > 0 && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
            <Button size="sm" variant="outline" onClick={handleSelectAll}>
              Select All ({filteredFiles.length})
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearSelection}>
              Clear Selection
            </Button>
            {selectedMediaFiles.length > 0 && (
              <span className="text-sm font-medium text-blue-800">
                {selectedMediaFiles.length} selected
              </span>
            )}
          </div>
        )}
        {/* File Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredFiles.map((file) => {
              const isSelected = selectedMediaFiles.some((f: MediaFile) => f.id === file.id)
              return (
                <Card
                  key={file.id}
                  className={`hover:shadow-lg transition-shadow cursor-pointer ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onContextMenu={(e) => handleContextMenu(e, file)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleFileSelect(file)}
                          className="rounded"
                        />
                        {getFileIcon(file.file_type)}
                        <CardTitle className="text-sm truncate">{file.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const thumbnailUrl = getThumbnailUrl(file)
                      if (thumbnailUrl) {
                        return (
                          <img 
                            src={thumbnailUrl} 
                            alt={file.title} 
                            className="w-full h-32 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              console.warn('Failed to load image:', file.id, thumbnailUrl)
                            }}
                          />
                        )
                      } else if (isVideoResource(file.media_url)) {
                        return (
                          <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                            <Video className="w-12 h-12 text-gray-400" />
                          </div>
                        )
                      } else {
                        return (
                          <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                            <File className="w-12 h-12 text-gray-400" />
                          </div>
                        )
                      }
                    })()}
                    <p className="text-sm text-gray-600 line-clamp-2">{file.description || 'No description'}</p>
                    {file.author && (
                      <p className="text-xs text-gray-500">By: {file.author}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {file.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>{formatFileSize(file.file_size)}</div>
                      <div>{formatDate(file.created_at)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handlePreview(file)}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditFile(file)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={file.media_url} download={file.title}>
                          <Download className="w-3 h-3" />
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(file)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedMediaFiles.length === filteredFiles.length && filteredFiles.length > 0}
                        onChange={selectedMediaFiles.length === filteredFiles.length ? handleClearSelection : handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thumbnail
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('title')}
                    >
                      Name {getSortIcon('title')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('file_type')}
                    >
                      Type {getSortIcon('file_type')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('file_size')}
                    >
                      Size {getSortIcon('file_size')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      Date {getSortIcon('created_at')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFiles.map((file) => {
                    const isSelected = selectedMediaFiles.some((f: MediaFile) => f.id === file.id)
                    const thumbnailUrl = getThumbnailUrl(file)
                    return (
                      <tr
                        key={file.id}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleFileSelect(file)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded">
                            {thumbnailUrl ? (
                              <img
                                src={thumbnailUrl}
                                alt={file.title}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  const parent = e.currentTarget.parentElement
                                  if (parent) {
                                    const icon = document.createElement('div')
                                    icon.className = 'flex items-center justify-center w-full h-full'
                                    icon.innerHTML = '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>'
                                    parent.appendChild(icon)
                                  }
                                }}
                              />
                            ) : isVideoResource(file.media_url) ? (
                              <Video className="w-8 h-8 text-gray-400" />
                            ) : (
                              getFileIcon(file.file_type)
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{file.title}</div>
                              <div className="text-sm text-gray-500 line-clamp-2">{file.description}</div>
                              {file.author && (
                                <div className="text-xs text-gray-400">By: {file.author}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.file_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFileSize(file.file_size)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(file.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handlePreview(file)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditFile(file)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <a href={file.media_url} download={file.title}>
                                <Download className="w-3 h-3" />
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(file)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Preview Modal */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedFile?.title}</DialogTitle>
            </DialogHeader>
            {selectedFile && (
              <div className="space-y-4">
                {renderPreview(selectedFile)}
                <div className="text-sm text-gray-600">
                  <p><strong>Description:</strong> {selectedFile.description || 'No description'}</p>
                  <p><strong>Type:</strong> {selectedFile.file_type}</p>
                  <p><strong>Size:</strong> {formatFileSize(selectedFile.file_size)}</p>
                  <p><strong>Created:</strong> {formatDate(selectedFile.created_at)}</p>
                  {selectedFile.author && (
                    <p><strong>Author:</strong> {selectedFile.author}</p>
                  )}
                  {selectedFile.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      <strong>Tags:</strong>
                      {selectedFile.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                   <div className="border-t pt-4">
                     <UrlDisplay 
                       url={selectedFile.media_url} 
                       title="Cloudinary URL"
                       showCopy={true}
                       showOpen={true}
                     />
                   </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Edit Modal */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent draggable>
            <DialogHeader>
              <DialogTitle>Edit File</DialogTitle>
            </DialogHeader>
            {editingFile && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingFile.title}
                    onChange={(e) => setEditingFile({ ...editingFile, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingFile.description}
                    onChange={(e) => setEditingFile({ ...editingFile, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={editingFile.category} onValueChange={(value) => setEditingFile({ ...editingFile, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(cat => cat !== 'all').map(category => (
                        <SelectItem key={category} value={category}>
                          {categoryLabel[category]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                  <Input
                    id="edit-tags"
                    value={(editingFile?.tags ?? []).join(', ')}
                    onChange={(e) => setEditingFile(prev => {
                      if (!prev) return prev
                      return {
                        ...prev,
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-station">Station</Label>
                  <Input
                    id="edit-station"
                    value={editingFile.station || ''}
                    onChange={(e) => setEditingFile({ ...editingFile, station: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editingFile.notes || ''}
                    onChange={(e) => setEditingFile({ ...editingFile, notes: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-author">Author/Submitted By</Label>
                  <Input
                    id="edit-author"
                    value={editingFile.author || ''}
                    onChange={(e) => setEditingFile({ ...editingFile, author: e.target.value })}
                  />
                </div>
                   <div className="border-t pt-4">
                     <UrlDisplay 
                       url={editingFile.media_url} 
                       title="Cloudinary URL"
                       showCopy={true}
                       showOpen={true}
                     />
                   </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveEdit}>Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Batch Operations Panel */}
{showBatchPanel && selectedMediaFiles.length > 0 && (
            <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-96 z-40">
              <BulkOperationsPanel
                selectedFiles={selectedMediaFiles}
                folders={folders}
                onComplete={() => {
                  handleClearSelection();
                  loadFiles();
                }}
              />
            </div>
          )}
        {/* Context Menu */}
        {contextMenu.show && contextMenu.file && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu({ show: false, x: 0, y: 0, file: null })}
          >
            <div
              className="fixed bg-white border border-gray-300 rounded-lg shadow-xl py-2 z-50 min-w-48"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2"
                onClick={() => handleContextAction('view', contextMenu.file!)}
              >
                👁️ View Details
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2"
                onClick={() => handleContextAction('edit', contextMenu.file!)}
              >
                ✏️ Edit
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2"
                onClick={() => handleContextAction('download', contextMenu.file!)}
              >
                💾 Download
              </button>
              <hr className="my-1" />
              <button
                className="w-full px-4 py-2 text-left hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"
                onClick={() => handleContextAction('delete', contextMenu.file!)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
        {/* Empty State */}
        {filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by uploading your first file.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
