import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getFirestore, collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

const App = () => {
  // State Management
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFolder, setCurrentFolder] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['']));
  const [showApprovalView, setShowApprovalView] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Firebase Setup
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

  // Firebase initialization and authentication
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firestoreAuth = getAuth(app);
        setDb(firestoreDb);
        setAuth(firestoreAuth);
        onAuthStateChanged(firestoreAuth, async (user) => {
          if (user) {
            setUserId(user.uid);
          } else {
            const anonymousUser = await signInAnonymously(firestoreAuth);
            setUserId(anonymousUser.user.uid);
          }
          setIsAuthReady(true);
        });
        if (typeof __initial_auth_token !== 'undefined') {
          await signInWithCustomToken(firestoreAuth, __initial_auth_token);
        } else {
          await signInAnonymously(firestoreAuth);
        }
      } catch (error) {
        console.error("Error initializing Firebase:", error);
      }
    };
    if (Object.keys(firebaseConfig).length > 0 && !db) {
      initFirebase();
    }
  }, [firebaseConfig]);

  // Firestore data subscription
  useEffect(() => {
    if (!isAuthReady || !db) return;
    const filesPath = `/artifacts/${appId}/public/data/files`;
    const foldersPath = `/artifacts/${appId}/public/data/folders`;
    const unsubscribeFiles = onSnapshot(collection(db, filesPath), (snapshot) => {
      const filesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        approvalStatus: doc.data().approvalStatus || 'Approved'
      }));
      setFiles(filesData);
      setLoading(false);
    });
    const unsubscribeFolders = onSnapshot(collection(db, foldersPath), (snapshot) => {
      const foldersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFolders(foldersData);
      setLoading(false);
    });
    return () => {
      unsubscribeFiles();
      unsubscribeFolders();
    };
  }, [db, isAuthReady, appId]);

  // Configuration - Your actual credentials
  const AIRTABLE_BASE_ID = 'appTK2fgCwe039t5J';
  const AIRTABLE_API_KEY = 'patbQMUOfJRtJ1S5d.be54ccdaf03c795c8deca53ae7c05ddbda8efe584e9a07a613a79fd0f0c04dc9';
  const CLOUDINARY_CLOUD_NAME = 'dzrw8nopf';
  const CLOUDINARY_UPLOAD_PRESET = 'HIBF_MASTER';

  // Database Functions
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
          body: JSON.stringify({ fields: fileData })
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error saving file to Airtable:', error);
      throw error;
    }
  }, [AIRTABLE_BASE_ID, AIRTABLE_API_KEY]);

  const saveFolderToAirtable = useCallback(async (folderData) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Folder%20Structure`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fields: folderData })
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error saving folder to Airtable:', error);
      throw error;
    }
  }, [AIRTABLE_BASE_ID, AIRTABLE_API_KEY]);

  const updateAirtableFile = useCallback(async (fileId, fields) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Media%20Assets/${fileId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fields })
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating Airtable file:', error);
      throw error;
    }
  }, [AIRTABLE_BASE_ID, AIRTABLE_API_KEY]);

  const deleteAirtableFile = useCallback(async (fileId) => {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Media%20Assets/${fileId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return true;
    } catch (error) {
      console.error('Error deleting file from Airtable:', error);
      throw error;
    }
  }, [AIRTABLE_BASE_ID, AIRTABLE_API_KEY]);

  // Folder Management
  const createNewFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;
    try {
      const newFolder = await saveFolderToAirtable({
        'Name': folderName.trim(),
        'Path': folderName.trim(),
        'Created': new Date().toISOString()
      });
      await setDoc(doc(db, `/artifacts/${appId}/public/data/folders/${newFolder.id}`), {
        name: newFolder.fields.Name,
        path: newFolder.fields.Path
      });
    } catch (error) {
      alert('Error creating folder: ' + error.message);
    }
  };

  const renameFolder = async (folderId, currentName) => {
    const newName = prompt('Enter new folder name:', currentName);
    if (!newName || !newName.trim() || newName.trim() === currentName) return;
    try {
      await updateAirtableFile(folderId, {
        'Name': newName.trim(),
        'Path': newName.trim()
      });
      await updateDoc(doc(db, `/artifacts/${appId}/public/data/folders/${folderId}`), {
        name: newName.trim(),
        path: newName.trim()
      });
      const filesToUpdate = files.filter(file => file.folder === currentName);
      for (const file of filesToUpdate) {
        await updateAirtableFile(file.id, { 'Category': newName.trim() });
        await updateDoc(doc(db, `/artifacts/${appId}/public/data/files/${file.id}`), { folder: newName.trim() });
      }
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
      const filesToMove = files.filter(file => file.folder === folderName);
      for (const file of filesToMove) {
        await updateAirtableFile(file.id, { 'Category': '' });
        await updateDoc(doc(db, `/artifacts/${appId}/public/data/files/${file.id}`), { folder: '' });
      }
      await deleteAirtableFile(folderId);
      await deleteDoc(doc(db, `/artifacts/${appId}/public/data/folders/${folderId}`));
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
      await deleteAirtableFile(fileId);
      await deleteDoc(doc(db, `/artifacts/${appId}/public/data/files/${fileId}`));
    } catch (error) {
      alert('Error deleting file: ' + error.message);
    }
  };

  const approveAndMoveFile = async (file) => {
    const targetFolder = prompt('Select target folder (e.g., Images, Documents):');
    if (!targetFolder) return;
    try {
      await updateAirtableFile(file.id, {
        'Approval Status': 'Approved',
        'Category': targetFolder
      });
      await updateDoc(doc(db, `/artifacts/${appId}/public/data/files/${file.id}`), {
        approvalStatus: 'Approved',
        folder: targetFolder
      });
    } catch (error) {
      alert('Error approving and moving file: ' + error.message);
    }
  };

  // Context Menu
  const handleContextMenuAction = async (action, item) => {
    setContextMenu(null);
    if (item.type === 'folder') {
      const folder = item.folder;
      switch (action) {
        case 'rename': await renameFolder(folder.id, folder.name); break;
        case 'delete': await deleteFolder(folder.id, folder.name); break;
        default: break;
      }
    } else if (item.type === 'file') {
      const file = item.file;
      switch (action) {
        case 'preview': setPreviewFile(file); break;
        case 'delete': await deleteFile(file.id); break;
        case 'approveAndMove': await approveAndMoveFile(file); break;
        default: break;
      }
    }
  };

  // Drag and Drop Logic for File Movement
  const handleDragStart = (e, fileId, isFolder = false) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ fileId, isFolder }));
  };

  const handleDrop = async (e, folderName) => {
    e.preventDefault();
    const { fileId, isFolder } = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (isFolder) return;
    try {
      await updateAirtableFile(fileId, { 'Category': folderName });
      await updateDoc(doc(db, `/artifacts/${appId}/public/data/files/${fileId}`), { folder: folderName });
    } catch (error) {
      alert('Error moving file: ' + error.message);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Helper function to get an icon based on asset type
  const getFileIcon = (assetType) => {
    if (assetType === 'Image') return '🖼️';
    if (assetType === 'Video') return '📺';
    if (assetType === 'Audio') return '🎵';
    if (assetType === 'PDF') return '📄';
    if (assetType === 'Document') return '📃';
    if (assetType === 'Spreadsheet') return '📊';
    return '📁';
  };

  // File explorer data
  const getCurrentFolderContents = useCallback(() => {
    let folderFiles = files.filter(file => file.approvalStatus === 'Approved' && (currentFolder ? file.folder === currentFolder : !file.folder));
    if (showApprovalView) {
      folderFiles = files.filter(file => file.approvalStatus === 'Pending Review');
    }
    const folderFolders = currentFolder ? [] : folders;
    return { files: folderFiles, folders: folderFolders };
  }, [files, folders, currentFolder, showApprovalView]);

  const { files: currentFiles, folders: currentFolders } = getCurrentFolderContents();

  // Folder Tree
  const folderTree = useMemo(() => {
    const tree = { name: 'Root', path: '', children: [], files: [] };
    const folderMap = { '': tree };
    folders.forEach(f => {
      folderMap[f.name] = { ...f, children: [], files: [] };
    });
    files.forEach(file => {
      const name = file.folder || '';
      if (name && !folderMap[name]) {
        folderMap[name] = { name, path: name, children: [], files: [] };
      }
    });
    Object.values(folderMap).forEach(node => {
      if (node.path !== '') {
        tree.children.push(node);
      }
    });
    files.forEach(file => {
      const target = folderMap[file.folder || ''];
      if (target) {
        target.files.push(file);
      }
    });
    return tree;
  }, [folders, files]);

  const renderFolderTree = (node, depth = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    return (
      <div key={node.path}>
        <div
          style={{
            paddingLeft: `${depth * 20}px`,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '5px 0'
          }}
          onClick={() => {
            if (node.children.length > 0 || node.files.length > 0) {
              const newExpanded = new Set(expandedFolders);
              if (isExpanded) {
                newExpanded.delete(node.path);
              } else {
                newExpanded.add(node.path);
              }
              setExpandedFolders(newExpanded);
            }
            setCurrentFolder(node.name === 'Root' ? '' : node.name);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (node.name !== 'Root') {
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                type: 'folder',
                folder: node
              });
            }
          }}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, node.name === 'Root' ? '' : node.name)}
        >
          {node.children.length > 0 && (
            <span style={{ marginRight: '5px' }}>{isExpanded ? '▼' : '▶'}</span>
          )}
          📁 {node.name || 'Root'}
        </div>
        {isExpanded && node.children.map(child => renderFolderTree(child, depth + 1))}
      </div>
    );
  };

  // Upload Handling
  const guessCategory = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'Images';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('text')) return 'Documents';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Spreadsheets';
    return 'Other';
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).map(file => ({
      file,
      name: file.name,
      type: guessCategory(file.type),
      size: file.size,
      folder: guessCategory(file.type),
      title: '',
      description: '',
      station: '',
      submittedBy: '',
      tags: '',
      notes: ''
    }));
    setUploadFiles(selectedFiles);
  };

  const updateFileMetadata = (index, field, value) => {
    setUploadFiles(prev => prev.map((file, i) => i === index ? { ...file, [field]: value } : file));
  };

  const handleUpload = async () => {
    setUploading(true);
    setUploadProgress(0);
    const totalFiles = uploadFiles.length;
    let uploadedCount = 0;

    for (const uploadFile of uploadFiles) {
      try {
        const formData = new FormData();
        formData.append('file', uploadFile.file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
          {
            method: 'POST',
            body: formData
          }
        );
        const cloudinaryData = await cloudinaryResponse.json();

        const fileData = {
          'Name': uploadFile.name,
          'URL': cloudinaryData.secure_url,
          'Type': uploadFile.type,
          'Category': uploadFile.folder,
          'Title': uploadFile.title,
          'Description': uploadFile.description,
          'Station': uploadFile.station,
          'Submitted By': uploadFile.submittedBy,
          'Tags': uploadFile.tags,
          'Notes': uploadFile.notes,
          'Date Submitted': new Date().toISOString(),
          'Approval Status': 'Pending Review'
        };

        const airtableRecord = await saveFileToAirtable(fileData);

        await setDoc(doc(db, `/artifacts/${appId}/public/data/files/${airtableRecord.id}`), {
          name: fileData.Name,
          url: fileData.URL,
          type: fileData.Type,
          folder: fileData.Category,
          title: fileData.Title,
          description: fileData.Description,
          station: fileData.Station,
          submittedBy: fileData['Submitted By'],
          tags: fileData.Tags,
          notes: fileData.Notes,
          dateSubmitted: fileData['Date Submitted'],
          approvalStatus: fileData['Approval Status']
        });

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    setUploading(false);
    setUploadFiles([]);
    setUploadProgress(0);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDropUpload = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).map(file => ({
      file,
      name: file.name,
      type: guessCategory(file.type),
      size: file.size,
      folder: guessCategory(file.type),
      title: '',
      description: '',
      station: '',
      submittedBy: '',
      tags: '',
      notes: ''
    }));
    setUploadFiles(droppedFiles);
  };

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
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => setShowApprovalView(!showApprovalView)}
            style={{
              padding: '8px 16px',
              backgroundColor: showApprovalView ? '#28a745' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {showApprovalView ? 'Back to Main View' : 'Pending Approvals'}
          </button>
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
              {showApprovalView ? 'Pending Review' : (currentFolder || 'Root')}
              <span style={{ fontSize: '16px', color: '#666', marginLeft: '10px' }}>
                ({currentFiles.length} files)
              </span>
            </h2>
            {currentFolder && !showApprovalView && (
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
            {/* Drag & Drop Upload Area */}
            <div
              style={{
                position: 'relative',
                display: 'inline-block'
              }}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDropUpload}
            >
              <label style={{
                padding: '8px 16px',
                backgroundColor: isDragging ? '#28a745' : '#007bff',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                border: isDragging ? '2px dashed #fff' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {isDragging ? 'Drop Files Here' : 'Upload Files'}
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
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
            {uploadFiles.length > 1 && (
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                padding: '10px',
                marginBottom: '15px',
                fontSize: '14px',
                color: '#856404'
              }}>
                <strong>Batch Upload:</strong> All files will share the same metadata below.
                Categories have been auto-assigned but can be changed individually.
              </div>
            )}
            {/* Global metadata for all files */}
            <div style={{
              backgroundColor: 'white',
              padding: '15px',
              marginBottom: '15px',
              borderRadius: '4px',
              border: '2px solid #007bff'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#007bff' }}>Shared Metadata (applies to all files)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title:</label>
                  <input
                    type="text"
                    value={uploadFiles[0]?.title || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUploadFiles(prev => prev.map(file => ({ ...file, title: value })));
                    }}
                    placeholder="Title for all files"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Station:</label>
                  <input
                    type="text"
                    placeholder="e.g., KTVU, ABC7"
                    value={uploadFiles[0]?.station || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUploadFiles(prev => prev.map(file => ({ ...file, station: value })));
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Submitted By:</label>
                  <input
                    type="text"
                    value={uploadFiles[0]?.submittedBy || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUploadFiles(prev => prev.map(file => ({ ...file, submittedBy: value })));
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tags:</label>
                  <input
                    type="text"
                    placeholder="comma, separated, tags"
                    value={uploadFiles[0]?.tags || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUploadFiles(prev => prev.map(file => ({ ...file, tags: value })));
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description:</label>
                  <textarea
                    value={uploadFiles[0]?.description || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUploadFiles(prev => prev.map(file => ({ ...file, description: value })));
                    }}
                    placeholder="Description for all files"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes:</label>
                  <textarea
                    value={uploadFiles[0]?.notes || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUploadFiles(prev => prev.map(file => ({ ...file, notes: value })));
                    }}
                    placeholder="Notes for all files"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
                  />
                </div>
              </div>
            </div>
            {/* Individual file list */}
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              <h4>Files to Upload:</h4>
              {uploadFiles.map((file, index) => (
                <div key={index} style={{
                  backgroundColor: 'white',
                  padding: '10px',
                  marginBottom: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{file.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <div style={{ minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Category:</label>
                    <select
                      value={file.folder || ''}
                      onChange={(e) => updateFileMetadata(index, 'folder', e.target.value)}
                      style={{ width: '100%', padding: '4px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                    >
                      <option value="Images">Images</option>
                      <option value="Video">Video</option>
                      <option value="Audio">Audio</option>
                      <option value="PDF">PDF</option>
                      <option value="Documents">Documents</option>
                      <option value="Spreadsheets">Spreadsheets</option>
                      <option value="Other">Other</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.name}>{folder.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            {/* Progress Bar */}
            {uploading && (
              <div style={{ margin: '15px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: '#28a745',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            )}
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
              draggable="true"
              onDragStart={(e) => handleDragStart(e, file.id)}
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
                  {file.url && file.type === 'Image' ? (
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
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '120px',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      backgroundColor: '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px'
                    }}>
                      {getFileIcon(file.type)}
                    </div>
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
                      <div style={{ margin: '2px 0', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {file.tags.split(',').map((tag, index) => (
                          <span key={index} style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px'
                          }}>
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {file.url && file.type === 'Image' ? (
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
                  ) : (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '4px',
                      backgroundColor: '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px'
                    }}>
                      {getFileIcon(file.type)}
                    </div>
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
                      {file.tags && (
                        <span>
                          🏷️ {file.tags.split(',').map(tag => tag.trim()).join(', ')}
                        </span>
                      )}
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
              : `No files in ${showApprovalView ? 'Pending Review' : (currentFolder || 'Root')} folder.`
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
              {contextMenu.file.approvalStatus === 'Pending Review' && (
                <div
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee'
                  }}
                  onClick={() => handleContextMenuAction('approveAndMove', contextMenu)}
                >
                  ✅ Approve and Move
                </div>
              )}
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
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '90%'
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
            {previewFile.url && previewFile.type === 'Image' ? (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  marginBottom: '15px',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            ) : (
              <div style={{
                width: '200px',
                height: '200px',
                margin: '0 auto 15px',
                backgroundColor: '#e9ecef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '100px',
                borderRadius: '8px'
              }}>
                {getFileIcon(previewFile.type)}
              </div>
            )}
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {previewFile.title && <p><strong>Title:</strong> {previewFile.title}</p>}
              {previewFile.description && <p><strong>Description:</strong> {previewFile.description}</p>}
              {previewFile.station && <p><strong>Station:</strong> {previewFile.station}</p>}
              {previewFile.submittedBy && <p><strong>Submitted By:</strong> {previewFile.submittedBy}</p>}
              {previewFile.tags && (
                <p><strong>Tags:</strong> {previewFile.tags.split(',').map(tag => tag.trim()).join(', ')}</p>
              )}
              <p><strong>Type:</strong> {previewFile.type}</p>
              {previewFile.dateSubmitted && (
                <p><strong>Date:</strong> {new Date(previewFile.dateSubmitted).toLocaleDateString()}</p>
              )}
              {previewFile.url && (
                <p>
                  <strong>URL:</strong>
                  <a href={previewFile.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '10px', color: '#007bff' }}>
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
