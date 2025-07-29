import React, { useState, useEffect, useCallback } from 'react';

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

  // Configuration
  const AIRTABLE_BASE_ID = process.env.REACT_APP_AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.REACT_APP_AIRTABLE_API_KEY;
  const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  // Airtable API Functions
  const fetchFilesFromAirtable = async () => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Files`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch files');
      
      const data = await response.json();
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
      
      setFiles(filesData);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchFoldersFromAirtable = async () => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Folders`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch folders');
      
      const data = await response.json();
      const foldersData = data.records.map(record => ({
        id: record.id,
        name: record.fields.Name || 'Untitled Folder',
        createdDate: record.fields.CreatedDate || new Date().toISOString()
      }));
      
      setFolders(foldersData);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };
  const saveFileToAirtable = async (fileData) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Files`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              Name: fileData.name,
              URL: fileData.url,
              Type: fileData.type,
              Size: fileData.size,
              Folder: fileData.folder || '',
              YearProduced: fileData.yearProduced || '',
              Station: fileData.station || '',
              Tags: fileData.tags || '',
              UploadDate: new Date().toISOString()
            }
          })
        }
      );
      
      if (!response.ok) throw new Error('Failed to save file');
      
      const data = await response.json();
      return {
        id: data.id,
        name: data.fields.Name,
        url: data.fields.URL,
        type: data.fields.Type,
        size: data.fields.Size,
        folder: data.fields.Folder || '',
        yearProduced: data.fields.YearProduced || '',
        station: data.fields.Station || '',
        tags: data.fields.Tags || '',
        uploadDate: data.fields.UploadDate
      };
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  };

  const deleteFileFromAirtable = async (fileId) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Files/${fileId}`,
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
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Folders`,
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
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Files/${fileId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              Folder: newFolder || ''
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
      yearProduced: '',
      station: '',
      tags: ''
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
          // Upload to Cloudinary
          const cloudinaryResponse = await uploadToCloudinary(
            fileObj.file,
            (progress) => {
              const overallProgress = ((completedFiles / totalFiles) * 100) + (progress / totalFiles);
              setUploadProgress(Math.round(overallProgress));
            }
          );
          
          // Save to Airtable
          const fileData = {
            name: fileObj.name,
            url: cloudinaryResponse.secure_url,
            type: fileObj.type,
            size: fileObj.size,
            folder: fileObj.folder,
            yearProduced: fileObj.yearProduced,
            station: fileObj.station,
            tags: fileObj.tags
          };
          
          const savedFile = await saveFileToAirtable(fileData);
          setFiles(prev => [...prev, savedFile]);
          
          completedFiles++;
          setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
          
        } catch (error) {
          console.error('Error uploading file:', fileObj.name, error);
        }
      }
      
      // Reset form
      setSelectedFiles([]);
      setShowUploadModal(false);
      
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  // File Management
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

  // Folder Management
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

  // Drag and Drop
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

  // Get current folder contents
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

  // Context Menu
  const handleRightClick = (e, file) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file: file
    });
  };

  const handleContextMenuAction = async (action, file) => {
    setContextMenu(null);
    
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
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchFilesFromAirtable(),
          fetchFoldersFromAirtable()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  // Preview Modal Component
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
            {file.yearProduced && <p><strong>Year Produced:</strong> {file.yearProduced}</p>}
            {file.station && <p><strong>Station:</strong> {file.station}</p>}
            {file.tags && <p><strong>Tags:</strong> {file.tags}</p>}
          </div>
        </div>
      </div>
    );
  };

  // Upload Modal Component
  const UploadModal = () => {
    if (!showUploadModal) return null;

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
          <h2 style={{ marginTop: 0 }}>Upload Files</h2>
          
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            style={{ marginBottom: '20px', width: '100%' }}
          />

          {selectedFiles.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Selected Files ({selectedFiles.length}):</h3>
              {selectedFiles.map((file, index) => (
                <div key={index} style={{ 
                  padding: '10px', border: '1px solid #ddd', 
                  borderRadius: '4px', marginBottom: '10px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{file.name}</span>
                    <button 
                      onClick={() => removeSelectedFile(index)}
                      style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Folder:</label>
                    <select
                      value={file.folder || ''}
                      onChange={(e) => updateFileMetadata(index, 'folder', e.target.value)}
                      style={{ width: '100%', padding: '5px', marginBottom: '10px' }}
                    >
                      <option value="">Root</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.name}>{folder.name}</option>
                      ))}
                    </select>

                    <label style={{ display: 'block', marginBottom: '5px' }}>Year Produced:</label>
                    <input
                      type="number"
                      placeholder="e.g., 2024"
                      value={file.yearProduced || ''}
                      onChange={(e) => updateFileMetadata(index, 'yearProduced', e.target.value)}
                      style={{ width: '100%', padding: '5px', marginBottom: '10px' }}
                    />

                    <label style={{ display: 'block', marginBottom: '5px' }}>Station:</label>
                    <input
                      type="text"
                      placeholder="e.g., KTVU, ABC7"
                      value={file.station || ''}
                      onChange={(e) => updateFileMetadata(index, 'station', e.target.value)}
                      style={{ width: '100%', padding: '5px', marginBottom: '10px' }}
                    />

                    <label style={{ display: 'block', marginBottom: '5px' }}>Tags:</label>
                    <input
                      type="text"
                      placeholder="news, sports, weather (comma separated)"
                      value={file.tags || ''}
                      onChange={(e) => updateFileMetadata(index, 'tags', e.target.value)}
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
                  onClick={() => setShowUploadModal(false)}
                  style={{
                    padding: '12px 24px', backgroundColor: '#f44336',
                    color: 'white', border: 'none', borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Media File Manager</h1>
      
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

      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <span 
          onClick={() => setCurrentFolder(null)}
          style={{ cursor: 'pointer', color: '#2196F3', textDecoration: 'underline' }}
        >
          Home
        </span>
        {currentFolder && (
          <>
            <span style={{ margin: '0 5px' }}>/</span>
            <span style={{ fontWeight: 'bold' }}>{currentFolder}</span>
          </>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading files from database...
        </div>
      ) : (
        <>
          {/* Folders */}
          {currentFolderContents.folders.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3>Folders</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '15px' 
              }}>
                {currentFolderContents.folders.map(folder => (
                  <div
                    key={folder.id}
                    onDoubleClick={() => setCurrentFolder(folder.name)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, folder.name)}
                    style={{
                      padding: '20px', border: '1px solid #ddd', borderRadius: '8px',
                      backgroundColor: '#f9f9f9', cursor: 'pointer', textAlign: 'center',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e9e9e9'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f9f9f9'}
                  >
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📁</div>
                    <div style={{ fontWeight: 'bold' }}>{folder.name}</div>
</div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          <div>
            <h3>Files ({currentFolderContents.files.length})</h3>
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
                  onContextMenu={(e) => handleRightClick(e, file)}
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
                  {viewMode === 'grid' && file.type?.startsWith('image/') && (
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
                      alignItems: 'center', justifyContent: 'center', fontSize: '40px'
                    }}>
                      🎥
                    </div>
                  )}

                  {viewMode === 'grid' && file.type?.startsWith('audio/') && (
                    <div style={{
                      width: '100%', height: '150px', backgroundColor: '#f0f0f0',
                      borderRadius: '4px', marginBottom: '10px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: '40px'
                    }}>
                      🎵
                    </div>
                  )}

                  {viewMode === 'list' && (
                    <div style={{ flexShrink: 0, width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {file.type?.startsWith('image/') ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          style={{ 
                            width: '60px', height: '60px', objectFit: 'cover', 
                            borderRadius: '4px' 
                          }}
                        />
                      ) : file.type?.startsWith('video/') ? (
                        <div style={{ fontSize: '30px' }}>🎥</div>
                      ) : file.type?.startsWith('audio/') ? (
                        <div style={{ fontSize: '30px' }}>🎵</div>
                      ) : (
                        <div style={{ fontSize: '30px' }}>📄</div>
                      )}
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>{file.name}</h4>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {file.yearProduced && (
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                        Year: {file.yearProduced}
                      </p>
                    )}
                    
                    {file.station && (
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                        Station: {file.station}
                      </p>
                    )}
                    
                    {file.tags && (
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                        Tags: {file.tags}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {currentFolderContents.files.length === 0 && (
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
        </>
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
          <button
            onClick={() => handleContextMenuAction('preview', contextMenu.file)}
            style={{
              display: 'block', width: '100%', padding: '10px 15px',
              border: 'none', background: 'none', textAlign: 'left',
              cursor: 'pointer', fontSize: '14px'
            }}
          >
            Preview
          </button>
          <button
            onClick={() => handleContextMenuAction('delete', contextMenu.file)}
            style={{
              display: 'block', width: '100%', padding: '10px 15px',
              border: 'none', background: 'none', textAlign: 'left',
              cursor: 'pointer', fontSize: '14px', color: '#f44336'
            }}
          >
            Delete
          </button>
        </div>
      )}

      {/* Modals */}
      <UploadModal />
      {previewModal && <PreviewModal file={previewModal} />}
    </div>
  );
};

export default App;
  \
