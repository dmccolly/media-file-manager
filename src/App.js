import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen,
  File, 
  Upload, 
  Plus, 
  Search, 
  Grid, 
  List, 
  ChevronRight,
  ChevronDown,
  Image,
  Video,
  FileText,
  Music,
  X,
  ExternalLink,
  Play,
  Eye,
  MoreVertical,
  Copy,
  Move,
  Trash2,
  Download,
  Users,
  Settings,
  Check,
  Square
} from 'lucide-react';

function App() {
  const AIRTABLE_BASE_ID = process.env.REACT_APP_AIRTABLE_BASE_ID || 'your_airtable_base_id';
  const AIRTABLE_API_KEY = process.env.REACT_APP_AIRTABLE_API_KEY || 'your_airtable_api_key';
  const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your_cloudinary_cloud_name';
  const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'your_upload_preset';

  const airtableApi = {
    baseUrl: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  const [folders, setFolders] = useState([
    { id: 'all', name: 'All Content', parent: null, children: ['marketing', 'product', 'design'], isEditing: false },
    { id: 'marketing', name: 'Marketing', parent: 'all', children: ['campaigns', 'assets'], isEditing: false },
    { id: 'campaigns', name: 'Campaigns', parent: 'marketing', children: [], isEditing: false },
    { id: 'assets', name: 'Assets', parent: 'marketing', children: [], isEditing: false },
    { id: 'product', name: 'Product', parent: 'all', children: ['docs', 'specs'], isEditing: false },
    { id: 'docs', name: 'Documentation', parent: 'product', children: [], isEditing: false },
    { id: 'specs', name: 'Specifications', parent: 'product', children: [], isEditing: false },
    { id: 'design', name: 'Design', parent: 'all', children: ['ui', 'graphics'], isEditing: false },
    { id: 'ui', name: 'UI Design', parent: 'design', children: [], isEditing: false },
    { id: 'graphics', name: 'Graphics', parent: 'design', children: [], isEditing: false },
  ]);

  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(folders[0]);
  const [expandedFolders, setExpandedFolders] = useState(['all']);
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [previewModal, setPreviewModal] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedFiles, setDraggedFiles] = useState(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFilesFromAirtable();
    loadFoldersFromAirtable();
  }, []);

  const loadFilesFromAirtable = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${airtableApi.baseUrl}/Files`, {
        headers: airtableApi.headers
      });
      
      if (response.ok) {
        const data = await response.json();
        const loadedFiles = data.records.map(record => ({
          id: record.id,
          name: record.fields.Name || '',
          title: record.fields.Title || '',
          folderId: record.fields.FolderId || 'marketing',
          type: record.fields.Type || 'document',
          size: record.fields.Size || '0 MB',
          modified: record.fields.Modified || new Date().toISOString().split('T')[0],
          createdBy: record.fields.CreatedBy || 'Unknown',
          submittedBy: record.fields.SubmittedBy || 'Unknown',
          status: record.fields.Status || 'draft',
          project: record.fields.Project || '',
          description: record.fields.Description || '',
          notes: record.fields.Notes || '',
          station: record.fields.Station || '',
          yearProduced: record.fields.YearProduced || new Date().getFullYear().toString(),
          tags: record.fields.Tags ? record.fields.Tags.split(',').map(tag => tag.trim()) : [],
          category: record.fields.Category || 'Document',
          url: record.fields.CloudinaryURL || '',
          mimeType: record.fields.MimeType || 'application/octet-stream'
        }));
        setFiles(loadedFiles);
      } else {
        console.error('Failed to load files from Airtable');
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFoldersFromAirtable = async () => {
    try {
      const response = await fetch(`${airtableApi.baseUrl}/Folders`, {
        headers: airtableApi.headers
      });
      
      if (response.ok) {
        const data = await response.json();
        const loadedFolders = data.records.map(record => ({
          id: record.id,
          name: record.fields.Name || '',
          parent: record.fields.Parent || null,
          children: record.fields.Children ? record.fields.Children.split(',') : [],
          isEditing: false
        }));
        
        setFolders(prev => {
          const merged = [...prev];
          loadedFolders.forEach(dbFolder => {
            const existingIndex = merged.findIndex(f => f.id === dbFolder.id);
            if (existingIndex >= 0) {
              merged[existingIndex] = { ...merged[existingIndex], ...dbFolder };
            } else {
              merged.push(dbFolder);
            }
          });
          return merged;
        });
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const saveFileToAirtable = async (fileData) => {
    try {
      const airtableData = {
        fields: {
          Name: fileData.name,
          Title: fileData.title,
          FolderId: fileData.folderId,
          Type: fileData.type,
          Size: fileData.size,
          Modified: fileData.modified,
          CreatedBy: fileData.createdBy,
          SubmittedBy: fileData.submittedBy,
          Status: fileData.status,
          Project: fileData.project,
          Description: fileData.description,
          Notes: fileData.notes,
          Station: fileData.station,
          YearProduced: fileData.yearProduced,
          Tags: fileData.tags.join(','),
          Category: fileData.category,
          CloudinaryURL: fileData.url,
          MimeType: fileData.mimeType
        }
      };

      const response = await fetch(`${airtableApi.baseUrl}/Files`, {
        method: 'POST',
        headers: airtableApi.headers,
        body: JSON.stringify(airtableData)
      });

      if (response.ok) {
        const result = await response.json();
        return result.id;
      } else {
        console.error('Failed to save file to Airtable');
        return null;
      }
    } catch (error) {
      console.error('Error saving file to Airtable:', error);
      return null;
    }
  };

  const updateFileInAirtable = async (fileId, updates) => {
    try {
      const response = await fetch(`${airtableApi.baseUrl}/Files/${fileId}`, {
        method: 'PATCH',
        headers: airtableApi.headers,
        body: JSON.stringify({
          fields: updates
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating file in Airtable:', error);
      return false;
    }
  };

  const deleteFileFromAirtable = async (fileId) => {
    try {
      const response = await fetch(`${airtableApi.baseUrl}/Files/${fileId}`, {
        method: 'DELETE',
        headers: airtableApi.headers
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting file from Airtable:', error);
      return false;
    }
  };

  const uploadToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (response.ok) {
        const result = await response.json();
        return {
          url: result.secure_url,
          publicId: result.public_id
        };
      } else {
        console.error('Failed to upload to Cloudinary');
        return null;
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      return null;
    }
  };

  const createNewFolder = async () => {
    const newFolderId = `folder_${Date.now()}`;
    const newFolder = {
      id: newFolderId,
      name: 'New Folder',
      parent: currentFolder?.id || 'all',
      children: [],
      isEditing: true
    };
    
    setFolders(prev => [...prev, newFolder]);
    
    if (currentFolder) {
      setFolders(prev => prev.map(folder =>
        folder.id === currentFolder.id
          ? { ...folder, children: [...folder.children, newFolderId] }
          : folder
      ));
      setExpandedFolders(prev => [...prev, currentFolder.id]);
    }

    try {
      await fetch(`${airtableApi.baseUrl}/Folders`, {
        method: 'POST',
        headers: airtableApi.headers,
        body: JSON.stringify({
          fields: {
            Name: newFolder.name,
            Parent: newFolder.parent,
            Children: newFolder.children.join(',')
          }
        })
      });
    } catch (error) {
      console.error('Error creating folder in Airtable:', error);
    }
  };

  const startFolderEdit = (folderId) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, isEditing: true } : folder
    ));
  };

  const saveFolderName = async (folderId, newName) => {
    if (newName.trim()) {
      setFolders(prev => prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, name: newName.trim(), isEditing: false }
          : folder
      ));
      
      try {
        await fetch(`${airtableApi.baseUrl}/Folders/${folderId}`, {
          method: 'PATCH',
          headers: airtableApi.headers,
          body: JSON.stringify({
            fields: {
              Name: newName.trim()
            }
          })
        });
        console.log(`Updated folder ${folderId} to name: ${newName}`);
      } catch (error) {
        console.error('Error updating folder in Airtable:', error);
      }
    } else {
      cancelFolderEdit(folderId);
    }
  };

  const cancelFolderEdit = (folderId) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, isEditing: false } : folder
    ));
  };

  const getCurrentFolderFiles = () => {
    if (currentFolder?.id === 'all') {
      return files.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return files.filter(file => 
      file.folderId === currentFolder?.id &&
      (file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  };

  const currentFolderFiles = getCurrentFolderFiles();

  const toggleFileSelection = (fileId) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === currentFolderFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(currentFolderFiles.map(f => f.id)));
    }
  };

  const moveSelectedFiles = async (targetFolderId) => {
    const filesToMove = Array.from(selectedFiles);
    
    setFiles(prev => prev.map(file => 
      selectedFiles.has(file.id) 
        ? { ...file, folderId: targetFolderId }
        : file
    ));
    
    for (const fileId of filesToMove) {
      await updateFileInAirtable(fileId, { FolderId: targetFolderId });
    }
    
    setSelectedFiles(new Set());
  };

  const deleteSelectedFiles = async () => {
    if (window.confirm(`Delete ${selectedFiles.size} selected file(s)?`)) {
      const filesToDelete = Array.from(selectedFiles);
      
      for (const fileId of filesToDelete) {
        await deleteFileFromAirtable(fileId);
      }
      
      setFiles(prev => prev.filter(file => !selectedFiles.has(file.id)));
      setSelectedFiles(new Set());
    }
  };

  const copySelectedFiles = async (targetFolderId) => {
    const filesToCopy = files.filter(file => selectedFiles.has(file.id));
    const copiedFiles = [];
    
    for (const file of filesToCopy) {
      const copiedFile = {
        ...file,
        id: Date.now().toString() + Math.random().toString(36),
        name: `Copy of ${file.name}`,
        title: `Copy of ${file.title}`,
        folderId: targetFolderId,
        modified: new Date().toISOString().split('T')[0]
      };
      
      const airtableId = await saveFileToAirtable(copiedFile);
      if (airtableId) {
        copiedFile.id = airtableId;
        copiedFiles.push(copiedFile);
      }
    }
    
    setFiles(prev => [...prev, ...copiedFiles]);
    setSelectedFiles(new Set());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const fileData = droppedFiles.map(file => ({
        file,
        id: Date.now().toString() + Math.random(),
        name: file.name,
        title: '',
        description: '',
        tags: '',
        category: file.type.startsWith('image/') ? 'Graphic' : 
                 file.type.startsWith('video/') ? 'Video' : 
                 file.type.startsWith('audio/') ? 'Audio' : 'Document',
        project: '',
        notes: '',
        submittedBy: '',
        station: '',
        yearProduced: new Date().getFullYear().toString(),
        status: 'draft'
      }));
      setUploadingFiles(fileData);
      setShowUploadModal(true);
    }
  };

  const handleFileDragStart = (e, fileId) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fileId);
    
    if (selectedFiles.has(fileId)) {
      setDraggedFiles(selectedFiles);
      e.dataTransfer.setData('application/json', JSON.stringify(Array.from(selectedFiles)));
    } else {
      setDraggedFiles(new Set([fileId]));
      e.dataTransfer.setData('application/json', JSON.stringify([fileId]));
    }
  };

  const handleFolderDrop = async (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const draggedFileIds = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (draggedFileIds && draggedFileIds.length > 0) {
        setFiles(prev => prev.map(file => 
          draggedFileIds.includes(file.id) 
            ? { ...file, folderId } 
            : file
        ));
        
        for (const fileId of draggedFileIds) {
          await updateFileInAirtable(fileId, { FolderId: folderId });
        }
        
        setSelectedFiles(new Set());
        console.log(`Moved ${draggedFileIds.length} file(s) to folder: ${folderId}`);
      }
    } catch (error) {
      console.error('Error moving files:', error);
    }
    
    setDraggedFiles(new Set());
  };

  const handleFolderDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const fileData = selectedFiles.map(file => ({
      file,
      id: Date.now().toString() + Math.random(),
      name: file.name,
      title: '',
      description: '',
      tags: '',
      category: file.type.startsWith('image/') ? 'Graphic' : 
               file.type.startsWith('video/') ? 'Video' : 
               file.type.startsWith('audio/') ? 'Audio' : 'Document',
      project: '',
      notes: '',
      submittedBy: '',
      station: '',
      yearProduced: new Date().getFullYear().toString(),
      status: 'draft'
    }));
    setUploadingFiles(fileData);
    setShowUploadModal(true);
  };

  const updateFileField = useCallback((index, field, value) => {
    setUploadingFiles(prevFiles => {
      const newFiles = [...prevFiles];
      if (newFiles[index]) {
        newFiles[index] = {
          ...newFiles[index],
          [field]: value
        };
      }
      return newFiles;
    });
  }, []);

  const uploadFiles = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const totalFiles = uploadingFiles.length;
    let processedFiles = 0;
    
    for (const fileData of uploadingFiles) {
      try {
        const cloudinaryResult = await uploadToCloudinary(fileData.file);
        
        if (cloudinaryResult) {
          const newFile = {
            name: fileData.name,
            title: fileData.title || fileData.name.split('.')[0],
            folderId: currentFolder?.id === 'all' ? 'marketing' : currentFolder?.id,
            type: fileData.file.type.startsWith('image/') ? 'image' : 
                  fileData.file.type.startsWith('video/') ? 'video' : 
                  fileData.file.type.startsWith('audio/') ? 'audio' : 'document',
            size: `${(fileData.file.size / 1024 / 1024).toFixed(1)} MB`,
            url: cloudinaryResult.url,
            modified: new Date().toISOString().split('T')[0],
            createdBy: 'Current User',
            submittedBy: fileData.submittedBy || 'Current User',
            status: fileData.status,
            category: fileData.category,
            project: fileData.project,
            description: fileData.description,
            notes: fileData.notes,
            station: fileData.station,
            yearProduced: fileData.yearProduced,
            tags: fileData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            mimeType: fileData.file.type,
            cloudinaryPublicId: cloudinaryResult.publicId
          };
          
          const airtableId = await saveFileToAirtable(newFile);
          
          if (airtableId) {
            newFile.id = airtableId;
            setFiles(prev => [...prev, newFile]);
          }
        }
        
        processedFiles++;
        const progress = Math.round((processedFiles / totalFiles) * 100);
        setUploadProgress(progress);
        
      } catch (error) {
        console.error('Error uploading file:', error);
        processedFiles++;
      }
    }
    
    setTimeout(() => {
      setIsUploading(false);
      setShowUploadModal(false);
      setUploadingFiles([]);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 500);
  };

  const getFileIcon = (type) => {
    const iconClass = "w-3 h-3 text-white";
    switch (type) {
      case 'image': return React.createElement(Image, { className: iconClass });
      case 'video': return React.createElement(Video, { className: iconClass });
      case 'audio': return React.createElement(Music, { className: iconClass });
      default: return React.createElement(FileText, { className: iconClass });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'approved': return 'bg-blue-500';
      case 'review': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return React.createElement('div', { className: "h-screen bg-gray-50 flex flex-col" },
    React.createElement('div', { className: "bg-white border-b border-gray-200 px-3 py-2" },
      React.createElement('div', { className: "flex items-center justify-between mb-2" },
        React.createElement('h1', { className: "text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent" }, 
          "Media Manager"
        ),
        React.createElement('div', { className: "flex items-center space-x-1.5" },
          React.createElement('button', {
            onClick: handleFileUpload,
            className: "flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-xs"
          },
            React.createElement(Upload, { className: "w-3 h-3" }),
            React.createElement('span', null, "Upload")
          )
        )
      )
    ),
    React.createElement('div', { className: "flex flex-1 overflow-hidden" },
      React.createElement('div', { className: "flex-1 overflow-y-auto p-4" },
        isLoading ? React.createElement('div', { className: "text-center py-8" },
          React.createElement('p', null, "Loading files from database...")
        ) : React.createElement('div', null,
          React.createElement('h2', { className: "text-xl mb-4" }, `Files (${files.length})`),
          files.length === 0 ? React.createElement('p', null, "No files found") :
          React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" },
            files.map(file => React.createElement('div', { 
              key: file.id, 
              className: "border rounded-lg p-4 hover:shadow-md transition-shadow" 
            },
              React.createElement('h3', { className: "font-semibold truncate" }, file.name),
              React.createElement('p', { className: "text-sm text-gray-600" }, file.title),
              React.createElement('p', { className: "text-xs text-gray-500" }, `${file.size} • ${file.category}`)
            ))
          )
        )
      )
    ),
    React.createElement('input', {
      ref: fileInputRef,
      type: "file",
      multiple: true,
      onChange: handleFilesSelected,
      className: "hidden"
    })
  );
}

export default App;
