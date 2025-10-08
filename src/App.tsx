import { useState, useEffect } from 'react'
import { Upload, Grid, List, FolderOpen, Sun, Moon, Folder, Plus, Trash2, Search, Filter, File, Film, Music, FileText, Eye, Loader2 } from 'lucide-react'

// Simple file interface
interface FileItem {
  id: string;
  title: string;
  media_url: string;
  thumbnail?: string;
  file_size: number;
  upload_date: string;
  type: string;
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentFolder, setCurrentFolder] = useState('/')
  const [showUpload, setShowUpload] = useState(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // LOAD FILES FROM BACKEND
  useEffect(() => {
    loadFiles()
  }, [currentFolder])

  const loadFiles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/media')
      const data = await response.json()
      console.log('Loaded files:', data) // Debug log
      setFiles(Array.isArray(data) ? data : (data.records || []))
    } catch (error) {
      console.error('Failed to load files:', error)
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (!fileList || fileList.length === 0) return

    // UPLOAD TO CLOUDINARY FIRST
    const formData = new FormData()
    formData.append('file', fileList[0])
    formData.append('upload_preset', 'HIBF_MASTER')
    formData.append('folder', currentFolder)

    try {
      const cloudinaryResponse = await fetch(
        'https://api.cloudinary.com/v1_1/dzrw8nopf/upload',
        { method: 'POST', body: formData }
      )
      const cloudinaryData = await cloudinaryResponse.json()

      // SAVE TO BACKEND
      const saveResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fileList[0].name,
          url: cloudinaryData.secure_url,
          media_url: cloudinaryData.secure_url,
          thumbnail: cloudinaryData.secure_url.replace('/upload/', '/upload/w_150,h_150,c_fill/'),
          size: cloudinaryData.bytes,
          type: fileList[0].type,
          upload_date: new Date().toISOString()
        })
      })

      if (saveResponse.ok) {
        // Reload files after successful upload
        await loadFiles()
        setShowUpload(false)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  // REST OF YOUR COMPONENT (folders, UI, etc.)
  const [folders, setFolders] = useState([
    { name: '/', path: '/' },
    { name: 'projects', path: '/projects' },
    { name: 'clients', path: '/clients' },
    { name: 'personal', path: '/personal' }
  ])

  // ... rest of your JSX structure but with actual file display ...

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Your existing header JSX */}
      
      {/* FILE DISPLAY AREA */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p>Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No files found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Upload files to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <div key={file.id} className="border rounded-lg p-4">
                <img 
                  src={file.thumbnail || file.media_url} 
                  alt={file.title}
                  className="w-full h-32 object-cover rounded mb-2"
                  onError={(e) => {
                    e.currentTarget.src = '/icons/file-placeholder.svg'
                  }}
                />
                <h4 className="font-medium text-sm truncate">{file.title}</h4>
                <p className="text-xs text-gray-500">
                  {new Date(file.upload_date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal with working upload */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
            <input
              type="file"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4"
            />
            <div className="flex justify-end">
              <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
