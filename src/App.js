import React, { useState, useEffect, useCallback, useMemo } from 'react';

// =============================================
// AIRTABLE SERVICE CLASS
// =============================================
class AirtableService {
  constructor() {
    this.baseId = 'appTK2fgCwe039t5J';
    this.apiKey = 'patbQMUOfJRtJ1S5d.be54ccdaf03c795c8deca53ae7c05ddbda8efe584e9a07a613a79fd0f0c04dc9';
    this.baseUrl = `https://api.airtable.com/v0/${this.baseId}/Media%20Assets`;
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async fetchAllFiles() {
    console.log('🔄 AirtableService: Fetching files from Airtable...');
    
    try {
      let allRecords = [];
      let offset = null;
      
      do {
        const url = offset ? `${this.baseUrl}?offset=${offset}` : this.baseUrl;
        const response = await fetch(url, { method: 'GET', headers: this.headers });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allRecords = allRecords.concat(data.records || []);
        offset = data.offset;
        
      } while (offset);

      console.log(`✅ AirtableService: Total records fetched: ${allRecords.length}`);
      return this.processRecords(allRecords);
      
    } catch (error) {
      console.error('❌ AirtableService: Error fetching files:', error);
      throw error;
    }
  }

  processRecords(records) {
    return records.map(record => {
      const fields = record.fields || {};
      const url = fields['URL'] || fields['File URL'] || '';
      const detectedType = this.detectFileTypeFromUrl(url);
      const thumbnail = this.generateThumbnailFromUrl(url, detectedType);
      
      console.log(`🔍 File: ${fields['Title']}, Type: ${detectedType}, Thumbnail: ${thumbnail}`);
      
      return {
        id: record.id,
        title: fields['Title'] || fields['Name'] || 'Untitled',
        url: url,
        category: fields['Category'] || 'uncategorized', 
        type: detectedType,
        station: fields['Station'] || '',
        description: fields['Description'] || '',
        notes: fields['Notes'] || '',
        tags: fields['Tags'] || '',
        uploadDate: fields['Upload Date'] || fields['Created'] || new Date().toISOString(),
        thumbnail: thumbnail,
        fileSize: fields['File Size'] || 0,
        duration: fields['Duration'] || ''
      };
    });
  }

  detectFileTypeFromUrl(url) {
    if (!url) return 'unknown';
    
    const extension = url.split('?')[0].split('.').pop()?.toLowerCase();
    
    const typeMap = {
      'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'webp': 'image',
      'mp4': 'video', 'avi': 'video', 'mov': 'video', 'wmv': 'video', 'webm': 'video',
      'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio', 'ogg': 'audio',
      'pdf': 'document', 'doc': 'document', 'docx': 'document', 'txt': 'document',
      'xls': 'spreadsheet', 'xlsx': 'spreadsheet', 'csv': 'spreadsheet'
    };
    
    return typeMap[extension] || 'file';
  }

  generateThumbnailFromUrl(url, fileType) {
    if (!url) return '';
    
    try {
      if (url.includes('cloudinary.com')) {
        if (fileType === 'image') {
          return url.replace('/upload/', '/upload/w_150,h_150,c_fill,f_auto,q_auto/');
        }
        if (fileType === 'video') {
          return url.replace('/upload/', '/upload/w_150,h_150,c_fill,f_auto,q_auto,so_0/').replace(/\.(mp4|avi|mov|wmv|webm)$/i, '.jpg');
        }
      }
      
      if (fileType === 'image') return url;
      return '';
      
    } catch (error) {
      console.error('❌ Error generating thumbnail:', error);
      return url;
    }
  }

  async saveFile(fileData) {
    const airtableData = {
      fields: {
        'Title': fileData.title || fileData.name,
        'URL': fileData.url,
        'Category': fileData.category,
        'Type': fileData.type,
        'Station': fileData.station || '',
        'Description': fileData.description || '',
        'Notes': fileData.notes || '',
        'Tags': fileData.tags || '',
        'Upload Date': new Date().toISOString().split('T')[0],
        'File Size': fileData.size || 0,
        'Thumbnail': fileData.thumbnail || fileData.url
      }
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(airtableData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Airtable error: ${errorData.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  async deleteFile(recordId) {
    const response = await fetch(`${this.baseUrl}/${recordId}`, {
      method: 'DELETE',
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  }
}
// =============================================
// CLOUDINARY SERVICE CLASS
// =============================================
class CloudinaryService {
  constructor() {
    this.cloudName = 'dzrw8nopf';
    this.uploadPreset = 'HIBF_MASTER';
    this.baseUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`;
  }

  async uploadFile(file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'HIBF_assets');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress, file.name);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          resolve({
            url: result.secure_url,
            thumbnail: this.generateThumbnailUrl(result.secure_url, result.resource_type),
            publicId: result.public_id,
            resourceType: result.resource_type,
            size: result.bytes
          });
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.open('POST', this.baseUrl);
      xhr.send(formData);
    });
  }

  async uploadMultipleFiles(files, sharedMetadata = {}, onProgress = null) {
    const uploadPromises = Array.from(files).map(async (file, index) => {
      try {
        const fileProgress = (progress, fileName) => {
          if (onProgress) onProgress(index, progress, fileName);
        };

        const cloudinaryResult = await this.uploadFile(file, fileProgress);
        
        return {
          name: file.name,
          title: sharedMetadata.title || file.name.split('.')[0],
          category: sharedMetadata.category || this.categorizeFile(file),
          type: this.getFileType(file),
          station: sharedMetadata.station || '',
          description: sharedMetadata.description || '',
          notes: sharedMetadata.notes || '',
          tags: sharedMetadata.tags || '',
          url: cloudinaryResult.url,
          thumbnail: cloudinaryResult.thumbnail,
          size: file.size
        };
      } catch (error) {
        return { name: file.name, error: error.message, failed: true };
      }
    });

    const results = await Promise.all(uploadPromises);
    return {
      successful: results.filter(r => !r.failed),
      failed: results.filter(r => r.failed),
      total: files.length
    };
  }

  categorizeFile(file) {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) return 'Images';
    if (type.startsWith('video/')) return 'Video';
    if (type.startsWith('audio/')) return 'Audio';
    if (type.includes('pdf') || type.includes('document')) return 'Documents';
    return 'Files';
  }

  getFileType(file) {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf') || type.includes('document')) return 'document';
    return 'file';
  }

  generateThumbnailUrl(originalUrl, resourceType) {
    if (!originalUrl) return '';
    
    try {
      if (resourceType === 'image') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,f_auto,q_auto/');
      }
      if (resourceType === 'video') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,f_auto,q_auto,so_0/').replace(/\.[^.]+$/, '.jpg');
      }
      return originalUrl;
    } catch (error) {
      return originalUrl;
    }
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================
const getFileIcon = (type, size = 'text-2xl') => {
  const icons = {
    image: '🖼️', video: '🎥', audio: '🎵', document: '📄',
    spreadsheet: '📊', presentation: '📽️', archive: '📦', file: '📁', unknown: '❓'
  };
  return <span className={size}>{icons[type] || icons.unknown}</span>;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};
// =============================================
// MAIN APPLICATION COMPONENT
// =============================================
export default function App() {
  // Initialize services
  const airtableService = useMemo(() => new AirtableService(), []);
  const cloudinaryService = useMemo(() => new CloudinaryService(), []);

  // State Management
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('Images');
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [imageErrors, setImageErrors] = useState(new Set());

  // Computed Values
  const folderTree = useMemo(() => {
    const tree = {};
    files.forEach(file => {
      const category = file.category || 'uncategorized';
      tree[category] = (tree[category] || 0) + 1;
    });
    return tree;
  }, [files]);

  const currentFiles = useMemo(() => {
    return files.filter(file => file.category === currentFolder);
  }, [files, currentFolder]);

  // Load Files
  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedFiles = await airtableService.fetchAllFiles();
      setFiles(loadedFiles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [airtableService]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Helper functions
  const handleImageError = (fileId) => {
    setImageErrors(prev => new Set([...prev, fileId]));
  };

  // Upload handler
  const handleUpload = async (uploadFiles, metadata) => {
    setIsUploading(true);
    setUploads(uploadFiles.map(file => ({ name: file.name, progress: 0 })));
    setShowUploadForm(false);

    try {
      const result = await cloudinaryService.uploadMultipleFiles(
        uploadFiles,
        metadata,
        (fileIndex, progress) => {
          setUploads(prev => prev.map((upload, index) => 
            index === fileIndex ? { ...upload, progress } : upload
          ));
        }
      );

      const savePromises = result.successful.map(fileData => airtableService.saveFile(fileData));
      await Promise.all(savePromises);

      if (result.failed.length > 0) {
        alert(`Upload complete! ${result.successful.length} files uploaded, ${result.failed.length} failed.`);
      } else {
        alert(`All ${result.successful.length} files uploaded successfully!`);
      }

      await loadFiles();
      setUploads([]);
      setPendingFiles([]);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <p className="text-red-600 mb-4 text-lg">Error loading files: {error}</p>
          <button onClick={loadFiles} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📁 Enhanced File Manager</h1>
            <p className="text-sm text-gray-600 mt-1">
              {files.length} total files • {currentFiles.length} in {currentFolder}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Upload Button */}
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const selectedFiles = Array.from(e.target.files);
                  if (selectedFiles.length > 0) {
                    setPendingFiles(selectedFiles);
                    setShowUploadForm(true);
                  }
                  e.target.value = '';
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isUploading ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
                disabled={isUploading}
              >
                {isUploading ? '⏳ Uploading...' : '📤 Upload Files'}
              </button>
            </div>

            <button onClick={loadFiles} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              🔄 Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-4">Folders</h3>
          <div className="space-y-1">
            {Object.entries(folderTree).map(([folder, count]) => (
              <div
                key={folder}
                className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-200 transition-colors ${
                  currentFolder === folder ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
                }`}
                onClick={() => setCurrentFolder(folder)}
              >
                <span className="w-4 h-4 mr-2">📁</span>
                <span className="flex-1 truncate">{folder}</span>
                <span className="text-xs text-gray-500 ml-2 bg-gray-200 px-1 rounded">{count}</span>
              </div>
            ))}
          </div>
        </div>
{/* File Display Area */}
        <div className="flex-1 p-4 overflow-auto">
          {currentFiles.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📁</div>
                <p className="text-lg font-medium mb-2">No files in this folder</p>
                <p className="text-sm">Drag files here or use the upload button</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {currentFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-white border-2 rounded-lg p-3 hover:shadow-lg cursor-pointer transition-all duration-200 border-gray-200 hover:border-gray-300"
                  onClick={() => {
                    setSelectedFile(file);
                    setShowFileDetails(true);
                  }}
                >
                  {/* File thumbnail/icon */}
                  <div className="aspect-square mb-2 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {file.type === 'image' && (file.thumbnail || file.url) && !imageErrors.has(file.id) ? (
                      <img
                        src={file.thumbnail || file.url}
                        alt={file.title}
                        className="w-full h-full object-cover rounded-lg"
                        onError={() => handleImageError(file.id)}
                        loading="lazy"
                      />
                    ) : file.type === 'video' && file.thumbnail && !imageErrors.has(file.id) ? (
                      <img
                        src={file.thumbnail}
                        alt={file.title}
                        className="w-full h-full object-cover rounded-lg"
                        onError={() => handleImageError(file.id)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        {getFileIcon(file.type, 'text-3xl')}
                        <span className="text-xs text-gray-500 mt-1 uppercase font-medium">
                          {file.type || 'unknown'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="text-sm">
                    <p className="font-medium truncate text-gray-900" title={file.title}>
                      {file.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {formatFileSize(file.fileSize)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Upload Settings</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const metadata = {
                category: formData.get('category') || currentFolder,
                station: formData.get('station') || '',
                description: formData.get('description') || '',
                tags: formData.get('tags') || ''
              };
              if (pendingFiles.length > 0) {
                await handleUpload(pendingFiles, metadata);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select name="category" defaultValue={currentFolder} className="w-full p-3 border border-gray-300 rounded-lg">
                  <option value="Images">Images</option>
                  <option value="Video">Video</option>
                  <option value="Audio">Audio</option>
                  <option value="Documents">Documents</option>
                  <option value="Files">Files</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
                <input type="text" name="station" placeholder="e.g., Studio A" className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={3} placeholder="Brief description..." className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input type="text" name="tags" placeholder="tag1, tag2, tag3" className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => { setShowUploadForm(false); setPendingFiles([]); }} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Upload Files
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Details Modal */}
      {showFileDetails && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                {getFileIcon(selectedFile.type, 'text-2xl')}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedFile.title}</h2>
                  <p className="text-sm text-gray-500">{selectedFile.category} • {formatFileSize(selectedFile.fileSize)}</p>
                </div>
              </div>
              <button onClick={() => { setShowFileDetails(false); setSelectedFile(null); }} className="p-2 hover:bg-gray-200 rounded-lg">
                ✕
              </button>
            </div>
            
            <div className="flex h-[calc(90vh-120px)]">
              <div className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
                {selectedFile.type === 'image' && selectedFile.url ? (
                  <img src={selectedFile.url} alt={selectedFile.title} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                ) : selectedFile.type === 'video' && selectedFile.url ? (
                  <video src={selectedFile.url} controls className="max-w-full max-h-full rounded-lg shadow-sm">
                    Your browser does not support video playback.
                  </video>
                ) : selectedFile.type === 'audio' && selectedFile.url ? (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎵</div>
                    <audio src={selectedFile.url} controls className="w-full max-w-md">
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-4">{getFileIcon(selectedFile.type, 'text-6xl')}</div>
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    {selectedFile.url && (
                      <a href={selectedFile.url} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        📄 Open File
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="w-96 p-6 overflow-y-auto border-l bg-white">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">File Details</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 block mb-1">File Type</span>
                    <span className="text-sm text-gray-900 capitalize">{selectedFile.type}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 block mb-1">Size</span>
                    <span className="text-sm text-gray-900">{formatFileSize(selectedFile.fileSize)}</span>
                  </div>
                  <div className="
