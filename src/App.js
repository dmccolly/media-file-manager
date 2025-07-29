import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Folder, FolderOpen, File, Upload, Plus, Search, Grid, List,
  ChevronRight, ChevronDown, Image, Video, FileText, Music, X,
  ExternalLink, Play, Eye, MoreVertical, Copy, Move, Trash2,
  Edit2, Download, Users, Settings, Link, Check, Square
} from 'lucide-react';

const App = () => {
  // ------------------------------------------------------------------
  // CONFIGURATION
  // ------------------------------------------------------------------
  const AIRTABLE_BASE_ID   = process.env.REACT_APP_AIRTABLE_BASE_ID   || 'your_airtable_base_id';
  const AIRTABLE_API_KEY   = process.env.REACT_APP_AIRTABLE_API_KEY   || 'your_airtable_api_key';
  const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your_cloudinary_cloud_name';
  const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'your_upload_preset';

  const airtableApi = {
    baseUrl: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  // ------------------------------------------------------------------
  // INITIAL STATE
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // LIFECYCLE
  // ------------------------------------------------------------------
  useEffect(() => {
    loadFilesFromAirtable();
    loadFoldersFromAirtable();
  }, []);

  // ------------------------------------------------------------------
  // AIRTABLE / CLOUDINARY
  // ------------------------------------------------------------------
  const loadFilesFromAirtable = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${airtableApi.baseUrl}/Files`, { headers: airtableApi.headers });
      if (!res.ok) return;
      const data = await res.json();
      setFiles(data.records.map(r => ({
        id: r.id,
        ...r.fields,
        tags: r.fields.Tags ? r.fields.Tags.split(',').map(t => t.trim()) : []
      })));
    } finally { setIsLoading(false); }
  };

  const loadFoldersFromAirtable = async () => {
    try {
      const res = await fetch(`${airtableApi.baseUrl}/Folders`, { headers: airtableApi.headers });
      if (!res.ok) return;
      const data = await res.json();
      setFolders(prev => {
        const db = data.records.map(r => ({
          id: r.id,
          name: r.fields.Name || '',
          parent: r.fields.Parent || null,
          children: r.fields.Children ? r.fields.Children.split(',') : [],
          isEditing: false
        }));
        return [...prev.filter(p => !db.find(d => d.id === p.id)), ...db];
      });
    } catch {}
  };

  const saveFileToAirtable = async fields => {
    const res = await fetch(`${airtableApi.baseUrl}/Files`, { method: 'POST', headers: airtableApi.headers, body: JSON.stringify({ fields }) });
    return res.ok ? (await res.json()).id : null;
  };

  const updateFileInAirtable = (id, updates) =>
    fetch(`${airtableApi.baseUrl}/Files/${id}`, { method: 'PATCH', headers: airtableApi.headers, body: JSON.stringify({ fields: updates }) })
    .then(r => r.ok);

  const deleteFileFromAirtable = id =>
    fetch(`${airtableApi.baseUrl}/Files/${id}`, { method: 'DELETE', headers: airtableApi.headers })
    .then(r => r.ok);

  const uploadToCloudinary = async file => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, { method: 'POST', body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return { url: data.secure_url, publicId: data.public_id };
  };

  // ------------------------------------------------------------------
  // FOLDER HELPERS
  // ------------------------------------------------------------------
  const createNewFolder = () => {
    const id = `folder_${Date.now()}`;
    const folder = { id, name: 'New Folder', parent: currentFolder?.id || 'all', children: [], isEditing: true };
    setFolders(f => [...f, folder]);
    if (currentFolder) {
      setFolders(f => f.map(o => o.id === currentFolder.id ? { ...o, children: [...o.children, id] } : o));
      setExpandedFolders(e => [...e, currentFolder.id]);
    }
  };
  const startFolderEdit = id => setFolders(f => f.map(o => o.id === id ? { ...o, isEditing: true } : o));
  const saveFolderName = async (id, name) => {
    if (!name.trim()) return;
    setFolders(f => f.map(o => o.id === id ? { ...o, name: name.trim(), isEditing: false } : o));
    await fetch(`${airtableApi.baseUrl}/Folders/${id}`, { method: 'PATCH', headers: airtableApi.headers, body: JSON.stringify({ fields: { Name: name.trim() } }) });
  };
  const cancelFolderEdit = id => setFolders(f => f.map(o => o.id === id ? { ...o, isEditing: false } : o));

  // ------------------------------------------------------------------
  // FILE HELPERS
  // ------------------------------------------------------------------
  const currentFolderFiles = files.filter(f =>
    (currentFolder?.id === 'all' || f.folderId === currentFolder?.id) &&
    (f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.title?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleFileSelection = id => {
    const next = new Set(selectedFiles);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedFiles(next);
  };
  const selectAllFiles = () =>
    setSelectedFiles(selectedFiles.size === currentFolderFiles.length ? new Set() : new Set(currentFolderFiles.map(f => f.id)));

  // ------------------------------------------------------------------
  // UPLOAD
  // ------------------------------------------------------------------
  const handleFilesSelected = e => {
    const list = Array.from(e.target.files).map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      title: '',
      description: '',
      tags: '',
      category: file.type.startsWith('image/') ? 'Graphic' : file.type.startsWith('video/') ? 'Video' : file.type.startsWith('audio/') ? 'Audio' : 'Document',
      project: '',
      notes: '',
      submittedBy: '',
      station: '',
      yearProduced: new Date().getFullYear().toString(),
      status: 'draft'
    }));
    setUploadingFiles(list);
    setShowUploadModal(true);
  };

  const updateFileField = useCallback((index, field, value) => {
    setUploadingFiles(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const uploadFiles = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    const total = uploadingFiles.length;
    for (let idx = 0; idx < total; idx++) {
      const data = uploadingFiles[idx];
      const cloud = await uploadToCloudinary(data.file);
      if (!cloud) continue;
      const fields = {
        name: data.name,
        title: data.title || data.name.split('.')[0],
        folderId: currentFolder?.id === 'all' ? 'marketing' : currentFolder?.id,
        type: data.file.type.startsWith('image/') ? 'image' :
              data.file.type.startsWith('video/') ? 'video' :
              data.file.type.startsWith('audio/') ? 'audio' : 'document',
        size: `${(data.file.size / 1024 / 1024).toFixed(1)} MB`,
        url: cloud.url,
        modified: new Date().toISOString().split('T')[0],
        createdBy: 'Current User',
        submittedBy: data.submittedBy || 'Current User',
        status: data.status,
        category: data.category,
        project: data.project,
        description: data.description,
        notes: data.notes,
        station: data.station,
        yearProduced: data.yearProduced,
        tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
        mimeType: data.file.type
      };
      const id = await saveFileToAirtable(fields);
      if (id) setFiles(p => [...p, { ...fields, id }]);
      setUploadProgress(Math.round((idx + 1) / total * 100));
    }
    setIsUploading(false);
    setShowUploadModal(false);
    setUploadingFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ------------------------------------------------------------------
  // DRAG & DROP
  // ------------------------------------------------------------------
  const handleDragOver = e => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = e => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = e => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (!dropped.length) return;
    const list = dropped.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      title: '',
      category: file.type.startsWith('image/') ? 'Graphic' : file.type.startsWith('video/') ? 'Video' : file.type.startsWith('audio/') ? 'Audio' : 'Document',
      project: '',
      description: '',
      tags: '',
      notes: '',
      submittedBy: '',
      station: '',
      yearProduced: new Date().getFullYear().toString(),
      status: 'draft'
    }));
    setUploadingFiles(list);
    setShowUploadModal(true);
  };

  const handleFileDragStart = (e, id) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedFiles(selectedFiles.has(id) ? selectedFiles : new Set([id]));
  };
  const handleFolderDrop = async (e, folderId) => {
    e.preventDefault();
    const ids = JSON.parse(e.dataTransfer.getData('application/json') || `["${e.dataTransfer.getData('text/plain')}"]`);
    setFiles(f => f.map(file => ids.includes(file.id) ? { ...file, folderId } : file));
    for (const id of ids) await updateFileInAirtable(id, { FolderId: folderId });
    setSelectedFiles(new Set());
  };
  const handleFolderDragOver = e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  const UploadModal = useCallback(() => {
    if (!showUploadModal) return null;
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Upload Files & Add Metadata</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <input
                    type="text"
                    value={fileData.project || ''}
                    onChange={(e) => {
                      e.persist();
                      updateFileField(index, 'project', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={fileData.tags || ''}
                    onChange={(e) => {
                      e.persist();
                      updateFileField(index, 'tags', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted By</label>
                  <input
                    type="text"
                    value={fileData.submittedBy || ''}
                    onChange={(e) => {
                      e.persist();
                      updateFileField(index, 'submittedBy', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Your name or team"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Produced</label>
                  <input
                    type="number"
                    value={fileData.yearProduced || new Date().getFullYear()}
                    onChange={(e) => {
                      e.persist();
                      updateFileField(index, 'yearProduced', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="2024"
                    min="1900"
                    max="2030"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
                  <input
                    type="text"
                    value={fileData.station || ''}
                    onChange={(e) => {
                      e.persist();
                      updateFileField(index, 'station', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Station identifier"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes <span className="text-gray-400">(max 3000)</span>
                  </label>
                  <textarea
                    value={fileData.notes || ''}
                    onChange={(e) => {
                      e.persist();
                      updateFileField(index, 'notes', e.target.value.slice(0, 3000));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    rows="3"
                    placeholder="Additional notes..."
                    maxLength={3000}
                  />
                  <div className="text-xs text-gray-400 mt-1">{(fileData.notes || '').length}/3000</div>
                </div>
              </div>
            </div>
          ))}
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

  const getFileIcon = type => {
    const iconClass = "w-3 h-3 text-white";
    switch (type) {
      case 'image': return <Image className={iconClass} />;
      case 'video': return <Video className={iconClass} />;
      case 'audio': return <Music className={iconClass} />;
      default: return <FileText className={iconClass} />;
    }
  };
  const getStatusColor = status => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'approved': return 'bg-blue-500';
      case 'review': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const PreviewModal = ({ file }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex">
        <div className="flex-1 bg-gray-50 flex items-center justify-center p-4">
          {file.type === 'image' ? (
            <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
          ) : file.type === 'video' ? (
            <video src={file.url} controls className="max-w-full max-h-full rounded-lg shadow-lg">Your browser does not support video playback.</video>
          ) : file.type === 'audio' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-3">
                <Music className="w-8 h-8 text-white" />
              </div>
              <audio src={file.url} controls className="mb-2">Your browser does not support audio playback.</audio>
              <p className="text-gray-600 text-xs">Audio File</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-3">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <button onClick={() => window.open(file.url, '_blank')} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 text-xs">
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
              <button onClick={() => setPreviewModal(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-3 h-3 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <File className="w-2 h-2 mr-1" /> Basic Info
                </h4>
                <div className="space-y-1">
                  <div><span className="text-gray-500 text-xs">Name:</span><p className="font-medium text-gray-900 mt-0.5 text-xs leading-tight">{file.name}</p></div>
                  <div><span className="text-gray-500 text-xs">Title:</span><p className="font-medium text-gray-900 mt-0.5 text-xs leading-tight">{file.title}</p></div>
                  <div className="flex justify-between"><span className="text-gray-500 text-xs">Type:</span><span className="font-medium text-xs">{file.category}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 text-xs">Size:</span><span className="font-medium text-xs">{file.size}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500 text-xs">Status:</span><span className={`px-1 py-0.5 rounded-full text-white ${getStatusColor(file.status)} text-[10px]`}>{file.status}</span></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <FileText className="w-2 h-2 mr-1" /> Content
                </h4>
                <div className="space-y-1">
                  <div><span className="text-gray-500 text-xs">Description:</span><p className="text-gray-900 mt-0.5 text-xs leading-tight">{file.description}</p></div>
                  <div><span className="text-gray-500 text-xs">Notes:</span><p className="text-gray-900 mt-0.5 text-xs leading-tight">{file.notes}</p></div>
                  <div><span className="text-gray-500 text-xs">Tags:</span><div className="flex flex-wrap gap-1 mt-0.5">{file.tags.map((tag, index) => (<span key={index} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[9px]">{tag}</span>))}</div></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <Users className="w-2 h-2 mr-1" /> Team
                </h4>
                <div className="space-y-1">
                  <div><span className="text-gray-500 text-xs">Project:</span><p className="font-medium text-gray-900 mt-0.5 text-xs">{file.project}</p></div>
                  <div><span className="text-gray-500 text-xs">Created By:</span><p className="font-medium text-gray-900 mt-0.5 text-xs">{file.createdBy}</p></div>
                  <div><span className="text-gray-500 text-xs">Submitted By:</span><p className="font-medium text-gray-900 mt-0.5 text-xs">{file.submittedBy}</p></div>
                  <div><span className="text-gray-500 text-xs">Station:</span><p className="font-medium text-gray-900 mt-0.5 text-xs">{file.station}</p></div>
                  <div><span className="text-gray-500 text-xs">Year:</span><p className="font-medium text-gray-900 mt-0.5 text-xs">{file.yearProduced}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFolderTree = (folderId, level = 0) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return null;
    const isExpanded = expandedFolders.includes(folderId);
    const isActive = currentFolder?.id === folderId;
    return (
      <div key={folderId}>
        <div
          className={`flex items-center px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-all ${isActive ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-r-2 border-purple-500' : ''}`}
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => !folder.isEditing && setCurrentFolder(folder)}
          onDrop={(e) => handleFolderDrop(e, folderId)}
          onDragOver={handleFolderDragOver}
          onDragEnter={(e) => e.preventDefault()}
        >
          {folder.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedFolders(prev => isExpanded ? prev.filter(i => i !== folderId) : [...prev, folderId]);
              }}
              className="mr-1"
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          )}
          {folder.children.length === 0 && <div className="w-3" />}
          {isExpanded ? <FolderOpen size={14} className="mr-1.5 text-blue-500" /> : <Folder size={14} className="mr-1.5 text-blue-500" />}
          {folder.isEditing ? (
            <input
              type="text"
              defaultValue={folder.name}
              className="flex-1 text-xs bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
              onBlur={(e) => saveFolderName(folderId, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveFolderName(folderId, e.target.value);
                if (e.key === 'Escape') cancelFolderEdit(folderId);
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
          <span className="ml-auto text-xs text-gray-400">{folderId === 'all' ? files.length : files.filter(f => f.folderId === folderId).length}</span>
        </div>
        {isExpanded && folder.children.length > 0 && (
          <div>{folder.children.map(childId => renderFolderTree(childId, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Ultra Compact Header */}
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
              onClick={handleFileUpload}
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

      <div className="flex flex-1 overflow-hidden">
        {/* Ultra Compact Sidebar */}
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

        {/* Main Content */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Compact Toolbar */}
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
                    <span className="text-xs text-gray-500">
                      {selectedFiles.size} selected
                    </span>
                    <div className="w-px h-3 bg-gray-300" />
                    <div className="relative">
                      <button
                        className="flex items-center space-x-0.5 px-1 py-0.5 text-xs text-green-600 hover:bg-green-50 rounded"
                        title="Move selected files"
                      >
                        <Move className="w-3 h-3" />
                        <span>Move to</span>
                      </button>
                    </div>
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

          {/* File List */}
          <div className="flex-1 overflow-y-auto">
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-300 flex items-center justify-center z-10">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-700">Drop files here to upload</p>
                  <p className="text-xs text-blue-600">to {currentFolder?.name}</p>
                </div>
              </div>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm font-medium text-gray-500">Loading files from database...</p>
                  <p className="text-xs text-gray-400">Connecting to Airtable & Cloudinary</p>
                </div>
              </div>
            ) : (
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
                          <p className="font-medium text-gray-900 truncate text-xs" title={file.name}>{file.name}</p>
                          <p className="text-gray-500 truncate" title={file.title} style={{ fontSize: '10px' }}>{file.title}</p>
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center text-gray-600 text-xs">{file.modified}</div>

                      <div className="col-span-1 flex items-center">
                        <span className="px-1 py-0.5 bg-gray-100 text-gray-700 rounded-full" style={{ fontSize: '9px' }}>{file.category}</span>
                      </div>

                      <div className="col-span-1 flex items-center text-gray-600 text-xs">{file.size}</div>

                      <div className="col-span-2 flex items-center">
                        <span className="truncate text-gray-700 text-xs" title={file.project}>{file.project}</span>
                      </div>

                      <div className="col-span-1 flex items-center space-x-0.5">
                        <button onClick={() => setPreviewModal(file)} className="p-0.5 hover:bg-gray-200 rounded transition-colors" title="Preview">
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

                {currentFolderFiles.length === 0 && !isLoading && (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-500">No files found</p>
                      <p className="text-xs text-gray-400">Upload files or try adjusting your search</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple onChange={handleFilesSelected} className="hidden" />
      {UploadModal()}
      {previewModal && <PreviewModal file={previewModal} />}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button onClick={() => { setPreviewModal(contextMenu.file); setContextMenu(null); }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center space-x-2 text-xs">
            <Eye className="w-3 h-3" /><span>Open</span>
          </button>
          <button onClick={() => { window.open(contextMenu.file.url, '_blank'); setContextMenu(null); }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center space-x-2 text-xs">
            <Download className="w-3 h-3" /><span>Download</span>
          </button>
          <hr className="my-1" />
          <button onClick={() => { copySelectedFiles(currentFolder?.id); setContextMenu(null); }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center space-x-2 text-xs">
            <Copy className="w-3 h-3" /><span>Copy</span>
          </button>
          <button onClick={async () => {
            if (window.confirm('Delete this file?')) {
              await deleteFileFromAirtable(contextMenu.file.id);
              setFiles(prev => prev.filter(f => f.id !== contextMenu.file.id));
            }
            setContextMenu(null);
          }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600 text-xs">
            <Trash2 className="w-3 h-3" /><span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
