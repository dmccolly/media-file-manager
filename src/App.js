import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AirtableService } from './AirtableService';
import { getFileIcon, formatFileSize, formatDate, FolderTree, FileGrid, FileDetailsModal, BatchOperationsPanel, ContextMenu, UploadMetadataForm, DragDropOverlay, ProgressBar, UploadButton } from './FileManagerComponents';

export default function App() {
  console.log('🚀 App: Starting Enhanced File Manager...');

  const airtableService = useMemo(() => new AirtableService(), []);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('Images');
  const [viewMode, setViewMode] = useState('grid');
  const [expandedFolders, setExpandedFolders] = useState(['Images', 'Video', 'Audio']);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, type: '', target: null });
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showBatchPanel, setShowBatchPanel] = useState(false);

  const folderTree = useMemo(() => {
    const tree = {};
    files.forEach(file => {
      const category = file.category || 'uncategorized';
      tree[category] = (tree[category] || 0) + 1;
    });
    return tree;
  }, [files]);

  const currentFiles = useMemo(() => files.filter(file => file.category === currentFolder), [files, currentFolder]);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedFiles = await airtableService.fetchAllFiles();
      setFiles(loadedFiles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [airtableService]);

  useEffect(() => { loadFiles(); }, [loadFiles]);
  useEffect(() => { setSelectedFiles([]); setShowBatchPanel(false); }, [currentFolder]);

  const startUpload = useCallback(async (selectedFiles, metadata) => {
    setIsUploading(true);
    setUploads(selectedFiles.map(file => ({ name: file.name, progress: 0 })));
    setShowUploadForm(false);
    try {
      const result = { successful: [], failed: [], total: 0 }; // Placeholder for Cloudinary
      const savePromises = result.successful.map(fileData => airtableService.saveFile(fileData));
      await Promise.all(savePromises);
      if (result.failed.length > 0) alert(`Upload complete! ${result.successful.length} files uploaded successfully, ${result.failed.length} failed.`);
      else alert(`All ${result.successful.length} files uploaded successfully!`);
      await loadFiles();
      setUploads([]);
      setPendingFiles([]);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  }, [airtableService, loadFiles]);

  const handleFileSelect = useCallback(files => { setPendingFiles(files); setShowUploadForm(true); }, []);
  const handleUploadSubmit = useCallback(metadata => { if (pendingFiles.length > 0) startUpload(pendingFiles, metadata); }, [pendingFiles, startUpload]);
  const handleFileSelectToggle = useCallback(file => setSelectedFiles(prev => prev.some(f => f.id === file.id) ? prev.filter(f => f.id !== file.id) : [...prev, file]), []);
  const handleSelectAll = useCallback(() => { setSelectedFiles(currentFiles); setShowBatchPanel(true); }, [currentFiles]);
  const handleClearSelection = useCallback(() => { setSelectedFiles([]); setShowBatchPanel(false); }, []);
  useEffect(() => { setShowBatchPanel(selectedFiles.length > 0); }, [selectedFiles]);
  const handleDragOver = useCallback(e => { e.preventDefault(); if (!isDragOver) setIsDragOver(true); }, [isDragOver]);
  const handleDragLeave = useCallback(e => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false); }, []);
  const handleDrop = useCallback(e => { e.preventDefault(); setIsDragOver(false); const files = Array.from(e.dataTransfer.files); if (files.length > 0) handleFileSelect(files); }, [handleFileSelect]);
  const handleFileClick = useCallback(file => { setSelectedFile(file); setShowFileDetails(true); }, []);
  const handleFileRightClick = useCallback((e, file) => { e.preventDefault(); setContextMenu({ show: true, x: e.clientX, y: e.clientY, type: 'file', target: file }); }, []);
  const handleContextAction = useCallback(async (action, target) => {
    try {
      switch (action) {
        case 'view': setSelectedFile(target); setShowFileDetails(true); break;
        case 'download': if (target.url) window.open(target.url, '_blank'); break;
        case 'rename': { const newTitle = prompt('Enter new name:', target.title); if (newTitle && newTitle !== target.title) { await airtableService.updateFile(target.id, { 'Title': newTitle }); await loadFiles(); } break; }
        case 'move': { const categories = Object.keys(folderTree); const newCategory = prompt('Move to category:\n' + categories.join(', '), target.category); if (newCategory && categories.includes(newCategory) && newCategory !== target.category) { await airtableService.updateFile(target.id, { 'Category': newCategory }); await loadFiles(); } break; }
        case 'delete': if (confirm(`Are you sure you want to delete "${target.title}"?`)) { await airtableService.deleteFile(target.id); await loadFiles(); } break;
        default: console.log('🔄 App: Unknown action:', action);
      }
    } catch (error) { alert('Action failed: ' + error.message); }
  }, [airtableService, loadFiles, folderTree]);
  const closeContextMenu = useCallback(() => setContextMenu({ show: false, x: 0, y: 0, type: '', target: null }), []);
  const handleFileUpdate = useCallback(async (fileId, updates) => { try { await airtableService.updateFile(fileId, updates); await loadFiles(); alert('File updated successfully!'); } catch (error) { alert('Error updating file: ' + error.message); } }, [airtableService, loadFiles]);
  const handleFileDelete = useCallback(async file => { if (confirm(`Are you sure you want to delete "${file.title}"?`)) { try { await airtableService.deleteFile(file.id); await loadFiles(); setShowFileDetails(false); alert('File deleted successfully!'); } catch (error) { alert('Error deleting file: ' + error.message); } } }, [airtableService, loadFiles]);
  const handleBatchUpdate = useCallback(async updates => { try { await airtableService.updateMultipleFiles(updates); await loadFiles(); setSelectedFiles([]); alert(`Successfully updated ${updates.length} files!`); } catch (error) { alert('Error updating files: ' + error.message); } }, [airtableService, loadFiles]);
  const handleBatchDelete = useCallback(async filesToDelete => { if (confirm(`Are you sure you want to delete ${filesToDelete.length} files? This cannot be undone.`)) { try { const recordIds = filesToDelete.map(f => f.id); await airtableService.deleteMultipleFiles(recordIds); await loadFiles(); setSelectedFiles([]); alert(`Successfully deleted ${filesToDelete.length} files!`); } catch (error) { alert('Error deleting files: ' + error.message); } } }, [airtableService, loadFiles]);
  const handleBatchMove = useCallback(async (filesToMove, newCategory) => { try { const updates = filesToMove.map(file => ({ id: file.id, fields: { 'Category': newCategory } })); await airtableService.updateMultipleFiles(updates); await loadFiles(); setSelectedFiles([]); alert(`Successfully moved ${filesToMove.length} files to ${newCategory}!`); } catch (error) { alert('Error moving files: ' + error.message); } }, [airtableService, loadFiles]);
  const handleCreateFolder = useCallback(() => { const folderName = prompt('Enter folder name:'); if (folderName && folderName.trim() && !folderTree[folderName.trim()]) { setCurrentFolder(folderName.trim()); } }, [folderTree]);

  if (loading) { return (<div className="h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div><p className="text-gray-600 text-lg">Loading files...</p></div></div>); }
  if (error) { return (<div className="h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><div className="text-red-500 text-6xl mb-4">❌</div><p className="text-red-600 mb-4 text-lg">Error loading files: {error}</p><button onClick={loadFiles} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Try Again</button></div></div>); }
  return (<div className="h-screen flex flex-col bg-gray-50" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}><header className="bg-white border-b border-gray-200 p-4 shadow-sm"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold text-gray-800">📁 Enhanced File Manager</h1><p className="text-sm text-gray-600 mt-1">{files.length} total files • {currentFiles.length} in {currentFolder}{selectedFiles.length > 0 && ` • ${selectedFiles.length} selected`}</p></div><div className="flex items-center space-x-4"><div className="flex bg-gray-100 rounded-lg p-1"><button onClick={() => setViewMode('grid')} className={`px-3 py-2 rounded text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>🔲 Grid</button><button onClick={() => setViewMode('list')} className={`px-3 py-2 rounded text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>📋 List</button></div><UploadButton onFileSelect={handleFileSelect} isUploading={isUploading} /><button onClick={loadFiles} disabled={loading} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">🔄 Refresh</button></div></div></header><div className="flex-1 flex overflow-hidden"><FolderTree folderTree={folderTree} currentFolder={currentFolder} setCurrentFolder={setCurrentFolder} setContextMenu={setContextMenu} onCreateFolder={handleCreateFolder} /><FileGrid files={currentFiles} viewMode={viewMode} onFileRightClick={handleFileRightClick} onFileClick={handleFileClick} selectedFiles={selectedFiles} onFileSelect={handleFileSelectToggle} onSelectAll={handleSelectAll} onClearSelection={handleClearSelection} /></div><ProgressBar uploads={uploads} onClose={() => setUploads([])} /><BatchOperationsPanel selectedFiles={selectedFiles} onClose={() => setShowBatchPanel(false)} onBatchUpdate={handleBatchUpdate} onBatchDelete={handleBatchDelete} onBatchMove={handleBatchMove} /><UploadMetadataForm isOpen={showUploadForm} onClose={() => { setShowUploadForm(false); setPendingFiles([]); }} onSubmit={handleUploadSubmit} initialData={{ category: currentFolder }} /><ContextMenu contextMenu={contextMenu} onClose={closeContextMenu} onAction={handleContextAction} /><FileDetailsModal file={selectedFile} isOpen={showFileDetails} onClose={() => { setShowFileDetails(false); setSelectedFile(null); }} onUpdate={handleFileUpdate} onDelete={handleFileDelete} /><DragDropOverlay isDragOver={isDragOver} /></div>); }
