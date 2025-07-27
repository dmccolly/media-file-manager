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
  Download
} from 'lucide-react';

const mockFolders = [
  { id: '1', name: 'Content Library', parentId: null, path: '/Content Library', createdBy: 'admin', createdAt: '2024-07-20' },
  { id: '2', name: 'Live Streams', parentId: null, path: '/Live Streams', createdBy: 'admin', createdAt: '2024-07-20' },
  { id: '3', name: 'Brand Assets', parentId: null, path: '/Brand Assets', createdBy: 'admin', createdAt: '2024-07-20' },
  { id: '4', name: 'Featured Content', parentId: '1', path: '/Content Library/Featured Content', createdBy: 'creator1', createdAt: '2024-07-21' },
  { id: '5', name: 'Archived Shows', parentId: '2', path: '/Live Streams/Archived Shows', createdBy: 'creator2', createdAt: '2024-07-22' },
];

const mockFiles = [
  { 
    id: 'f1', 
    name: 'hero-banner.jpg', 
    folderId: '1', 
    type: 'graphic', 
    size: '4.2 MB', 
    url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=400&fit=crop',
    modified: '2024-07-25',
    createdBy: 'design-team',
    version: '2.1',
    tags: ['hero', 'homepage', 'featured'],
    title: 'Main Hero Banner for Streaming Platform Homepage',
    description: 'This is the primary hero banner image displayed on the homepage of our streaming platform. It features dynamic content and represents our brand identity.',
    status: 'published',
    project: 'Website Redesign',
    submittedBy: 'John Designer',
    notes: 'Updated to match new brand guidelines. This version includes optimized compression for web delivery.'
  },
  { 
    id: 'f2', 
    name: 'stream-highlights.mp4', 
    folderId: '2', 
    type: 'video', 
    size: '128.4 MB', 
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    modified: '2024-07-24',
    createdBy: 'content-team',
    version: '1.3',
    tags: ['highlights', 'compilation', 'trending'],
    title: 'Best Moments Compilation from Recent Live Streams',
    description: 'A curated compilation of the most engaging and popular moments from our recent live streaming sessions, edited for promotional use.',
    status: 'processing',
    project: 'Q3 Content Strategy',
    submittedBy: 'Sarah Editor',
    notes: 'Currently being processed for different quality outputs. Will be available in 4K, 1080p, and 720p versions.'
  },
  { 
    id: 'f3', 
    name: 'brand-guidelines.pdf', 
    folderId: '3', 
    type: 'document', 
    size: '2.8 MB', 
    url: '#',
    modified: '2024-07-23',
    createdBy: 'brand-team',
    version: '4.0',
    tags: ['brand', 'guidelines', 'design-system'],
    title: 'Complete Brand Guidelines and Design System Documentation',
    description: 'Comprehensive documentation covering our brand identity, including logos, color palettes, typography, voice and tone guidelines, and usage examples.',
    status: 'approved',
    project: 'Brand Update 2024',
    submittedBy: 'Brand Manager',
    notes: 'Latest version includes updated color specifications and new logo variations for digital use.'
  },
  { 
    id: 'f4', 
    name: 'intro-theme.mp3', 
    folderId: null, 
    type: 'audio', 
    size: '12.3 MB', 
    url: '#',
    modified: '2024-07-22',
    createdBy: 'audio-team',
    version: '1.0',
    tags: ['music', 'intro', 'theme'],
    title: 'Signature Intro Theme Music for Live Streams',
    description: 'Original composition created specifically for use as intro music during live streaming sessions. Features upbeat tempo and memorable melody.',
    status: 'published',
    project: 'Audio Branding',
    submittedBy: 'Audio Producer',
    notes: 'Available in multiple formats. This is the master quality version.'
  },
  { 
    id: 'f5', 
    name: 'logo-variations.png', 
    folderId: null, 
    type: 'graphic', 
    size: '1.8 MB', 
    url: 'https://via.placeholder.com/400x300/6366f1/ffffff?text=Logo+Variations',
    modified: '2024-07-21',
    createdBy: 'design-team',
    version: '1.5',
    tags: ['logo', 'brand', 'identity'],
    title: 'Complete Logo Variations Package for All Media',
    description: 'Collection of logo variations including horizontal, vertical, monochrome, and simplified versions for different use cases and media applications.',
    status: 'approved',
    project: 'Brand Update 2024',
    submittedBy: 'Lead Designer',
    notes: 'Includes PNG, SVG, and EPS formats. All variations tested for accessibility and readability.'
  }
];

