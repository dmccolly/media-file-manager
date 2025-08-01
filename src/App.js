import React, { useState, useEffect, useCallback, useMemo } from 'react';

// =============================================
// AIRTABLE SERVICE CLASS - FIXED
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

  // FIXED - Process raw Airtable records into app format
  processRecords(records) {
    console.log('🔄 AirtableService: Processing records...', records);
    
    const processedFiles = records.map(record => {
      const fields = record.fields || {};
      const url = fields['URL'] || fields['File URL'] || '';
      
      // Better file type detection
      const detectedType = this.detectFileTypeFromUrl(url);
      console.log(`🔍 File type detection for ${fields['Title']}: ${detectedType} from URL: ${url}`);
      
      // Generate thumbnail with better logic
      const thumbnail = this.generateThumbnailFromUrl(url, detectedType);
      console.log(`🖼️ Thumbnail generated for ${fields['Title']}: ${thumbnail}`);
      
      const processedFile = {
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
        duration: fields['Duration'] || '',
        originalRecord: record
      };
      
      console.log('✅ Processed file:', processedFile);
      return processedFile;
    });

    console.log('✅ AirtableService: All processed files:', processedFiles);
    return processedFiles;
  }

  // FIXED - Enhanced file type detection from URL
  detectFileTypeFromUrl(url) {
    if (!url) {
      console.log('⚠️ No URL provided for file type detection');
      return 'unknown';
    }
    
    console.log(`🔍 Detecting file type from URL: ${url}`);
    
    // Extract extension from URL (handle query parameters)
    const urlParts = url.split('?')[0]; // Remove query params
    const extension = urlParts.split('.').pop()?.toLowerCase();
    
    console.log(`📄 Extracted extension: ${extension}`);
    
    // Enhanced file type mapping
    const typeMap = {
      // Images
      'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 
      'webp': 'image', 'svg': 'image', 'bmp': 'image', 'tiff': 'image', 'tif': 'image',
      
      // Videos  
      'mp4': 'video', 'avi': 'video', 'mov': 'video', 'wmv': 'video', 
      'flv': 'video', 'webm': 'video', 'mkv': 'video', '3gp': 'video', 'm4v': 'video',
      
      // Audio
      'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio', 
      'ogg': 'audio', 'm4a': 'audio', 'wma': 'audio',
      
      // Documents
      'pdf': 'document', 'doc': 'document', 'docx': 'document', 
      'txt': 'document', 'rtf': 'document',
      
      // Spreadsheets
      'xls': 'spreadsheet', 'xlsx': 'spreadsheet', 'csv': 'spreadsheet',
      
      // Presentations
      'ppt': 'presentation', 'pptx': 'presentation',
      
      // Archives
      'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive', 'gz': 'archive'
    };
    
    const detectedType = typeMap[extension] || 'file';
    console.log(`✅ File type detected: ${detectedType} for extension: ${extension}`);
    
    return detectedType;
  }

  // FIXED - Enhanced thumbnail generation
  generateThumbnailFromUrl(url, fileType) {
    if (!url) {
      console.log('⚠️ No URL provided for thumbnail generation');
      return '';
    }
    
    console.log(`🖼️ Generating thumbnail for URL: ${url}, type: ${fileType}`);
    
    try {
      // If it's a Cloudinary URL, generate proper thumbnail
      if (url.includes('cloudinary.com')) {
        console.log('📸 Cloudinary URL detected, generating thumbnail...');
        
        if (fileType === 'image') {
          const thumbnail = url.replace('/upload/', '/upload/w_150,h_150,c_fill,f_auto,q_auto/');
          console.log(`✅ Image thumbnail: ${thumbnail}`);
          return thumbnail;
        }
        
        if (fileType === 'video') {
          const thumbnail = url.replace('/upload/', '/upload/w_150,h_150,c_fill,f_auto,q_auto,so_0/')
                              .replace(/\.(mp4|avi|mov|wmv|flv|webm|mkv|3gp|m4v)$/i, '.jpg');
          console.log(`✅ Video thumbnail: ${thumbnail}`);
          return thumbnail;
        }
        
        // NEW: Handle documents and PDFs
        if (fileType === 'document' || fileType === 'spreadsheet' || fileType === 'presentation') {
          const thumbnail = url.replace('/upload/', '/upload/w_150,h_150,c_fill,f_jpg,pg_1/');
          console.log(`✅ Document thumbnail: ${thumbnail}`);
          return thumbnail;
        }
      }
      
      // For non-Cloudinary URLs or non-media files, return original URL for images
      if (fileType === 'image') {
        console.log(`✅ Direct image URL: ${url}`);
        return url;
      }
      
      // For other file types, no thumbnail URL needed (will show icon)
      console.log(`ℹ️ No thumbnail needed for type: ${fileType}`);
      return '';
      
    } catch (error) {
      console.error('❌ Error generating thumbnail:', error);
      return url; // Fallback to original URL
    }
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

  // Update multiple files at once
  async updateMultipleFiles(updates) {
    console.log('🔄 AirtableService: Updating multiple files:', updates);
    
    try {
      const records = updates.map(update => ({
        id: update.id,
        fields: update.fields
      }));

      const response = await fetch(this.baseUrl, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          records: records
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ AirtableService: Multiple files updated successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ AirtableService: Error updating multiple files:', error);
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

  // Delete multiple files at once
  async deleteMultipleFiles(recordIds) {
    console.log('🔄 AirtableService: Deleting multiple files:', recordIds);
    
    try {
      const deletePromises = recordIds.map(id => this.deleteFile(id));
      await Promise.all(deletePromises);
      
      console.log('✅ AirtableService: Multiple files deleted successfully');
      return true;
      
    } catch (error) {
      console.error('❌ AirtableService: Error deleting multiple files:', error);
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
    if (type.includes('spreadsheet') || type.includes('excel')) return 'Documents';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'Documents';
    
    return 'Files';
  }

  // Get file type for display
  getFileType(file) {
    const type = file.type.toLowerCase();
    
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf')) return 'document';
    if (type.includes('text/') || type.includes('document')) return 'document';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'spreadsheet';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'presentation';
    
    return 'file';
  }

  // Generate thumbnail URL for different media types
  generateThumbnailUrl(originalUrl, resourceType) {
    if (!originalUrl) return '';
    
    try {
      // For images, create a small thumbnail
      if (resourceType === 'image') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,f_auto,q_auto/');
      }
      
      // For videos, get first frame as thumbnail
      if (resourceType === 'video') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,f_auto,q_auto,so_0/').replace(/\.[^.]+$/, '.jpg');
      }
      
      // NEW: For documents, get the first page as a JPG thumbnail
      if (resourceType === 'raw' || resourceType === 'auto') {
        if (originalUrl.endsWith('.pdf')) {
          return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,f_jpg,pg_1/');
        }
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
// UTILITY FUNCTIONS - FIXED
// =============================================

// FIXED - Get file type icon
const getFileIcon = (type, size = 'text-2xl') => {
  console.log(`🎨 Getting icon for type: ${type}, size: ${size}`);
  
  const icons = {
    // Media types
    image: '🖼️',
    video: '🎥', 
    audio: '🎵',
    
    // Document types
    document: '📄',
    spreadsheet: '📊',
    presentation: '📽️',
    
    // Other types
    archive: '📦',
    file: '📁',
    unknown: '❓'
  };
  
  const icon = icons[type] || icons.unknown;
  console.log(`✅ Icon selected: ${icon} for type: ${type}`);
  
  return <span className={size}>{icon}</span>;
};

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

// =============================================
// ENHANCED UI COMPONENTS - FIXED JSX
// =============================================

// Enhanced Folder Tree Component
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
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          title="Create New Folder"
        >
          + New
        </button>
      </div>
      
      <div className="space-y-1">
        {Object.entries(folderTree).map(([folder, count]) => (
          <div key={folder} className="group">
            <div
              className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-200 transition-colors ${
                currentFolder === folder ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
              }`}
              onClick={() => handleFolderClick(folder)}
              onContextMenu={(e) => handleFolderRightClick(e, folder)}
            >
              <span className="w-4 h-4 mr-2">📁</span>
              <span className="flex-1 truncate">{folder}</span>
              <span className="text-xs text-gray-500 ml-2 bg-gray-200 px-1 rounded">
                {count}
              </span>
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
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          isUploading
            ? 'bg-gray-400 cursor-not-allowed text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
        }`}
        disabled={isUploading}
      >
        {isUploading ? '⏳ Uploading...' : '📤 Upload Files'}
      </button>
    </div>
  );
};

// FIXED - Enhanced File Grid Component with Multi-Selection
const FileGrid = ({ 
  files, 
  viewMode, 
  onFileRightClick, 
  onFileClick,
  selectedFiles,
  onFileSelect,
  onSelectAll,
  onClearSelection
}) => {
  const [imageErrors, setImageErrors] = useState(new Set());

  const handleImageError = (fileId) => {
    setImageErrors(prev => new Set([...prev, fileId]));
  };

  const handleFileClick = (file) => {
    onFileClick && onFileClick(file);
  };

  const handleFileSelectToggle = (file, e) => {
    e.stopPropagation();
    onFileSelect(file);
  };

  const isSelected = (file) => selectedFiles.some(f => f.id === file.id);

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-lg font-medium mb-2">No files in this folder</p>
          <p className="text-sm">Drag files here or use the upload button</p>
        </div>
      </div>
    );
  }

  // Selection controls
  const SelectionControls = () => (
    <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 rounded-lg">
      <button
        onClick={onSelectAll}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        Select All ({files.length})
      </button>
      <span className="text-gray-400">|</span>
      <button
        onClick={onClearSelection}
        className="text-sm text-gray-600 hover:text-gray-800"
      >
        Clear Selection
      </button>
      {selectedFiles.length > 0 && (
        <>
          <span className="text-gray-400">|</span>
          <span className="text-sm font-medium text-blue-800">
            {selectedFiles.length} selected
          </span>
        </>
      )}
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <SelectionControls />
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedFiles.length === files.length}
                    onChange={selectedFiles.length === files.length ? onClearSelection : onSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file) => (
                <tr
                  key={file.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected(file) ? 'bg-blue-50' : ''
                  }`}
                  onContextMenu={(e) => onFileRightClick(e, file)}
                  onClick={() => handleFileClick(file)}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected(file)}
                      onChange={(e) => handleFileSelectToggle(file, e)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {getFileIcon(file.type, 'text-lg')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 truncate" title={file.title}>
                          {file.title}
                        </div>
                        {file.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {file.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {file.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatFileSize(file.fileSize)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(file.uploadDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-auto">
      <SelectionControls />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className={`relative bg-white border-2 rounded-lg p-3 hover:shadow-lg cursor-pointer transition-all duration-200 group ${
              isSelected(file) 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onContextMenu={(e) => onFileRightClick(e, file)}
            onClick={() => handleFileClick(file)}
          >
            {/* Selection checkbox */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={isSelected(file)}
                onChange={(e) => handleFileSelectToggle(file, e)}
                className="rounded shadow-sm"
              />
            </div>

            {/* FIXED - File thumbnail/icon with enhanced logic */}
            <div className="aspect-square mb-2 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {(() => {
                console.log(`🎨 Rendering file: ${file.title}, type: ${file.type}, thumbnail: ${file.thumbnail}, url: ${file.url}`);
                
                const isImageOrVideo = ['image', 'video', 'document', 'spreadsheet', 'presentation'].includes(file.type);
                const hasThumbnail = file.thumbnail && !imageErrors.has(file.id);

                if (isImageOrVideo && hasThumbnail) {
                  return (
                    <img
                      src={file.thumbnail}
                      alt={file.title}
                      className="w-full h-full object-cover rounded-lg"
                      onError={() => {
                        console.log(`❌ Thumbnail failed to load: ${file.thumbnail}`);
                        handleImageError(file.id);
                      }}
                      onLoad={() => {
                        console.log(`✅ Thumbnail loaded successfully: ${file.thumbnail}`);
                      }}
                      loading="lazy"
                    />
                  );
                }
                
                // Fallback to file type icon
                return (
                  <div className="flex flex-col items-center justify-center h-full">
                    {getFileIcon(file.type, 'text-3xl')}
                    <span className="text-xs text-gray-500 mt-1 uppercase font-medium">
                      {file.type || 'unknown'}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* File info */}
            <div className="text-sm">
              <p className="font-medium truncate text-gray-900" title={file.title}>
                {file.title}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {formatFileSize(file.fileSize)}
              </p>
              {file.tags && (
                <p className="text-xs text-blue-600 truncate mt-1">
                  {file.tags}
                </p>
              )}
            </div>

            {/* Hover overlay with quick actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileRightClick(e, file);
                  }}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-sm"
                  title="More options"
                >
                  ⋯
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced File Details Modal
const FileDetailsModal = ({ file, isOpen, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (file) {
      setEditData({
        title: file.title || '',
        description: file.description || '',
        notes: file.notes || '',
        tags: file.tags || '',
        station: file.station || '',
        category: file.category || ''
      });
    }
  }, [file]);

  const handleSave = () => {
    onUpdate(file.id, {
      'Title': editData.title,
      'Description': editData.description,
      'Notes': editData.notes,
      'Tags': editData.tags,
      'Station': editData.station,
      'Category': editData.category
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (file) {
      setEditData({
        title: file.title || '',
        description: file.description || '',
        notes: file.notes || '',
        tags: file.tags || '',
        station: file.station || '',
        category: file.category || ''
      });
    }
    setIsEditing(false);
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            {getFileIcon(file.type, 'text-2xl')}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{file.title}</h2>
              <p className="text-sm text-gray-500">{file.category} • {formatFileSize(file.fileSize)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isEditing ? 'Cancel' : '✏️ Edit'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="flex h-[calc(90vh-120px)]">
          {/* Preview Section */}
          <div className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
            {file.type === 'image' && file.url && (
              <img
                src={file.url}
                alt={file.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              />
            )}
            
            {file.type === 'video' && file.url && (
              <video
                src={file.url}
                controls
                className="max-w-full max-h-full rounded-lg shadow-sm"
              >
                Your browser does not support video playback.
              </video>
            )}
            
            {file.type === 'audio' && file.url && (
              <div className="text-center">
                <div className="text-6xl mb-4">🎵</div>
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
              <div className="text-center">
                <div className="text-6xl mb-4">{getFileIcon(file.type, 'text-6xl')}</div>
                <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📄 Open File
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="w-96 p-6 overflow-y-auto border-l bg-white">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">File Details</h3>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({...editData, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editData.category}
                    onChange={(e) => setEditData({...editData, category: e.target.value})}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
                  <input
                    type="text"
                    value={editData.station}
                    onChange={(e) => setEditData({...editData, station: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    type="text"
                    value={editData.tags}
                    onChange={(e) => setEditData({...editData, tags: e.target.value})}
                    placeholder="tag1, tag2, tag3"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    💾 Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 block mb-1">File Type</span>
                    <span className="text-sm text-gray-900 capitalize">{file.type}</span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 block mb-1">Size</span>
                    <span className="text-sm text-gray-900">{formatFileSize(file.fileSize)}</span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 block mb-1">Upload Date</span>
                    <span className="text-sm text-gray-900">{formatDate(file.uploadDate)}</span>
                  </div>

                  {file.station && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 block mb-1">Station</span>
                      <span className="text-sm text-gray-900">{file.station}</span>
                    </div>
                  )}

                  {file.description && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 block mb-1">Description</span>
                      <span className="text-sm text-gray-900">{file.description}</span>
                    </div>
                  )}

                  {file.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 block mb-1">Notes</span>
                      <span className="text-sm text-gray-900">{file.notes}</span>
                    </div>
                  )}

                  {file.tags && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 block mb-1">Tags</span>
                      <div className="flex flex-wrap gap-1">
                        {file.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {tag.trim()}
                          </span>
                      </div>
                    </div>
                  )}

                  {file.url && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 block mb-1">File URL</span>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 break-all"
                      >
                        {file.url}
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={() => onDelete(file)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🗑️ Delete File
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Other components (BatchOperationsPanel, ContextMenu, etc.) and main App component
const BatchOperationsPanel = ({ selectedFiles, onClose, onBatchUpdate, onBatchDelete, onBatchMove }) => {
  const [batchAction, setBatchAction] = useState('');
  const [batchData, setBatchData] = useState({
    category: '',
    tags: '',
    station: '',
    description: '',
    notes: ''
  });

  const handleBatchUpdate = () => {
    const updates = selectedFiles.map(file => ({
      id: file.id,
      fields: {
        ...(batchData.category && { 'Category': batchData.category }),
        ...(batchData.tags && { 'Tags': batchData.tags }),
        ...(batchData.station && { 'Station': batchData.station }),
        ...(batchData.description && { 'Description': batchData.description }),
        ...(batchData.notes && { 'Notes': batchData.notes })
      }
    }));
    onBatchUpdate(updates);
  };

  if (selectedFiles.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 z-40">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-800">
          Batch Operations ({selectedFiles.length} files)
        </h4>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <select
            value={batchAction}
            onChange={(e) => setBatchAction(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded text-sm"
          >
            <option value="">Choose Action</option>
            <option value="update">Update Fields</option>
            <option value="move">Move to Category</option>
            <option value="delete">Delete Files</option>
          </select>
        </div>

        {batchAction === 'update' && (
          <div className="space-y-2">
            <select
              value={batchData.category}
              onChange={(e) => setBatchData({...batchData, category: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Category (no change)</option>
              <option value="Images">Images</option>
              <option value="Video">Video</option>
              <option value="Audio">Audio</option>
              <option value="Documents">Documents</option>
              <option value="Files">Files</option>
            </select>

            <input
              type="text"
              placeholder="Tags (append/replace)"
              value={batchData.tags}
              onChange={(e) => setBatchData({...batchData, tags: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />

            <input
              type="text"
              placeholder="Station"
              value={batchData.station}
              onChange={(e) => setBatchData({...batchData, station: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />

            <button
              onClick={handleBatchUpdate}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Update {selectedFiles.length} Files
            </button>
          </div>
        )}

        {batchAction === 'move' && (
          <div className="space-y-2">
            <select
              value={batchData.category}
              onChange={(e) => setBatchData({...batchData, category: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Select Destination</option>
              <option value="Images">Images</option>
              <option value="Video">Video</option>
              <option value="Audio">Audio</option>
              <option value="Documents">Documents</option>
              <option value="Files">Files</option>
            </select>

            <button
              onClick={() => onBatchMove(selectedFiles, batchData.category)}
              disabled={!batchData.category}
              className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
            >
              Move {selectedFiles.length} Files
            </button>
          </div>
        )}

        {batchAction === 'delete' && (
          <div className="space-y-2">
            <p className="text-sm text-red-600">
              This will permanently delete {selectedFiles.length} files.
            </p>
            <button
              onClick={() => onBatchDelete(selectedFiles)}
              className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              🗑️ Delete {selectedFiles.length} Files
            </button>
          </div>
        )}
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
        className="fixed bg-white border border-gray-300 rounded-lg shadow-xl py-2 z-50 min-w-48"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        {contextMenu.type === 'file' && (
          <>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2"
              onClick={() => handleAction('view')}
            >
              👁️ View Details
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2"
              onClick={() => handleAction('download')}
            >
              💾 Download
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2"
              onClick={() => handleAction('rename')}
            >
              ✏️ Rename
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2"
              onClick={() => handleAction('move')}
            >
              📁 Move to Category
            </button>
            <hr className="my-1" />
            <button
              className="w-full px-4 py-2 text-left hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"
              onClick={() => handleAction('delete')}
            >
              🗑️ Delete
            </button>
          </>
        )}
        
        {contextMenu.type === 'folder' && (
          <>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2"
              onClick={() => handleAction('rename')}
            >
              ✏️ Rename Folder
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Upload Settings</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="bg-white rounded-2xl p-12 shadow-2xl text-center border-4 border-dashed border-blue-400">
        <div className="text-6xl mb-4">📤</div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">Drop files to upload</h3>
        <p className="text-gray-600">Release to start uploading to the current folder</p>
      </div>
    </div>
  );
};

// Progress Bar Component
const ProgressBar = ({ uploads, onClose }) => {
  if (!uploads || uploads.length === 0) return null;

  const overallProgress = uploads.reduce((sum, upload) => sum + upload.progress, 0) / uploads.length;

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-64 overflow-y-auto z-50">
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

// =============================================
// MAIN APPLICATION COMPONENT
// =============================================
export default function App() {
  console.log('🚀 App: Starting Enhanced File Manager...');

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileDetails, setShowFileDetails] = useState(false);
  
  // Multi-selection states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showBatchPanel, setShowBatchPanel] = useState(false);

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

  // Clear selections when folder changes
  useEffect(() => {
    setSelectedFiles([]);
    setShowBatchPanel(false);
  }, [currentFolder]);

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

  // Multi-selection handlers
  const handleFileSelectToggle = useCallback((file) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedFiles(currentFiles);
    setShowBatchPanel(true);
  }, [currentFiles]);

  const handleClearSelection = useCallback(() => {
    setSelectedFiles([]);
    setShowBatchPanel(false);
  }, []);

  // Show batch panel when files are selected
  useEffect(() => {
    setShowBatchPanel(selectedFiles.length > 0);
  }, [selectedFiles]);

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

  // File Actions
  const handleFileClick = useCallback((file) => {
    console.log('🔄 App: File clicked:', file.title);
    setSelectedFile(file);
    setShowFileDetails(true);
  }, []);

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
        case 'view':
          setSelectedFile(target);
          setShowFileDetails(true);
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

        case 'move':
          const categories = ['Images', 'Video', 'Audio', 'Documents', 'Files', 'Product'];
          const newCategory = prompt('Move to category:\n' + categories.join(', '), target.category);
          if (newCategory && categories.includes(newCategory) && newCategory !== target.category) {
            await airtableService.updateFile(target.id, { 'Category': newCategory });
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

  // File Update Handler
  const handleFileUpdate = useCallback(async (fileId, updates) => {
    try {
      await airtableService.updateFile(fileId, updates);
      await loadFiles();
      alert('File updated successfully!');
    } catch (error) {
      console.error('❌ App: Error updating file:', error);
      alert('Error updating file: ' + error.message);
    }
  }, [airtableService, loadFiles]);

  // File Delete Handler
  const handleFileDelete = useCallback(async (file) => {
    if (confirm(`Are you sure you want to delete "${file.title}"?`)) {
      try {
        await airtableService.deleteFile(file.id);
        await loadFiles();
        setShowFileDetails(false);
        alert('File deleted successfully!');
      } catch (error) {
        console.error('❌ App: Error deleting file:', error);
        alert('Error deleting file: ' + error.message);
      }
    }
  }, [airtableService, loadFiles]);

  // Batch Operations
  const handleBatchUpdate = useCallback(async (updates) => {
    try {
      await airtableService.updateMultipleFiles(updates);
      await loadFiles();
      setSelectedFiles([]);
      alert(`Successfully updated ${updates.length} files!`);
    } catch (error) {
      console.error('❌ App: Error batch updating files:', error);
      alert('Error updating files: ' + error.message);
    }
  }, [airtableService, loadFiles]);

  const handleBatchDelete = useCallback(async (filesToDelete) => {
    if (confirm(`Are you sure you want to delete ${filesToDelete.length} files? This cannot be undone.`)) {
      try {
        const recordIds = filesToDelete.map(f => f.id);
        await airtableService.deleteMultipleFiles(recordIds);
        await loadFiles();
        setSelectedFiles([]);
        alert(`Successfully deleted ${filesToDelete.length} files!`);
      } catch (error) {
        console.error('❌ App: Error batch deleting files:', error);
        alert('Error deleting files: ' + error.message);
      }
    }
  }, [airtableService, loadFiles]);

  const handleBatchMove = useCallback(async (filesToMove, newCategory) => {
    try {
      const updates = filesToMove.map(file => ({
        id: file.id,
        fields: { 'Category': newCategory }
      }));
      await airtableService.updateMultipleFiles(updates);
      await loadFiles();
      setSelectedFiles([]);
      alert(`Successfully moved ${filesToMove.length} files to ${newCategory}!`);
    } catch (error) {
      console.error('❌ App: Error batch moving files:', error);
      alert('Error moving files: ' + error.message);
    }
  }, [airtableService, loadFiles]);

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
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading files...</p>
        </div>
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <p className="text-red-600 mb-4 text-lg">Error loading files: {error}</p>
          <button
            onClick={loadFiles}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📁 Enhanced File Manager</h1>
            <p className="text-sm text-gray-600 mt-1">
              {files.length} total files • {currentFiles.length} in {currentFolder}
              {selectedFiles.length > 0 && ` • ${selectedFiles.length} selected`}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🔲 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg
