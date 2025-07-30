import React, { useState, useEffect, useCallback, useMemo } from 'react';

const App = () => {
  // State Management
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['']));

  // Configuration - Replace with your actual values
  const AIRTABLE_BASE_ID = 'appTK2fgCwe039t5J';
  const AIRTABLE_API_KEY = 'your_airtable_api_key_here';
  const CLOUDINARY_CLOUD_NAME = 'your_cloudinary_cloud_name_here';
  const CLOUDINARY_UPLOAD_PRESET = 'your_cloudinary_upload_preset_here';

  // Database Functions
  const fetchFilesFromAirtable = useCallback(async () => {
    try {
      console.log('Fetching files from Airtable...');
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Media%20Assets`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw Airtable response:', data);

      const filesData = data.records.map(record => ({
        id: record.id,
        name: record.fields['Asset Name'] || 'Untitled',
        url: record.fields['Cloudinary Public URL'] || '',
        type: record.fields['Asset Type'] || '',
        size: 0, // Size field not in your current structure
        folder: record.fields.Category || '',
        title: record.fields.Title || '',
        description: record.fields.Description || '',
        station: record.fields.Station || '',
        submittedBy: record.fields['Submitted by'] || '',
        notes: record.fields.Notes || '',
        tags: record.fields.Tags || '',
        dateSubmitted: record.fields['Upload Date'] || new Date().toISOString(),
        other1: record.fields.Other1 || '',
        other2: record.fields.Other2 || ''
      }));

      console.log('Processed files:', filesData);
      setFiles(filesData);
      return filesData;
    } catch (error) {
      console.error('Error fetching files:', error);
      return [];
    }
  }, [AIRTABLE_BASE_ID, AIRTABLE_API_KEY]);

  const fetchFoldersFromAirtable = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Folder%20Structure`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const foldersData = data.records.map(record => ({
        id: record.id,
        name: record.fields.Name || '',
        path: record.fields.Path || '',
        created: record.fields.Created || new Date().toISOString()
      }));

      setFolders(foldersData);
      return foldersData;
    } catch (error) {
      console.error('Error fetching folders:', error);
      return [];
    }
  }, [AIRTABLE_BASE_ID, AIRTABLE_API_KEY]);

  const saveFileToAirtable = useCallback(async (fileData) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Media%20Assets`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              'Asset Name': fileData.name,
              'Cloudinary Public URL': fileData.url,
              'Asset Type': fileData.type,
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        name: data.fields['Asset Name'],
        url: data.fields['Cloudinary Public URL'],
        type: data.fields['Asset Type'],
        size: 0,
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
  }, [AIRTABLE_BASE_ID, AIRTABLE_API_KEY]);

  const saveFolderToAirtable = useCallback(async (folderName, path = '') => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Folder%20Structure`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              'Name': folderName,
              'Path': path || folderName,
              'Created': new Date().toISOString()
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        name: data.fields.Name,
        path: data.fields.Path,
        created: data.fields.Created
      };
    } catch (error) {
      console.error('Error saving folder:', error);
      throw error;
    }
  }, [AIRTABLE_BASE_ID, AIRTABLE_API_KEY]);

  const updateFileFolder = useCallback(async (fileId, newFolder) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Media%20Assets/${fileId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              'Category': newFolder || ''
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating file folder:', error);
      throw error;
    }
  }, [AIRTABLE_BASE_ID, AIRTABLE_API_KEY]);

  const deleteFileFromAirtable = useCallback(async (fileId) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Media%20Assets/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }, [AIRTABLE_BASE_ID, AIRTABLE_API_KEY]);

  const deleteFolderFromAirtable = useCallback(async (folderId) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Folder%20Structure/${folderId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }, [AIRTABLE_BASE_ID, AIRTABLE_API_KEY]);

  const renameFolderInAirtable = useCallback(async (folderId, newName) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Folder%20Structure/${folderId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              'Name': newName,
              'Path': newName
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error renaming folder:', error);
      throw error;
    }
  }, [AIRTABLE_BASE_ID, AIRTABLE_API_KEY]);

  // Folder Management
  const createNewFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;
    
    try {
      const newFolder = await saveFolderToAirtable(folderName.trim());
      setFolders(prev => [...prev, newFolder]);
    } catch (error) {
      alert('Error creating folder: ' + error.message);
    }
  };

  const renameFolder = async (folderId, currentName) => {
    const newName = prompt('Enter new folder name:', currentName);
    if (!newName || !newName.trim() || newName.trim() === currentName) return;

    try {
      await renameFolderInAirtable(folderId, newName.trim());
      
      // Update folders
      setFolders(prev => prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, name: newName.trim(), path: newName.trim() }
          : folder
      ));

      // Update files in this folder
      const filesToUpdate = files.filter(file => file.folder === currentName);
      for (const file of filesToUpdate) {
        await updateFileFolder(file.id, newName.trim());
      }

      // Update local files state
      setFiles(prev => prev.map(file => 
        file.folder === currentName 
          ? { ...file, folder: newName.trim() }
          : file
      ));

      // Update current folder if we're viewing the renamed folder
      if (currentFolder === currentName) {
        setCurrentFolder(newName.trim());
      }
    } catch (error) {
      alert('Error renaming folder: ' + error.message);
    }
  };

  const deleteFolder = async (folderId, folderName) => {
    if (!window.confirm(`Delete folder "${folderName}"? Files will be moved to Root.`)) return;

    try {
      // Move files to root
      const filesToMove = files.filter(file => file.folder === folderName);
      for (const file of filesToMove) {
        await updateFileFolder(file.id, '');
      }

      // Delete folder
      await deleteFolderFromAirtable(folderId);

      // Update local state
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      setFiles(prev => prev.map(file => 
        file.folder === folderName ? { ...file, folder: '' } : file
      ));

      // Go to root if we were viewing this folder
      if (currentFolder === folderName) {
        setCurrentFolder('');
      }
    } catch (error) {
      alert('Error deleting folder: ' + error.message);
    }
  };

  // File Management
  const deleteFile = async (fileId) => {
    if (!window.confirm('Delete this file?')) return;

    try {
      await deleteFileFromAirtable(fileId);
      setFiles(prev => prev.filter(file => file.id !== fileId));
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    } catch (error) {
      alert('Error deleting file: ' + error.message);
    }
  };

  // Context Menu
  const handleContextMenuAction = async (action, item) => {
    setContextMenu(null);
    
    if (item.type === 'folder') {
      const folder = item.folder;
      switch (action) {
        case 'rename':
          await renameFolder(folder.id, folder.name);
          break;
        case 'delete':
          await deleteFolder(folder.id, folder.name);
          break;
      }
    } else if (item.type === 'file') {
      const file = item.file;
      switch (action) {
        case 'preview':
          setPreviewFile(file);
          break;
        case 'delete':
          await deleteFile(file.id);
          break;
      }
    }
  };

  // Upload handling
  const [uploadFiles, setUploadFiles] = useState([]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const fileObjects = selectedFiles.map(file => ({
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
    setUploadFiles(fileObjects);
  };

  const updateFileMetadata = (index, field, value) => {
    setUploadFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, [field]: value } : file
    ));
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return await response.json();
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles = [];

      for (const fileObj of uploadFiles) {
        const cloudinaryResponse = await uploadToCloudinary(fileObj.file);
        
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
        uploadedFiles.push(savedFile);
      }

      setFiles(prev => [...prev, ...uploadedFiles]);
      setUploadFiles([]);
      alert(`${uploadedFiles.length} files uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // File explorer data
  const getCurrentFolderContents = useCallback(() => {
    const folderFiles = files.filter(file => 
      (currentFolder ? file.folder === currentFolder : !file.folder)
    );
    
    const folderFolders = currentFolder ? [] : folders;
    return { files: folderFiles, folders: folderFolders };
  }, [files, folders, currentFolder]);

  const { files: currentFiles, folders: currentFolders } = getCurrentFolderContents();

  // Build folder tree
  const folderTree = useMemo(() => {
    const tree = { name: 'Root', path: '', children: [], files: [] };
    const folderMap = { '': tree };

    // Add folders to tree
    folders.forEach(folder => {
      folderMap[folder.name] = {
        ...folder,
        children: [],
        files: []
      };
      tree.children.push(folderMap[folder.name]);
    });

    // Add files to folders
    files.forEach(file => {
      const targetFolder = folderMap[file.folder || ''];
      if (targetFolder) {
        targetFolder.files.push(file);
      }
    });

    return tree;
  }, [folders, files]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchFilesFromAirtable(),
        fetchFoldersFromAirtable()
      ]);
      setLoading(false);
    };

    if (AIRTABLE_BASE_ID && AIRTABLE_API_KEY) {
      loadData();
    } else {
      console.error('Missing Airtable configuration');
      setLoading(false);
    }
  }, [fetchFilesFromAirtable, fetchFoldersFromAirtable, AIRTABLE_BASE_ID, AIRTABLE_API_KEY]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Render folder tree
  const renderFolderTree = (node, level = 0) => {
    const indent = level * 20;
    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = node.children && node.children.length > 0;
    const fileCount = node.files ? node.files.length : 0;

    return (
      <div key={node.path || 'root'}>
        {level > 0 && (
          <div
            style={{
              display: 'flex', alignItems: 'center', padding: '8px 4px',
              paddingLeft: `${indent}px`, cursor: 'pointer',
              backgroundColor: currentFolder === node.name ? '#e3f2fd' : 'transparent',
              borderRadius: '4px', margin: '2px 0'
            }}
            onClick={() => setCurrentFolder(node.name || '')}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                type: 'folder',
                folder: node
              });
            }}
          >
            {hasChildren && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedFolders(prev => {
                    const newSet = new Set(prev);
                    if (isExpanded) {
                      newSet.delete(node.path);
                    } else {
                      newSet.add(node.path);
                    }
                    return newSet;
                  });
                }}
                style={{ marginRight: '8px', fontSize: '12px' }}
              >
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            <span style={{ marginRight: '8px' }}>📁</span>
            <span style={{ fontSize: '14px' }}>{node.name || 'Root'}</span>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
              ({fileCount})
            </span>
          </div>
        )}
        {hasChildren && (isExpanded || level === 0) && 
          node.children.map(child => renderFolderTree(child, level + 1))
        }
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ 
        width: '300px', 
        borderRight: '1px solid #ddd', 
        padding: '20px',
        backgroundColor: '#f8f9fa',
        overflow: 'auto'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>File Explorer</h3>
          <button 
            onClick={createNewFolder}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + New Folder
          </button>
        </div>
        
        <div>
          {renderFolderTree(folderTree)}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0' }}>
              {currentFolder || 'Root'} 
              <span style={{ fontSize: '16px', color: '#666', marginLeft: '10px' }}>
                ({currentFiles.length} files)
              </span>
            </h2>
            {currentFolder && (
              <button 
                onClick={() => setCurrentFolder('')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ← Back to Root
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              Upload Files
              <input 
                type="file" 
                multiple 
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
            
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {viewMode === 'grid' ? '☰' : '⊞'}
            </button>
          </div>
        </div>

        {/* Upload Form */}
        {uploadFiles.length > 0 && (
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            <h3>Upload Files ({uploadFiles.length})</h3>
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {uploadFiles.map((file, index) => (
                <div key={index} style={{ 
                  backgroundColor: 'white', 
                  padding: '15px', 
                  marginBottom: '10px', 
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{file.name}</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Title:</label>
                      <input
                        type="text"
                        value={file.title}
                        onChange={(e) => updateFileMetadata(index, 'title', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Station:</label>
                      <input
                        type="text"
                        placeholder="e.g., KTVU, ABC7"
                        value={file.station}
                        onChange={(e) => updateFileMetadata(index, 'station', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Submitted By:</label>
                      <input
                        type="text"
                        value={file.submittedBy}
                        onChange={(e) => updateFileMetadata(index, 'submittedBy', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Tags:</label>
                      <input
                        type="text"
                        placeholder="comma, separated, tags"
                        value={file.tags}
                        onChange={(e) => updateFileMetadata(index, 'tags', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Category:</label>
                    <select
                      value={file.folder || ''}
                      onChange={(e) => updateFileMetadata(index, 'folder', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="">Root</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.name}>{folder.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
                    <textarea
                      value={file.description}
                      onChange={(e) => updateFileMetadata(index, 'description', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
                    />
                  </div>
                  
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Notes:</label>
                    <textarea
                      value={file.notes}
                      onChange={(e) => updateFileMetadata(index, 'notes', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: uploading ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {uploading ? 'Uploading...' : 'Upload All Files'}
              </button>
              
              <button
                onClick={() => setUploadFiles([])}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Files Display */}
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'block',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr',
          gap: viewMode === 'grid' ? '15px' : '10px'
        }}>
          {currentFiles.map(file => (
            <div
              key={file.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: viewMode === 'grid' ? '15px' : '10px',
                backgroundColor: selectedFiles.includes(file.id) ? '#e3f2fd' : 'white',
                cursor: 'pointer',
                display: viewMode === 'grid' ? 'block' : 'flex',
                alignItems: viewMode === 'list' ? 'center' : 'stretch',
                gap: viewMode === 'list' ? '15px' : '0'
              }}
              onClick={() => {
                setSelectedFiles(prev => 
                  prev.includes(file.id) 
                    ? prev.filter(id => id !== file.id)
                    : [...prev, file.id]
                );
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
            >
              {viewMode === 'grid' ? (
                <>
                  {file.url && file.type?.startsWith('image/') && (
                    <img 
                      src={file.url} 
                      alt={file.name}
                      style={{ 
                        width: '100%', 
                        height: '120px', 
                        objectFit: 'cover', 
                        borderRadius: '4px',
                        marginBottom: '10px'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>{file.name}</h4>
                    {file.title && (
                      <p style={{ margin: '2px 0', fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
                        {file.title}
                      </p>
                    )}
                    {file.description && (
                      <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>
                        {file.description.substring(0, 100)}...
                      </p>
                    )}
                    {file.station && (
                      <p style={{ margin: '2px 0', fontSize: '12px', color: '#007bff' }}>
                        📺 {file.station}
                      </p>
                    )}
                    {file.tags && (
                      <p style={{ margin: '2px 0', fontSize: '11px', color: '#28a745' }}>
                        🏷️ {file.tags}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {file.url && file.type?.startsWith('image/') && (
                    <img 
                      src={file.url} 
                      alt={file.name}
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        objectFit: 'cover', 
                        borderRadius: '4px'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>{file.name}</h4>
                    {file.title && (
                      <p style={{ margin: '2px 0', fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
                        {file.title}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#666' }}>
                      {file.station && <span>📺 {file.station}</span>}
                      {file.submittedBy && <span>👤 {file.submittedBy}</span>}
                      {file.tags && <span>🏷️ {file.tags}</span>}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {currentFiles.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            fontSize: '16px'
          }}>
            {files.length === 0 
              ? 'No files uploaded yet. Upload some files to get started!'
              : `No files in ${currentFolder || 'Root'} folder.`
            }
          </div>
        )}
      </div>

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
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '150px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'folder' ? (
            <>
              <div
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee'
                }}
                onClick={() => handleContextMenuAction('rename', contextMenu)}
              >
                ✏️ Rename Folder
              </div>
              <div
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  color: '#dc3545'
                }}
                onClick={() => handleContextMenuAction('delete', contextMenu)}
              >
                🗑️ Delete Folder
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee'
                }}
                onClick={() => handleContextMenuAction('preview', contextMenu)}
              >
                👁️ Preview
              </div>
              <div
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  color: '#dc3545'
                }}
                onClick={() => handleContextMenuAction('delete', contextMenu)}
              >
                🗑️ Delete
              </div>
            </>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setPreviewFile(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>{previewFile.name}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                ✕
              </button>
            </div>
            
            {previewFile.url && previewFile.type?.startsWith('image/') && (
              <img 
                src={previewFile.url} 
                alt={previewFile.name}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '400px', 
                  objectFit: 'contain',
                  marginBottom: '15px'
                }}
              />
            )}

            <div style={{ fontSize: '14px', color: '#666' }}>
              {previewFile.title && <p><strong>Title:</strong> {previewFile.title}</p>}
              {previewFile.description && <p><strong>Description:</strong> {previewFile.description}</p>}
              {previewFile.station && <p><strong>Station:</strong> {previewFile.station}</p>}
              {previewFile.submittedBy && <p><strong>Submitted By:</strong> {previewFile.submittedBy}</p>}
              {previewFile.tags && <p><strong>Tags:</strong> {previewFile.tags}</p>}
              {previewFile.notes && <p><strong>Notes:</strong> {previewFile.notes}</p>}
              <p><strong>Type:</strong> {previewFile.type}</p>
              {previewFile.dateSubmitted && (
                <p><strong>Date:</strong> {new Date(previewFile.dateSubmitted).toLocaleDateString()}</p>
              )}
              {previewFile.url && (
                <p>
                  <strong>URL:</strong> 
                  <a href={previewFile.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '10px' }}>
                    Open Original
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
