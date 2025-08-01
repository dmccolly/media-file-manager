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

  // Fetch all files from Airtable with pagination
  async fetchAllFiles() {
    console.log('🔄 AirtableService: Fetching files from Airtable...');
    
    try {
      let allRecords = [];
      let offset = null;
      
      do {
        const url = offset 
          ? `${this.baseUrl}?offset=${offset}` 
          : this.baseUrl;
        
        console.log('📡 AirtableService: Fetching page...', { offset });
        
        const response = await fetch(url, {
          method: 'GET',
          headers: this.headers
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 AirtableService: Raw response data:', data);
        
        allRecords = allRecords.concat(data.records || []);
        offset = data.offset;
        
        console.log(`📊 AirtableService: Page fetched. Records this page: ${data.records?.length || 0}, Total so far: ${allRecords.length}`);
        
      } while (offset);

      console.log(`✅ AirtableService: Total records fetched: ${allRecords.length}`);
      return this.processRecords(allRecords);
      
    } catch (error) {
      console.error('❌ AirtableService: Error fetching files:', error);
      throw error;
    }
  }

  // Process raw Airtable records into app format
  processRecords(records) {
    console.log('🔄 AirtableService: Processing records...', records);
    
    const processedFiles = records.map(record => {
      const fields = record.fields || {};
      
      return {
        id: record.id,
        title: fields['Title'] || fields['Name'] || 'Untitled',
        url: fields['URL'] || fields['File URL'] || '',
        category: fields['Category'] || 'uncategorized', 
        type: fields['Type'] || this.detectFileType(fields['URL'] || ''),
        station: fields['Station'] || '',
        description: fields['Description'] || '',
        notes: fields['Notes'] || '',
        tags: fields['Tags'] || '',
        uploadDate: fields['Upload Date'] || fields['Created'] || new Date().toISOString(),
        thumbnail: fields['Thumbnail'] || fields['URL'] || '',
        fileSize: fields['File Size'] || 0,
        duration: fields['Duration'] || '',
        originalRecord: record
      };
    });

    console.log('✅ AirtableService: Processed files:', processedFiles);
    return processedFiles;
  }

  // Detect file type from URL
  detectFileType(url) {
    if (!url) return 'unknown';
    
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) return 'audio';
    if (['pdf'].includes(extension)) return 'document';
    
    return 'file';
  }

  // Save new file to Airtable
  async saveFile(fileData) {
    console.log('🔄 AirtableService: Saving file to Airtable:', fileData);
    
    try {
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

      console.log('📡 AirtableService: Sending to Airtable:', airtableData);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(airtableData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ AirtableService: Airtable error:', errorData);
        throw new Error(`Airtable error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ AirtableService: File saved successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ AirtableService: Error saving file:', error);
      throw error;
    }
  }

  // Update existing file in Airtable
  async updateFile(recordId, updates) {
    console.log('🔄 AirtableService: Updating file:', { recordId, updates });
    
    try {
      const response = await fetch(`${this.baseUrl}/${recordId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          fields: updates
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ AirtableService: File updated successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ AirtableService: Error updating file:', error);
      throw error;
    }
  }

  // Delete file from Airtable
  async deleteFile(recordId) {
    console.log('🔄 AirtableService: Deleting file:', recordId);
    
    try {
      const response = await fetch(`${this.baseUrl}/${recordId}`, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ AirtableService: File deleted successfully');
      return true;
      
    } catch (error) {
      console.error('❌ AirtableService: Error deleting file:', error);
      throw error;
    }
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

  // Upload single file to Cloudinary
  async uploadFile(file, onProgress = null) {
    console.log('🔄 CloudinaryService: Starting upload for:', file.name);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', 'HIBF_assets');

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        if (onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              console.log(`📈 CloudinaryService: Upload progress for ${file.name}: ${progress}%`);
              onProgress(progress, file.name);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              console.log('✅ CloudinaryService: Upload successful:', result);
              
              const processedResult = {
                url: result.secure_url,
                thumbnail: this.generateThumbnailUrl(result.secure_url, result.resource_type),
                publicId: result.public_id,
                resourceType: result.resource_type,
                format: result.format,
                size: result.bytes,
                width: result.width,
                height: result.height,
                duration: result.duration,
                originalResult: result
              };
              
              resolve(processedResult);
            } catch (parseError) {
              console.error('❌ CloudinaryService: Error parsing response:', parseError);
              reject(parseError);
            }
          } else {
            console.error('❌ CloudinaryService: Upload failed with status:', xhr.status);
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          console.error('❌ CloudinaryService: Network error during upload');
          reject(new Error('Network error during upload'));
        };

        xhr.open('POST', this.baseUrl);
        xhr.send(formData);
      });

    } catch (error) {
      console.error('❌ CloudinaryService: Error uploading file:', error);
      throw error;
    }
  }

  // Upload multiple files with shared metadata
  async uploadMultipleFiles(files, sharedMetadata = {}, onProgress = null) {
    console.log('🔄 CloudinaryService: Starting batch upload for', files.length, 'files');
    console.log('📋 CloudinaryService: Shared metadata:', sharedMetadata);
    
    const uploadPromises = Array.from(files).map(async (file, index) => {
      try {
        // Individual progress callback
        const fileProgress = (progress, fileName) => {
          if (onProgress) {
            onProgress(index, progress, fileName);
          }
        };

        // Upload to Cloudinary
        const cloudinaryResult = await this.uploadFile(file, fileProgress);
        
        // Combine with metadata and file info
        const fileData = {
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
          size: file.size,
          duration: cloudinaryResult.duration || '',
          originalFile: file,
          cloudinaryData: cloudinaryResult
        };

        console.log('✅ CloudinaryService: File processed:', fileData);
        return fileData;

      } catch (error) {
        console.error('❌ CloudinaryService: Error uploading file:', file.name, error);
        return {
          name: file.name,
          error: error.message,
          failed: true
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => !r.failed);
    const failed = results.filter(r => r.failed);

    console.log(`✅ CloudinaryService: Batch upload complete. Success: ${successful.length}, Failed: ${failed.length}`);
    
    return {
      successful,
      failed,
      total: files.length
    };
  }

  // Categorize file based on type
  categorizeFile(file) {
    const type = file.type.toLowerCase();
    
    if (type.startsWith('image/')) return 'Images';
    if (type.startsWith('video/')) return 'Video';
    if (type.startsWith('audio/')) return 'Audio';
    if (type.includes('pdf')) return 'Documents';
    if (type.includes('text/') || type.includes('document')) return 'Documents';
    
    return 'Files';
  }

  // Get file type for display
  getFileType(file) {
    const type = file.type.toLowerCase();
    
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf')) return 'document';
    
    return 'file';
  }

  // Generate thumbnail URL for different media types
  generateThumbnailUrl(originalUrl, resourceType) {
    if (!originalUrl) return '';
    
    try {
      // For images, create a small thumbnail
      if (resourceType === 'image') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill/');
      }
      
      // For videos, get first frame as thumbnail
      if (resourceType === 'video') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,so_0/').replace(/\.[^.]+$/, '.jpg');
      }
      
      // For other types, return original URL
      return originalUrl;
      
    } catch (error) {
      console.error('❌ CloudinaryService: Error generating thumbnail:', error);
      return originalUrl;
    }
  }
}

// =============================================
// UI COMPONENTS
// =============================================

// Folder Tree Component
const FolderTree = ({ 
  folderTree, 
  currentFolder, 
  setCurrentFolder, 
  expandedFolders, 
  setExpandedFolders,
  setContextMenu,
  onCreateFolder 
}) => {
  const handleFolderClick = (folder) => {
    setCurrentFolder(folder);
  };

  const handleFolderRightClick = (e, folder) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type: 'folder',
      target: folder
    });
  };

  return (
    <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Folders</h3>
        <button
          onClick={onCreateFolder}
          className="text-blue-600 hover:text-blue-800 text-sm"
          title="Create New Folder"
        >
          + New
        </button>
      </div>
      
      <div className="space-y-1">
        {Object.entries(folderTree).map(([folder, count]) => (
          <div key={folder} className="group">
            <div
              className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 ${
                currentFolder === folder ? 'bg-blue-100 text-blue-800' : 'text-gray-700'
              }`}
              onClick={() => handleFolderClick(folder)}
              onContextMenu={(e) => handleFolderRightClick(e, folder)}
            >
              <span className="w-4 h-4 mr-2">📁</span>
              <span className="flex-1 truncate">{folder}</span>
              <span className="text-xs text-gray-500 ml-2">({count})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Upload Button Component
const UploadButton = ({ onFileSelect, isUploading }) => {
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFileSelect(files);
    }
    e.target.value = ''; // Reset input
  };

  return (
    <div className="relative">
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />
      <button
        className={`px-4 py-2 rounded-lg font-medium ${
          isUploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : '📤 Upload Files'}
      </button>
    </div>
  );
};
// Progress Bar Component
const ProgressBar = ({ uploads, onClose }) => {
  if (!uploads || uploads.length === 0) return null;

  const overallProgress = uploads.reduce((sum, upload) => sum + upload.progress, 0) / uploads.length;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-64 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-800">Uploading Files</h4>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Overall Progress</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {uploads.map((upload, index) => (
          <div key={index} className="text-sm">
            <div className="flex justify-between text-gray-600 mb-1">
              <span className="truncate">{upload.name}</span>
              <span>{upload.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  upload.progress === 100 ? 'bg-green-500' : 'bg-blue-600'
                }`}
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Context Menu Component
const ContextMenu = ({ contextMenu, onClose, onAction }) => {
  if (!contextMenu.show) return null;

  const handleAction = (action) => {
    onAction(action, contextMenu.target);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        {contextMenu.type === 'file' && (
          <>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
              onClick={() => handleAction('preview')}
            >
              👁️ Preview
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
              onClick={() => handleAction('download')}
            >
              💾 Download
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
              onClick={() => handleAction('rename')}
            >
              ✏️ Rename
            </button>
            <hr className="my-1" />
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
              onClick={() => handleAction('delete')}
            >
              🗑️ Delete
            </button>
          </>
        )}
        
        {contextMenu.type === 'folder' && (
          <>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
              onClick={() => handleAction('rename')}
            >
              ✏️ Rename Folder
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
              onClick={() => handleAction('delete')}
            >
              🗑️ Delete Folder
            </button>
          </>
        )}
      </div>
    </>
  );
};

// File Grid Component
const FileGrid = ({ files, viewMode, onFileRightClick, onFileDoubleClick }) => {
  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📁</div>
          <p>No files in this folder</p>
          <p className="text-sm">Drag files here or use the upload button</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Size</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr
                key={file.id}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onContextMenu={(e) => onFileRightClick(e, file)}
                onDoubleClick={() => onFileDoubleClick(file)}
              >
                <td className="px-4 py-2">
                  <div className="flex items-center">
                    <span className="mr-2">
                      {file.type === 'image' && '🖼️'}
                      {file.type === 'video' && '🎥'}
                      {file.type === 'audio' && '🎵'}
                      {file.type === 'document' && '📄'}
                      {!['image', 'video', 'audio', 'document'].includes(file.type) && '📁'}
                    </span>
                    <span className="truncate">{file.title}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 capitalize">{file.type}</td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {file.fileSize ? `${(file.fileSize / 1024 / 1024).toFixed(1)} MB` : '-'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md cursor-pointer transition-shadow"
            onContextMenu={(e) => onFileRightClick(e, file)}
            onDoubleClick={() => onFileDoubleClick(file)}
          >
            <div className="aspect-square mb-2 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
              {file.type === 'image' && file.thumbnail ? (
                <img
                  src={file.thumbnail}
                  alt={file.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="text-2xl">
                  {file.type === 'image' && '🖼️'}
                  {file.type === 'video' && '🎥'}
                  {file.type === 'audio' && '🎵'}
                  {file.type === 'document' && '📄'}
                  {!['image', 'video', 'audio', 'document'].includes(file.type) && '📁'}
                </div>
              )}
            </div>
            <div className="text-sm">
              <p className="font-medium truncate" title={file.title}>
                {file.title}
              </p>
              <p className="text-gray-500 text-xs capitalize">{file.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Upload Metadata Form Component
const UploadMetadataForm = ({ isOpen, onClose, onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    category: initialData.category || 'Images',
    station: initialData.station || '',
    description: initialData.description || '',
    notes: initialData.notes || '',
    tags: initialData.tags || '',
    ...initialData
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Upload Settings</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Images">Images</option>
              <option value="Video">Video</option>
              <option value="Audio">Audio</option>
              <option value="Documents">Documents</option>
              <option value="Files">Files</option>
              <option value="product">Product</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Station
            </label>
            <input
              type="text"
              value={formData.station}
              onChange={(e) => handleChange('station', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Studio A, Location B"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the files..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload Files
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Drag and Drop Overlay Component
const DragDropOverlay = ({ isDragOver }) => {
  if (!isDragOver) return null;

  return (
    <div className="fixed inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-lg text-center">
        <div className="text-4xl mb-4">📤</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Drop files to upload</h3>
        <p className="text-gray-600">Release to start uploading</p>
      </div>
    </div>
  );
};

// File Preview Modal Component
const FilePreviewModal = ({ file, isOpen, onClose }) => {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold truncate">{file.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 overflow-auto max-h-[calc(90vh-8rem)]">
          {file.type === 'image' && (
            <img
              src={file.url}
              alt={file.title}
              className="max-w-full max-h-full object-contain"
            />
          )}
          
          {file.type === 'video' && (
            <video
              src={file.url}
              controls
              className="max-w-full max-h-full"
            >
              Your browser does not support video playback.
            </video>
          )}
          
          {file.type === 'audio' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎵</div>
              <audio
                src={file.url}
                controls
                className="w-full max-w-md"
              >
                Your browser does not support audio playback.
              </audio>
            </div>
          )}
          
          {!['image', 'video', 'audio'].includes(file.type) && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-gray-600 mb-4">Preview not available for this file type</p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Open File
              </a>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <span className="ml-2 text-gray-600">{file.category}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <span className="ml-2 text-gray-600 capitalize">{file.type}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Station:</span>
                <span className="ml-2 text-gray-600">{file.station || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Upload Date:</span>
                <span className="ml-2 text-gray-600">
                  {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-700">Description:</span>
                <span className="ml-2 text-gray-600">{file.description || 'No description'}</span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-700">Tags:</span>
                <span className="ml-2 text-gray-600">{file.tags || 'No tags'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// MAIN APPLICATION COMPONENT
// =============================================
export default function App() {
  console.log('🚀 App: Starting File Manager...');

  // Initialize services
  const airtableService = useMemo(() => {
    console.log('🔧 App: Initializing AirtableService...');
    return new AirtableService();
  }, []);

  const cloudinaryService = useMemo(() => {
    console.log('🔧 App: Initializing CloudinaryService...');
    return new CloudinaryService();
  }, []);

  // State Management
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('Images');
  const [viewMode, setViewMode] = useState('grid');
  const [expandedFolders, setExpandedFolders] = useState(['Images', 'Video', 'Audio']);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, type: '', target: null });
  
  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  
  // UI states
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Computed Values
  const folderTree = useMemo(() => {
    console.log('🔄 App: Computing folder tree from files:', files);
    
    const tree = {};
    files.forEach(file => {
      const category = file.category || 'uncategorized';
      tree[category] = (tree[category] || 0) + 1;
    });
    
    console.log('📊 App: Folder tree:', tree);
    return tree;
  }, [files]);

  const currentFiles = useMemo(() => {
    const filtered = files.filter(file => file.category === currentFolder);
    console.log(`📁 App: Files in ${currentFolder}:`, filtered.length);
    return filtered;
  }, [files, currentFolder]);

  // Load Files from Database
  const loadFiles = useCallback(async () => {
    console.log('🔄 App: Loading files from database...');
    setLoading(true);
    setError(null);

    try {
      const loadedFiles = await airtableService.fetchAllFiles();
      console.log('✅ App: Files loaded successfully:', loadedFiles);
      setFiles(loadedFiles);
    } catch (err) {
      console.error('❌ App: Error loading files:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [airtableService]);

  // Initial load
  useEffect(() => {
    console.log('🔄 App: Component mounted, loading files...');
    loadFiles();
  }, [loadFiles]);

  // File Upload Functions
  const startUpload = useCallback((selectedFiles, metadata) => {
    console.log('🔄 App: Starting upload process...', { files: selectedFiles.length, metadata });
    setIsUploading(true);
    setUploads(selectedFiles.map(file => ({ name: file.name, progress: 0 })));
    setShowUploadForm(false);

    const uploadProcess = async () => {
      try {
        const result = await cloudinaryService.uploadMultipleFiles(
          selectedFiles,
          metadata,
          (fileIndex, progress, fileName) => {
            console.log(`📈 App: Upload progress - ${fileName}: ${progress}%`);
            setUploads(prev => prev.map((upload, index) => 
              index === fileIndex ? { ...upload, progress } : upload
            ));
          }
        );

        console.log('🔄 App: Upload to Cloudinary complete, saving to database...', result);

        // Save successful uploads to Airtable
        const savePromises = result.successful.map(async (fileData) => {
          try {
            await airtableService.saveFile(fileData);
            console.log('✅ App: File saved to database:', fileData.title);
          } catch (error) {
            console.error('❌ App: Error saving file to database:', error);
            throw error;
          }
        });

        await Promise.all(savePromises);

        // Show results
        if (result.failed.length > 0) {
          console.warn('⚠️ App: Some uploads failed:', result.failed);
          alert(`Upload complete! ${result.successful.length} files uploaded successfully, ${result.failed.length} failed.`);
        } else {
          console.log('✅ App: All uploads successful!');
          alert(`All ${result.successful.length} files uploaded successfully!`);
        }

        // Reload files and reset states
        await loadFiles();
        setUploads([]);
        setPendingFiles([]);

      } catch (error) {
        console.error('❌ App: Upload process failed:', error);
        alert('Upload failed: ' + error.message);
      } finally {
        setIsUploading(false);
      }
    };

    uploadProcess();
  }, [cloudinaryService, airtableService, loadFiles]);

  // Handle File Selection
  const handleFileSelect = useCallback((selectedFiles) => {
    console.log('🔄 App: Files selected for upload:', selectedFiles.length);
    setPendingFiles(selectedFiles);
    setShowUploadForm(true);
  }, []);

  // Handle Upload Form Submit
  const handleUploadSubmit = useCallback((metadata) => {
    console.log('🔄 App: Upload form submitted with metadata:', metadata);
    if (pendingFiles.length > 0) {
      startUpload(pendingFiles, metadata);
    }
  }, [pendingFiles, startUpload]);

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!isDragOver) {
      console.log('🔄 App: Drag over detected');
      setIsDragOver(true);
    }
  }, [isDragOver]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      console.log('🔄 App: Drag leave detected');
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    console.log('🔄 App: Files dropped');
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [handleFileSelect]);

  // Context Menu Handlers
  const handleFileRightClick = useCallback((e, file) => {
    e.preventDefault();
    console.log('🔄 App: File right-clicked:', file.title);
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type: 'file',
      target: file
    });
  }, []);

  const handleContextAction = useCallback(async (action, target) => {
    console.log('🔄 App: Context action:', { action, target: target?.title || target });

    try {
      switch (action) {
        case 'preview':
          setPreviewFile(target);
          setShowPreview(true);
          break;

        case 'download':
          if (target.url) {
            window.open(target.url, '_blank');
          }
          break;

        case 'rename':
          const newTitle = prompt('Enter new name:', target.title);
          if (newTitle && newTitle !== target.title) {
            await airtableService.updateFile(target.id, { 'Title': newTitle });
            await loadFiles();
          }
          break;

        case 'delete':
          if (confirm(`Are you sure you want to delete "${target.title}"?`)) {
            await airtableService.deleteFile(target.id);
            await loadFiles();
          }
          break;

        default:
          console.log('🔄 App: Unknown action:', action);
      }
    } catch (error) {
      console.error('❌ App: Context action failed:', error);
      alert('Action failed: ' + error.message);
    }
  }, [airtableService, loadFiles]);

  const closeContextMenu = useCallback(() => {
    setContextMenu({ show: false, x: 0, y: 0, type: '', target: null });
  }, []);

  // File Actions
  const handleFileDoubleClick = useCallback((file) => {
    console.log('🔄 App: File double-clicked:', file.title);
    setPreviewFile(file);
    setShowPreview(true);
  }, []);

  // Folder Management
  const handleCreateFolder = useCallback(() => {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      console.log('🔄 App: Creating folder:', folderName);
      // Add folder to current categories if it doesn't exist
      if (!folderTree[folderName.trim()]) {
        setCurrentFolder(folderName.trim());
      }
    }
  }, [folderTree]);

  // Render Loading State
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading files...</p>
        </div>
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <p className="text-red-600 mb-4">Error loading files: {error}</p>
          <button
            onClick={loadFiles}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div 
      className="h-screen flex flex-col bg-gray-50"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📁 File Manager</h1>
            <p className="text-sm text-gray-600">
              {files.length} files • Current: {currentFolder} ({currentFiles.length})
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🔲 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📋 List
              </button>
            </div>

            {/* Upload Button */}
            <UploadButton 
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
            />

            {/* Refresh Button */}
            <button
              onClick={loadFiles}
              disabled={loading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <FolderTree
          folderTree={folderTree}
          currentFolder={currentFolder}
          setCurrentFolder={setCurrentFolder}
          expandedFolders={expandedFolders}
          setExpandedFolders={setExpandedFolders}
          setContextMenu={setContextMenu}
          onCreateFolder={handleCreateFolder}
        />

        {/* File Display Area */}
        <FileGrid
          files={currentFiles}
          viewMode={viewMode}
          onFileRightClick={handleFileRightClick}
          onFileDoubleClick={handleFileDoubleClick}
        />
      </div>

      {/* Upload Progress */}
      <ProgressBar
        uploads={uploads}
        onClose={() => setUploads([])}
      />

      {/* Upload Metadata Form */}
      <UploadMetadataForm
        isOpen={showUploadForm}
        onClose={() => {
          setShowUploadForm(false);
          setPendingFiles([]);
        }}
        onSubmit={handleUploadSubmit}
        initialData={{ category: currentFolder }}
      />

      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={closeContextMenu}
        onAction={handleContextAction}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewFile(null);
        }}
      />

      {/* Drag and Drop Overlay */}
      <DragDropOverlay isDragOver={isDragOver} />
    </div>
  );
}
