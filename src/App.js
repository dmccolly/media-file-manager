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

const App = () => {
  // API Configuration
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

  const getFileIcon = (type) => {
    const iconClass = "w-3 h-3 text-white";
    switch (type) {
      case 'image': return <Image className={iconClass} />;
      case 'video': return <Video className={iconClass} />;
      case 'audio': return <Music className={iconClass} />;
      default: return <FileText className={iconClass} />;
    }
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

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Media Manager
          </h1>

          <div className="flex items-center space-x-1.5">
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

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-xs"
            >
              <Upload className="w-3 h-3" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        <div className="flex items-center text-xs text-gray-600">
          <span>Files</span>
          <ChevronRight className="w-2 h-2 mx-1" />
          <span className="font-medium text-gray-900">{currentFolder?.name}</span>
        </div>
      </div>

      {/* Render folder tree and file list here... */}

      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          {/* Context menu buttons here */}
        </div>
      )}

      <UploadModal />
    </div>
  );
};

export default App;
