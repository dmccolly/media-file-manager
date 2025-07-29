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
      case 'image': return <Image className={iconClass} />;
      case 'video': return <Video className={iconClass} />;
      case 'audio': return <Music className={iconClass} />;
      default: return <FileText className={iconClass} />;
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

  const PreviewModal = ({ file }) => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex">
          <div className="flex-1 bg-gray-50 flex items-center justify-center p-4">
            {file.type === 'image' ? (
              <img 
                src={file.url} 
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            ) : file.type === 'video' ? (
              <video 
                src={file.url} 
                controls 
                className="max-w-full max-h-full rounded-lg shadow-lg"
              >
                Your browser does not support video playback.
              </video>
            ) : file.type === 'audio' ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-3">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <audio src={file.url} controls className="mb-2">
                  Your browser does not support audio playback.
                </audio>
                <p className="text-gray-600 text-xs">Audio File</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-3">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <button
                  onClick={() => window.open(file.url, '_blank')}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 text-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Document</span>
                </button>
              </div>
            )}
          </div>

          <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-900">File Details</h3>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <File className="w-2 h-2 mr-1" />
                    Basic Info
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-gray-500 text-xs">Name:</span>
                      <p className="font-medium text-gray-900 mt-0.5 text-xs leading-tight">{file.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Title:</span>
                      <p className="font-medium text-gray-900 mt-0.5 text-xs leading-tight">{file.title}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-xs">Type:</span>
                      <span className="font-medium text-xs">{file.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-xs">Size:</span>
                      <span className="font-medium text-xs">{file.size}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <button
                    onClick={() => window.open(file.url, '_blank')}
                    className="w-full px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 text-xs"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const UploadModal = useCallback(() => {
    if (!showUploadModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Upload Files & Add Metadata</h3>
          
          <div className="space-y-4">
            {uploadingFiles.map((fileData, index) => (
              <div key={`${fileData.id}-${index}`} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                    {getFileIcon(fileData.category?.toLowerCase() || 'document')}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{fileData.name}</h4>
                    <p className="text-sm text-gray-500">{(fileData.file.size / 1024 / 1024).toFixed(1)} MB → {currentFolder?.name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-gray-400">(max 120)</span>
                    </label>
                    <input
                      type="text"
                      value={fileData.title || ''}
                      onChange={(e) => {
                        e.persist();
                        updateFileField(index, 'title', e.target.value.
