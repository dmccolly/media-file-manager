// FileManagerComponents.js - Reusable UI Components
import React, { useState } from 'react';

// Folder Tree Component
export const FolderTree = ({ 
  folderTree, 
  currentFolder, 
  setCurrentFolder, 
  expandedFolders, 
  setExpandedFolders,
  setContextMenu,
  onCreateFolder 
}) => {
  const toggleFolder = (folder) => {
    if (expandedFolders.includes(folder)) {
      setExpandedFolders(expandedFolders.filter(f => f !== folder));
    } else {
      setExpandedFolders([...expandedFolders, folder]);
    }
  };

  const handleFolderClick = (folder) => {
    setCurrentFolder(folder);
  };

  const handleFolderRightClick = (e, folder) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type: 'folder',
      target: folder
    });
  };

  return (
    <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Folders</h3>
        <button
          onClick={onCreateFolder}
          className="text-blue-600 hover:text-blue-800 text-sm"
          title="Create New Folder"
        >
          + New
        </button>
      </div>
      
      <div className="space-y-1">
        {Object.entries(folderTree).map(([folder, count]) => (
          <div key={folder} className="group">
            <div
              className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 ${
                currentFolder === folder ? 'bg-blue-100 text-blue-800' : 'text-gray-700'
              }`}
              onClick={() => handleFolderClick(folder)}
              onContextMenu={(e) => handleFolderRightClick(e, folder)}
            >
              <span className="w-4 h-4 mr-2">📁</span>
              <span className="flex-1 truncate">{folder}</span>
              <span className="text-xs text-gray-500 ml-2">({count})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Upload Button Component
export const UploadButton = ({ onFileSelect, isUploading }) => {
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFileSelect(files);
    }
    e.target.value = ''; // Reset input
  };

  return (
    <div className="relative">
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />
      <button
        className={`px-4 py-2 rounded-lg font-medium ${
          isUploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : '📤 Upload Files'}
      </button>
    </div>
  );
};

// Progress Bar Component
export const ProgressBar = ({ uploads, onClose }) => {
  if (!uploads || uploads.length === 0) return null;

  const overallProgress = uploads.reduce((sum, upload) => sum + upload.progress, 0) / uploads.length;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-64 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-800">Uploading Files</h4>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Overall Progress</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {uploads.map((upload, index) => (
          <div key={index} className="text-sm">
            <div className="flex justify-between text-gray-600 mb-1">
              <span className="truncate">{upload.name}</span>
              <span>{upload.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  upload.progress === 100 ? 'bg-green-500' : 'bg-blue-600'
                }`}
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Context Menu Component
export const ContextMenu = ({ contextMenu, onClose, onAction }) => {
  if (!contextMenu.show) return null;

  const handleAction = (action) => {
    onAction(action, contextMenu.target);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        {contextMenu.type === 'file' && (
          <>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
              onClick={() => handleAction('preview')}
            >
              👁️ Preview
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
              onClick={() => handleAction('download')}
            >
              💾 Download
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
              onClick={() => handleAction('rename')}
            >
              ✏️ Rename
            </button>
            <hr className="my-1" />
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
              onClick={() => handleAction('delete')}
            >
              🗑️ Delete
            </button>
          </>
        )}
        
        {contextMenu.type === 'folder' && (
          <>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
              onClick={() => handleAction('rename')}
            >
              ✏️ Rename Folder
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
              onClick={() => handleAction('delete')}
            >
              🗑️ Delete Folder
            </button>
          </>
        )}
      </div>
    </>
  );
};

// File Grid Component
export const FileGrid = ({ files, viewMode, onFileRightClick, onFileDoubleClick }) => {
  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📁</div>
          <p>No files in this folder</p>
          <p className="text-sm">Drag files here or use the upload button</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Size</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr
                key={file.id}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onContextMenu={(e) => onFileRightClick(e, file)}
                onDoubleClick={() => onFileDoubleClick(file)}
              >
                <td className="px-4 py-2">
                  <div className="flex items-center">
                    <span className="mr-2">
                      {file.type === 'image' && '🖼️'}
                      {file.type === 'video' && '🎥'}
                      {file.type === 'audio' && '🎵'}
                      {file.type === 'document' && '📄'}
                      {!['image', 'video', 'audio', 'document'].includes(file.type) && '📁'}
                    </span>
                    <span className="truncate">{file.title}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 capitalize">{file.type}</td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {file.fileSize ? `${(file.fileSize / 1024 / 1024).toFixed(1)} MB` : '-'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md cursor-pointer transition-shadow"
            onContextMenu={(e) => onFileRightClick(e, file)}
            onDoubleClick={() => onFileDoubleClick(file)}
          >
            <div className="aspect-square mb-2 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
              {file.type === 'image' && file.thumbnail ? (
                <img
                  src={file.thumbnail}
                  alt={file.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="text-2xl">
                  {file.type === 'image' && '🖼️'}
                  {file.type === 'video' && '🎥'}
                  {file.type === 'audio' && '🎵'}
                  {file.type === 'document' && '📄'}
                  {!['image', 'video', 'audio', 'document'].includes(file.type) && '📁'}
                </div>
              )}
            </div>
            <div className="text-sm">
              <p className="font-medium truncate" title={file.title}>
                {file.title}
              </p>
              <p className="text-gray-500 text-xs capitalize">{file.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Upload Metadata Form Component
export const UploadMetadataForm = ({ isOpen, onClose, onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    category: initialData.category || 'Images',
    station: initialData.station || '',
    description: initialData.description || '',
    notes: initialData.notes || '',
    tags: initialData.tags || '',
    ...initialData
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Upload Settings</h3>
