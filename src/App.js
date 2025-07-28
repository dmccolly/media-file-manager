import React, { useState, useRef } from 'react';
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
  Edit2,
  Download,
  Users,
  Settings,
  Link,
  Check,
  Square
} from 'lucide-react';

const App = () => {
  // Initial folder structure
  const [folders] = useState([
    { id: 'all', name: 'All Content', parent: null, children: ['marketing', 'product', 'design'] },
    { id: 'marketing', name: 'Marketing', parent: 'all', children: ['campaigns', 'assets'] },
    { id: 'campaigns', name: 'Campaigns', parent: 'marketing', children: [] },
    { id: 'assets', name: 'Assets', parent: 'marketing', children: [] },
    { id: 'product', name: 'Product', parent: 'all', children: ['docs', 'specs'] },
    { id: 'docs', name: 'Documentation', parent: 'product', children: [] },
    { id: 'specs', name: 'Specifications', parent: 'product', children: [] },
    { id: 'design', name: 'Design', parent: 'all', children: ['ui', 'graphics'] },
    { id: 'ui', name: 'UI Design', parent: 'design', children: [] },
    { id: 'graphics', name: 'Graphics', parent: 'design', children: [] },
  ]);

  // Sample files distributed across folders
  const [files, setFiles] = useState([
    {
      id: '1',
      name: 'Brand Guidelines.pdf',
      title: 'Complete Brand Identity Guidelines Document',
      folderId: 'marketing',
      type: 'document',
      size: '2.4 MB',
      modified: '2024-01-15',
      createdBy: 'Sarah Chen',
      submittedBy: 'Marketing Team',
      status: 'published',
      project: 'Brand Refresh 2024',
      description: 'Comprehensive brand guidelines including logo usage, color palette, typography, and voice guidelines for all marketing materials.',
      notes: 'Updated with new color variations. All teams should reference this for consistency.',
      tags: ['brand', 'guidelines', 'official'],
      category: 'Document',
      url: '/files/brand-guidelines.pdf',
      mimeType: 'application/pdf'
    },
    {
      id: '2',
      name: 'Product Demo.mp4',
      title: 'Q1 Product Demo Video Presentation',
      folderId: 'product',
      type: 'video',
      size: '45.2 MB',
      modified: '2024-01-20',
      createdBy: 'Mike Johnson',
      submittedBy: 'Product Team',
      status: 'review',
      project: 'Q1 Launch',
      description: 'Complete product demonstration video showcasing new features and improvements for Q1 release.',
      notes: 'Needs final approval from stakeholders before publication.',
      tags: ['demo', 'product', 'q1'],
      category: 'Video',
      url: '/files/demo.mp4',
      mimeType: 'video/mp4'
    },
    {
      id: '3',
      name: 'Hero Banner.jpg',
      title: 'Website Hero Banner Main Design',
      folderId: 'design',
      type: 'image',
      size: '1.8 MB',
      modified: '2024-01-18',
      createdBy: 'Lisa Wang',
      submittedBy: 'Design Team',
      status: 'approved',
      project: 'Website Redesign',
      description: 'Primary hero banner design for homepage featuring new brand elements and call-to-action.',
      notes: 'Approved by stakeholders. Ready for implementation.',
      tags: ['hero', 'banner', 'homepage'],
      category: 'Graphic',
      url: '/files/hero-banner.jpg',
      mimeType: 'image/jpeg'
    }
  ]);

  // State management
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

  const fileInputRef = useRef(null);

  // Get all files for "All Content" or filter by folder
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

  // File selection handlers
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

  // Bulk operations
  const moveSelectedFiles = (targetFolderId) => {
    setFiles(prev => prev.map(file => 
      selectedFiles.has(file.id) 
        ? { ...file, folderId: targetFolderId }
        : file
    ));
    setSelectedFiles(new Set());
  };

  const deleteSelectedFiles = () => {
    if (window.confirm(`Delete ${selectedFiles.size} selected file(s)?`)) {
      setFiles(prev => prev.filter(file => !selectedFiles.has(file.id)));
      setSelectedFiles(new Set());
    }
  };

  const copySelectedFiles = (targetFolderId) => {
    const filesToCopy = files.filter(file => selectedFiles.has(file.id));
    const copiedFiles = filesToCopy.map(file => ({
      ...file,
      id: Date.now().toString() + Math.random().toString(36),
      name: `Copy of ${file.name}`,
      title: `Copy of ${file.title}`,
      folderId: targetFolderId,
      modified: new Date().toISOString().split('T')[0]
    }));
    setFiles(prev => [...prev, ...copiedFiles]);
    setSelectedFiles(new Set());
  };

  // Drag and drop handlers
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
        status: 'draft'
      }));
      setUploadingFiles(fileData);
      setShowUploadModal(true);
    }
  };

  // File drag operations
  const handleFileDragStart = (e, fileId) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fileId);
    setDraggedFiles(new Set([fileId]));
  };

  const handleFolderDrop = (e, folderId) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData('text/plain');
    if (fileId) {
      setFiles(prev => prev.map(file => 
        file.id === fileId ? { ...file, folderId } : file
      ));
    }
    setDraggedFiles(new Set());
  };

  // Upload handlers
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
      status: 'draft'
    }));
    setUploadingFiles(fileData);
    setShowUploadModal(true);
  };

  const updateFileData = (index, field, value) => {
    setUploadingFiles(prev => 
      prev.map((item, i) => i === index ? { ...item, [field]: value } : item)
    );
  };

  const uploadFiles = () => {
    uploadingFiles.forEach(fileData => {
      const newFile = {
        id: fileData.id,
        name: fileData.name,
        title: fileData.title || fileData.name.split('.')[0],
        folderId: currentFolder?.id === 'all' ? 'marketing' : currentFolder?.id, // Fixed: proper folder assignment
        type: fileData.file.type.startsWith('image/') ? 'image' : 
              fileData.file.type.startsWith('video/') ? 'video' : 
              fileData.file.type.startsWith('audio/') ? 'audio' : 'document',
        size: `${(fileData.file.size / 1024 / 1024).toFixed(1)} MB`,
        url: URL.createObjectURL(fileData.file),
        modified: new Date().toISOString().split('T')[0],
        createdBy: 'Current User',
        submittedBy: fileData.submittedBy || 'Current User',
        status: fileData.status,
        category: fileData.category,
        project: fileData.project,
        description: fileData.description,
        notes: fileData.notes,
        tags: fileData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        mimeType: fileData.file.type
      };
      setFiles(prev => [...prev, newFile]);
    });
    
    setShowUploadModal(false);
    setUploadingFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // UI Components
  const getFileIcon = (type) => {
    const iconClass = "w-4 h-4 text-white";
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

  // Enhanced Preview Modal with Database Card
  const PreviewModal = ({ file }) => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex">
          {/* Content Preview Panel */}
          <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
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
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
                  <Music className="w-16 h-16 text-white" />
                </div>
                <audio src={file.url} controls className="mb-4">
                  Your browser does not support audio playback.
                </audio>
                <p className="text-gray-600">Audio File</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-6">
                  <FileText className="w-16 h-16 text-white" />
                </div>
                <button
                  onClick={() => window.open(file.url, '_blank')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Document</span>
                </button>
              </div>
            )}
          </div>

          {/* Database Information Panel */}
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">File Details</h3>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Basic Information */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <File className="w-4 h-4 mr-2" />
                    Basic Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <p className="font-medium text-gray-900 mt-1">{file.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Title:</span>
                      <p className="font-medium text-gray-900 mt-1">{file.title}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">{file.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span className="font-medium">{file.size}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(file.status)}`}>
                        {file.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Details */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Content Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">Description:</span>
                      <p className="text-gray-900 mt-1 text-xs leading-relaxed">{file.description}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Notes:</span>
                      <p className="text-gray-900 mt-1 text-xs leading-relaxed">{file.notes}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {file.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project & Team */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Project & Team
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">Project:</span>
                      <p className="font-medium text-gray-900 mt-1">{file.project}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Created By:</span>
                      <p className="font-medium text-gray-900 mt-1">{file.createdBy}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Submitted By:</span>
                      <p className="font-medium text-gray-900 mt-1">{file.submittedBy}</p>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Technical Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Modified:</span>
                      <span className="font-medium">{file.modified}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">MIME Type:</span>
                      <span className="font-medium text-xs">{file.mimeType}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 space-y-2">
                  <button
                    onClick={() => window.open(file.url, '_blank')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in New Tab</span>
                  </button>
                  <button
                    onClick={() => {/* Add download logic */}}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Upload Modal Component
  const UploadModal = () => {
    if (!showUploadModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 w-4xl max-w-6xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Upload Files & Add Metadata</h3>
          
          <div className="space-y-6">
            {uploadingFiles.map((fileData, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                    {getFileIcon(fileData.category.toLowerCase())}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{fileData.name}</h4>
                    <p className="text-sm text-gray-500">{(fileData.file.size / 1024 / 1024).toFixed(1)} MB • Uploading to: {currentFolder?.name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-gray-400">(10-12 words, max 120 chars)</span>
                    </label>
                    <input
                      type="text"
                      value={fileData.title}
                      onChange={(e) => updateFileData(index, 'title', e.target.value.slice(0, 120))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter a descriptive title..."
                      maxLength={120}
                    />
                    <div className="text-xs text-gray-400 mt-1">{fileData.title.length}/120 characters</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={fileData.category}
                      onChange={(e) => updateFileData(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Document">Document</option>
                      <option value="Video">Video</option>
                      <option value="Audio">Audio</option>
                      <option value="Graphic">Graphic</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-gray-400">(up to 500 words, max 3000 chars)</span>
                    </label>
                    <textarea
                      value={fileData.description}
                      onChange={(e) => updateFileData(index, 'description', e.target.value.slice(0, 3000))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows="3"
                      placeholder="Describe this file..."
                      maxLength={3000}
                    />
                    <div className="text-xs text-gray-400 mt-1">{fileData.description.length}/3000 characters</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                    <input
                      type="text"
                      value={fileData.project}
                      onChange={(e) => updateFileData(index, 'project', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Project name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={fileData.tags}
                      onChange={(e) => updateFileData(index, 'tags', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Submitted By</label>
                    <input
                      type="text"
                      value={fileData.submittedBy}
                      onChange={(e) => updateFileData(index, 'submittedBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Your name or team"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={fileData.status}
                      onChange={(e) => updateFileData(index, 'status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="review">Review</option>
                      <option value="approved">Approved</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes <span className="text-gray-400">(up to 500 words, max 3000 chars)</span>
                    </label>
                    <textarea
                      value={fileData.notes}
                      onChange={(e) => updateFileData(index, 'notes', e.target.value.slice(0, 3000))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows="3"
                      placeholder="Additional notes or comments..."
                      maxLength={3000}
                    />
                    <div className="text-xs text-gray-400 mt-1">{fileData.notes.length}/3000 characters</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowUploadModal(false);
                setUploadingFiles([]);
              }}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={uploadFiles}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
            >
              Upload {uploadingFiles.length} File{uploadingFiles.length > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Folder tree rendering
  const renderFolderTree = (folderId, level = 0) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return null;

    const isExpanded = expandedFolders.includes(folderId);
    const hasChildren = folder.children.length > 0;
    const isActive = currentFolder?.id === folderId;

    return (
      <div key={folderId}>
        <div 
          className={`flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-lg transition-all ${
            isActive ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-r-2 border-purple-500' : ''
          }`}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => setCurrentFolder(folder)}
          onDrop={(e) => handleFolderDrop(e, folderId)}
          onDragOver={(e) => e.preventDefault()}
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
              className="mr-1 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-blue-500 mr-2" />
          ) : (
            <Folder className="w-4 h-4 text-blue-500 mr-2" />
          )}
          
          <span className={`text-sm ${isActive ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
            {folder.name}
          </span>
          
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

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Media File Manager
          </h1>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 w-64"
              />
            </div>
            
            <div className="flex items-center space-x-1 border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-l-lg transition-colors ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-r-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={handleFileUpload}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>
        </div>
        
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600">
          <span>Files</span>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="font-medium text-gray-900">{currentFolder?.name}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4">
            <button
              onClick={() => setCurrentFolder(folders[0])}
              className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-gray-900">New Folder</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {renderFolderTree('all')}
          </div>
        </div>

        {/* Main Content */}
        <div 
          className="flex-1 flex flex-col overflow-hidden"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={selectAllFiles}
                  className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {selectedFiles.size === currentFolderFiles.length && currentFolderFiles.length > 0 ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>Select All ({currentFolderFiles.length})</span>
                </button>
                
                {selectedFiles.size > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {selectedFiles.size} selected
                    </span>
                    <div className="w-px h-4 bg-gray-300" />
                    <button
                      onClick={() => copySelectedFiles(currentFolder?.id)}
                      className="flex items-center space-x-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => moveSelectedFiles(currentFolder?.id)}
                      className="flex items-center space-x-1 px-2 py-1 text-sm text-orange-600 hover:bg-orange-50 rounded"
                    >
                      <Move className="w-3 h-3" />
                      <span>Move</span>
                    </button>
                    <button
                      onClick={deleteSelectedFiles}
                      className="flex items-center space-x-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                {currentFolderFiles.length} items
              </div>
            </div>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto">
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-300 flex items-center justify-center z-10">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-blue-700">Drop files here to upload</p>
                  <p className="text-sm text-blue-600">to {currentFolder?.name}</p>
                </div>
              </div>
            )}

            {/* List Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="col-span-1"></div> {/* Checkbox */}
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Modified</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-1">Size</div>
              <div className="col-span-2">Project</div>
              <div className="col-span-1">Actions</div>
            </div>

            {/* File Rows */}
            <div className="divide-y divide-gray-100">
              {currentFolderFiles.map(file => (
                <div
                  key={file.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-3 text-sm hover:bg-gray-50 cursor-pointer transition-all ${
                    selectedFiles.has(file.id) ? 'bg-blue-50' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleFileDragStart(e, file.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ file, x: e.clientX, y: e.clientY });
                  }}
                >
                  {/* Checkbox */}
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  {/* Name & Icon */}
                  <div className="col-span-4 flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      file.type === 'image' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                      file.type === 'video' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                      file.type === 'audio' ? 'bg-gradient-to-br from-purple-500 to-indigo-500' :
                      'bg-gradient-to-br from-blue-500 to-cyan-500'
                    }`}>
                      {getFileIcon(file.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate" title={file.title}>
                        {file.title}
                      </p>
                    </div>
                  </div>

                  {/* Modified */}
                  <div className="col-span-2 flex items-center text-gray-600">
                    {file.modified}
                  </div>

                  {/* Type */}
                  <div className="col-span-1 flex items-center">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {file.category}
                    </span>
                  </div>

                  {/* Size */}
                  <div className="col-span-1 flex items-center text-gray-600">
                    {file.size}
                  </div>

                  {/* Project */}
                  <div className="col-span-2 flex items-center">
                    <span className="truncate text-gray-700" title={file.project}>
                      {file.project}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center space-x-1">
                    <button
                      onClick={() => setPreviewModal(file)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({ file, x: e.clientX, y: e.clientY });
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {currentFolderFiles.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-500">No files found</p>
                  <p className="text-gray-400">Upload files or try adjusting your search</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() => {
              setPreviewModal(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
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
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Play</span>
          </button>
          <button
            onClick={() => {
              window.open(contextMenu.file.url, '_blank');
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          <hr className="my-1" />
          <button
            onClick={() => {
              copySelectedFiles(currentFolder?.id);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('Delete this file?')) {
                setFiles(prev => prev.filter(f => f.id !== contextMenu.file.id));
              }
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Modals */}
      <UploadModal />
      {previewModal && <PreviewModal file={previewModal} />}
    </div>
  );
};

export default App;
