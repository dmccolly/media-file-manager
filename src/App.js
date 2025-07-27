import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Copy, 
  Move, 
  Plus, 
  Search, 
  Grid3x3, 
  List, 
  ChevronRight,
  ChevronDown,
  Image,
  Video,
  FileText,
  Music,
  Archive,
  X,
  Check,
  Edit2,
  Trash2,
  RefreshCw,
  Play,
  Eye,
  ExternalLink,
  Tag,
  Clock,
  User,
  FolderPlus,
  FilePlus,
  Settings,
  MoreVertical,
  CheckSquare,
  Square,
  Zap,
  Star,
  Filter
} from 'lucide-react';

// Mock data with streaming/media focus
const mockFolders = [
  { id: '1', name: 'Content Library', parentId: null, path: '/Content Library', createdBy: 'admin', createdAt: '2024-07-20', permissions: ['read', 'write', 'delete'] },
  { id: '2', name: 'Live Streams', parentId: null, path: '/Live Streams', createdBy: 'admin', createdAt: '2024-07-20', permissions: ['read', 'write', 'delete'] },
  { id: '3', name: 'Brand Assets', parentId: null, path: '/Brand Assets', createdBy: 'admin', createdAt: '2024-07-20', permissions: ['read', 'write', 'delete'] },
  { id: '4', name: 'Featured Content', parentId: '1', path: '/Content Library/Featured Content', createdBy: 'creator1', createdAt: '2024-07-21', permissions: ['read', 'write'] },
  { id: '5', name: 'Archived Shows', parentId: '2', path: '/Live Streams/Archived Shows', createdBy: 'creator2', createdAt: '2024-07-22', permissions: ['read', 'write'] },
];

const mockFiles = [
  { 
    id: 'f1', 
    name: 'hero-banner.jpg', 
    folderId: '1', 
    type: 'image', 
    size: '4.2 MB', 
    url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=400&fit=crop',
    modified: '2024-07-25',
    createdBy: 'design-team',
    version: '2.1',
    tags: ['hero', 'homepage', 'featured'],
    description: 'Main hero banner for streaming platform homepage',
    status: 'published'
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
    description: 'Best moments compilation from recent streams',
    status: 'processing'
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
    description: 'Complete brand guidelines and design system',
    status: 'approved'
  },
  { 
    id: 'f4', 
    name: 'intro-theme.mp3', 
    folderId: '3', 
    type: 'audio', 
    size: '12.3 MB', 
    url: '#',
    modified: '2024-07-22',
    createdBy: 'audio-team',
    version: '1.0',
    tags: ['music', 'intro', 'theme'],
    description: 'Signature intro theme for live streams',
    status: 'published'
  },
];

