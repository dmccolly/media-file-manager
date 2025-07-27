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
  Link
} from 'lucide-react';

const App = () => {
  // States
  const [currentFolder, setCurrentFolder] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [previewModal, setPreviewModal] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(['root']);
  const [allFiles, setAllFiles] = useState([]); // Track all files including uploaded ones
  
  const fileInputRef = useRef(null);

  // Sample data with all content
  const sampleFiles = [
    {
      id: 1,
      name: 'Project_Proposal.pdf',
      title: 'Annual Marketing Project Proposal for Q4 2025',
      type: 'pdf',
      category: 'Document',
      size: '2.4 MB',
      project: 'Marketing Campaign',
      notes: 'This comprehensive proposal outlines our marketing strategy for the fourth quarter, including budget allocations, target demographics, and expected ROI metrics.',
      submittedBy: 'John Smith',
      description: 'A detailed proposal covering all aspects of our Q4 marketing initiative, including digital advertising, content creation, and campaign analytics. The document includes market research, competitor analysis, and projected outcomes.',
      tags: ['marketing', 'proposal', 'Q4', 'strategy'],
      createdAt: '2025-07-20',
      modifiedAt: '2025-07-25',
      status: 'Active',
      folderId: null
    },
    {
      id: 2,
      name: 'Team_Meeting.mp4',
      title: 'Weekly Team Standup Recording July 2025',
      type: 'mp4',
      category: 'Video',
      size: '145 MB',
      project: 'Team Operations',
      notes: 'Weekly standup covering project updates, blockers, and next week planning. Includes discussion about new feature rollouts.',
      submittedBy: 'Sarah Johnson',
      description: 'Recording of our weekly team standup meeting where we discussed current project status, upcoming deadlines, and resource allocation for the next sprint.',
      tags: ['meeting', 'standup', 'team', 'video'],
      createdAt: '2025-07-22',
      modifiedAt: '2025-07-22',
      status: 'Active',
      folderId: null
    },
    {
      id: 3,
      name: 'Brand_Logo.png',
      title: 'Company Brand Logo Vector Graphics File',
      type: 'png',
      category: 'Graphic',
      size: '890 KB',
      project: 'Brand Identity',
      notes: 'High-resolution brand logo in PNG format. Transparent background, suitable for web and print use.',
      submittedBy: 'Design Team',
      description: 'Official company logo in high-resolution PNG format with transparent background. This version is optimized for digital use and maintains brand consistency across platforms.',
      tags: ['logo', 'brand', 'graphics', 'png'],
      createdAt: '2025-07-15',
      modifiedAt: '2025-07-15',
      status: 'Active',
      folderId: 1
    },
    {
      id: 4,
      name: 'Background_Music.mp3',
      title: 'Corporate Background Music Track for Videos',
      type: 'mp3',
      category: 'Audio',
      size: '8.2 MB',
      project: 'Video Production',
      notes: 'Royalty-free background music suitable for corporate videos, presentations, and promotional content.',
      submittedBy: 'Audio Team',
      description: 'Professional background music track designed for corporate use. The track is upbeat yet professional, perfect for presentations, promotional videos, and company communications.',
      tags: ['music', 'background', 'corporate', 'audio'],
      createdAt: '2025-07-18',
      modifiedAt: '2025-07-18',
      status: 'Active',
      folderId: 2
    },
    {
      id: 5,
      name: 'Financial_Report.xlsx',
      title: 'Q2 2025 Financial Performance Analysis Report',
      type: 'xlsx',
      category: 'Document',
      size: '1.8 MB',
      project: 'Financial Planning',
      notes: 'Comprehensive financial analysis including revenue, expenses, profit margins, and growth projections for Q2 2025.',
      submittedBy: 'Finance Department',
      description: 'Detailed financial report analyzing Q2 2025 performance with comprehensive charts, graphs, and projections. Includes departmental breakdowns and comparison with previous quarters.',
      tags: ['finance', 'report', 'Q2', 'analysis'],
      createdAt: '2025-07-10',
      modifiedAt: '2025-07-24',
      status: 'Active',
      folderId: null
    }
  ];

  const sampleFolders = [
    { id: 1, name: 'Graphics', parentId: null, icon: 'folder' },
    { id: 2, name: 'Audio Files', parentId: null, icon: 'folder' },
    { id: 3, name: 'Documents', parentId: null, icon: 'folder' },
    { id: 4, name: 'Videos', parentId: null, icon: 'folder' },
    { id: 5, name: 'Archive', parentId: null, icon: 'folder' }
  ];

  // Initialize with sample files
  React.useEffect(() => {
    setAllFiles(sampleFiles);
  }, []);

  // Get current folder contents
  const getCurrentFolderContents = () => {
    const filteredFiles = allFiles.filter(file => {
      const matchesFolder = currentFolder === null ? true : file.folderId === currentFolder;
      const matchesSearch = !searchQuery || 
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFolder && matchesSearch;
    });

    const folders = currentFolder === null ? sampleFolders.filter(f => !f.parentId) : [];
    
    return { files: filteredFiles, folders };
  };

  const currentFolderContents = getCurrentFolderContents();

  // File type icons
  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
      case 'xlsx':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-green-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return <Video className="w-4 h-4 text-purple-500" />;
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
        return <Music className="w-4 h-4 text-orange-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  // File selection
  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Context menu handlers
  const handleRightClick = (e, file) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file: file
    });
  };

  const handleContextMenuAction = (action, file) => {
    switch (action) {
      case 'open':
        setPreviewModal(file);
        break;
      case 'download':
        console.log('Downloading:', file.name);
        break;
      case 'copy':
        console.log('Copying:', file.name);
        break;
      case 'move':
        console.log('Moving:', file.name);
        break;
      case 'delete':
        console.log('Deleting:', file.name);
        break;
      default:
        break;
    }
    setContextMenu(null);
  };

  // Close context menu when clicking elsewhere
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Folder navigation
  const navigateToFolder = (folderId) => {
    setCurrentFolder(folderId);
    setSelectedFiles([]);
  };

  // Upload Modal Component
  const UploadModal = () => {
    const [uploadData, setUploadData] = useState({
      title: '',
      description: '',
      category: 'Document',
      project: '',
      notes: '',
      submittedBy: '',
      tags: ''
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);

    const categories = ['Document', 'Video', 'Audio', 'Graphic', 'Other'];

    const handleInputChange = (field, value) => {
      setUploadData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileSelect = (files) => {
      const fileArray = Array.from(files);
      setSelectedFiles(prev => [...prev, ...fileArray]);
      
      // Auto-detect category based on first file
      if (fileArray.length > 0 && !uploadData.category) {
        const file = fileArray[0];
        const extension = file.name.split('.').pop().toLowerCase();
        let category = 'Other';
        
        if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'xlsx', 'xls'].includes(extension)) {
          category = 'Document';
        } else if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension)) {
          category = 'Video';
        } else if (['mp3', 'wav', 'flac', 'aac', 'm4a'].includes(extension)) {
          category = 'Audio';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp'].includes(extension)) {
          category = 'Graphic';
        }
        
        setUploadData(prev => ({ ...prev, category }));
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setDragActive(false);
      handleFileSelect(e.dataTransfer.files);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      setDragActive(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      setDragActive(false);
    };

    const removeFile = (index) => {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
      if (selectedFiles.length === 0) {
        alert('Please select files to upload');
        return;
      }

      if (!uploadData.title.trim()) {
        alert('Please enter a title');
        return;
      }

      if (!uploadData.submittedBy.trim()) {
        alert('Please enter who submitted this');
        return;
      }

      try {
        console.log('Uploading files:', selectedFiles);
        console.log('With metadata:', uploadData);
        
        // Simulate upload progress
        setUploadingFiles(selectedFiles.map(file => ({
          name: file.name,
          progress: 0
        })));

        // Simulate progress updates
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadingFiles(prev => prev.map(file => ({
            ...file,
            progress: i
          })));
        }

        // Create new file entries and add to allFiles
        const newFiles = selectedFiles.map((file, index) => ({
          id: Date.now() + index, // Simple ID generation
          name: file.name,
          title: uploadData.title,
          type: file.name.split('.').pop().toLowerCase(),
          category: uploadData.category,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          project: uploadData.project,
          notes: uploadData.notes,
          submittedBy: uploadData.submittedBy,
          description: uploadData.description,
          tags: uploadData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          createdAt: new Date().toISOString().split('T')[0],
          modifiedAt: new Date().toISOString().split('T')[0],
          status: 'Active',
          folderId: currentFolder,
          fileObject: file // Store the actual file object for preview
        }));

        // Add new files to the state
        setAllFiles(prev => [...prev, ...newFiles]);

        // Success
        alert(`Successfully uploaded ${selectedFiles.length} file(s)!`);
        
        // Reset form
        setShowUploadModal(false);
        setSelectedFiles([]);
        setUploadingFiles([]);
        setUploadData({
          title: '',
          description: '',
          category: 'Document',
          project: '',
          notes: '',
          submittedBy: '',
          tags: ''
        });

      } catch (error) {
        console.error('Upload failed:', error);
        alert('Upload failed. Please try again.');
      }
    };

    if (!showUploadModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Upload Files</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to browse</p>
                <p className="text-sm text-gray-500">Support for multiple file formats</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Select Files
                </button>
              </div>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Selected Files ({selectedFiles.length})</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div className="flex items-center">
                          {getFileIcon(file.name.split('.').pop())}
                          <span className="ml-2 text-sm font-medium">{file.name}</span>
                          <span className="ml-2 text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploadingFiles.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-3">Uploading Files...</h3>
                  <div className="space-y-2">
                    {uploadingFiles.map((file, index) => (
                      <div key={index} className="bg-white p-2 rounded border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-gray-500">{file.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (10-12 words) *
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={uploadData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter descriptive title..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{uploadData.title.length}/120 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={uploadData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project
                  </label>
                  <input
                    type="text"
                    value={uploadData.project}
                    onChange={(e) => handleInputChange('project', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Project name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submitted By *
                  </label>
                  <input
                    type="text"
                    value={uploadData.submittedBy}
                    onChange={(e) => handleInputChange('submittedBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your name..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={uploadData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="tag1, tag2, tag3..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (up to 500 words)
                  </label>
                  <textarea
                    maxLength={3000}
                    rows={4}
                    value={uploadData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Detailed description of the file..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{uploadData.description.length}/3000 characters</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (up to 500 words)
                  </label>
                  <textarea
                    maxLength={3000}
                    rows={3}
                    value={uploadData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes or comments..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{uploadData.notes.length}/3000 characters</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={uploadingFiles.length > 0}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || uploadingFiles.length > 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploadingFiles.length > 0 ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''} Files`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Preview Modal with Database Card
  const PreviewModal = ({ file }) => {
    if (!file) return null;

    // Helper function to download file
    const downloadFile = () => {
      if (file.fileObject) {
        // For uploaded files with file object
        const url = URL.createObjectURL(file.fileObject);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For sample files, just alert (in real app, would download from server)
        alert(`Downloading ${file.name}...`);
      }
    };

    // Helper function to open in new tab
    const openInNewTab = () => {
      if (file.fileObject) {
        const url = URL.createObjectURL(file.fileObject);
        window.open(url, '_blank');
      } else {
        alert(`Opening ${file.name} in new tab...`);
      }
    };

    const renderPreview = () => {
      const fileExtension = file.type?.toLowerCase();
      
      switch (file.category.toLowerCase()) {
        case 'graphic':
          if (file.fileObject && file.fileObject.type.startsWith('image/')) {
            // Show actual image for uploaded files
            const imageUrl = URL.createObjectURL(file.fileObject);
            return (
              <div className="flex items-center justify-center h-full bg-gray-50 p-4">
                <div className="max-w-full max-h-full">
                  <img 
                    src={imageUrl} 
                    alt={file.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    onLoad={() => URL.revokeObjectURL(imageUrl)}
                  />
                </div>
              </div>
            );
          } else {
            return (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <Image className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">Image Preview</p>
                  <button 
                    onClick={openInNewTab}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </button>
                </div>
              </div>
            );
          }
        case 'video':
          if (file.fileObject && file.fileObject.type.startsWith('video/')) {
            // Show actual video player for uploaded files
            const videoUrl = URL.createObjectURL(file.fileObject);
            return (
              <div className="flex items-center justify-center h-full bg-black p-4">
                <video 
                  controls 
                  className="max-w-full max-h-full"
                  onLoadedData={() => URL.revokeObjectURL(videoUrl)}
                >
                  <source src={videoUrl} type={file.fileObject.type} />
                  Your browser does not support the video tag.
                </video>
              </div>
            );
          } else {
            return (
              <div className="flex items-center justify-center h-full bg-black">
                <div className="text-center text-white">
                  <Play className="w-24 h-24 text-white mx-auto mb-4" />
                  <p className="text-lg font-medium">{file.name}</p>
                  <p className="text-sm text-gray-300">Video Player</p>
                  <button 
                    onClick={openInNewTab}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center mx-auto"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Video
                  </button>
                </div>
              </div>
            );
          }
        case 'audio':
          if (file.fileObject && file.fileObject.type.startsWith('audio/')) {
            // Show actual audio player for uploaded files
            const audioUrl = URL.createObjectURL(file.fileObject);
            return (
              <div className="flex items-center justify-center h-full bg-gray-900 p-4">
                <div className="text-center text-white">
                  <Music className="w-24 h-24 text-white mx-auto mb-6" />
                  <p className="text-lg font-medium mb-6">{file.name}</p>
                  <audio 
                    controls 
                    className="w-full max-w-md"
                    onLoadedData={() => URL.revokeObjectURL(audioUrl)}
                  >
                    <source src={audioUrl} type={file.fileObject.type} />
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              </div>
            );
          } else {
            return (
              <div className="flex items-center justify-center h-full bg-gray-900">
                <div className="text-center text-white">
                  <Music className="w-24 h-24 text-white mx-auto mb-4" />
                  <p className="text-lg font-medium">{file.name}</p>
                  <p className="text-sm text-gray-300">Audio Player</p>
                  <button 
                    onClick={openInNewTab}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center mx-auto"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Audio
                  </button>
                </div>
              </div>
            );
          }
        case 'document':
          if (['pdf'].includes(fileExtension)) {
            if (file.fileObject && file.fileObject.type === 'application/pdf') {
              // Show actual PDF for uploaded files
              const pdfUrl = URL.createObjectURL(file.fileObject);
              return (
                <div className="h-full bg-gray-100">
                  <div className="h-full flex flex-col">
                    <div className="bg-white border-b p-4 flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">PDF Viewer</h3>
                      <div className="flex space-x-2">
                        <button 
                          onClick={downloadFile}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                        >
                          Download
                        </button>
                        <button 
                          onClick={openInNewTab}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                        >
                          Open in New Tab
                        </button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <iframe
                        src={pdfUrl}
                        className="w-full h-full border-0"
                        title="PDF Viewer"
                        onLoad={() => URL.revokeObjectURL(pdfUrl)}
                      />
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="h-full bg-gray-100">
                  <div className="h-full flex flex-col">
                    <div className="bg-white border-b p-4 flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">PDF Viewer</h3>
                      <div className="flex space-x-2">
                        <button 
                          onClick={downloadFile}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                        >
                          Download
                        </button>
                        <button 
                          onClick={openInNewTab}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                        >
                          Open in New Tab
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center bg-gray-200">
                      <div className="bg-white shadow-lg rounded-lg p-8 max-w-2xl w-full">
                        <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-center mb-2">{file.name}</h4>
                        <p className="text-gray-600 text-center mb-4">PDF Document</p>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p><strong>Size:</strong> {file.size}</p>
                          <p><strong>Type:</strong> Portable Document Format</p>
                          <p><strong>Pages:</strong> Multiple pages</p>
                        </div>
                        <button 
                          onClick={openInNewTab}
                          className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open PDF in New Tab
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          } else if (['doc', 'docx', 'rtf'].includes(fileExtension)) {
            return (
              <div className="h-full bg-gray-100">
                <div className="h-full flex flex-col">
                  <div className="bg-white border-b p-4 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Document Viewer</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={downloadFile}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                      >
                        Download
                      </button>
                      <button 
                        onClick={openInNewTab}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                      >
                        Open in New Tab
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-6 bg-white m-4 rounded-lg shadow-lg overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                      <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{file.title}</h1>
                        <p className="text-sm text-gray-500">Document preview - {file.name}</p>
                      </div>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed mb-4">
                          This is a preview of your Word document. The actual content would be rendered here 
                          with proper formatting, fonts, and styling preserved.
                        </p>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          {file.description}
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <p className="text-sm text-gray-600 italic">
                            Note: To display actual document content, you would need to integrate with a document 
                            parsing service or use a library like mammoth.js for Word documents.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          } else if (['xlsx', 'xls'].includes(fileExtension)) {
            return (
              <div className="h-full bg-gray-100">
                <div className="h-full flex flex-col">
                  <div className="bg-white border-b p-4 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Spreadsheet Viewer</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={downloadFile}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                      >
                        Download
                      </button>
                      <button 
                        onClick={openInNewTab}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                      >
                        Open in New Tab
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="bg-white rounded-lg shadow-lg h-full overflow-hidden">
                      <div className="p-4 border-b">
                        <h4 className="font-semibold text-gray-900">{file.name}</h4>
                        <p className="text-sm text-gray-500">Excel Spreadsheet</p>
                      </div>
                      <div className="overflow-auto h-full">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left border-r border-gray-200">A</th>
                              <th className="px-4 py-2 text-left border-r border-gray-200">B</th>
                              <th className="px-4 py-2 text-left border-r border-gray-200">C</th>
                              <th className="px-4 py-2 text-left border-r border-gray-200">D</th>
                              <th className="px-4 py-2 text-left">E</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-200">
                              <td className="px-4 py-2 border-r border-gray-200">Quarter</td>
                              <td className="px-4 py-2 border-r border-gray-200">Revenue</td>
                              <td className="px-4 py-2 border-r border-gray-200">Expenses</td>
                              <td className="px-4 py-2 border-r border-gray-200">Profit</td>
                              <td className="px-4 py-2">Growth %</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="px-4 py-2 border-r border-gray-200">Q1 2025</td>
                              <td className="px-4 py-2 border-r border-gray-200">$125,000</td>
                              <td className="px-4 py-2 border-r border-gray-200">$95,000</td>
                              <td className="px-4 py-2 border-r border-gray-200">$30,000</td>
                              <td className="px-4 py-2">15.2%</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="px-4 py-2 border-r border-gray-200">Q2 2025</td>
                              <td className="px-4 py-2 border-r border-gray-200">$142,500</td>
                              <td className="px-4 py-2 border-r border-gray-200">$98,500</td>
                              <td className="px-4 py-2 border-r border-gray-200">$44,000</td>
                              <td className="px-4 py-2">22.8%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 bg-gray-50 border-t">
                        <p className="text-sm text-gray-600 mb-2">
                          Note: To display actual Excel content, integrate with SheetJS or similar library.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">Text Document</p>
                  <button 
                    onClick={openInNewTab}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </button>
                </div>
              </div>
            );
          }
        default:
          return (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">Document Preview</p>
                <button 
                  onClick={openInNewTab}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </button>
              </div>
            </div>
          );
      }
    };
                        <p><strong>Type:</strong> Portable Document Format</p>
                        <p><strong>Pages:</strong> Multiple pages</p>
                      </div>
                      <button className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open PDF in New Tab
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          } else if (['doc', 'docx', 'rtf'].includes(fileExtension)) {
            return (
              <div className="h-full bg-gray-100">
                <div className="h-full flex flex-col">
                  <div className="bg-white border-b p-4 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Document Viewer</h3>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">Edit</button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">Print</button>
                    </div>
                  </div>
                  <div className="flex-1 p-6 bg-white m-4 rounded-lg shadow-lg overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                      <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{file.title}</h1>
                        <p className="text-sm text-gray-500">Document preview - {file.name}</p>
                      </div>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed mb-4">
                          This is a preview of your Word document. The actual content would be rendered here 
                          with proper formatting, fonts, and styling preserved.
                        </p>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          {file.description}
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <p className="text-sm text-gray-600 italic">
                            Note: This is a demo preview. In a real implementation, the document content 
                            would be parsed and displayed with full formatting.
                          </p>
                        </div>
                      </div>
                      <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in Word Online
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          } else if (['xlsx', 'xls'].includes(fileExtension)) {
            return (
              <div className="h-full bg-gray-100">
                <div className="h-full flex flex-col">
                  <div className="bg-white border-b p-4 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Spreadsheet Viewer</h3>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">Edit</button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">Download</button>
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="bg-white rounded-lg shadow-lg h-full overflow-hidden">
                      <div className="p-4 border-b">
                        <h4 className="font-semibold text-gray-900">{file.name}</h4>
                        <p className="text-sm text-gray-500">Excel Spreadsheet</p>
                      </div>
                      <div className="overflow-auto h-full">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left border-r border-gray-200">A</th>
                              <th className="px-4 py-2 text-left border-r border-gray-200">B</th>
                              <th className="px-4 py-2 text-left border-r border-gray-200">C</th>
                              <th className="px-4 py-2 text-left border-r border-gray-200">D</th>
                              <th className="px-4 py-2 text-left">E</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-200">
                              <td className="px-4 py-2 border-r border-gray-200">Quarter</td>
                              <td className="px-4 py-2 border-r border-gray-200">Revenue</td>
                              <td className="px-4 py-2 border-r border-gray-200">Expenses</td>
                              <td className="px-4 py-2 border-r border-gray-200">Profit</td>
                              <td className="px-4 py-2">Growth %</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="px-4 py-2 border-r border-gray-200">Q1 2025</td>
                              <td className="px-4 py-2 border-r border-gray-200">$125,000</td>
                              <td className="px-4 py-2 border-r border-gray-200">$95,000</td>
                              <td className="px-4 py-2 border-r border-gray-200">$30,000</td>
                              <td className="px-4 py-2">15.2%</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="px-4 py-2 border-r border-gray-200">Q2 2025</td>
                              <td className="px-4 py-2 border-r border-gray-200">$142,500</td>
                              <td className="px-4 py-2 border-r border-gray-200">$98,500</td>
                              <td className="px-4 py-2 border-r border-gray-200">$44,000</td>
                              <td className="px-4 py-2">22.8%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 bg-gray-50 border-t">
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open in Excel Online
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">Text Document</p>
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </button>
                </div>
              </div>
            );
          }
        default:
          return (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">Document Preview</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </button>
              </div>
            </div>
          );
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex">
          {/* Content Preview - Left Side */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Content Preview</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={downloadFile}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={openInNewTab}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Open in New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              {renderPreview()}
            </div>
          </div>

          {/* Database Card - Right Side */}
          <div className="w-96 border-l bg-gray-50 flex flex-col">
            <div className="p-4 border-b bg-white flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">File Information</h3>
              <button
                onClick={() => setPreviewModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <File className="w-4 h-4 mr-2" />
                  Basic Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {file.name}</div>
                  <div><span className="font-medium">Title:</span> 
                    <p className="mt-1 text-gray-700 font-medium">{file.title}</p>
                  </div>
                  <div><span className="font-medium">Type:</span> {file.type?.toUpperCase()}</div>
                  <div><span className="font-medium">Size:</span> {file.size}</div>
                  <div><span className="font-medium">Category:</span> 
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {file.category}
                    </span>
                  </div>
                  <div><span className="font-medium">Status:</span>
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      {file.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Details */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Content Details
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-gray-600 text-xs leading-relaxed">{file.description}</p>
                  </div>
                  <div>
                    <span className="font-medium">Notes:</span>
                    <p className="mt-1 text-gray-600 text-xs leading-relaxed">{file.notes}</p>
                  </div>
                  <div>
                    <span className="font-medium">Tags:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {file.tags?.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Project & Team */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Project & Team
                </h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Project:</span> {file.project}</div>
                  <div><span className="font-medium">Submitted By:</span> {file.submittedBy}</div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Technical Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Created:</span> {file.createdAt}</div>
                  <div><span className="font-medium">Modified:</span> {file.modifiedAt}</div>
                  <div><span className="font-medium">MIME Type:</span> {file.type}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 flex items-center">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Metadata
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
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">File Manager</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Home</span>
              {currentFolder && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span>{sampleFolders.find(f => f.id === currentFolder)?.name}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                {viewMode === 'list' ? <Grid className="w-5 h-5" /> : <List className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="space-y-1">
              {/* All Content */}
              <div 
                className={`flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-lg transition-all ${
                  currentFolder === null ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-700'
                }`}
                onClick={() => navigateToFolder(null)}
              >
                <Folder className="w-4 h-4 mr-3" />
                <span className="font-medium">All Content</span>
                <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  {sampleFiles.length}
                </span>
              </div>

              {/* Folders */}
              {sampleFolders.map(folder => (
                <div key={folder.id}>
                  <div 
                    className={`flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-lg transition-all ${
                      currentFolder === folder.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-700'
                    }`}
                    onClick={() => navigateToFolder(folder.id)}
                  >
                    {expandedFolders.includes(folder.id) ? 
                      <FolderOpen className="w-4 h-4 mr-3" /> : 
                      <Folder className="w-4 h-4 mr-3" />
                    }
                    <span className="font-medium">{folder.name}</span>
                    <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      {sampleFiles.filter(f => f.folderId === folder.id).length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {currentFolderContents.files.length + currentFolderContents.folders.length} items
              </span>
              {selectedFiles.length > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  {selectedFiles.length} selected
                </span>
              )}
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center">
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </button>
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center">
                  <Move className="w-4 h-4 mr-1" />
                  Move
                </button>
                <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto">
            {/* Headers */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Modified</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-1">Size</div>
              <div className="col-span-2">Project</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Actions</div>
            </div>

            <div className="divide-y divide-gray-200">
              {/* Folders */}
              {currentFolderContents.folders.map(folder => (
                <div
                  key={folder.id}
                  className="grid grid-cols-12 gap-4 px-6 py-3 text-sm hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigateToFolder(folder.id)}
                >
                  <div className="col-span-4 flex items-center">
                    <Folder className="w-4 h-4 text-blue-500 mr-3" />
                    <span className="font-medium text-gray-900">{folder.name}</span>
                  </div>
                  <div className="col-span-2 text-gray-500">-</div>
                  <div className="col-span-1 text-gray-500">Folder</div>
                  <div className="col-span-1 text-gray-500">-</div>
                  <div className="col-span-2 text-gray-500">-</div>
                  <div className="col-span-1 text-gray-500">-</div>
                  <div className="col-span-1"></div>
                </div>
              ))}

              {/* Files */}
              {currentFolderContents.files.map(file => (
                <div
                  key={file.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-3 text-sm hover:bg-gray-50 cursor-pointer ${
                    selectedFiles.includes(file.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => toggleFileSelection(file.id)}
                  onContextMenu={(e) => handleRightClick(e, file)}
                >
                  <div className="col-span-4 flex items-center">
                    {getFileIcon(file.type)}
                    <span className="ml-3 font-medium text-gray-900 truncate">{file.name}</span>
                  </div>
                  <div className="col-span-2 text-gray-500">{file.modifiedAt}</div>
                  <div className="col-span-1 text-gray-500 uppercase">{file.type}</div>
                  <div className="col-span-1 text-gray-500">{file.size}</div>
                  <div className="col-span-2 text-gray-600 truncate">{file.project}</div>
                  <div className="col-span-1">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {file.status}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewModal(file);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRightClick(e, file);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {currentFolderContents.files.length === 0 && currentFolderContents.folders.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No files found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {searchQuery ? 'Try adjusting your search terms' : 'Upload some files to get started'}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Files
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleContextMenuAction('open', contextMenu.file)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <ExternalLink className="w-4 h-4 mr-3" />
            Open
          </button>
          <button
            onClick={() => handleContextMenuAction('download', contextMenu.file)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <Download className="w-4 h-4 mr-3" />
            Download
          </button>
          <hr className="my-1" />
          <button
            onClick={() => handleContextMenuAction('copy', contextMenu.file)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <Copy className="w-4 h-4 mr-3" />
            Copy
          </button>
          <button
            onClick={() => handleContextMenuAction('move', contextMenu.file)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <Move className="w-4 h-4 mr-3" />
            Move
          </button>
          <hr className="my-1" />
          <button
            onClick={() => handleContextMenuAction('delete', contextMenu.file)}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-3" />
            Delete
          </button>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal />

      {/* Preview Modal */}
      {previewModal && <PreviewModal file={previewModal} />}
    </div>
  );
};

export default App;
