// FIXED VERSION - Part 1
// ---------------------------------------------------
// Imports and Initial Setup
// ---------------------------------------------------

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

// ---------------------------------------------------
// Component: App
// ---------------------------------------------------

const App = () => {
  // ---------------------------------------------------
  // FIXED: API Configuration
  // Added safe defaults and improved logging
  // ---------------------------------------------------
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

  // ---------------------------------------------------
  // FIXED: State variables
  // Includes missing states and corrected default values
  // ---------------------------------------------------
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState([]);
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

  // ---------------------------------------------------
  // Refs
  // ---------------------------------------------------
  const fileInputRef = useRef(null);

  // ---------------------------------------------------
  // useEffect: Load files and folders on mount
  // ---------------------------------------------------
  useEffect(() => {
    loadFilesFromAirtable();
    loadFoldersFromAirtable();
  }, []);

  // ---------------------------------------------------
  // FIXED: Function to load files from Airtable
  // Added error handling and improved mapping
  // ---------------------------------------------------
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

  // ---------------------------------------------------
  // FIXED: Function to load folders from Airtable
  // Added logging and safe merging
  // ---------------------------------------------------
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
// ---------------------------------------------------
// Part 2 – Utility Functions, File Uploads, and Fixes
// ---------------------------------------------------

// ---------------------------------------------------
// FIXED: Icon Helper
// ---------------------------------------------------
const getFileIcon = (type) => {
  const iconClass = "w-3 h-3 text-white";
  switch (type) {
    case 'image': return <Image className={iconClass} />;
    case 'video': return <Video className={iconClass} />;
    case 'audio': return <Music className={iconClass} />;
    default: return <FileText className={iconClass} />;
  }
};

// ---------------------------------------------------
// FIXED: Status Color Helper
// ---------------------------------------------------
const getStatusColor = (status) => {
  switch (status) {
    case 'published': return 'bg-green-500';
    case 'approved': return 'bg-blue-500';
    case 'review': return 'bg-yellow-500';
    case 'draft': return 'bg-gray-500';
    default: return 'bg-gray-400';
  }
};

// ---------------------------------------------------
// FIXED: Added updateFileField
// Used in UploadModal to dynamically update state
// ---------------------------------------------------
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

// ---------------------------------------------------
// Cloudinary Upload
// ---------------------------------------------------
const uploadToCloudinary = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      { method: 'POST', body: formData }
    );

    if (response.ok) {
      const result = await response.json();
      return { url: result.secure_url, publicId: result.public_id };
    } else {
      console.error('Failed to upload to Cloudinary');
      return null;
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
};

// ---------------------------------------------------
// Airtable Operations
// ---------------------------------------------------
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

// ---------------------------------------------------
// FIXED: Upload Files
// Handles uploading multiple files and saving metadata
// ---------------------------------------------------
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
// ---------------------------------------------------
// Part 3 – Modals: UploadModal & PreviewModal
// ---------------------------------------------------