const FileManager = () => {
  const [folders, setFolders] = useState(mockFolders);
  const [files, setFiles] = useState(mockFiles);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(['root']);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [previewModal, setPreviewModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveDestination, setMoveDestination] = useState(null);
  const [filterTag, setFilterTag] = useState('');
  const fileInputRef = useRef(null);
  const contextMenuRef = useRef(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter files and folders based on current folder, search, and tag filter
  const currentFolderContents = {
    folders: folders.filter(f => 
      f.parentId === currentFolder?.id && 
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    files: files.filter(f => 
      f.folderId === currentFolder?.id && 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterTag === '' || f.tags?.includes(filterTag))
    )
  };

  // Get all unique tags
  const allTags = [...new Set(files.flatMap(f => f.tags || []))];

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-emerald-400';
      case 'processing': return 'bg-amber-400';
      case 'approved': return 'bg-blue-400';
      case 'draft': return 'bg-slate-400';
      default: return 'bg-slate-500';
    }
  };

  // Get folder tree for sidebar
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

  // Handle folder selection in sidebar
  const handleFolderSelect = (folder) => {
    setCurrentFolder(folder);
    setSelectedItems([]);
    setBulkSelectMode(false);
  };

  // Handle item selection
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

  // Handle right-click context menu
  const handleContextMenu = (event, item, type) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      item,
      type
    });
  };

  // Handle folder expansion in sidebar
  const toggleFolderExpansion = (folderId) => {
    if (expandedFolders.includes(folderId)) {
      setExpandedFolders(expandedFolders.filter(id => id !== folderId));
    } else {
      setExpandedFolders([...expandedFolders, folderId]);
    }
  };

  // Create new folder
  const createFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: Date.now().toString(),
        name: newFolderName.trim(),
        parentId: currentFolder?.id || null,
        path: currentFolder ? `${currentFolder.path}/${newFolderName.trim()}` : `/${newFolderName.trim()}`,
        createdBy: 'current-user',
        createdAt: new Date().toISOString().split('T')[0],
        permissions: ['read', 'write', 'delete']
      };
      setFolders([...folders, newFolder]);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    uploadedFiles.forEach(file => {
      const newFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        folderId: currentFolder?.id || null,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 
              file.type.startsWith('audio/') ? 'audio' : 'document',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        url: URL.createObjectURL(file),
        modified: new Date().toISOString().split('T')[0],
        createdBy: 'current-user',
        version: '1.0',
        tags: [],
        description: '',
        status: 'draft'
      };
      setFiles(prev => [...prev, newFile]);
    });
  };

  // Delete selected items
  const deleteSelectedItems = () => {
    const fileIds = selectedItems.filter(id => id.startsWith('file-')).map(id => id.replace('file-', ''));
    const folderIds = selectedItems.filter(id => id.startsWith('folder-')).map(id => id.replace('folder-', ''));
    
    setFiles(files.filter(f => !fileIds.includes(f.id)));
    setFolders(folders.filter(f => !folderIds.includes(f.id)));
    setSelectedItems([]);
  };

  // Copy selected items
  const copySelectedItems = () => {
    const fileIds = selectedItems.filter(id => id.startsWith('file-')).map(id => id.replace('file-', ''));
    const filesToCopy = files.filter(f => fileIds.includes(f.id));
    
    const copiedFiles = filesToCopy.map(file => ({
      ...file,
      id: Date.now().toString() + Math.random(),
      name: `Copy of ${file.name}`,
      modified: new Date().toISOString().split('T')[0]
    }));
    
    setFiles([...files, ...copiedFiles]);
    setSelectedItems([]);
  };

  // Move items to different folder
  const moveSelectedItems = () => {
    if (moveDestination === undefined) return;
    
    const fileIds = selectedItems.filter(id => id.startsWith('file-')).map(id => id.replace('file-', ''));
    const folderIds = selectedItems.filter(id => id.startsWith('folder-')).map(id => id.replace('folder-', ''));
    
    setFiles(files.map(f => 
      fileIds.includes(f.id) ? { ...f, folderId: moveDestination?.id || null } : f
    ));
    
    setFolders(folders.map(f => 
      folderIds.includes(f.id) ? { ...f, parentId: moveDestination?.id || null } : f
    ));
    
    setSelectedItems([]);
    setShowMoveModal(false);
    setMoveDestination(null);
  };

  // Preview file content
  const previewFile = (file) => {
    setPreviewModal(file);
  };

  // Download file
  const downloadFile = (file) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  // Edit file metadata
  const saveFileMetadata = (fileId, metadata) => {
    setFiles(files.map(f => 
      f.id === fileId ? { ...f, ...metadata } : f
    ));
    setEditingItem(null);
  };

  // Get file icon
  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  // Handle drag and drop
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
    droppedFiles.forEach(file => {
      const newFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        folderId: currentFolder?.id || null,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 
              file.type.startsWith('audio/') ? 'audio' : 'document',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        url: URL.createObjectURL(file),
        modified: new Date().toISOString().split('T')[0],
        createdBy: 'current-user',
        version: '1.0',
        tags: [],
        description: '',
        status: 'draft'
      };
      setFiles(prev => [...prev, newFile]);
    });
  };

  // Select all items in current folder
  const selectAll = () => {
    const allItems = [
      ...currentFolderContents.folders.map(f => `folder-${f.id}`),
      ...currentFolderContents.files.map(f => `file-${f.id}`)
    ];
    setSelectedItems(allItems);
  };

  // Render folder tree item
  const FolderTreeItem = ({ folder }) => {
    const isExpanded = expandedFolders.includes(folder.id);
    const hasChildren = folder.children.length > 0;
    
    return (
      <div key={folder.id}>
        <div 
          className={`flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-lg transition-all ${
            currentFolder?.id === folder.id ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-l-2 border-purple-500' : ''
          }`}
          style={{ paddingLeft: `${folder.level * 16 + 12}px` }}
          onClick={() => handleFolderSelect(folder)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderExpansion(folder.id);
              }}
              className="mr-2 p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          <Folder className="w-4 h-4 mr-3 text-blue-600" />
          <span className="text-sm text-gray-800 font-medium">{folder.name}</span>
        </div>
        {isExpanded && folder.children.map(child => <FolderTreeItem key={child.id} folder={child} />)}
      </div>
    );
  };

  // Context Menu Component
  const ContextMenu = ({ menu }) => {
    const { item, type } = menu;
    
    const menuItems = [
      {
        label: type === 'file' && (item.type === 'image' || item.type === 'video' || item.type === 'audio') ? 'Preview' : 'View',
        icon: type === 'file' && (item.type === 'video' || item.type === 'audio') ? <Play className="w-4 h-4" /> : <Eye className="w-4 h-4" />,
        action: () => previewFile(item)
      },
      { label: 'Download', icon: <Download className="w-4 h-4" />, action: () => downloadFile(item) },
      { label: 'Copy', icon: <Copy className="w-4 h-4" />, action: copySelectedItems },
      { label: 'Move', icon: <Move className="w-4 h-4" />, action: () => setShowMoveModal(true) },
      { label: 'Edit', icon: <Edit2 className="w-4 h-4" />, action: () => setEditingItem(item) },
      { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, action: deleteSelectedItems, className: 'text-red-600 hover:bg-red-50' }
    ];

    return (
      <div
        ref={contextMenuRef}
        className="fixed bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 min-w-40"
        style={{ left: menu.x, top: menu.y }}
      >
        {menuItems.map((menuItem, index) => (
          <button
            key={index}
            className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center space-x-3 text-gray-700 text-sm transition-colors ${menuItem.className || ''}`}
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

  // Preview Modal Component
  const PreviewModal = ({ file }) => {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl max-w-5xl max-h-[90vh] overflow-auto border border-gray-200 shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <h3 className="text-xl font-semibold text-gray-900">{file.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(file.status)}`}>
                {file.status}
              </span>
            </div>
            <button 
              onClick={() => setPreviewModal(null)} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="p-6">
            {file.type === 'image' && (
              <img src={file.url} alt={file.name} className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg" />
            )}
            
            {file.type === 'video' && (
              <video controls className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg bg-black">
                <source src={file.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            
            {file.type === 'audio' && (
              <div className="text-center py-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Music className="w-12 h-12 text-white" />
                </div>
                <audio controls className="mx-auto">
                  <source src={file.url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            
            {file.type === 'document' && (
              <div className="text-center py-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                  <FileText className="w-12 h-12 text-white" />
                </div>
                <p className="mb-6 text-gray-600">Document preview not available</p>
                <button
                  onClick={() => window.open(file.url, '_blank')}
                  className="flex items-center mx-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in new tab
                </button>
              </div>
            )}
            
            <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <div className="text-gray-600">Size:</div>
                  <div className="text-gray-900 font-medium">{file.size}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-gray-600">Modified:</div>
                  <div className="text-gray-900 font-medium">{file.modified}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-gray-600">Created by:</div>
                  <div className="text-gray-900 font-medium">{file.createdBy}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-gray-600">Version:</div>
                  <div className="text-gray-900 font-medium">{file.version}</div>
                </div>
              </div>
              {file.description && (
                <div className="mt-4 space-y-2">
                  <div className="text-gray-600">Description:</div>
                  <div className="text-gray-900">{file.description}</div>
                </div>
              )}
              {file.tags && file.tags.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-gray-600">Tags:</div>
                  <div className="flex flex-wrap gap-2">
                    {file.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-sm rounded-full border border-purple-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Media Manager
            </h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div 
            className={`flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-lg transition-all ${
              currentFolder === null ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-l-2 border-purple-500' : ''
            }`}
            onClick={() => handleFolderSelect(null)}
          >
            <Folder className="w-4 h-4 mr-3 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">All Content</span>
          </div>
          
          {folderTree.map(folder => <FolderTreeItem key={folder.id} folder={folder} />)}
        </div>
        
        <div className="p-4 border-t border-gray-200 space-y-3">
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Folder
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search files and folders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-80 transition-all"
                />
              </div>
              
              {allTags.length > 0 && (
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-medium shadow-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {selectedItems.length > 0 && (
                <>
                  <button
                    onClick={copySelectedItems}
                    className="flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </button>
                  <button
                    onClick={() => setShowMoveModal(true)}
                    className="flex items-center px-4 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all"
                  >
                    <Move className="w-4 h-
                      <Move className="w-4 h-4 mr-2" />
                    Move
                  </button>
                  <button
                    onClick={deleteSelectedItems}
                    className="flex items-center px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setBulkSelectMode(!bulkSelectMode)}
                className={`p-2 rounded-lg transition-all ${bulkSelectMode ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                title="Bulk Select Mode"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              <button
                onClick={selectAll}
                className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
                title="Select All"
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <span 
                  className="hover:text-purple-600 cursor-pointer transition-colors"
                  onClick={() => setCurrentFolder(null)}
                >
                  All Content
                </span>
                {currentFolder && (
                  <>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <span className="text-gray-900 font-medium">{currentFolder.name}</span>
                  </>
                )}
              </div>
              
              {selectedItems.length > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                    {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div 
          className={`flex-1 p-6 overflow-y-auto ${
            dragOver ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-dashed border-purple-400' : ''
          } transition-all`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {dragOver && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Upload className="w-12 h-12 text-white" />
                </div>
                <p className="text-2xl font-semibold text-gray-800 mb-2">Drop files here to upload</p>
                <p className="text-gray-600">Support for images, videos, audio, and documents</p>
              </div>
            </div>
          )}
          
          {!dragOver && (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-6 gap-6">
                  {currentFolderContents.folders.map(folder => (
                    <div
                      key={folder.id}
                      className={`group p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all relative ${
                        selectedItems.includes(`folder-${folder.id}`) ? 'border-purple-500 bg-purple-50' : ''
                      }`}
                      onClick={(e) => handleItemSelect(folder, 'folder', e)}
                      onDoubleClick={() => handleFolderSelect(folder)}
                      onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
                    >
                      {bulkSelectMode && (
                        <div className="absolute top-3 right-3 z-10">
                          {selectedItems.includes(`folder-${folder.id}`) ? 
                            <CheckSquare className="w-5 h-5 text-purple-600" /> : 
                            <Square className="w-5 h-5 text-gray-400" />
                          }
                        </div>
                      )}
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-3">
                          <Folder className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800 text-center line-clamp-2 mb-1">{folder.name}</h3>
                        <p className="text-xs text-gray-500">{folder.createdBy}</p>
                      </div>
                    </div>
                  ))}
                  
                  {currentFolderContents.files.map(file => (
                    <div
                      key={file.id}
                      className={`group p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all relative ${
                        selectedItems.includes(`file-${file.id}`) ? 'border-purple-500 bg-purple-50' : ''
                      }`}
                      onClick={(e) => handleItemSelect(file, 'file', e)}
                      onDoubleClick={() => previewFile(file)}
                      onContextMenu={(e) => handleContextMenu(e, file, 'file')}
                    >
                      {bulkSelectMode && (
                        <div className="absolute top-3 right-3 z-10">
                          {selectedItems.includes(`file-${file.id}`) ? 
                            <CheckSquare className="w-5 h-5 text-purple-600" /> : 
                            <Square className="w-5 h-5 text-gray-400" />
                          }
                        </div>
                      )}
                      
                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(file.status)}`}>
                          {file.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-center pt-6">
                        {file.type === 'image' ? (
                          <div className="w-full h-24 mb-3 relative">
                            <img 
                              src={file.url} 
                              alt={file.name} 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-3 ${
                            file.type === 'video' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                            file.type === 'audio' ? 'bg-gradient-to-br from-green-500 to-teal-500' :
                            'bg-gradient-to-br from-gray-500 to-gray-600'
                          }`}>
                            {getFileIcon(file.type)}
                          </div>
                        )}
                        
                        <h3 className="text-sm font-semibold text-gray-800 text-center line-clamp-2 mb-1">{file.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{file.size}</p>
                        
                        {file.tags && file.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {file.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full border border-purple-200">
                                {tag}
                              </span>
                            ))}
                            {file.tags.length > 2 && (
                              <span className="text-xs text-gray-500">+{file.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-medium text-gray-600 border-b border-gray-200">
                    <div className="col-span-1">
                      {bulkSelectMode && (
                        <button onClick={selectAll} className="hover:text-purple-600 transition-colors">
                          <Square className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="col-span-5">Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-1">Size</div>
                    <div className="col-span-2">Modified</div>
                    <div className="col-span-1">Status</div>
                  </div>
                  
                  {currentFolderContents.folders.map(folder => (
                    <div
                      key={folder.id}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer rounded-xl transition-all ${
                        selectedItems.includes(`folder-${folder.id}`) ? 'bg-purple-50 border border-purple-200' : ''
                      }`}
                      onClick={(e) => handleItemSelect(folder, 'folder', e)}
                      onDoubleClick={() => handleFolderSelect(folder)}
                      onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
                    >
                      <div className="col-span-1">
                        {bulkSelectMode && (
                          selectedItems.includes(`folder-${folder.id}`) ? 
                            <CheckSquare className="w-4 h-4 text-purple-600" /> : 
                            <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="col-span-5 flex items-center">
                        <Folder className="w-5 h-5 text-blue-600 mr-3" />
                        <span className="text-sm font-medium text-gray-800">{folder.name}</span>
                      </div>
                      <div className="col-span-2 text-sm text-gray-600">Folder</div>
                      <div className="col-span-1 text-sm text-gray-600">-</div>
                      <div className="col-span-2 text-sm text-gray-600">{folder.createdAt}</div>
                      <div className="col-span-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContextMenu(e, folder, 'folder');
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {currentFolderContents.files.map(file => (
                    <div
                      key={file.id}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer rounded-xl transition-all ${
                        selectedItems.includes(`file-${file.id}`) ? 'bg-purple-50 border border-purple-200' : ''
                      }`}
                      onClick={(e) => handleItemSelect(file, 'file', e)}
                      onDoubleClick={() => previewFile(file)}
                      onContextMenu={(e) => handleContextMenu(e, file, 'file')}
                    >
                      <div className="col-span-1">
                        {bulkSelectMode && (
                          selectedItems.includes(`file-${file.id}`) ? 
                            <CheckSquare className="w-4 h-4 text-purple-600" /> : 
                            <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="col-span-5 flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                          file.type === 'image' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                          file.type === 'video' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                          file.type === 'audio' ? 'bg-gradient-to-br from-green-500 to-teal-500' :
                          'bg-gradient-to-br from-gray-500 to-gray-600'
                        }`}>
                          {getFileIcon(file.type)}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-800">{file.name}</span>
                          {file.tags && file.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {file.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2 text-sm text-gray-600 capitalize">{file.type}</div>
                      <div className="col-span-1 text-sm text-gray-600">{file.size}</div>
                      <div className="col-span-2 text-sm text-gray-600">{file.modified}</div>
                      <div className="col-span-1 flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(file.status)}`}>
                          {file.status}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContextMenu(e, file, 'file');
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {currentFolderContents.folders.length === 0 && currentFolderContents.files.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                    <Folder className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">This folder is empty</h3>
                  <p className="text-gray-500 mb-6">Drag and drop files here or use the upload button to get started</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
                  >
                    Upload Files
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && <ContextMenu menu={contextMenu} />}

      {/* Preview Modal */}
      {previewModal && <PreviewModal file={previewModal} />}

      {/* New Folder Modal */}
      {isCreatingFolder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-96 border border-gray-200 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-96 max-h-96 overflow-y-auto border border-gray-200 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Move Items</h3>
            <p className="text-gray-600 mb-6">Select destination folder:</p>
            
            <div className="space-y-2 mb-6">
              <div 
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  moveDestination === null ? 'bg-purple-100 border border-purple-300' : 'hover:bg-gray-50'
                }`}
                onClick={() => setMoveDestination(null)}
              >
                <div className="flex items-center">
                  <Folder className="w-4 h-4 text-blue-600 mr-3" />
                  <span className="text-gray-800">All Content</span>
                </div>
              </div>
              
              {folders.map(folder => (
                <div
                  key={folder.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    moveDestination?.id === folder.id ? 'bg-purple-100 border border-purple-300' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setMoveDestination(folder)}
                  style={{ paddingLeft: `${(folder.path.split('/').length - 1) * 16 + 12}px` }}
                >
                  <div className="flex items-center">
                    <Folder className="w-4 h-4 text-blue-600 mr-3" />
                    <span className="text-gray-800">{folder.name}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setMoveDestination(null);
                }}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={moveSelectedItems}
                disabled={moveDestination === undefined}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-96 border border-gray-200 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit {editingItem.name}</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const metadata = {
                name: formData.get('name'),
                description: formData.get('description'),
                tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(Boolean)
              };
              saveFileMetadata(editingItem.id, metadata);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={editingItem.name}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingItem.description || ''}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                  <input
                    name="tags"
                    type="text"
                    defaultValue={editingItem.tags ? editingItem.tags.join(', ') : ''}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
