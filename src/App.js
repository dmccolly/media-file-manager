// App.js - Main Application
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AirtableService } from './AirtableService';
import { CloudinaryService } from './CloudinaryService';
import {
  FolderTree,
  UploadButton,
  ProgressBar,
  ContextMenu,
  FileGrid,
  UploadMetadataForm,
  DragDropOverlay,
  FilePreviewModal
} from './FileManagerComponents';

// Main Application Component
export default function App() {
  console.log('🚀 App: Starting File Manager...');

  // Initialize services
  const airtableService = useMemo(() => {
    console.log('🔧 App: Initializing AirtableService...');
    return new AirtableService();
  }, []);

  const cloudinaryService = useMemo(() => {
    console.log('🔧 App: Initializing CloudinaryService...');
    return new CloudinaryService();
  }, []);

  // State Management
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('Images');
  const [viewMode, setViewMode] = useState('grid');
  const [expandedFolders, setExpandedFolders] = useState(['Images', 'Video', 'Audio']);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, type: '', target: null });
  
  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  
  // UI states
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Computed Values
  const folderTree = useMemo(() => {
    console.log('🔄 App: Computing folder tree from files:', files);
    
    const tree = {};
    files.forEach(file => {
      const category = file.category || 'uncategorized';
      tree[category] = (tree[category] || 0) + 1;
    });
    
    console.log('📊 App: Folder tree:', tree);
    return tree;
  }, [files]);

  const currentFiles = useMemo(() => {
    const filtered = files.filter(file => file.category === currentFolder);
    console.log(`📁 App: Files in ${currentFolder}:`, filtered.length);
    return filtered;
  }, [files, currentFolder]);

  // Load Files from Database
  const loadFiles = useCallback(async () => {
    console.log('🔄 App: Loading files from database...');
    setLoading(true);
    setError(null);

    try {
      const loadedFiles = await airtableService.fetchAllFiles();
      console.log('✅ App: Files loaded successfully:', loadedFiles);
      setFiles(loadedFiles);
    } catch (err) {
      console.error('❌ App: Error loading files:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [airtableService]);

  // Initial load
  useEffect(() => {
    console.log('🔄 App: Component mounted, loading files...');
    loadFiles();
  }, [loadFiles]);

  // File Upload Functions
  const startUpload = useCallback((selectedFiles, metadata) => {
    console.log('🔄 App: Starting upload process...', { files: selectedFiles.length, metadata });
    setIsUploading(true);
    setUploads(selectedFiles.map(file => ({ name: file.name, progress: 0 })));
    setShowUploadForm(false);

    const uploadProcess = async () => {
      try {
        const result = await cloudinaryService.uploadMultipleFiles(
          selectedFiles,
          metadata,
          (fileIndex, progress, fileName) => {
            console.log(`📈 App: Upload progress - ${fileName}: ${progress}%`);
            setUploads(prev => prev.map((upload, index) => 
              index === fileIndex ? { ...upload, progress } : upload
            ));
          }
        );

        console.log('🔄 App: Upload to Cloudinary complete, saving to database...', result);

        // Save successful uploads to Airtable
        const savePromises = result.successful.map(async (fileData) => {
          try {
            await airtableService.saveFile(fileData);
            console.log('✅ App: File saved to database:', fileData.title);
          } catch (error) {
            console.error('❌ App: Error saving file to database:', error);
            throw error;
          }
        });

        await Promise.all(savePromises);

        // Show results
        if (result.failed.length > 0) {
          console.warn('⚠️ App: Some uploads failed:', result.failed);
          alert(`Upload complete! ${result.successful.length} files uploaded successfully, ${result.failed.length} failed.`);
        } else {
          console.log('✅ App: All uploads successful!');
          alert(`All ${result.successful.length} files uploaded successfully!`);
        }

        // Reload files and reset states
        await loadFiles();
        setUploads([]);
        setPendingFiles([]);

      } catch (error) {
        console.error('❌ App: Upload process failed:', error);
        alert('Upload failed: ' + error.message);
      } finally {
        setIsUploading(false);
      }
    };

    uploadProcess();
  }, [cloudinaryService, airtableService, loadFiles]);

  // Handle File Selection
  const handleFileSelect = useCallback((selectedFiles) => {
    console.log('🔄 App: Files selected for upload:', selectedFiles.length);
    setPendingFiles(selectedFiles);
    setShowUploadForm(true);
  }, []);

  // Handle Upload Form Submit
  const handleUploadSubmit = useCallback((metadata) => {
    console.log('🔄 App: Upload form submitted with metadata:', metadata);
    if (pendingFiles.length > 0) {
      startUpload(pendingFiles, metadata);
    }
  }, [pendingFiles, startUpload]);

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!isDragOver) {
      console.log('🔄 App: Drag over detected');
      setIsDragOver(true);
    }
  }, [isDragOver]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      console.log('🔄 App: Drag leave detected');
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    console.log('🔄 App: Files dropped');
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [handleFileSelect]);

  // Context Menu Handlers
  const handleFileRightClick = useCallback((e, file) => {
    e.preventDefault();
    console.log('🔄 App: File right-clicked:', file.title);
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type: 'file',
      target: file
    });
  }, []);

  const handleContextAction = useCallback(async (action, target) => {
    console.log('🔄 App: Context action:', { action, target: target?.title || target });

    try {
      switch (action) {
        case 'preview':
          setPreviewFile(target);
          setShowPreview(true);
          break;

        case 'download':
          if (target.url) {
            window.open(target.url, '_blank');
          }
          break;

        case 'rename':
          const newTitle = prompt('Enter new name:', target.title);
          if (newTitle && newTitle !== target.title) {
            await airtableService.updateFile(target.id, { 'Title': newTitle });
            await loadFiles();
          }
          break;

        case 'delete':
          if (confirm(`Are you sure you want to delete "${target.title}"?`)) {
            await airtableService.deleteFile(target.id);
            await loadFiles();
          }
          break;

        default:
          console.log('🔄 App: Unknown action:', action);
      }
    } catch (error) {
      console.error('❌ App: Context action failed:', error);
      alert('Action failed: ' + error.message);
    }
  }, [airtableService, loadFiles]);

  const closeContextMenu = useCallback(() => {
    setContextMenu({ show: false, x: 0, y: 0, type: '', target: null });
  }, []);

  // File Actions
  const handleFileDoubleClick = useCallback((file) => {
    console.log('🔄 App: File double-clicked:', file.title);
    setPreviewFile(file);
    setShowPreview(true);
  }, []);

  // Folder Management
  const handleCreateFolder = useCallback(() => {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      console.log('🔄 App: Creating folder:', folderName);
      // Add folder to current categories if it doesn't exist
      if (!folderTree[folderName.trim()]) {
        setCurrentFolder(folderName.trim());
      }
    }
  }, [folderTree]);

  // Render Loading State
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading files...</p>
        </div>
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <p className="text-red-600 mb-4">Error loading files: {error}</p>
          <button
            onClick={loadFiles}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div 
      className="h-screen flex flex-col bg-gray-50"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📁 File Manager</h1>
            <p className="text-sm text-gray-600">
              {files.length} files • Current: {currentFolder} ({currentFiles.length})
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🔲 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📋 List
              </button>
            </div>

            {/* Upload Button */}
            <UploadButton 
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
            />

            {/* Refresh Button */}
            <button
              onClick={loadFiles}
              disabled={loading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <FolderTree
          folderTree={folderTree}
          currentFolder={currentFolder}
          setCurrentFolder={setCurrentFolder}
          expandedFolders={expandedFolders}
          setExpandedFolders={setExpandedFolders}
          setContextMenu={setContextMenu}
          onCreateFolder={handleCreateFolder}
        />

        {/* File Display Area */}
        <FileGrid
          files={currentFiles}
          viewMode={viewMode}
          onFileRightClick={handleFileRightClick}
          onFileDoubleClick={handleFileDoubleClick}
        />
      </div>

      {/* Upload Progress */}
      <ProgressBar
        uploads={uploads}
        onClose={() => setUploads([])}
      />

      {/* Upload Metadata Form */}
      <UploadMetadataForm
        isOpen={showUploadForm}
        onClose={() => {
          setShowUploadForm(false);
          setPendingFiles([]);
        }}
        onSubmit={handleUploadSubmit}
        initialData={{ category: currentFolder }}
      />

      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={closeContextMenu}
        onAction={handleContextAction}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewFile(null);
        }}
      />

      {/* Drag and Drop Overlay */}
      <DragDropOverlay isDragOver={isDragOver} />
    </div>
  );
}
