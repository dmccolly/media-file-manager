import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';

// =============================================
// AIRTABLE SERVICE CLASS - FIXED
// =============================================

// AIRTABLE SERVICE CLASS - FIXED
// =============================================
class AirtableService {
  constructor() {
    this.baseId = process.env.REACT_APP_AIRTABLE_BASE_ID;
    this.apiKey = process.env.REACT_APP_AIRTABLE_API_KEY;
    this.baseUrl = '/api/media';
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
       
        // Handle direct array response from Xano API (not wrapped in records property)
        const records = Array.isArray(data) ? data : (data.records || []);
        allRecords = allRecords.concat(records);
        offset = data.offset;
       
        console.log(`📊 AirtableService: Page fetched. Records this page: ${records.length}, Total so far: ${allRecords.length}`);
       
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
      // Handle Xano API direct field structure (not wrapped in fields property)
      console.log('🔍 DEBUG: Available fields for record:', record.id, Object.keys(record));
      console.log('🔍 DEBUG: Full record object:', record);
      
      // Extract data from Xano record structure
      let url = record.media_url || record.attachment || '';
      let fileSize = record.file_size || 0;
      let actualFilename = record.filename || '';
      
      console.log('🔍 Xano fields - media_url:', record.media_url, 'filename:', record.filename, 'file_size:', record.file_size);
      
      if (url) {
        console.log('✅ Found URL in Xano record:', { url, fileSize, actualFilename });
      } else {
        // Fallback: try to find any field that looks like a URL
        for (const [fieldName, fieldValue] of Object.entries(record)) {
          if (typeof fieldValue === 'string' && (
            fieldValue.startsWith('http://') || 
            fieldValue.startsWith('https://') ||
            fieldValue.includes('cloudinary.com') ||
            fieldValue.includes('xano.io')
          )) {
            url = fieldValue;
            console.log(`✅ Found URL-like value in field '${fieldName}':`, url);
            break;
          }
        }
      }
      
      if (!url) {
        console.warn('⚠️ No URL found for record:', record.id, 'Available fields:', Object.keys(record));
      }
      
      // Extract other metadata from Xano record structure
      const title = record.title || record.filename || 'Untitled';
      const description = record.description || record.notes || '';
      const tags = record.tags || '';
      const category = record.category || 'other';
      const uploadedBy = record.submitted_by || 'Unknown';
      const uploadDate = record.created_at ? new Date(record.created_at).toISOString() : new Date().toISOString();
      
      console.log('📁 File processing:', title, 'URL:', url, 'Size:', fileSize, 'Filename:', actualFilename);
      
      const detectedType = this.detectFileTypeFromUrl(url || actualFilename);
      console.log('🔍 Final file type for', title, ':', detectedType, 'from URL:', url);
      
      // Generate thumbnail
      const thumbnail = this.generateThumbnailFromUrl(url, detectedType);
      console.log('🖼️ Thumbnail generated for', title, ':', thumbnail);
      
      const categoryMapping = {
        'image': 'image',
        'video': 'video', 
        'audio': 'audio',
        'document': 'document',
        'other': 'other'
      };
      
      const processedFile = {
        id: record.id,
        title: title,
        description: description,
        url: url,
        thumbnail: thumbnail,
        type: detectedType,
        category: categoryMapping[category.toLowerCase()] || 'other',
        size: fileSize,
        filename: actualFilename || title,
        tags: tags,
        uploadedBy: uploadedBy,
        uploadDate: uploadDate,
        metadata: {
          originalRecord: record
        }
      };
      
      console.log('✅ Processed file:', processedFile);
      return processedFile;
    });
    
    const filteredFiles = processedFiles.filter(file => {
      const hasValidUrl = file.url && file.url.trim() !== '';
      if (!hasValidUrl) {
        console.log('🚫 Filtering out record without URL:', file.title, 'ID:', file.id);
      }
      return hasValidUrl;
    });
    
    console.log('✅ AirtableService: All processed files:', processedFiles.length);
    console.log('✅ AirtableService: Filtered files with URLs:', filteredFiles.length);
    return filteredFiles;
  }
  // Enhanced file type detection from URL
  detectFileTypeFromUrl(url) {
    if (!url || typeof url !== 'string') {
      console.log('⚠️ No valid URL provided for file type detection:', url);
      return 'unknown';
    }
   
    console.log(`🔍 Detecting file type from URL: ${url}`);
   
    try {
      // Extract extension from URL (handle query parameters and fragments)
      const urlParts = url.split('?')[0].split('#')[0]; // Remove query params and fragments
      const pathParts = urlParts.split('/');
      const filename = pathParts[pathParts.length - 1];
      const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : '';
     
      console.log(`📄 Extracted filename: ${filename}, extension: ${extension}`);
     
      if (!extension) {
        console.log('⚠️ No extension found in URL');
        return 'unknown';
      }
     
      const typeMap = {
        // Images
        'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
        'webp': 'image', 'svg': 'image', 'bmp': 'image', 'tiff': 'image', 'tif': 'image',
        'ico': 'image', 'heic': 'image', 'heif': 'image',
       
        // Videos
        'mp4': 'video', 'avi': 'video', 'mov': 'video', 'wmv': 'video',
        'flv': 'video', 'webm': 'video', 'mkv': 'video', '3gp': 'video', 'm4v': 'video',
        'mpg': 'video', 'mpeg': 'video', 'ogv': 'video',
       
        // Audio
        'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio',
        'ogg': 'audio', 'm4a': 'audio', 'wma': 'audio', 'opus': 'audio',
       
        // Documents (including spreadsheets and presentations)
        'pdf': 'document', 'doc': 'document', 'docx': 'document',
        'txt': 'document', 'rtf': 'document', 'odt': 'document',
        'xls': 'document', 'xlsx': 'document', 'csv': 'document',
        'ods': 'document', 'ppt': 'document', 'pptx': 'document', 'odp': 'document',
       
        // Archives
        'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive', 
        'gz': 'archive', 'bz2': 'archive'
      };
     
      const detectedType = typeMap[extension] || 'file';
      console.log(`✅ File type detected: ${detectedType} for extension: ${extension}`);
     
      return detectedType;
    } catch (error) {
      console.error('❌ Error in file type detection:', error);
      return 'unknown';
    }
  }
  // Enhanced thumbnail generation
  generateThumbnailFromUrl(url, fileType) {
    if (!url || typeof url !== 'string') {
      console.log('⚠️ No valid URL provided for thumbnail generation');
      return '';
    }

    console.log(`🖼️ Generating thumbnail for URL: ${url}, type: ${fileType}`);

    try {
      const extension = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
      const isCloudinaryUrl = url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
      const isDirectImageUrl = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif'].includes(extension);

      let thumbnail = '';

      if (isCloudinaryUrl) {
        console.log('📸 Cloudinary URL detected, generating thumbnail...');
        
        if (fileType === 'image' || isDirectImageUrl) {
          thumbnail = url.replace('/upload/', '/upload/w_150,h_150,c_fill,f_auto,q_auto/');
          console.log(`✅ Image thumbnail: ${thumbnail}`);
        } else if (fileType === 'video') {
          thumbnail = url.replace('/upload/', '/upload/w_150,h_150,c_fill,f_auto,q_auto,so_0/')
                        .replace(/\.(mp4|avi|mov|wmv|flv|webm|mkv|3gp|m4v|mpg|mpeg)$/i, '.jpg');
          if (thumbnail === url) {
            console.warn('⚠️ Video thumbnail generation failed, using placeholder');
            thumbnail = 'https://via.placeholder.com/150x150/4A90E2/FFFFFF?text=VIDEO';
          }
          console.log(`✅ Video thumbnail: ${thumbnail}`);
        } else if (fileType === 'document' && extension === 'pdf') {
          thumbnail = url.replace('/upload/', '/upload/w_150,h_150,c_fill,f_jpg,pg_1,q_auto/');
          if (thumbnail === url) {
            console.warn('⚠️ PDF thumbnail generation failed, using placeholder');
            thumbnail = 'https://via.placeholder.com/150x150/E74C3C/FFFFFF?text=PDF';
          }
          console.log(`✅ PDF thumbnail from first page: ${thumbnail}`);
        } else {
          console.log(`ℹ️ No thumbnail transformation for type: ${fileType}, using type-specific placeholder`);
          thumbnail = this.getPlaceholderThumbnail(fileType);
        }
      } else if (fileType === 'image' || isDirectImageUrl) {
        console.log(`✅ Direct image URL (non-Cloudinary): ${url}`);
        return url; // Use original URL for direct images
      } else {
        console.log(`ℹ️ Non-Cloudinary URL for type: ${fileType}, using placeholder`);
        thumbnail = this.getPlaceholderThumbnail(fileType);
      }

      return thumbnail;

    } catch (error) {
      console.error('❌ Error generating thumbnail:', error);
      // Return type-specific placeholder on error
      return this.getPlaceholderThumbnail(fileType);
    }
  }
  
  // Get placeholder thumbnail based on file type
  getPlaceholderThumbnail(fileType) {
    const placeholders = {
      'image': 'https://via.placeholder.com/150x150/2ECC71/FFFFFF?text=IMAGE',
      'video': 'https://via.placeholder.com/150x150/4A90E2/FFFFFF?text=VIDEO',
      'audio': 'https://via.placeholder.com/150x150/9B59B6/FFFFFF?text=AUDIO',
      'document': 'https://via.placeholder.com/150x150/E74C3C/FFFFFF?text=DOC',
      'spreadsheet': 'https://via.placeholder.com/150x150/27AE60/FFFFFF?text=SHEET',
      'presentation': 'https://via.placeholder.com/150x150/F39C12/FFFFFF?text=SLIDES',
      'archive': 'https://via.placeholder.com/150x150/95A5A6/FFFFFF?text=ZIP',
      'file': 'https://via.placeholder.com/150x150/7F8C8D/FFFFFF?text=FILE',
      'unknown': 'https://via.placeholder.com/150x150/BDC3C7/FFFFFF?text=UNKNOWN'
    };
    
    return placeholders[fileType] || placeholders['unknown'];
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
    this.cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dzrw8nopf';
    this.uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'HIBF_MASTER';
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
     
      // For PDFs, get first page as thumbnail
      if (resourceType === 'document' && originalUrl.split('.').pop()?.toLowerCase() === 'pdf') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,f_jpg,pg_1,q_auto/');
      }
     
      // For other types, return empty string (icon will be used)
      return '';
     
    } catch (error) {
      console.error('❌ CloudinaryService: Error generating thumbnail:', error);
      return originalUrl;
    }
  }
}

