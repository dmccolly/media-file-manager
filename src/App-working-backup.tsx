import { useState } from 'react'
import { Upload, Grid, List, FolderOpen, Sun, Moon, Folder, Plus, Trash2 } from 'lucide-react'

// Simple working version with folder management UI
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentFolder, setCurrentFolder] = useState('/')
  const [showUpload, setShowUpload] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  
  const [folders, setFolders] = useState([
    { name: '/', path: '/' },
    { name: 'projects', path: '/projects' },
    { name: 'clients', path: '/clients' },
    { name: 'personal', path: '/personal' }
  ])

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        name: newFolderName.trim(),
        path: `/${newFolderName.trim()}`
      }
      setFolders([...folders, newFolder])
      setNewFolderName('')
      setShowNewFolder(false)
    }
  }

  const handleDeleteFolder = (folderPath: string) => {
    if (folderPath !== '/') {
      setFolders(folders.filter(folder => folder.path !== folderPath))
      if (currentFolder === folderPath) {
        setCurrentFolder('/')
      }
    }
  }

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
                  onClick={() => setShowNewFolder(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                >
                  <Plus size={14} />
                  <span>New Folder</span>
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
                    {folder.path !== '/' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFolder(folder.path)
                        }}
                        className="ml-auto text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {/* Toolbar */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="Search files..."
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option>All</option>
                      <option>Images</option>
                      <option>Videos</option>
                      <option>Documents</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Grid size={20} />
                    </button>
                    <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <List size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* File Area */}
              <div className="p-6">
                <div className="text-center py-12">
                  <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No files in {currentFolder}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Upload files to get started
                  </p>
                </div>
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
              <label className="block text-sm font-medium mb-2">Select Files</label>
              <input
                type="file"
                multiple
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Target Folder</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                {folders.map((folder) => (
                  <option key={folder.path} value={folder.path}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUpload(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Upload Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Folder Name</label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNewFolder(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}