import React, { useState, useEffect, useCallback, useMemo } from 'react';

const App = () => {
  // State Management
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [contextMenu, setContextMenu] = useState(null);
  const [previewModal, setPreviewModal] = useState(null);
  const [draggedFiles, setDraggedFiles] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));

  // Configuration
  const AIRTABLE_BASE_ID = process.env.REACT_APP_AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.REACT_APP_AIRTABLE_API_KEY;
  const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  // Database Functions - ORIGINAL FIELD NAMES
  const fetchFilesFromAirtable = async () => {
    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
      console.error('Airtable credentials missing');
      return;
    }

    try {
      console.log('Fetching files from Airtable...');
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Media%20Assets`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw Airtable response:', data);
      
      const filesData = data.records.map(record => ({
        id: record.id,
        name: record.fields.Name || 'Untitled',
        url: record.fields.URL || '',
        type: record.fields.Type || '',
        size: record.fields.Size || 0,
        folder: record.fields.Folder || '',
        yearProduced: record.fields.YearProduced || '',
        station: record.fields.Station || '',
        tags: record.fields.Tags || '',
        uploadDate: record.fields.UploadDate || new Date().toISOString()
      }));
      
      console.log('Processed files:', filesData);
      setFiles(filesData);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchFoldersFromAirtable = async () => {
    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
      console.error('Airtable credentials missing');
      return;
    }

    try {
      console.log('Fetching folders from Airtable...');
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Folder%20Structure`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw folders response:', data);
      
      const foldersData = data.records.map(record => ({
        id: record.id,
        name: record.fields.Name || 'Untitled Folder',
        createdDate: record.fields.CreatedDate || new Date().toISOString()
      }));
      
      console.log('Processed folders:', foldersData);
      setFolders(foldersData);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const saveFileToAirtable = async (fileData) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Media%20Assets`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              'Asset Name': fileData.name,
              'Cloudinary Public URL': fileData.url,
              'Asset Type': fileData.type,
              'Size': fileData.size,
              'Category': fileData.folder || '',
              'Title': fileData.title || '',
              'Description': fileData.description || '',
              'Station': fileData.station || '',
              'Submitted by': fileData.submittedBy || '',
              'Notes': fileData.notes || '',
              'Tags': fileData.tags || '',
              'Upload Date': new Date().toISOString(),
              'Other1': fileData.other1 || '',
              'Other2': fileData.other2 || ''
            }
          })
        }
      );
      
      if (!response.ok) throw new Error('Failed to save file');
      
      const data = await response.json();
      return {
        id: data.id,
        name: data.fields['Asset Name'],
        url: data.fields['Cloudinary Public URL'],
        type: data.fields['Asset Type'],
        size: data.fields.Size,
        folder: data.fields.Category || '',
        title: data.fields.Title || '',
        description: data.fields.Description || '',
        station: data.fields.Station || '',
        submittedBy: data.fields['Submitted by'] || '',
        notes: data.fields.Notes || '',
        tags: data.fields.Tags || '',
        dateSubmitted: data.fields['Upload Date'],
        other1: data.fields.Other1 || '',
        other2: data.fields.Other2 || ''
      };
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  };

  const deleteFileFromAirtable = async (fileId) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Media%20Assets/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to delete file');
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  const saveFolderToAirtable = async (folderName) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Folder%20Structure`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              Name: folderName,
              CreatedDate: new Date().toISOString()
            }
          })
        }
      );
      
      if (!response.ok) throw new Error('Failed to save folder');
      
      const data = await response.json();
      return {
        id: data.id,
        name: data.fields.Name,
        createdDate: data.fields.CreatedDate
      };
    } catch (error) {
      console.error('Error saving folder:', error);
      throw error;
    }
  };

  const updateFileFolder = async (fileId, newFolder) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Media%20Assets/${fileId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              'Category': newFolder || ''
            }
          })
        }
      );
      
      if (!response.ok) throw new Error('Failed to update file folder');
      return true;
    } catch (error) {
      console.error('Error updating file folder:', error);
      throw error;
    }
  };

  // Cloudinary Upload
  const uploadToCloudinary = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else {
          reject(new Error('Upload failed'));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });
      
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`);
      xhr.send(formData);
    });
  };

  // File Handling
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const fileObjects = files.map(file => ({
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      folder: currentFolder || '',
      title: '',
      description: '',
      station: '',
      submittedBy: '',
      notes: '',
      tags: '',
      other1: '',
      other2: ''
    }));
    setSelectedFiles(fileObjects);
  };

  const updateFileMetadata = (index, field, value) => {
    setSelectedFiles(prev => 
      prev.map((file, i) => 
        i === index ? { ...file, [field]: value } : file
      )
    );
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const totalFiles = selectedFiles.length;
      let completedFiles = 0;
      
      for (const fileObj of selectedFiles) {
        try {
          const cloudinaryResponse = await uploadToCloudinary(
            fileObj.file,
            (progress) => {
              const overallProgress = ((completedFiles / totalFiles) * 100) + (progress / totalFiles);
              setUploadProgress(Math.round(overallProgress));
            }
          );
          
          const fileData = {
            name: fileObj.name,
            url: cloudinaryResponse.secure_url,
            type: fileObj.type,
            size: fileObj.size,
            folder: fileObj.folder,
            title: fileObj.title,
            description: fileObj.description,
            station: fileObj.station,
            submittedBy: fileObj.submittedBy,
            notes: fileObj.notes,
            tags: fileObj.tags,
            other1: fileObj.other1,
            other2: fileObj.other2
          };
          
          const savedFile = await saveFileToAirtable(fileData);
          setFiles(prev => [...prev, savedFile]);
          
          completedFiles++;
          setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
          
        } catch (error) {
          console.error('Error uploading file:', fileObj.name, error);
        }
      }
      
      setSelectedFiles([]);
      setShowUploadModal(false);
      
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // File Management Functions
  const toggleFileSelection = (fileId) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const deleteSelectedFiles = async () => {
    if (selectedFileIds.length === 0) return;
    
    if (!window.confirm(`Delete ${selectedFileIds.length} file(s)?`)) return;
    
    try {
      for (const fileId of selectedFileIds) {
        await deleteFileFromAirtable(fileId);
        setFiles(prev => prev.filter(file => file.id !== fileId));
      }
      setSelectedFileIds([]);
    } catch (error) {
      console.error('Error deleting files:', error);
      alert('Error deleting files. Please try again.');
    }
  };

  const createNewFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;
    
    try {
      const newFolder = await saveFolderToAirtable(folderName.trim());
      setFolders(prev => [...prev, newFolder]);
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Error creating folder. Please try again.');
    }
  };

  const renameFolder = async (folderId, oldName) => {
    const newName = prompt('Enter new folder name:', oldName);
    if (!newName || !newName.trim() || newName === oldName) return;
    
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Folder%20Structure/${folderId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              Name: newName.trim()
            }
          })
        }
      );
      
      if (!response.ok) throw new Error('Failed to rename folder');
      
      // Update local state
      setFolders(prev => 
        prev.map(folder => 
          folder.id === folderId ? { ...folder, name: newName.trim() } : folder
        )
      );
      
      // Update files that were in the old folder
      setFiles(prev =>
        prev.map(file =>
          file.folder === oldName ? { ...file, folder: newName.trim() } : file
        )
      );
      
    } catch (error) {
      console.error('Error renaming folder:', error);
      alert('Error renaming folder. Please try again.');
    }
  };

  const deleteFolder = async (folderId, folderName) => {
    const filesInFolder = files.filter(file => file.folder === folderName);
    
    if (filesInFolder.length > 0) {
      if (!window.confirm(`Folder "${folderName}" contains ${filesInFolder.length} file(s). Delete anyway? Files will be moved to Root.`)) {
        return;
      }
      
      // Move files to root
      for (const file of filesInFolder) {
        try {
          await updateFileFolder(file.id, '');
        } catch (error) {
          console.error('Error moving file:', error);
        }
      }
      
      // Update local state
      setFiles(prev =>
        prev.map(file =>
          file.folder === folderName ? { ...file, folder: '' } : file
        )
      );
    }
    
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Folder%20Structure/${folderId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to delete folder');
      
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Error deleting folder. Please try again.');
    }
  };

  const handleDragStart = (e, fileIds) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(fileIds));
    setDraggedFiles(fileIds);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    
    try {
      const fileIds = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      for (const fileId of fileIds) {
        await updateFileFolder(fileId, targetFolder);
        setFiles(prev => 
          prev.map(file => 
            file.id === fileId ? { ...file, folder: targetFolder || '' } : file
          )
        );
      }
      
      setDraggedFiles([]);
    } catch (error) {
      console.error('Error moving files:', error);
      alert('Error moving files. Please try again.');
    }
  };

    const getCurrentFolderContents = useCallback(() => {
      const folderFiles = files.filter(file => 
        (currentFolder ? file.folder === currentFolder : !file.folder)
      );
      
      const folderFolders = currentFolder ? [] : folders;
      
      return {
        files: folderFiles,
        folders: folderFolders
      };
    }, [files, folders, currentFolder]);

  const currentFolderContents = getCurrentFolderContents();

  const handleRightClick = (e, file) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file: file
    });
  };

  const handleContextMenuAction = async (action, item) => {
    setContextMenu(null);
    
    if (item.type === 'folder') {
      const folder = item.folder;
      switch (action) {
        case 'rename':
          await renameFolder(folder.id, folder.name);
          break;
        case 'delete':
          if (window.confirm(`Delete folder "${folder.name}"?`)) {
            await deleteFolder(folder.id, folder.name);
          }
          break;
        default:
          break;
      }
    } else {
      // File actions
      const file = item.file;
      switch (action) {
        case 'delete':
          if (window.confirm(`Delete "${file.name}"?`)) {
            try {
              await deleteFileFromAirtable(file.id);
              setFiles(prev => prev.filter(f => f.id !== file.id));
            } catch (error) {
              console.error('Error deleting file:', error);
              alert('Error deleting file. Please try again.');
            }
          }
          break;
        case 'preview':
          setPreviewModal(file);
          break;
        default:
          break;
      }
    }
  };

  // Effects
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      console.log('Loading data...');
      setLoading(true);
      try {
        await Promise.all([
          fetchFilesFromAirtable(),
          fetchFoldersFromAirtable()
        ]);
        console.log('Data loading complete');
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // File Explorer Tree Functions
  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderName)) {
        newSet.delete(folderName);
      } else {
        newSet.add(folderName);
      }
      return newSet;
    });
  };

  const getFolderStructure = () => {
    const structure = { 
      name: 'root', 
      folders: {}, 
      files: files.filter(file => !file.folder || file.folder === '') 
    };
    
    folders.forEach(folder => {
      structure.folders[folder.name] = {
        name: folder.name,
        id: folder.id,
        files: files.filter(file => file.folder === folder.name)
      };
    });
    
    return structure;
  };

  const renderTreeNode = (node, path = '', level = 0) => {
    const isExpanded = expandedFolders.has(path || 'root');
    const indent = level * 20;
    
    return (
      <div key={path || 'root'} style={{ width: '100%' }}>
        {level > 0 && (
          <div
            style={{
              display: 'flex', alignItems: 'center', padding: '8px 4px',
              paddingLeft: `${indent}px`, cursor: 'pointer',
              backgroundColor: currentFolder === node.name ? '#e3f2fd' : 'transparent',
              borderRadius: '4px', margin: '2px 0'
            }}
            onClick={() => {
              setCurrentFolder(node.name);
              toggleFolder(path);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                type: 'folder',
                folder: node
              });
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, node.name)}
          >
            <span style={{ marginRight: '6px', fontSize: '12px' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
            <span style={{ marginRight: '6px' }}>📁</span>
            <span style={{ fontWeight: 'bold', fontSize: '14px', flex: 1 }}>
              {node.name}
            </span>
            <span style={{ fontSize: '11px', color: '#666' }}>
              ({node.files?.length || 0})
            </span>
          </div>
        )}
        
        {level === 0 && (
          <div
            style={{
              display: 'flex', alignItems: 'center', padding: '8px 4px',
              cursor: 'pointer', 
              backgroundColor: !currentFolder ? '#e3f2fd' : 'transparent',
              borderRadius: '4px', margin: '2px 0', fontWeight: 'bold'
            }}
            onClick={() => {
              setCurrentFolder(null);
              toggleFolder('root');
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, '')}
          >
            <span style={{ marginRight: '6px', fontSize: '12px' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
            <span style={{ marginRight: '6px' }}>🏠</span>
            <span style={{ fontSize: '14px', flex: 1 }}>Root Directory</span>
            <span style={{ fontSize: '11px', color: '#666' }}>
              ({node.files?.length || 0})
            </span>
          </div>
        )}

        {isExpanded && (
          <div>
            {Object.values(node.folders || {}).map(folder => 
              renderTreeNode(folder, folder.name, level + 1)
            )}
            
            {(node.files || []).map(file => (
              <div
                key={file.id}
                draggable
                onDragStart={(e) => handleDragStart(e, [file.id])}
                style={{
                  display: 'flex', alignItems: 'center', padding: '4px',
                  paddingLeft: `${indent + 24}px`, cursor: 'pointer',
                  backgroundColor: selectedFileIds.includes(file.id) ? '#e8f5e8' : 'transparent',
                  borderRadius: '4px', margin: '1px 0',
                  opacity: draggedFiles.includes(file.id) ? 0.5 : 1,
                  fontSize: '13px'
                }}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    toggleFileSelection(file.id);
                  } else {
                    setSelectedFileIds([file.id]);
                  }
                }}
                onDoubleClick={() => setPreviewModal(file)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    type: 'file',
                    file: file
                  });
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedFileIds.includes(file.id)}
                  onChange={() => toggleFileSelection(file.id)}
                  style={{ marginRight: '6px', transform: 'scale(0.8)' }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span style={{ marginRight: '6px', fontSize: '11px' }}>
                  {file.type?.startsWith('image/') ? 'IMG' :
                   file.type?.startsWith('video/') ? 'VID' :
                   file.type?.startsWith('audio/') ? 'AUD' : 'FILE'}
                </span>
                <span style={{ flex: 1, fontSize: '12px' }}>{file.name}</span>
                <span style={{ fontSize: '10px', color: '#666' }}>
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const FileExplorerTree = () => {
    const folderStructure = getFolderStructure();
    
    return (
      <div style={{
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '15px',
        backgroundColor: '#fafafa', 
        height: '600px', 
        overflowY: 'auto',
        minWidth: '280px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '15px',
          borderBottom: '1px solid #ddd',
          paddingBottom: '10px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>File Explorer</h3>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {files.length} files, {folders.length} folders
          </span>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            Loading files and folders...
          </div>
        ) : (
          <>
            {renderTreeNode(folderStructure)}
            
            {files.length === 0 && folders.length === 0 && !loading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#666',
                fontSize: '14px'
              }}>
                No files or folders found.
                <br />
                <button
                  onClick={() => setShowUploadModal(true)}
                  style={{
                    marginTop: '10px',
                    padding: '6px 12px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Upload Files
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Modal Components
  const PreviewModal = ({ file }) => {
    if (!file) return null;

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1001
      }}>
        <div style={{
          backgroundColor: 'white', padding: '20px', borderRadius: '12px',
          maxWidth: '90%', maxHeight: '90%', overflow: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>{file.name}</h2>
            <button
              onClick={() => setPreviewModal(null)}
              style={{
                background: 'none', border: 'none', fontSize: '24px',
                cursor: 'pointer', color: '#666'
              }}
            >
              ×
            </button>
          </div>
          
          {file.type?.startsWith('image/') && (
            <img
              src={file.url}
              alt={file.name}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
          
          {file.type?.startsWith('video/') && (
            <video
              src={file.url}
              controls
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
            />
          )}
          
          {file.type?.startsWith('audio/') && (
            <audio
              src={file.url}
              controls
              style={{ width: '100%' }}
            />
          )}
          
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
            <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Type:</strong> {file.type}</p>
            {file.title && <p><strong>Title:</strong> {file.title}</p>}
            {file.description && <p><strong>Description:</strong> {file.description}</p>}
            {file.station && <p><strong>Station:</strong> {file.station}</p>}
            {file.submittedBy && <p><strong>Submitted by:</strong> {file.submittedBy}</p>}
            {file.notes && <p><strong>Notes:</strong> {file.notes}</p>}
            {file.tags && <p><strong>Tags:</strong> {file.tags}</p>}
            {file.other1 && <p><strong>Other1:</strong> {file.other1}</p>}
            {file.other2 && <p><strong>Other2:</strong> {file.other2}</p>}
          </div>
        </div>
      </div>
    );
  };

  const UploadModal = () => {
    if (!showUploadModal) return null;

    const handleCancel = () => {
      setSelectedFiles([]);
      setUploadProgress(0);
      setUploading(false);
      setShowUploadModal(false);
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
    };

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white', padding: '30px', borderRadius: '12px',
          maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Upload Files</h2>
            <button
              onClick={handleCancel}
              disabled={uploading}
              style={{
                background: 'none', border: 'none', fontSize: '24px',
                cursor: uploading ? 'not-allowed' : 'pointer', color: '#666'
              }}
            >
              ×
            </button>
          </div>
          
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ marginBottom: '20px', width: '100%' }}
          />

          {selectedFiles.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Selected Files ({selectedFiles.length}):</h3>
              {selectedFiles.map((file, index) => (
                <div key={index} style={{ 
                  padding: '10px', border: '1px solid #ddd', 
                  borderRadius: '4px', marginBottom: '10px',
                  backgroundColor: uploading ? '#f9f9f9' : 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{file.name}</span>
                    {!uploading && (
                      <button 
                        onClick={() => removeSelectedFile(index)}
                        style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Category:</label>
                    <select
                      value={file.folder || ''}
                      onChange={(e) => updateFileMetadata(index, 'folder', e.target.value)}
                      disabled={uploading}
                      style={{ width: '100%', padding: '5px', marginBottom: '10px' }}
                    >
                      <option value="">Root</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.name}>{folder.name}</option>
                      ))}
                    </select>

                    <label style={{ display: 'block', marginBottom: '5px' }}>Title:</label>
                    <input
                      type="text"
                      placeholder="Title"
                      value={file.title || ''}
                      onChange={(e) => updateFileMetadata(index, 'title', e.target.value)}
                      disabled={uploading}
                      style={{ width: '100%', padding: '5px', marginBottom: '10px' }}
                    />

                    <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
                    <textarea
                      placeholder="Description"
                      value={file.description || ''}
                      onChange={(e) => updateFileMetadata(index, 'description', e.target.value)}
                      disabled={uploading}
                      style={{ width: '100%', padding: '5px', marginBottom: '10px', height: '60px' }}
                    />

                    <label style={{ display: 'block', marginBottom: '5px' }}>Station:</label>
                    <input
                      type="text"
                      placeholder="e.g., KTVU, ABC7"
                      value={file.station || ''}
                      onChange={(e) => updateFileMetadata(index, 'station', e.target.value)}
                      disabled={uploading}
                      style={{ width: '100%', padding: '5px', marginBottom: '10px' }}
                    />

                    <label style={{ display: 'block', marginBottom: '5px' }}>Submitted by:</label>
                    <input
                      type="text"
                      placeholder="Submitted by"
                      value={file.submittedBy || ''}
                      onChange={(e) => updateFileMetadata(index, 'submittedBy', e.target.value)}
                      disabled={uploading}
                      style={{ width: '100%', padding: '5px', marginBottom: '10px' }}
                    />

                    <label style={{ display: 'block', marginBottom: '5px' }}>Notes:</label>
                    <textarea
                      placeholder="Notes"
                      value={file.notes || ''}
                      onChange={(e) => updateFileMetadata(index, 'notes', e.target.value)}
                      disabled={uploading}
                      style={{ width: '100%', padding: '5px', marginBottom: '10px', height: '60px' }}
                    />

                    <label style={{ display: 'block', marginBottom: '5px' }}>Tags:</label>
                    <input
                      type="text"
                      placeholder="news, sports, weather"
                      value={file.tags || ''}
                      onChange={(e) => updateFileMetadata(index, 'tags', e.target.value)}
                      disabled={uploading}
                      style={{ width: '100%', padding: '5px', marginBottom: '10px' }}
                    />

                    <label style={{ display: 'block', marginBottom: '5px' }}>Other1:</label>
                    <input
                      type="text"
                      placeholder="Other1"
                      value={file.other1 || ''}
                      onChange={(e) => updateFileMetadata(index, 'other1', e.target.value)}
                      disabled={uploading}
                      style={{ width: '100%', padding: '5px', marginBottom: '10px' }}
                    />

                    <label style={{ display: 'block', marginBottom: '5px' }}>Other2:</label>
                    <input
                      type="text"
                      placeholder="Other2"
                      value={file.other2 || ''}
                      onChange={(e) => updateFileMetadata(index, 'other2', e.target.value)}
                      disabled={uploading}
                      style={{ width: '100%', padding: '5px' }}
                    />
                  </div>
                </div>
              ))}

              {uploadProgress > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ marginBottom: '5px' }}>Upload Progress: {uploadProgress}%</div>
                  <div style={{ 
                    width: '100%', height: '10px', backgroundColor: '#f0f0f0', 
                    borderRadius: '5px', overflow: 'hidden' 
                  }}>
                    <div style={{ 
                      width: `${uploadProgress}%`, height: '100%', 
                      backgroundColor: '#4CAF50', transition: 'width 0.3s' 
                    }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={handleFileUpload}
                  disabled={uploading}
                  style={{
                    padding: '12px 24px', backgroundColor: uploading ? '#ccc' : '#4CAF50',
                    color: 'white', border: 'none', borderRadius: '6px',
                    cursor: uploading ? 'not-allowed' : 'pointer', flex: 1
                  }}
                >
                  {uploading ? 'Uploading...' : 'Upload Files'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={uploading}
                  style={{
                    padding: '12px 24px', backgroundColor: uploading ? '#ccc' : '#f44336',
                    color: 'white', border: 'none', borderRadius: '6px',
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {uploading ? 'Cannot Cancel' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {selectedFiles.length === 0 && (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              Select files to upload
              <br />
              <button
                onClick={handleCancel}
                style={{
                  marginTop: '10px', padding: '8px 16px', backgroundColor: '#f44336',
                  color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Media File Manager</h1>
      
      {/* Debug Info */}
      {(!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <strong>⚠️ Configuration Issue:</strong>
          <ul style={{ margin: '10px 0' }}>
            {!AIRTABLE_BASE_ID && <li>REACT_APP_AIRTABLE_BASE_ID is missing</li>}
            {!AIRTABLE_API_KEY && <li>REACT_APP_AIRTABLE_API_KEY is missing</li>}
            {!CLOUDINARY_CLOUD_NAME && <li>REACT_APP_CLOUDINARY_CLOUD_NAME is missing</li>}
            {!CLOUDINARY_UPLOAD_PRESET && <li>REACT_APP_CLOUDINARY_UPLOAD_PRESET is missing</li>}
          </ul>
          Please check your environment variables in Heroku.
        </div>
      )}
      
      {/* Toolbar */}
      <div style={{ 
        marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', 
        borderRadius: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer'
          }}
        >
          Upload Files
        </button>
        
        <button
          onClick={createNewFolder}
          style={{
            padding: '10px 20px', backgroundColor: '#2196F3', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer'
          }}
        >
          New Folder
        </button>
        
        {selectedFileIds.length > 0 && (
          <>
            <span style={{ marginLeft: '10px', color: '#666' }}>
              {selectedFileIds.length} file(s) selected
            </span>
            <button
              onClick={deleteSelectedFiles}
              style={{
                padding: '10px 20px', backgroundColor: '#f44336', color: 'white',
                border: 'none', borderRadius: '6px', cursor: 'pointer'
              }}
            >
              Delete Selected
            </button>
          </>
        )}
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>View:</span>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            style={{ padding: '5px' }}
          >
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading files from database...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Connecting to Airtable...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Left Panel - File Explorer Tree */}
          <div style={{ flexShrink: 0 }}>
            <FileExplorerTree />
          </div>

          {/* Right Panel - Content Area */}
          <div style={{ flex: 1 }}>
            {/* Breadcrumb */}
            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <span 
                onClick={() => setCurrentFolder(null)}
                style={{ cursor: 'pointer', color: '#2196F3', textDecoration: 'underline' }}
              >
                Root
              </span>
              {currentFolder && (
                <>
                  <span style={{ margin: '0 5px' }}>/</span>
                  <span style={{ fontWeight: 'bold' }}>{currentFolder}</span>
                </>
              )}
            </div>

            {/* Content Area */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>
                  {currentFolder || 'Root Directory'} ({currentFolderContents.files.length} files)
                </h3>
              </div>

              {/* Files Grid/List */}
              <div style={{ 
                display: viewMode === 'grid' ? 'grid' : 'block',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(250px, 1fr))' : 'none',
                gap: viewMode === 'grid' ? '20px' : '0'
              }}>
                {currentFolderContents.files.map(file => (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={(e) => {
                      const filesToDrag = selectedFileIds.includes(file.id) 
                        ? selectedFileIds 
                        : [file.id];
                      handleDragStart(e, filesToDrag);
                    }}
                    onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    type: 'file',
                    file: file
                  });
                }}
                    onDoubleClick={() => setPreviewModal(file)}
                    style={{
                      border: '1px solid #ddd', borderRadius: '8px', padding: '15px',
                      backgroundColor: selectedFileIds.includes(file.id) ? '#e3f2fd' : '#fff',
                      cursor: 'pointer', position: 'relative',
                      marginBottom: viewMode === 'list' ? '10px' : '0',
                      display: viewMode === 'list' ? 'flex' : 'block',
                      alignItems: viewMode === 'list' ? 'center' : 'normal',
                      gap: viewMode === 'list' ? '15px' : '0',
                      opacity: draggedFiles.includes(file.id) ? 0.5 : 1,
                      transition: 'background-color 0.2s, opacity 0.2s'
                    }}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        toggleFileSelection(file.id);
                      } else {
                        setSelectedFileIds([file.id]);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFileIds.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      style={{ position: 'absolute', top: '10px', left: '10px' }}
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* File Preview */}
                    {viewMode === 'grid' && file.type?.startsWith('image/') && file.url && (
                      <img
                        src={file.url}
                        alt={file.name}
                        style={{ 
                          width: '100%', height: '150px', objectFit: 'cover', 
                          borderRadius: '4px', marginBottom: '10px' 
                        }}
                      />
                    )}

                    {viewMode === 'grid' && file.type?.startsWith('video/') && (
                      <div style={{
                        width: '100%', height: '150px', backgroundColor: '#f0f0f0',
                        borderRadius: '4px', marginBottom: '10px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                        fontWeight: 'bold', color: '#666'
                      }}>
                        VIDEO
                      </div>
                    )}

                    {viewMode === 'grid' && file.type?.startsWith('audio/') && (
                      <div style={{
                        width: '100%', height: '150px', backgroundColor: '#f0f0f0',
                        borderRadius: '4px', marginBottom: '10px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                        fontWeight: 'bold', color: '#666'
                      }}>
                        AUDIO
                      </div>
                    )}

                    {viewMode === 'list' && (
                      <div style={{ flexShrink: 0, width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {file.type?.startsWith('image/') && file.url ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            style={{ 
                              width: '60px', height: '60px', objectFit: 'cover', 
                              borderRadius: '4px' 
                            }}
                          />
                        ) : file.type?.startsWith('video/') ? (
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#666', textAlign: 'center' }}>VIDEO</div>
                        ) : file.type?.startsWith('audio/') ? (
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#666', textAlign: 'center' }}>AUDIO</div>
                        ) : (
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#666', textAlign: 'center' }}>FILE</div>
                        )}
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>{file.name}</h4>
                      {file.title && (
                        <p style={{ margin: '2px 0', fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
                          {file.title}
                        </p>
                      )}
                      {file.description && (
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                          {file.description}
                        </p>
                      )}
                      <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                        {file.size > 0 ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Size unknown'}
                      </p>
                      
                      {file.station && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                          Station: {file.station}
                        </p>
                      )}
                      
                      {file.submittedBy && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                          Submitted by: {file.submittedBy}
                        </p>
                      )}
                      
                      {file.tags && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                          Tags: {file.tags}
                        </p>
                      )}

                      {file.notes && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                          Notes: {file.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {currentFolderContents.files.length === 0 && !loading && (
                <div style={{ 
                  textAlign: 'center', padding: '40px', color: '#666',
                  border: '2px dashed #ddd', borderRadius: '8px' 
                }}>
                  {currentFolder ? `No files in "${currentFolder}" folder` : 'No files uploaded yet'}
                  <br />
                  <button
                    onClick={() => setShowUploadModal(true)}
                    style={{
                      marginTop: '10px', padding: '10px 20px', backgroundColor: '#4CAF50',
                      color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                    }}
                  >
                    Upload Your First File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1002,
            minWidth: '120px'
          }}
        >
          {contextMenu.type === 'folder' ? (
            // Folder context menu
            <>
              <button
                onClick={() => handleContextMenuAction('rename', contextMenu)}
                style={{
                  display: 'block', width: '100%', padding: '10px 15px',
                  border: 'none', background: 'none', textAlign: 'left',
                  cursor: 'pointer', fontSize: '14px'
                }}
              >
                Rename Folder
              </button>
              <button
                onClick={() => handleContextMenuAction('delete', contextMenu)}
                style={{
                  display: 'block', width: '100%', padding: '10px 15px',
                  border: 'none', background: 'none', textAlign: 'left',
                  cursor: 'pointer', fontSize: '14px', color: '#f44336'
                }}
              >
                Delete Folder
              </button>
            </>
          ) : (
            // File context menu
            <>
              <button
                onClick={() => handleContextMenuAction('preview', contextMenu)}
                style={{
                  display: 'block', width: '100%', padding: '10px 15px',
                  border: 'none', background: 'none', textAlign: 'left',
                  cursor: 'pointer', fontSize: '14px'
                }}
              >
                Preview
              </button>
              <button
                onClick={() => handleContextMenuAction('delete', contextMenu)}
                style={{
                  display: 'block', width: '100%', padding: '10px 15px',
                  border: 'none', background: 'none', textAlign: 'left',
                  cursor: 'pointer', fontSize: '14px', color: '#f44336'
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      <UploadModal />
      {previewModal && <PreviewModal file={previewModal} />}
    </div>
  );
};

export default App;