// --- End of Part 1, continue with Part 2 ---
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
   
    // Other types
    archive: '📦',
    file: '📁',
    unknown: '❓'
  };
 
  const icon = icons[type] || icons.unknown;
  console.log(`✅ Icon selected: ${icon} for type: ${type}`);
 
  return <span className={size}>{icon}</span>;
};

const getCategoryIcon = (category) => {
  const iconMap = {
    'image': '🖼️',
    'video': '🎥',
    'audio': '🎵',
    'document': '📄',
    'other': '📁'
  };
  
  return iconMap[category] || iconMap['other'];
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
}

// --- End of Part 2, continue with Part 3 ---
// =============================================
// ENHANCED UI COMPONENTS - FIXED
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
        <h3 className="font-semibold text-gray-800">Categories</h3>
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
              <span className="w-4 h-4 mr-2">{getCategoryIcon(folder)}</span>
              <span className="flex-1 truncate">
                {folder === 'image' ? 'Image/Graphics' : 
                 folder === 'video' ? 'Video' :
                 folder === 'audio' ? 'Audio' :
                 folder === 'document' ? 'Documents' :
                 folder === 'other' ? 'Other' : 
                 folder.charAt(0).toUpperCase() + folder.slice(1)}
              </span>
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

const sortFiles = (files, field, direction) => {
  return [...files].sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];
    
    if (field === 'fileSize') {
      aVal = parseInt(aVal) || 0;
      bVal = parseInt(bVal) || 0;
    } else if (field === 'uploadDate') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (direction === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });
};

