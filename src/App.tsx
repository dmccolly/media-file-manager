import React, { useState, useEffect } from 'react'
import { Upload, Search, Grid, List, Eye, Edit, Download, FolderOpen, File, Image, Video, Music, FileText, X, Plus, Menu } from 'lucide-react'
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
import { FolderTree } from './components/FolderTree'
import { Breadcrumb } from './components/Breadcrumb'

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

interface FolderNode {
  path: string
  name: string
  children: FolderNode[]
  fileCount: number
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

const categories = ['all', 'images', 'videos', 'documents', 'audio', 'other']

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
  const [sortField, setSortField] = useState<'title' | 'file_type' | 'file_size' | 'created_at'>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentFolderPath, setCurrentFolderPath] = useState<string>('')
  const [folderTree, setFolderTree] = useState<FolderNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([]))
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [emptyFolders, setEmptyFolders] = useState<Set<string>>(new Set())

  const cloudinaryService = new CloudinaryService()
  const xanoService = new XanoService()

  useEffect(() => {
    loadFiles()
  }, [])

  useEffect(() => {
    let filtered = files

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
    } else {
      filtered = filtered.filter(file => (file.folder_path || '') === currentFolderPath)
    }

    const sortedFiles = [...filtered].sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
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

    setFilteredFiles(sortedFiles)
  }, [files, searchTerm, selectedCategory, sortField, sortDirection, currentFolderPath])

  useEffect(() => {
    setFolderTree(buildFolderTree(files, emptyFolders))
  }, [files, emptyFolders])

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
      
      const result = await cloudinaryService.uploadMultipleFiles(
        selectedFiles,
        {
          ...sharedMetadata,
          folder_path: currentFolderPath
        },
        (_fileIndex: number, progress: number, fileName: string) => {
          setUploadProgress(prev => ({
            ...prev,
            [fileName]: progress
          }))
        }
      )
      
      console.log('✅ App: Cloudinary upload complete:', result)
      
      const savePromises = result.successful.map(async (fileData: any) => {
        try {
          console.log('🔄 App: Saving file to Xano:', fileData.title)
          await xanoService.saveFile(fileData)
          console.log('✅ App: File saved to database:', fileData.title)
          
          console.log('🔄 App: Syncing to Webflow via Netlify Function:', fileData.title)
          try {
            const webflowResponse = await fetch('/.netlify/functions/webflow-sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                title: fileData.title,
                name: fileData.name,
                url: fileData.url,
                description: fileData.description,
                category: fileData.category,
                type: fileData.type,
                size: fileData.size,
                tags: fileData.tags,
                author: fileData.author
              })
            })
            
            if (webflowResponse.ok) {
              const webflowResult = await webflowResponse.json()
              console.log('✅ App: Webflow sync successful via Netlify Function:', webflowResult)
            } else {
              const errorData = await webflowResponse.text()
              console.warn('🔶 App: Webflow sync failed via Netlify Function:', errorData)
            }
          } catch (webflowError) {
            console.warn('🔶 App: Webflow sync error via Netlify Function:', webflowError)
          }
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

  const handleEditFile = (file: MediaFile) => {
    setEditingFile({ ...file })
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingFile) return
    
    try {
      console.log('🔄 App: Updating file:', editingFile)
      
      const updates = {
        title: editingFile.title,
        description: editingFile.description,
        category: editingFile.category,
        tags: editingFile.tags.join(', '),
        notes: editingFile.notes,
        station: editingFile.station,
        author: editingFile.author,
        folder_path: editingFile.folder_path
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

  const handleThumbnailMigration = async () => {
    alert('Thumbnail generation is now handled automatically when files are loaded. No migration needed!')
  }

  const buildFolderTree = (files: MediaFile[], emptyFolderPaths: Set<string>): FolderNode[] => {
    const tree: FolderNode[] = []
    const pathMap = new Map<string, FolderNode>()
    
    const folderPaths = new Set<string>()
    
    files.forEach(file => {
      if (file.folder_path && file.folder_path !== '') {
        const parts = file.folder_path.split('/').filter(Boolean)
        let currentPath = ''
        parts.forEach(part => {
          currentPath += '/' + part
          folderPaths.add(currentPath)
        })
      }
    })
    
    emptyFolderPaths.forEach(path => {
      if (path && path !== '') {
        folderPaths.add(path)
        const parts = path.split('/').filter(Boolean)
        let currentPath = ''
        parts.forEach(part => {
          currentPath += '/' + part
          folderPaths.add(currentPath)
        })
      }
    })
    
    Array.from(folderPaths).sort().forEach(path => {
      const parts = path.split('/').filter(Boolean)
      const name = parts[parts.length - 1]
      const parentPath = parts.length > 1 ? '/' + parts.slice(0, -1).join('/') : ''
      
      const node: FolderNode = {
        path,
        name,
        children: [],
        fileCount: files.filter(f => f.folder_path === path).length
      }
      
      pathMap.set(path, node)
      
      if (parentPath && pathMap.has(parentPath)) {
        pathMap.get(parentPath)!.children.push(node)
      } else if (!parentPath) {
        tree.push(node)
      }
    })
    
    return tree
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    
    const newPath = currentFolderPath ? `${currentFolderPath}/${newFolderName}` : `/${newFolderName}`
    
    setEmptyFolders(prev => new Set(prev).add(newPath))
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (currentFolderPath) {
        next.add(currentFolderPath)
      }
      return next
    })
    setCurrentFolderPath(newPath)
    setNewFolderName('')
    setIsCreateFolderOpen(false)
  }

  const handleFolderClick = (path: string) => {
    setCurrentFolderPath(path)
  }

  const handleFileDrop = async (fileId: string, targetFolderPath: string) => {
    const file = files.find(f => f.id === fileId)
    if (!file) return
    
    try {
      await xanoService.updateFile(file.id, { folder_path: targetFolderPath })
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, folder_path: targetFolderPath } : f
      ))
      
      if (targetFolderPath && emptyFolders.has(targetFolderPath)) {
        setEmptyFolders(prev => {
          const next = new Set(prev)
          next.delete(targetFolderPath)
          return next
        })
      }
    } catch (error) {
      console.error('Error moving file to folder:', error)
      alert('Failed to move file to folder')
    }
  }

  const handleDeleteFolder = async (folderPath: string) => {
    if (!folderPath) return
    
    const filesInFolder = files.filter(f => f.folder_path === folderPath)
    
    if (filesInFolder.length > 0) {
      const confirmDelete = window.confirm(
        `This folder contains ${filesInFolder.length} file(s). They will be moved to Uncategorized. Continue?`
      )
      
      if (!confirmDelete) return
      
      try {
        for (const file of filesInFolder) {
          await xanoService.updateFile(file.id, { folder_path: '' })
        }
        
        setFiles(prev => prev.map(file => 
          file.folder_path === folderPath ? { ...file, folder_path: '' } : file
        ))
        
        setEmptyFolders(prev => {
          const next = new Set(prev)
          next.delete(folderPath)
          return next
        })
        
        setCurrentFolderPath('')
        
        alert('Folder deleted and files moved to Uncategorized.')
      } catch (error: any) {
        console.error('❌ App: Error deleting folder:', error)
        alert('Error deleting folder: ' + (error?.message || 'Unknown error'))
      }
    } else {
      setEmptyFolders(prev => {
        const next = new Set(prev)
        next.delete(folderPath)
        return next
      })
      
      setCurrentFolderPath('')
      alert('Folder deleted.')
    }
  }

  const renderPreview = (file: MediaFile) => {
    // Extract file extension from URL or title
    const getFileExtension = (url: string, title: string) => {
      const extFromUrl = url.split('.').pop()?.toLowerCase() || '';
      const extFromTitle = title.split('.').pop()?.toLowerCase() || '';
      return extFromUrl || extFromTitle || '';
    };

    const fileExt = getFileExtension(file.media_url, file.title);

    if (file.file_type.startsWith('image/')) {
      return <img src={file.media_url} alt={file.title} className="max-w-full max-h-96 object-contain" />
    }
    
    if (file.file_type.startsWith('video/')) {
      return <video src={file.media_url} controls className="max-w-full max-h-96" />
    }
    
    if (file.file_type.startsWith('audio/')) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
            <Music className="w-16 h-16 text-gray-400" />
          </div>
          <audio src={file.media_url} controls className="w-full" />
        </div>
      )
    }
    
    // Enhanced PDF handling - use Cloudinary transformation to convert to JPG
    if (file.file_type.includes('pdf') || fileExt === 'pdf') {
      const mediaUrl = file.media_url
      
      if (mediaUrl?.includes('cloudinary.com')) {
        const transformedUrl = mediaUrl.replace('/upload/', '/upload/w_600,h_800,c_fit,f_jpg,pg_1/')
        
        return (
          <div className="w-full">
            <img 
              src={transformedUrl}
              alt={file.title || 'PDF Document'}
              className="w-full max-h-96 object-contain border border-gray-200 rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = document.createElement('div')
                fallback.className = 'flex flex-col items-center justify-center h-96 text-gray-500'
                fallback.innerHTML = `
                  <div class="text-4xl mb-4">📄</div>
                  <div class="text-lg mb-2">PDF preview not available</div>
                  <a href="${mediaUrl}" target="_blank" class="text-blue-500 hover:underline">Open PDF in new tab</a>
                `
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.appendChild(fallback)
                }
              }}
            />
            <div className="text-sm text-gray-500 mt-2 text-center">
              Page 1 of PDF - <a href={mediaUrl} target="_blank" className="text-blue-500 hover:underline">Open full PDF</a>
            </div>
          </div>
        )
      } else {
        return (
          <iframe 
            src={`${mediaUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-96 border border-gray-200 rounded" 
            title={file.title}
          />
        )
      }
    }
    
    // Enhanced DOC/DOCX handling using Microsoft Office Web Viewer
    if (fileExt === 'doc' || fileExt === 'docx') {
      const officeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.media_url)}`;
      return (
        <iframe 
          src={officeSrc}
          className="w-full h-96 border-none" 
          title={file.title}
        />
      )
    }
    
    // Handle other Office document types
    if (['xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt)) {
      const officeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.media_url)}`;
      return (
        <iframe 
          src={officeSrc}
          className="w-full h-96 border-none" 
          title={file.title}
        />
      )
    }
    
    // Handle text-based documents
    if (['txt', 'rtf', 'csv'].includes(fileExt)) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
            <FileText className="w-16 h-16 text-gray-400" />
          </div>
          <iframe 
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(file.media_url)}&embedded=true`}
            className="w-full h-96 border-none" 
            title={file.title}
          />
        </div>
      )
    }
    
    return (
      <div className="p-8 text-center text-gray-500 space-y-4">
        <FileText className="w-16 h-16 mx-auto text-gray-400" />
        <p>Preview not available for this file type</p>
        <Button onClick={() => window.open(file.media_url, '_blank')} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download File
        </Button>
      </div>
    )
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Folder Tree */}
      <div className={`${isSidebarOpen ? 'fixed inset-0 z-50 bg-black bg-opacity-50 lg:relative lg:bg-transparent' : 'hidden'} lg:block lg:w-64 lg:flex-shrink-0`}>
        <div className={`${isSidebarOpen ? 'w-64' : 'w-full'} h-full bg-white border-r border-gray-200 flex flex-col lg:relative`}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div
              className={`flex items-center gap-2 py-2 px-3 mb-2 hover:bg-gray-100 cursor-pointer rounded-md transition-colors ${
                currentFolderPath === '' ? 'bg-blue-50 text-blue-700 font-medium' : ''
              }`}
              onClick={() => {
                handleFolderClick('')
                setIsSidebarOpen(false)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('bg-blue-100')
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-blue-100')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('bg-blue-100')
                const fileId = e.dataTransfer.getData('fileId')
                if (fileId) {
                  handleFileDrop(fileId, '')
                }
              }}
            >
              <FolderOpen className="w-4 h-4 text-amber-600" />
              <span className="flex-1 text-sm">Uncategorized</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {files.filter(f => !f.folder_path || f.folder_path === '').length}
              </span>
            </div>
            
            <FolderTree
              tree={folderTree}
              currentPath={currentFolderPath}
              expandedFolders={expandedFolders}
              onFolderClick={(path: string) => {
                handleFolderClick(path)
                setIsSidebarOpen(false)
              }}
              onToggleExpand={(path: string) => {
                setExpandedFolders(prev => {
                  const next = new Set(prev)
                  if (next.has(path)) {
                    next.delete(path)
                  } else {
                    next.add(path)
                  }
                  return next
                })
              }}
              onDrop={(path: string, e: React.DragEvent) => {
                const fileId = e.dataTransfer.getData('fileId')
                if (fileId) {
                  handleFileDrop(fileId, path)
                }
              }}
              onDeleteFolder={handleDeleteFolder}
            />
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <Button
              onClick={() => setIsCreateFolderOpen(true)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Open folder navigation"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Media File Manager</h1>
                  <p className="text-sm text-gray-600 hidden sm:block">Upload, organize, and manage your media files</p>
                </div>
              </div>
            </div>
            <Breadcrumb 
              currentPath={currentFolderPath} 
              onNavigate={handleFolderClick}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search files across all folders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
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
                <Button variant="outline" size="sm" onClick={handleThumbnailMigration}>
                  🔄 Fix Thumbnails
                </Button>
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
                                {category.charAt(0).toUpperCase() + category.slice(1)}
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
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('fileId', file.id)
                    e.currentTarget.classList.add('opacity-50')
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.classList.remove('opacity-50')
                  }}
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
                    {file.thumbnail && (
                      <img src={file.thumbnail} alt={file.title} className="w-full h-32 object-cover rounded" />
                    )}
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
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                  <table className="w-full">
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
                          return (
                            <tr 
                              key={file.id} 
                              className={`hover:bg-gray-50 cursor-pointer ${
                                isSelected ? 'bg-blue-50' : ''
                              }`}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('fileId', file.id)
                                e.currentTarget.classList.add('opacity-50')
                              }}
                              onDragEnd={(e) => {
                                e.currentTarget.classList.remove('opacity-50')
                              }}
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
                                <div className="flex items-center">
                                  {getFileIcon(file.file_type)}
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">{file.title}</div>
                                    <div className="text-sm text-gray-500">{file.description}</div>
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
            
            {/* Empty State */}
            {filteredFiles.filter(file => (file.folder_path || '') === currentFolderPath).length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Get started by uploading your first file or drag files into this folder.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Folder Name</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder()
                  }
                }}
              />
            </div>
            <div className="text-sm text-gray-500">
              Will be created in: {currentFolderPath || 'Uncategorized'}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>
                Create Folder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
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
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                  <Input
                    id="edit-tags"
                    value={editingFile.tags.join(', ')}
                    onChange={(e) => setEditingFile({ 
                      ...editingFile, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
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
                <div>
                  <Label htmlFor="edit-folder">Folder</Label>
                  <Select 
                    value={editingFile.folder_path || ''} 
                    onValueChange={(value) => setEditingFile({ ...editingFile, folder_path: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Uncategorized</SelectItem>
                      {Array.from(new Set(files.map(f => f.folder_path).filter((path): path is string => !!path))).sort().map(folderPath => (
                        <SelectItem key={folderPath} value={folderPath}>
                          {folderPath}
                        </SelectItem>
                      ))}
                      {Array.from(emptyFolders).sort().map(folderPath => (
                        <SelectItem key={folderPath} value={folderPath}>
                          {folderPath}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 z-40">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800">
                Batch Operations ({selectedMediaFiles.length} files)
              </h4>
              <Button size="sm" variant="ghost" onClick={handleClearSelection}>
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  const category = prompt('Enter new category:')
                  if (category) handleBatchUpdate({ category })
                }}
              >
                Move to Category
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  const tags = prompt('Enter tags (comma-separated):')
                  if (tags) handleBatchUpdate({ tags })
                }}
              >
                Update Tags
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                className="w-full"
                onClick={handleBatchDelete}
              >
                Delete Files
              </Button>
            </div>
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

    </div>
  )
}

export default App
