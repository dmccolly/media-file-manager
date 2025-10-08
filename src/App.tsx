import { useState, useEffect } from 'react'
import { Upload, Grid, List, FolderOpen, Sun, Moon, Folder, Plus, Trash2, Search, Filter, File, Film, Music, FileText, Eye, Loader2 } from 'lucide-react'

// File interface matching your backend
interface FileItem {
  id: string;
  title: string;
  media_url: string;
  thumbnail?: string;
  file_size: number;
  upload_date: string;
  type: string;
}

interface Folder {
  name: string;
  path: string;
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentFolder, setCurrentFolder] = useState('/')
  const [showUpload, setShowUpload] = useState(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  const [folders, setFolders] = useState<Folder[]>([
    { name: '/', path: '/' },
    { name: 'projects', path: '/projects' },
    { name: 'clients', path: '/clients' },
    { name: 'personal', path: '/personal' }
  ])

  // LOAD FILES FROM YOUR BACKEND
  useEffect(() => {
    loadFiles()
  }, [currentFolder])

  const loadFiles = async () => {
    setIsLoading(true)
    try {
      console.log('Loading files from /api/media...')
      const response = await fetch('/api/media')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Raw API response:', data)
      
      const filesArray = Array.isArray(data) ? data : (data.records || [])
      console.log('Processed files:', filesArray)
      
      // Check each file for Cloudinary URLs
      filesArray.forEach((file: any, index) => {
        console.log(`File ${index}:`, {
          id: file.id,
          title: file.title,
          media_url: file.media_url,
          hasCloudinary: file.media_url?.includes('cloudinary.com'),
          thumbnail: file.thumbnail
        })
      })
      
      setFiles(filesArray)
    } catch (error) {
      console.error('Failed to load files:', error)
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }

  // WORKING FILE UPLOAD
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (!fileList || fileList.length === 0) return

    const file = fileList[0]
    console.log('Starting upload for:', file.name)

    setIsLoading(true)

    try {
      // Step 1: Upload to Cloudinary
      console.log('Step 1: Uploading to Cloudinary...')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'HIBF_MASTER')
      formData.append('folder', currentFolder)

      const cloudinaryRes = await fetch(
        'https://api.cloudinary.com/v1_1/dzrw8nopf/upload',
        { method: 'POST', body: formData }
      )

      if (!cloudinaryRes.ok) {
        const errorText = await cloudinaryRes.text()
        throw new Error(`Cloudinary upload failed: ${cloudinaryRes.status} - ${errorText}`)
      }

      const cloudinaryData = await cloudinaryRes.json()
      console.log('Cloudinary upload successful:', cloudinaryData.secure_url)

      // Step 2: Save to your backend
      console.log('Step 2: Saving to backend...')
      const backendData = {
        title: file.name,
        url: cloudinaryData.secure_url,
        media_url: cloudinaryData.secure_url,
        thumbnail: cloudinaryData.secure_url.replace('/upload/', '/upload/w_150,h_150,c_fill/'),
        size: cloudinaryData.bytes,
        type: file.type,
        upload_date: new Date().toISOString(),
        author: 'Unknown'
      }

      console.log('Backend data:', backendData)
      const backendRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData)
      })

      const responseText = await backendRes.text()
      console.log('Backend response:', responseText)

      if (!backendRes.ok) {
        throw new Error(`Backend save failed: ${backendRes.status} - ${responseText}`)
      }

      console.log('Upload complete! Reloading files...')
      await loadFiles()
      setShowUpload(false)

    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const response = await fetch(`/api/delete/${fileId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      await loadFiles()
    } catch (error) {
      console.error('Failed to delete file:', error)
      alert('Failed to delete file: ' + error.message)
    }
  }

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <File className="w-8 h-8 text-blue-500" />
    if (type.startsWith('video/')) return <Film className="w-8 h-8 text-purple-500" />
    if (type.startsWith('audio/')) return <Music className="w-8 h-8 text-green-500" />
    return <FileText className="w-8 h-8 text-gray-500" />
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

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || file.type.startsWith(filterType + '/')
    return matchesSearch && matchesFilter
  })

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              📁 Media File Manager
            </h1>
            <div className="flex items-center space-x-4">
              {selectedFiles.length > 0 && (
                <button
                  onClick={() => {
                    // Batch delete would go here
                    selectedFiles.forEach(id => handleDeleteFile(id))
                    setSelectedFiles([])
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Delete ({selectedFiles.length})</span>
                </button>
              )}
              <button
                onClick={() => setShowUpload(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Upload size={16} />
                <span>Upload</span>
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Folders */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Folders</h2>
                <button
                  onClick={() => setShowUpload(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                >
                  <Upload size={14} />
                  <span>Upload</span>
                </button>
              </div>

              <div className="space-y-2">
                {folders.map((folder) => (
                  <div
                    key={folder.path}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      currentFolder === folder.path ? 'bg-blue-100 dark:bg-blue-900' : ''
                    }`}
                    onClick={() => setCurrentFolder(folder.path)}
                  >
                    <Folder size={16} className="text-blue-600" />
                    <span className="text-sm">{folder.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - FILES */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {/* Toolbar */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="relative">
                      <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="all">All Files</option>
                        <option value="image">Images</option>
                        <option value="video">Videos</option>
                        <option value="audio">Audio</option>
                        <option value="application">Documents</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      <Grid size={20} />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      <List size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* File Display Area */}
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading files...</p>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {searchTerm || filterType !== 'all' ? 'No files match your criteria' : `No files in ${currentFolder}`}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm || filterType !== 'all' ? 'Try adjusting your search or filter' : 'Upload files to get started'}
                    </p>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`${viewMode === 'grid' ? 'border rounded-lg p-4 hover:shadow-md transition-shadow' : 'flex items-center space-x-4 p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-700'} ${
                          selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900' : ''
                        }`}
                      >
                        {viewMode === 'grid' ? (
                          <>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={selectedFiles.includes(file.id)}
                                onChange={() => toggleFileSelection(file.id)}
                                className="absolute top-2 right-2 z-10"
                              />
                              {file.media_url ? (
                                <img 
                                  src={file.thumbnail || file.media_url} 
                                  alt={file.title}
                                  className="w-full h-32 object-cover rounded mb-3"
                                  onError={(e) => {
                                    e.currentTarget.src = '/icons/file-placeholder.svg'
                                  }}
                                />
                              ) : (
                                <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded mb-3 flex items-center justify-center">
                                  {getFileIcon(file.type)}
                                </div>
                              )}
                            </div>
                            <h4 className="font-medium text-sm truncate">{file.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.file_size)} • {formatDate(file.upload_date)}
                            </p>
                            <div className="mt-2 flex space-x-2">
                              <button
                                onClick={() => window.open(file.media_url, '_blank')}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={() => toggleFileSelection(file.id)}
                            />
                            {file.media_url ? (
                              <img 
                                src={file.thumbnail || file.media_url} 
                                alt={file.title}
                                className="w-12 h-12 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src = '/icons/file-placeholder.svg'
                                }}
                              />
                            ) : (
                              getFileIcon(file.type)
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium">{file.title}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.file_size)} • {formatDate(file.upload_date)}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => window.open(file.media_url, '_blank')}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select File</label>
              <input
                type="file"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUpload(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