// ---------------------------------------------------
// FIXED: Upload Modal Component
// ---------------------------------------------------
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
                      updateFileField(index, 'title', e.target.value.slice(0, 120));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Enter title..."
                    maxLength={120}
                  />
                  <div className="text-xs text-gray-400 mt-1">{(fileData.title || '').length}/120</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={fileData.category || 'Document'}
                    onChange={(e) => {
                      e.persist();
                      updateFileField(index, 'category', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="Document">Document</option>
                    <option value="Video">Video</option>
                    <option value="Audio">Audio</option>
                    <option value="Graphic">Graphic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-gray-400">(max 3000)</span>
                  </label>
                  <textarea
                    value={fileData.description || ''}
                    onChange={(e) => {
                      e.persist();
                      updateFileField(index, 'description', e.target.value.slice(0, 3000));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    rows="3"
                    placeholder="Describe this file..."
                    maxLength={3000}
                  />
                  <div className="text-xs text-gray-400 mt-1">{(fileData.description || '').length}/3000</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted By</label>
                  <input
                    type="text"
                    value={fileData.submittedBy || 'Unknown'}
                    onChange={(e) => {
                      e.persist();
                      updateFileField(index, 'submittedBy', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Your name or team"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {isUploading && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Uploading files...</span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-5">
          <button
            onClick={() => {
              setShowUploadModal(false);
              setUploadingFiles([]);
            }}
            disabled={isUploading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={uploadFiles}
            disabled={isUploading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <span>Upload {uploadingFiles.length} File{uploadingFiles.length > 1 ? 's' : ''}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}, [showUploadModal, uploadingFiles, currentFolder, updateFileField, isUploading, uploadProgress]);

// ---------------------------------------------------
// FIXED: Preview Modal Component
// ---------------------------------------------------
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
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">Status:</span>
                    <span className={`px-1 py-0.5 rounded-full text-white ${getStatusColor(file.status)}`} style={{ fontSize: '10px' }}>
                      {file.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <FileText className="w-2 h-2 mr-1" />
                  Content
                </h4>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-gray-500 text-xs">Description:</span>
                    <p className="text-gray-900 mt-0.5 text-xs leading-tight">{file.description}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Notes:</span>
                    <p className="text-gray-900 mt-0.5 text-xs leading-tight">{file.notes}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {file.tags.map((tag, index) => (
                        <span key={index} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded-full" style={{ fontSize: '9px' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <Users className="w-2 h-2 mr-1" />
                  Team
                </h4>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-gray-500 text-xs">Project:</span>
                    <p className="font-medium text-gray-900 mt-0.5 text-xs">{file.project}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Created By:</span>
                    <p className="font-medium text-gray-900 mt-0.5 text-xs">{file.createdBy}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Submitted By:</span>
                    <p className="font-medium text-gray-900 mt-0.5 text-xs">{file.submittedBy}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// ---------------------------------------------------
// Part 4 – Folder Tree Rendering & File List UI
// ---------------------------------------------------

// ---------------------------------------------------
// Helper: Get files for current folder with search
// ---------------------------------------------------
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

// ---------------------------------------------------
// Folder Tree Renderer
// ---------------------------------------------------
const renderFolderTree = (folderId, level = 0) => {
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return null;

  const isExpanded = expandedFolders.includes(folderId);
  const hasChildren = folder.children.length > 0;
  const isActive = currentFolder?.id === folderId;

  return (
    <div key={folderId}>
      <div 
        className={`flex items-center px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-all ${
          isActive ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-r-2 border-purple-500' : ''
        } ${draggedFiles.size > 0 ? 'border-2 border-dashed border-blue-300 bg-blue-50' : ''}`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => !folder.isEditing && setCurrentFolder(folder)}
        onDrop={(e) => handleFolderDrop(e, folderId)}
        onDragOver={handleFolderDragOver}
        onDragEnter={(e) => e.preventDefault()}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedFolders(prev => 
                isExpanded 
                  ? prev.filter(id => id !== folderId)
                  : [...prev, folderId]
              );
            }}
            className="mr-1 p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-2 h-2 text-gray-500" />
            ) : (
              <ChevronRight className="w-2 h-2 text-gray-500" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-3" />}
        
        {isExpanded ? (
          <FolderOpen className="w-3 h-3 text-blue-500 mr-1.5" />
        ) : (
          <Folder className="w-3 h-3 text-blue-500 mr-1.5" />
        )}
        
        {folder.isEditing ? (
          <input
            type="text"
            defaultValue={folder.name}
            className="flex-1 text-xs bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
            onBlur={(e) => saveFolderName(folderId, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveFolderName(folderId, e.target.value);
              } else if (e.key === 'Escape') {
                cancelFolderEdit(folderId);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className={`text-xs flex-1 ${isActive ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
            onDoubleClick={() => folderId !== 'all' && startFolderEdit(folderId)}
            title="Double-click to rename"
          >
            {folder.name}
          </span>
        )}
        
        <span className="ml-auto text-xs text-gray-400">
          {folderId === 'all' ? files.length : files.filter(f => f.folderId === folderId).length}
        </span>
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {folder.children.map(childId => renderFolderTree(childId, level + 1))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------
// File List Rendering
// ---------------------------------------------------
const FileList = () => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium text-gray-500">Loading files from database...</p>
          <p className="text-xs text-gray-400">Connecting to Airtable & Cloudinary</p>
        </div>
      </div>
    );
  }

  if (currentFolderFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No files found</p>
          <p className="text-xs text-gray-400">Upload files or try adjusting your search</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 grid grid-cols-12 gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
        <div className="col-span-1"></div>
        <div className="col-span-4">Name <span className="text-gray-400 normal-case">(drag to move)</span></div>
        <div className="col-span-2">Modified</div>
        <div className="col-span-1">Type</div>
        <div className="col-span-1">Size</div>
        <div className="col-span-2">Project</div>
        <div className="col-span-1">Actions</div>
      </div>

      <div className="divide-y divide-gray-100">
        {currentFolderFiles.map(file => (
          <div
            key={file.id}
            className={`grid grid-cols-12 gap-1 px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer transition-all ${
              selectedFiles.has(file.id) ? 'bg-blue-50' : ''
            } ${draggedFiles.has(file.id) ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleFileDragStart(e, file.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ file, x: e.clientX, y: e.clientY });
            }}
            title="Drag to move file to another folder"
          >
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedFiles.has(file.id)}
                onChange={() => toggleFileSelection(file.id)}
                className="w-3 h-3 text-purple-600 rounded focus:ring-purple-500"
              />
            </div>

            <div className="col-span-4 flex items-center space-x-1.5">
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                file.type === 'image' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                file.type === 'video' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                file.type === 'audio' ? 'bg-gradient-to-br from-purple-500 to-indigo-500' :
                'bg-gradient-to-br from-blue-500 to-cyan-500'
              }`}>
                {getFileIcon(file.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate text-xs" title={file.name}>
                  {file.name}
                </p>
                <p className="text-gray-500 truncate" title={file.title} style={{ fontSize: '10px' }}>
                  {file.title}
                </p>
              </div>
            </div>

            <div className="col-span-2 flex items-center text-gray-600 text-xs">
              {file.modified}
            </div>

            <div className="col-span-1 flex items-center">
              <span className="px-1 py-0.5 bg-gray-100 text-gray-700 rounded-full" style={{ fontSize: '9px' }}>
                {file.category}
              </span>
            </div>

            <div className="col-span-1 flex items-center text-gray-600 text-xs">
              {file.size}
            </div>

            <div className="col-span-2 flex items-center">
              <span className="truncate text-gray-700 text-xs" title={file.project}>
                {file.project}
              </span>
            </div>

            <div className="col-span-1 flex items-center space-x-0.5">
              <button
                onClick={() => setPreviewModal(file)}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                title="Preview"
              >
                <Eye className="w-3 h-3 text-gray-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setContextMenu({ file, x: e.clientX, y: e.clientY });
                }}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                title="More options"
              >
                <MoreVertical className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
// ---------------------------------------------------
// Part 5 – Context Menu, Drag/Drop, and File Actions
// ---------------------------------------------------

// ---------------------------------------------------
// File Selection Utilities
// ---------------------------------------------------
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

// ---------------------------------------------------
// File Operations: Move, Copy, Delete
// ---------------------------------------------------
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

// ---------------------------------------------------
// Drag and Drop Handlers
// ---------------------------------------------------
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

// ---------------------------------------------------
// Airtable Update/Delete Functions
// ---------------------------------------------------
const updateFileInAirtable = async (fileId, updates) => {
  try {
    const response = await fetch(`${airtableApi.baseUrl}/Files/${fileId}`, {
      method: 'PATCH',
      headers: airtableApi.headers,
      body: JSON.stringify({ fields: updates })
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
// ---------------------------------------------------
// Part 6 – Main Component Layout & Return JSX
// ---------------------------------------------------

return (
  <div className="h-screen bg-gray-50 flex flex-col">
    {/* Header */}
    <div className="bg-white border-b border-gray-200 px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Media Manager
        </h1>

        <div className="flex items-center space-x-1.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-6 pr-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 w-32 text-xs"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded-l-lg transition-colors ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <List className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-r-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Grid className="w-3 h-3" />
            </button>
          </div>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-xs"
          >
            <Upload className="w-3 h-3" />
            <span>Upload</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={(event) => {
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
            }}
          />
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center text-xs text-gray-600">
        <span>Files</span>
        <ChevronRight className="w-2 h-2 mx-1" />
        <span className="font-medium text-gray-900">{currentFolder?.name}</span>
      </div>
    </div>

    {/* Main Layout */}
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar - Folder Tree */}
      <div className="w-40 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-2">
          <button
            onClick={createNewFolder}
            className="w-full flex items-center space-x-1 px-1.5 py-1 text-left hover:bg-gray-50 rounded-lg transition-colors text-xs"
          >
            <Plus className="w-3 h-3 text-purple-600" />
            <span className="font-medium text-gray-900">New Folder</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {renderFolderTree('all')}
        </div>
      </div>

      {/* File List Area */}
      <div 
        className="flex-1 flex flex-col overflow-hidden"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* File Actions Bar */}
        <div className="bg-white border-b border-gray-200 px-3 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={selectAllFiles}
                className="flex items-center space-x-1 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {selectedFiles.size === currentFolderFiles.length && currentFolderFiles.length > 0 ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Square className="w-3 h-3" />
                )}
                <span>All ({currentFolderFiles.length})</span>
              </button>
              
              {selectedFiles.size > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">{selectedFiles.size} selected</span>
                  <div className="w-px h-3 bg-gray-300" />
                  <button
                    onClick={() => copySelectedFiles(currentFolder?.id)}
                    className="flex items-center space-x-0.5 px-1 py-0.5 text-xs text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={() => moveSelectedFiles(currentFolder?.id)}
                    className="flex items-center space-x-0.5 px-1 py-0.5 text-xs text-orange-600 hover:bg-orange-50 rounded"
                  >
                    <Move className="w-3 h-3" />
                    <span>Move</span>
                  </button>
                  <button
                    onClick={deleteSelectedFiles}
                    className="flex items-center space-x-0.5 px-1 py-0.5 text-xs text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500">
              {currentFolderFiles.length} items
            </div>
          </div>
        </div>

        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-300 flex items-center justify-center z-10">
            <div className="text-center">
              <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-700">Drop files here to upload</p>
              <p className="text-xs text-blue-600">to {currentFolder?.name}</p>
            </div>
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          <FileList />
        </div>
      </div>
    </div>

    {/* Modals */}
    {showUploadModal && <UploadModal />}
    {previewModal && <PreviewModal file={previewModal} />}

    {/* Context Menu */}
    {contextMenu && (
      <div
        className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
        style={{ left: contextMenu.x, top: contextMenu.y }}
        onMouseLeave={() => setContextMenu(null)}
      >
        <button
          onClick={() => {
            setPreviewModal(contextMenu.file);
            setContextMenu(null);
          }}
          className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center space-x-2 text-xs"
        >
          <Eye className="w-3 h-3" />
          <span>Open</span>
        </button>
        <button
          onClick={() => {
            if (contextMenu.file.type === 'video' || contextMenu.file.type === 'audio') {
              setPreviewModal(contextMenu.file);
            } else {
              window.open(contextMenu.file.url, '_blank');
            }
            setContextMenu(null);
          }}
          className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center space-x-2 text-xs"
        >
          <Play className="w-3 h-3" />
          <span>Play</span>
        </button>
        <button
          onClick={() => {
            window.open(contextMenu.file.url, '_blank');
            setContextMenu(null);
          }}
          className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center space-x-2 text-xs"
        >
          <Download className="w-3 h-3" />
          <span>Download</span>
        </button>
      </div>
    )}
  </div>
);

}; // <-- end of App component

export default App;