const handleSort = (field, setSortField, setSortDirection, sortField, sortDirection) => {
  const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
  setSortField(field);
  setSortDirection(newDirection);
};

const getSortIcon = (field, sortField, sortDirection) => {
  if (sortField !== field) return '↕️';
  return sortDirection === 'asc' ? '↑' : '↓';
};

const FileGrid = ({
  files,
  viewMode,
  onFileRightClick,
  onFileClick,
  selectedFiles,
  onFileSelect,
  onSelectAll,
  onClearSelection,
  onSort,
  sortField,
  sortDirection,
  getSortIcon
}) => {
  const [imageErrors, setImageErrors] = useState(new Set());

  const handleImageError = (fileId) => {
    console.log(`❌ Image error for file ID: ${fileId}`);
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

  if (viewMode === 'list') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <SelectionControls />
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedFiles.length === files.length}
                    onChange={selectedFiles.length === files.length ? onClearSelection : onSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => onSort('title')}>
                  Name {getSortIcon('title')}
                </th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => onSort('type')}>
                  Type {getSortIcon('type')}
                </th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => onSort('fileSize')}>
                  Size {getSortIcon('fileSize')}
                </th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => onSort('uploadDate')}>
                  Date {getSortIcon('uploadDate')}
                </th>
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
                  <td className="px-2 py-1">
                    <input
                      type="checkbox"
                      checked={isSelected(file)}
                      onChange={(e) => handleFileSelectToggle(file, e)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex items-center">
                      <div className="mr-2">
                        {getFileIcon(file.type, 'text-sm')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 truncate text-sm" title={file.title}>
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
                  <td className="px-2 py-1 text-xs text-gray-600 capitalize">
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {file.type}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-xs text-gray-600">
                    {formatFileSize(file.fileSize)}
                  </td>
                  <td className="px-2 py-1 text-xs text-gray-600">
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
            {/* File thumbnail/icon with enhanced logic */}
            <div className="aspect-square mb-2 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {(() => {
                console.log(`🎨 Rendering file: ${file.title}, type: ${file.type}, thumbnail: ${file.thumbnail}, url: ${file.url}`);
                const hasValidThumbnail = file.thumbnail && !imageErrors.has(file.id) && file.thumbnail !== '';
                if (hasValidThumbnail) {
                  return (
                    <img
                      src={file.thumbnail}
                      alt={file.title}
                      className="w-full h-full object-cover rounded-lg"
                      onError={() => handleImageError(file.id)}
                      onLoad={() => console.log(`✅ Thumbnail loaded for ${file.title}`)}
                      loading="lazy"
                    />
                  );
                }
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
                    <option value="image">Image/Graphics</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="document">Documents</option>
                    <option value="other">Other</option>
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
                        ))}
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
// Batch Operations Panel
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
  const [currentFolder, setCurrentFolder] = useState('image');
  const [viewMode, setViewMode] = useState('grid');
  const [expandedFolders, setExpandedFolders] = useState(['image', 'video', 'audio']);
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
  
  const [sortField, setSortField] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
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
    if (!files || files.length === 0) {
      console.log('⏳ App: Waiting for files to load...');
      return [];
    }
    
    const filtered = files.filter(file => file.category === currentFolder);
    const sorted = sortFiles(filtered, sortField, sortDirection);
    console.log(`📁 App: Files in ${currentFolder}:`, sorted.length);
    return sorted;
  }, [files, currentFolder, sortField, sortDirection]);
  // Load Files from Database
  const loadFiles = useCallback(async () => {
    console.log('🔄 App: Loading files from database...');
    setLoading(true);
    setError(null);
    try {
      const loadedFiles = await airtableService.fetchAllFiles();
      console.log('✅ App: Files loaded successfully:', loadedFiles);
      
      setTimeout(() => {
        setFiles(loadedFiles);
        console.log('🔄 App: Files state updated with:', loadedFiles.length, 'files');
      }, 50);
    } catch (err) {
      console.error('❌ App: Error loading files:', err);
      setError(err.message);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 100);
    }
  }, [airtableService]);
  // Initial load
  useEffect(() => {
    console.log('🔄 App: Component mounted, loading files...');
    const timer = setTimeout(() => {
      loadFiles();
    }, 100);
    return () => clearTimeout(timer);
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
  
  const handleSortClick = useCallback((field) => {
    handleSort(field, setSortField, setSortDirection, sortField, sortDirection);
  }, [sortField, sortDirection]);
  
  const getSortIconForField = useCallback((field) => {
    return getSortIcon(field, sortField, sortDirection);
  }, [sortField, sortDirection]);
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

  // Batch Operations Handlers
  const handleBatchUpdate = useCallback(async (updates) => {
    try {
      await airtableService.updateMultipleFiles(updates);
      await loadFiles();
      setSelectedFiles([]);
      setShowBatchPanel(false);
      alert(`${updates.length} files updated successfully!`);
    } catch (error) {
      console.error('❌ App: Error updating files:', error);
      alert('Error updating files: ' + error.message);
    }
  }, [airtableService, loadFiles]);

  const handleBatchDelete = useCallback(async (filesToDelete) => {
    if (confirm(`Are you sure you want to delete ${filesToDelete.length} files?`)) {
      try {
        const recordIds = filesToDelete.map(file => file.id);
        await airtableService.deleteMultipleFiles(recordIds);
        await loadFiles();
        setSelectedFiles([]);
        setShowBatchPanel(false);
        alert(`${filesToDelete.length} files deleted successfully!`);
      } catch (error) {
        console.error('❌ App: Error deleting files:', error);
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
      setShowBatchPanel(false);
      alert(`${filesToMove.length} files moved to ${newCategory}!`);
    } catch (error) {
      console.error('❌ App: Error moving files:', error);
      alert('Error moving files: ' + error.message);
    }
  }, [airtableService, loadFiles]);

  // Create Folder Handler
  const handleCreateFolder = useCallback(() => {
    const folderName = prompt('Enter folder name:');
    if (folderName && !folderTree[folderName]) {
      setCurrentFolder(folderName);
      // Note: Folder will be created when first file is uploaded to it
    }
  }, [folderTree]);

  // Render Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl font-semibold text-gray-700">Loading files...</p>
        </div>
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl font-semibold text-red-600 mb-4">Error loading files</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadFiles}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // Main App Render
  return (
    <div 
      className="min-h-screen bg-gray-100 flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">📁 File Manager</h1>
              <div className="ml-4 text-sm text-gray-500">
                {currentFiles.length} files in {currentFolder}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🔲 Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar - Folder Tree */}
        <FolderTree
          folderTree={folderTree}
          currentFolder={currentFolder}
          setCurrentFolder={setCurrentFolder}
          expandedFolders={expandedFolders}
          setExpandedFolders={setExpandedFolders}
          setContextMenu={setContextMenu}
          onCreateFolder={handleCreateFolder}
        />

        {/* File Grid/List */}
        <FileGrid
          files={currentFiles}
          viewMode={viewMode}
          onFileRightClick={handleFileRightClick}
          onFileClick={handleFileClick}
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelectToggle}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onSort={handleSortClick}
          sortField={sortField}
          sortDirection={sortDirection}
          getSortIcon={getSortIconForField}
        />
      </div>

      {/* Modals and Overlays */}
      <DragDropOverlay isDragOver={isDragOver} />
      
      <ProgressBar 
        uploads={uploads} 
        onClose={() => setUploads([])} 
      />

      <UploadMetadataForm
        isOpen={showUploadForm}
        onClose={() => {
          setShowUploadForm(false);
          setPendingFiles([]);
        }}
        onSubmit={handleUploadSubmit}
        initialData={{ category: currentFolder }}
      />

      <FileDetailsModal
        file={selectedFile}
        isOpen={showFileDetails}
        onClose={() => {
          setShowFileDetails(false);
          setSelectedFile(null);
        }}
        onUpdate={handleFileUpdate}
        onDelete={handleFileDelete}
      />

      <BatchOperationsPanel
        selectedFiles={selectedFiles}
        onClose={() => setShowBatchPanel(false)}
        onBatchUpdate={handleBatchUpdate}
        onBatchDelete={handleBatchDelete}
        onBatchMove={handleBatchMove}
      />

      <ContextMenu
        contextMenu={contextMenu}
        onClose={closeContextMenu}
        onAction={handleContextAction}
      />
    </div>
  );
}