const FileManager = () => {
  const [folders, setFolders] = useState(mockFolders);
  const [files, setFiles] = useState(mockFiles);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(['root']);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [previewModal, setPreviewModal] = useState(null);
  const [filterTag, setFilterTag] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const fileInputRef = useRef(null);

  // Show ALL files when currentFolder is null
  const currentFolderContents = {
    folders: folders.filter(f => {
      if (currentFolder === null) return f.parentId === null; // Only top-level folders for root
      return f.parentId === currentFolder?.id;
    }).filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())),
    files: files.filter(f => {
      if (currentFolder === null) return true; // Show ALL files when in root
      return f.folderId === currentFolder?.id;
    }).filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterTag === '' || f.tags?.includes(filterTag))
    )
  };

  const allTags = [...new Set(files.flatMap(f => f.tags || []))];

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'graphic': return <Image className="w-4 h-4 text-blue-600" />;
      case 'video': return <Video className="w-4 h-4 text-red-600" />;
      case 'audio': return <Music className="w-4 h-4 text-green-600" />;
      case 'document': return <FileText className="w-4 h-4 text-purple-600" />;
      default: return <File className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeCategory = (fileType) => {
    if (fileType.startsWith('image/')) return 'graphic';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const getFolderTree = (parentId = null, level = 0) => {
    return folders
      .filter(f => f.parentId === parentId)
      .map(folder => ({
        ...folder,
        level,
        children: getFolderTree(folder.id, level + 1)
      }));
  };

  const folderTree = getFolderTree();

  const handleFolderSelect = (folder) => {
    setCurrentFolder(folder);
    setSelectedItems([]);
  };

  const handleItemSelect = (item, type, event) => {
    const itemId = `${type}-${item.id}`;
    
    if (event?.ctrlKey || event?.metaKey || bulkSelectMode) {
      if (selectedItems.includes(itemId)) {
        setSelectedItems(selectedItems.filter(id => id !== itemId));
      } else {
        setSelectedItems([...selectedItems, itemId]);
      }
    } else {
      setSelectedItems([itemId]);
    }
  };

  const handleContextMenu = (event, item, type) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      item,
      type
    });
  };

  const toggleFolderExpansion = (folderId) => {
    if (expandedFolders.includes(folderId)) {
      setExpandedFolders(expandedFolders.filter(id => id !== folderId));
    } else {
      setExpandedFolders([...expandedFolders, folderId]);
    }
  };

  const createFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: Date.now().toString(),
        name: newFolderName.trim(),
        parentId: currentFolder?.id || null,
        path: currentFolder ? `${currentFolder.path}/${newFolderName.trim()}` : `/${newFolderName.trim()}`,
        createdBy: 'current-user',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setFolders([...folders, newFolder]);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
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
      category: getTypeCategory(file.type),
      project: '',
      submittedBy: '',
      notes: '',
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
        folderId: currentFolder?.id || null,
        type: fileData.category,
        size: `${(fileData.file.size / 1024 / 1024).toFixed(1)} MB`,
        url: URL.createObjectURL(fileData.file),
        modified: new Date().toISOString().split('T')[0],
        createdBy: 'current-user',
        version: '1.0',
        tags: fileData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        title: fileData.title,
        description: fileData.description,
        status: fileData.status,
        project: fileData.project,
        submittedBy: fileData.submittedBy,
        notes: fileData.notes,
        uploadedAt: new Date().toISOString(),
        originalName: fileData.file.name,
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

  const previewFile = (file) => {
    setPreviewModal(file);
  };

  const playFile = (file) => {
    if (file.type === 'video' || file.type === 'audio') {
      setPreviewModal(file);
    } else {
      window.open(file.url, '_blank');
    }
  };

  const downloadFile = (file) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const fileData = droppedFiles.map(file => ({
      file,
      id: Date.now().toString() + Math.random(),
      name: file.name,
      title: '',
      description: '',
      tags: '',
      category: getTypeCategory(file.type),
      project: '',
      submittedBy: '',
      notes: '',
      status: 'draft'
    }));
    setUploadingFiles(fileData);
    setShowUploadModal(true);
  };

  const selectAll = () => {
    const allItems = [
      ...currentFolderContents.folders.map(f => `folder-${f.id}`),
      ...currentFolderContents.files.map(f => `file-${f.id}`)
    ];
    setSelectedItems(allItems);
  };

  const FolderTreeItem = ({ folder }) => {
    const isExpanded = expandedFolders.includes(folder.id);
    const hasChildren = folder.children.length > 0;
    const isSelected = currentFolder?.id === folder.id;
    
    return (
      <div key={folder.id}>
        <div 
          className={`flex items-center px-2 py-1 hover:bg-blue-50 cursor-pointer text-sm ${
            isSelected ? 'bg-blue-100 text-blue-800' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${folder.level * 16 + 8}px` }}
          onClick={() => handleFolderSelect(folder)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderExpansion(folder.id);
              }}
              className="mr-1 p-0.5"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          {isExpanded ? <FolderOpen className="w-4 h-4 mr-2 text-blue-600" /> : <Folder className="w-4 h-4 mr-2 text-blue-600" />}
          <span className="truncate">{folder.name}</span>
        </div>
        {isExpanded && folder.children.map(child => <FolderTreeItem key={child.id} folder={child} />)}
      </div>
    );
  };

  const ContextMenu = ({ menu }) => {
    const { item, type } = menu;
    
    const menuItems = [
      {
        label: 'Open',
        icon: type === 'file' && (item.type === 'video' || item.type === 'audio') ? <Play className="w-4 h-4" /> : <Eye className="w-4 h-4" />,
        action: () => type === 'file' ? playFile(item) : handleFolderSelect(item)
      },
      { label: 'Download', icon: <Download className="w-4 h-4" />, action: () => downloadFile(item), show: type === 'file' },
      { label: 'Copy', icon: <Copy className="w-4 h-4" />, action: () => {} },
      { label: 'Move', icon: <Move className="w-4 h-4" />, action: () => {} },
      { label: 'Edit', icon: <Edit2 className="w-4 h-4" />, action: () => {} },
      { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, action: () => {}, className: 'text-red-600 hover:bg-red-50' }
    ];

    return (
      <div
        className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-32"
        style={{ left: menu.x, top: menu.y }}
      >
        {menuItems.filter(item => item.show !== false).map((menuItem, index) => (
          <button
            key={index}
            className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm ${menuItem.className || ''}`}
            onClick={() => {
              menuItem.action();
              setContextMenu(null);
            }}
          >
            {menuItem.icon}
            <span>{menuItem.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const PreviewModal = ({ file }) => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex">
          {/* Left Panel - Content Preview */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold">{file.title || file.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(file.status)}`}>
                  {file.status}
                </span>
              </div>
              <button 
                onClick={() => setPreviewModal(null)} 
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-auto">
              {file.type === 'graphic' && (
                <div className="flex items-center justify-center h-full">
                  <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain rounded shadow-lg" />
                </div>
              )}
              
              {file.type === 'video' && (
                <div className="flex items-center justify-center h-full">
                  <video controls className="max-w-full max-h-full rounded shadow-lg">
                    <source src={file.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              
              {file.type === 'audio' && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-32 h-32 mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <Music className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{file.title || file.name}</h3>
                  <audio controls className="w-full max-w-md">
                    <source src={file.url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              
              {file.type === 'document' && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-32 h-32 mb-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <FileText className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{file.title || file.name}</h3>
                  <p className="mb-6 text-gray-600 max-w-md">
                    Document preview not available in browser. Click below to open in a new tab.
                  </p>
                  <button
                    onClick={() => window.open(file.url, '_blank')}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Open Document
                  </button>
                </div>
              )}
              
              {file.type === 'other' && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-32 h-32 mb-6 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                    <File className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{file.title || file.name}</h3>
                  <p className="mb-6 text-gray-600 max-w-md">
                    Preview not available for this file type. Click below to download or open.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => downloadFile(file)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                    <button
                      onClick={() => window.open(file.url, '_blank')}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Panel - Database Fields Card */}
          <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                File Details
              </h4>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Basic Information */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h5 className="font-medium text-gray-800 mb-3 text-sm uppercase tracking-wide">Basic Information</h5>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">FILENAME</label>
                    <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{file.name}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">TITLE</label>
                    <div className="text-sm text-gray-900">{file.title || 'No title provided'}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">TYPE</label>
                    <div className="flex items-center">
                      {getTypeIcon(file.type)}
                      <span className="text-sm text-gray-900 ml-2 capitalize">{file.type}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">SIZE</label>
                      <div className="text-sm text-gray-900">{file.size}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">VERSION</label>
                      <div className="text-sm text-gray-900">{file.version}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {file.description && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h5 className="font-medium text-gray-800 mb-3 text-sm uppercase tracking-wide">Description</h5>
                  <div className="text-sm text-gray-700 leading-relaxed">{file.description}</div>
                </div>
              )}
              
              {/* Project & Team Information */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h5 className="font-medium text-gray-800 mb-3 text-sm uppercase tracking-wide">Project & Team</h5>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">PROJECT</label>
                    <div className="text-sm text-gray-900">{file.project || 'Not assigned'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">CREATED BY</label>
                      <div className="text-sm text-gray-900">{file.createdBy}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">SUBMITTED BY</label>
                      <div className="text-sm text-gray-900">{file.submittedBy || 'Not specified'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Status & Dates */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h5 className="font-medium text-gray-800 mb-3 text-sm uppercase tracking-wide">Status & Timeline</h5>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">STATUS</label>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(file.status)}`}>
                      {file.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">CREATED</label>
                      <div className="text-sm text-gray-900">{file.modified}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">MODIFIED</label>
                      <div className="text-sm text-gray-900">{file.modified}</div>
                    </div>
                  </div>
                  {file.uploadedAt && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">UPLOADED</label>
                      <div className="text-sm text-gray-900">{new Date(file.uploadedAt).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tags */}
              {file.tags && file.tags.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h5 className="font-medium text-gray-800 mb-3 text-sm uppercase tracking-wide">Tags</h5>
                  <div className="flex flex-wrap gap-2">
                    {file.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {file.notes && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h5 className="font-medium text-gray-800 mb-3 text-sm uppercase tracking-wide">Notes</h5>
                  <div className="text-sm text-gray-700 leading-relaxed bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                    {file.notes}
                  </div>
                </div>
              )}
              
              {/* Technical Information */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h5 className="font-medium text-gray-800 mb-3 text-sm uppercase tracking-wide">Technical Details</h5>
                <div className="space-y-3">
                  {file.mimeType && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">MIME TYPE</label>
                      <div className="text-sm text-gray-900 font-mono">{file.mimeType}</div>
                    </div>
                  )}
                  {file.fileHash && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">FILE HASH</label>
                      <div className="text-xs text-gray-600 font-mono break-all bg-gray-100 p-2 rounded">{file.fileHash}</div>
                    </div>
                  )}
                  {file.originalName && file.originalName !== file.name && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">ORIGINAL NAME</label>
                      <div className="text-sm text-gray-900 font-mono">{file.originalName}</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h5 className="font-medium text-gray-800 mb-3 text-sm uppercase tracking-wide">Quick Actions</h5>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => downloadFile(file)}
                    className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                  <button
                    onClick={() => window.open(file.url, '_blank')}
                    className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </button>
                  <button
                    onClick={() => {/* Add copy functionality */}}
                    className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </button>
                  <button
                    onClick={() => {/* Add edit functionality */}}
                    className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar - Tree View */}
      <div className="w-64 border-r border-gray-200 bg-gray-50">
        <div className="p-3 border-b border-gray-200 bg-white">
          <h3 className="font-semibold text-gray-800">Folders</h3>
        </div>
        
        <div className="p-2 overflow-y-auto h-full">
          <div 
            className={`flex items-center px-2 py-1 hover:bg-blue-50 cursor-pointer text-sm mb-1 rounded ${
              currentFolder === null ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-gray-700'
            }`}
            onClick={() => handleFolderSelect(null)}
          >
            <Folder className="w-4 h-4 mr-2 text-blue-600" />
            <span>All Content</span>
          </div>
          
          {folderTree.map(folder => <FolderTreeItem key={folder.id} folder={folder} />)}
        </div>
        
        <div className="p-3 border-t border-gray-200 bg-white">
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Folder
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {allTags.length > 0 && (
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />
              
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-600">
            <span 
              className="hover:text-blue-600 cursor-pointer"
              onClick={() => setCurrentFolder(null)}
            >
              All Content
            </span>
            {currentFolder && (
              <>
                <ChevronRight className="w-4 h-4 mx-1" />
                <span className="text-gray-900 font-medium">{currentFolder.name}</span>
              </>
            )}
          </div>
        </div>

        {/* File List */}
        <div 
          className={`flex-1 overflow-y-auto ${
            dragOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {dragOver && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Upload className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                <p className="text-xl font-semibold text-blue-700">Drop files here to upload</p>
              </div>
            </div>
          )}
          
          {!dragOver && (
            <>
              {/* List View Headers */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Modified</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-1">Size</div>
                <div className="col-span-2">Project</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Actions</div>
              </div>
              
              {/* Folders */}
              {currentFolderContents.folders.map(folder => (
                <div
                  key={folder.id}
                  className={`grid grid-cols-12 gap-4 px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    selectedItems.includes(`folder-${folder.id}`) ? 'bg-blue-50' : ''
                  }`}
                  onClick={(e) => handleItemSelect(folder, 'folder', e)}
                  onDoubleClick={() => handleFolderSelect(folder)}
                  onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
                >
                  <div className="col-span-4 flex items-center">
                    <Folder className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="font-medium">{folder.name}</span>
                  </div>
                  <div className="col-span-2 text-gray-500">{folder.createdAt}</div>
                  <div className="col-span-1 text-gray-500">Folder</div>
                  <div className="col-span-1 text-gray-500">-</div>
                  <div className="col-span-2 text-gray-500">-</div>
                  <div className="col-span-1 text-gray-500">-</div>
                  <div className="col-span-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, folder, 'folder');
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Files */}
              {currentFolderContents.files.map(file => (
                <div
                  key={file.id}
                  className={`grid grid-cols-12 gap-4 px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    selectedItems.includes(`file-${file.id}`) ? 'bg-blue-50' : ''
                  }`}
                  onClick={(e) => handleItemSelect(file, 'file', e)}
                  onDoubleClick={() => previewFile(file)}
                  onContextMenu={(e) => handleContextMenu(e, file, 'file')}
                >
                  <div className="col-span-4 flex items-center">
                    {getTypeIcon(file.type)}
                    <div className="ml-2">
                      <div className="font-medium truncate">{file.title || file.name}</div>
                      {file.title && (
                        <div className="text-xs text-gray-500 truncate">{file.name}</div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-gray-500">{file.modified}</div>
                  <div className="col-span-1 text-gray-500 capitalize">{file.type}</div>
                  <div className="col-span-1 text-gray-500">{file.size}</div>
                  <div className="col-span-2 text-gray-500">{file.project || '-'}</div>
                  <div className="col-span-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(file.status)}`}>
                      {file.status}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        previewFile(file);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Preview"
                    >
                      {file.type === 'video' || file.type === 'audio' ? 
                        <Play className="w-3 h-3 text-green-600" /> : 
                        <Eye className="w-3 h-3 text-blue-600" />
                      }
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Download"
                    >
                      <Download className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, file, 'file');
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <MoreVertical className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {currentFolderContents.folders.length === 0 && currentFolderContents.files.length === 0 && !dragOver && (
            <div className="text-center py-16">
              <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {currentFolder ? 'This folder is empty' : 'No content found'}
              </h3>
              <p className="text-gray-500 mb-4">
                {currentFolder ? 'Drag and drop files here or use the upload button' : 'Upload some files to get started'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-semibold mb-6">Upload Files & Add Metadata</h3>
            
            <div className="space-y-6">
              {uploadingFiles.map((fileData, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      {getTypeIcon(fileData.category)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{fileData.name}</h4>
                      <p className="text-sm text-gray-500">{(fileData.file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title (10-12 words)</label>
                      <input
                        type="text"
                        value={fileData.title}
                        onChange={(e) => updateFileData(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brief descriptive title for this file"
                        maxLength="120"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={fileData.category}
                        onChange={(e) => updateFileData(index, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="document">Document</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="graphic">Graphic</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description (up to 500 words)</label>
                      <textarea
                        value={fileData.description}
                        onChange={(e) => updateFileData(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Detailed description of this file and its purpose"
                        maxLength="3000"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {fileData.description.length}/3000 characters
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                      <input
                        type="text"
                        value={fileData.tags}
                        onChange={(e) => updateFileData(index, 'tags', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="tag1, tag2, tag3"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                      <input
                        type="text"
                        value={fileData.project}
                        onChange={(e) => updateFileData(index, 'project', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Project name or identifier"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Submitted By</label>
                      <input
                        type="text"
                        value={fileData.submittedBy}
                        onChange={(e) => updateFileData(index, 'submittedBy', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Person who submitted this file"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={fileData.status}
                        onChange={(e) => updateFileData(index, 'status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="processing">Processing</option>
                        <option value="approved">Approved</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes (up to 500 words)</label>
                      <textarea
                        value={fileData.notes}
                        onChange={(e) => updateFileData(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Additional notes, comments, or special instructions"
                        maxLength="3000"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {fileData.notes.length}/3000 characters
                      </div>
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
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={uploadFiles}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Upload {uploadingFiles.length} File{uploadingFiles.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && <PreviewModal file={previewModal} />}

      {/* Context Menu */}
      {contextMenu && <ContextMenu menu={contextMenu} />}

      {/* New Folder Modal */}
      {isCreatingFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
