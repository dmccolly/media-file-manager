import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './index.css';
import {
  getFileIcon,
  formatFileSize,
  formatDate,
  SelectionControls,
  FolderTree,
  UploadButton,
  FileGrid,
  FileDetailsModal,
  BatchOperationsPanel,
  ContextMenu,
  UploadMetadataForm,
  DragDropOverlay,
  ProgressBar
} from './FileManagerComponents';

// =============================================
// =============================================
class XanoService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_XANO_API_BASE || 'https://x8ki-letl-twmt.n7.xano.io/api:pYeqCtV';
    this.headers = {
      'Content-Type': 'application/json'
    };
  }
  // Fetch all files - XANO /voxpro endpoint only supports POST, not GET
  async fetchAllFiles() {
    console.log('🔄 XanoService: XANO API /voxpro endpoint does not support GET operations');
    console.log('📦 XanoService: Returning empty files array - no existing records to fetch');
   
    try {
      // Return empty array until proper GET endpoint is available or configured
      const emptyData = [];
      console.log('📦 XanoService: Raw response data:', emptyData);
      
      return this.processRecords(emptyData);
     
    } catch (error) {
      console.error('❌ XanoService: Error processing empty data:', error);
      return [];
    }
  }
  // Process raw XANO records into app format
  processRecords(records) {
    console.log('🔄 XanoService: Processing records...', records);
   
    const processedFiles = records.map(record => {
      console.log('🔍 DEBUG: Available properties for record:', record.id, Object.keys(record));
      console.log('🔍 DEBUG: Full record object:', record);
      
      // Enhanced URL extraction - handle XANO direct properties
      let url = '';
      let fileSize = 0;
      let actualFilename = '';
      
      // Try different property names for XANO records
      console.log('🔍 Checking database_url property:', record.database_url);
      console.log('🔍 Checking file_url property:', record.file_url);
      console.log('🔍 Checking url property:', record.url);
      
      if (record.database_url) {
        url = record.database_url;
        console.log('✅ Found URL in database_url property:', url);
      } else if (record.file_url) {
        url = record.file_url;
        console.log('✅ Found URL in file_url property:', url);
      } else if (record.url) {
        url = record.url;
        console.log('✅ Found URL in url property:', url);
      } else {
        console.log('❌ No URL found in any expected property');
      }
      
      // Get file size and filename from XANO record
      fileSize = record.file_size || 0;
      actualFilename = record.title || record.filename || '';
      
      let detectedType = this.detectFileTypeFromUrl(url);
      console.log(`🔍 Detected type from URL: ${detectedType} for URL: ${url}`);
      
      if (detectedType === 'unknown' || detectedType === 'file') {
        const category = record.category || '';
        console.log(`🔍 Trying category-based detection for category: ${category}`);
        if (category.toLowerCase().includes('image')) detectedType = 'image';
        else if (category.toLowerCase().includes('video')) detectedType = 'video';
        else if (category.toLowerCase().includes('audio')) detectedType = 'audio';
        else if (category.toLowerCase().includes('document')) detectedType = 'document';
        else detectedType = 'file';
        console.log(`🔄 Final fallback type from category: ${detectedType}`);
      }
      
      console.log(`🔍 Final file type for ${record.title}: ${detectedType} from URL: ${url}`);
     
      // Generate thumbnail with enhanced logic
      const thumbnail = this.generateThumbnailFromUrl(url, detectedType);
      console.log(`🖼️ Thumbnail generated for ${record.title}: ${thumbnail}`);
     
      const processedFile = {
        id: record.id,
        title: record.title || record.name || actualFilename || 'Untitled',
        url: url,
        category: record.category || 'uncategorized',
        type: detectedType,
        station: record.station || '',
        description: record.description || '',
        notes: record.notes || '',
        tags: record.tags || '',
        uploadDate: record.created_at ? new Date(record.created_at).toISOString() : new Date().toISOString(),
        thumbnail: thumbnail,
        fileSize: fileSize,
        duration: record.duration || '',
        originalRecord: record,
        filename: actualFilename
      };
     
      console.log('✅ Processed file:', processedFile);
      return processedFile;
    });
    console.log('✅ XanoService: All processed files:', processedFiles);
    return processedFiles;
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
       
        // Documents
        'pdf': 'document', 'doc': 'document', 'docx': 'document',
        'txt': 'document', 'rtf': 'document', 'odt': 'document',
       
        // Spreadsheets
        'xls': 'spreadsheet', 'xlsx': 'spreadsheet', 'csv': 'spreadsheet',
        'ods': 'spreadsheet',
       
        // Presentations
        'ppt': 'presentation', 'pptx': 'presentation', 'odp': 'presentation',
       
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
  // Save new file to XANO API
  async saveFile(fileData) {
    console.log('🔄 XanoService: Saving file to XANO API:', fileData);
   
    try {
      const xanoData = {
        title: fileData.title || fileData.name,
        database_url: fileData.url,
        category: fileData.category,
        station: fileData.station || '',
        description: fileData.description || '',
        notes: fileData.notes || '',
        tags: fileData.tags || '',
        file_size: fileData.size || 0,
        file_type: fileData.metadata?.mimeType || '',
        submitted_by: 'File Manager',
        created_at: Date.now(),
        is_featured: false
      };
      console.log('📡 XanoService: Sending to XANO API:', xanoData);
      const response = await fetch(`${this.baseUrl}/voxpro`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(xanoData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ XanoService: XANO API error:', errorData);
        throw new Error(`XANO API error: ${errorData.error?.message || response.statusText}`);
      }
      const result = await response.json();
      console.log('✅ XanoService: File saved successfully:', result);
      return result;
     
    } catch (error) {
      console.error('❌ XanoService: Error saving file:', error);
      throw error;
    }
  }
  // Update existing file via XANO API
  async updateFile(recordId, updates) {
    console.log('🔄 XanoService: Updating file:', { recordId, updates });
   
    try {
      const xanoUpdates = {};
      if (updates.Title) xanoUpdates.title = updates.Title;
      if (updates.Description) xanoUpdates.description = updates.Description;
      if (updates.Category) xanoUpdates.category = updates.Category;
      if (updates.Tags) xanoUpdates.tags = updates.Tags;
      
      const response = await fetch(`${this.baseUrl}/voxpro/${recordId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(xanoUpdates)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('✅ XanoService: File updated successfully:', result);
      return result;
     
    } catch (error) {
      console.error('❌ XanoService: Error updating file:', error);
      throw error;
    }
  }
  // Update multiple files at once via XANO API
  async updateMultipleFiles(updates) {
    console.log('🔄 XanoService: Updating multiple files:', updates);
   
    try {
      const updatePromises = updates.map(update => {
        const xanoUpdates = {};
        if (update.fields.Title) xanoUpdates.title = update.fields.Title;
        if (update.fields.Description) xanoUpdates.description = update.fields.Description;
        if (update.fields.Category) xanoUpdates.category = update.fields.Category;
        if (update.fields.Tags) xanoUpdates.tags = update.fields.Tags;
        
        return fetch(`${this.baseUrl}/voxpro/${update.id}`, {
          method: 'PATCH',
          headers: this.headers,
          body: JSON.stringify(xanoUpdates)
        });
      });
      
      const responses = await Promise.all(updatePromises);
      const allSuccessful = responses.every(r => r.ok);
      if (!allSuccessful) {
        throw new Error('Some updates failed');
      }
      console.log('✅ XanoService: Multiple files updated successfully');
      return { success: true };
     
    } catch (error) {
      console.error('❌ XanoService: Error updating multiple files:', error);
      throw error;
    }
  }
  // Delete file via XANO API
  async deleteFile(recordId) {
    console.log('🔄 XanoService: Deleting file:', recordId);
   
    try {
      const response = await fetch(`${this.baseUrl}/voxpro/${recordId}`, {
        method: 'DELETE',
        headers: this.headers
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('✅ XanoService: File deleted successfully');
      return true;
     
    } catch (error) {
      console.error('❌ XanoService: Error deleting file:', error);
      throw error;
    }
  }
  // Delete multiple files at once
  async deleteMultipleFiles(recordIds) {
    console.log('🔄 XanoService: Deleting multiple files:', recordIds);
   
    try {
      const deletePromises = recordIds.map(id => this.deleteFile(id));
      await Promise.all(deletePromises);
     
      console.log('✅ XanoService: Multiple files deleted successfully');
      return true;
     
    } catch (error) {
      console.error('❌ XanoService: Error deleting multiple files:', error);
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

// --- End of Part 2, continue with Part 3 ---
// =============================================
// ENHANCED UI COMPONENTS - FIXED
// =============================================
// =============================================
// MAIN APPLICATION COMPONENT
// =============================================
export default function App() {
  console.log('🚀 App: Starting Enhanced File Manager...');
  // Initialize services
  const xanoService = useMemo(() => {
    console.log('🔧 App: Initializing XanoService...');
    return new XanoService();
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
      const loadedFiles = await xanoService.fetchAllFiles();
      console.log('✅ App: Files loaded successfully:', loadedFiles);
      setFiles(loadedFiles);
    } catch (err) {
      console.error('❌ App: Error loading files:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [xanoService]);
  // Initial load
  useEffect(() => {
    console.log('🔄 App: Component mounted, loading files...');
    
    // Enhanced mounting verification
    setTimeout(() => {
      const rootElement = document.getElementById('root');
      if (rootElement) {
        const hasAppContent = rootElement.innerHTML.includes('HOIBF File Manager') || 
                             rootElement.innerHTML.includes('Choose Files');
        console.log(`🔍 App: Mounting verification - hasAppContent: ${hasAppContent}`);
        
        if (!hasAppContent) {
          console.error('🚨 App: React app content not detected in DOM after mounting');
          setTimeout(() => {
            console.log('🔄 App: Attempting forced re-render...');
            setLoading(false);
            setLoading(true);
          }, 1000);
        }
      }
    }, 2000);
    
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ App: Loading taking longer than expected, checking network...');
      setLoading(false);
      setError('Loading is taking longer than expected. Please check your internet connection.');
    }, 15000);
    
    loadFiles().finally(() => {
      clearTimeout(loadingTimeout);
    });
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
            await xanoService.saveFile(fileData);
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
  }, [cloudinaryService, xanoService, loadFiles]);
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
            await xanoService.updateFile(target.id, { 'Title': newTitle });
            await loadFiles();
          }
          break;
        case 'move':
          const categories = ['Images', 'Video', 'Audio', 'Documents', 'Files', 'Product'];
          const newCategory = prompt('Move to category:\n' + categories.join(', '), target.category);
          if (newCategory && categories.includes(newCategory) && newCategory !== target.category) {
            await xanoService.updateFile(target.id, { 'Category': newCategory });
            await loadFiles();
          }
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete "${target.title}"?`)) {
            await xanoService.deleteFile(target.id);
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
  }, [xanoService, loadFiles]);
  const closeContextMenu = useCallback(() => {
    setContextMenu({ show: false, x: 0, y: 0, type: '', target: null });
  }, []);
  // File Update Handler
  const handleFileUpdate = useCallback(async (fileId, updates) => {
    try {
      await xanoService.updateFile(fileId, updates);
      await loadFiles();
      alert('File updated successfully!');
    } catch (error) {
      console.error('❌ App: Error updating file:', error);
      alert('Error updating file: ' + error.message);
    }
  }, [xanoService, loadFiles]);
  // File Delete Handler
  const handleFileDelete = useCallback(async (file) => {
    if (confirm(`Are you sure you want to delete "${file.title}"?`)) {
      try {
        await xanoService.deleteFile(file.id);
        await loadFiles();
        setShowFileDetails(false);
        alert('File deleted successfully!');
      } catch (error) {
        console.error('❌ App: Error deleting file:', error);
        alert('Error deleting file: ' + error.message);
      }
    }
  }, [xanoService, loadFiles]);

  // Batch Operations Handlers
  const handleBatchUpdate = useCallback(async (updates) => {
    try {
      await xanoService.updateMultipleFiles(updates);
      await loadFiles();
      setSelectedFiles([]);
      setShowBatchPanel(false);
      alert(`${updates.length} files updated successfully!`);
    } catch (error) {
      console.error('❌ App: Error updating files:', error);
      alert('Error updating files: ' + error.message);
    }
  }, [xanoService, loadFiles]);

  const handleBatchDelete = useCallback(async (filesToDelete) => {
    if (confirm(`Are you sure you want to delete ${filesToDelete.length} files?`)) {
      try {
        const recordIds = filesToDelete.map(file => file.id);
        await xanoService.deleteMultipleFiles(recordIds);
        await loadFiles();
        setSelectedFiles([]);
        setShowBatchPanel(false);
        alert(`${filesToDelete.length} files deleted successfully!`);
      } catch (error) {
        console.error('❌ App: Error deleting files:', error);
        alert('Error deleting files: ' + error.message);
      }
    }
  }, [xanoService, loadFiles]);

  const handleBatchMove = useCallback(async (filesToMove, newCategory) => {
    try {
      const updates = filesToMove.map(file => ({
        id: file.id,
        fields: { 'Category': newCategory }
      }));
      await xanoService.updateMultipleFiles(updates);
      await loadFiles();
      setSelectedFiles([]);
      setShowBatchPanel(false);
      alert(`${filesToMove.length} files moved to ${newCategory}!`);
    } catch (error) {
      console.error('❌ App: Error moving files:', error);
      alert('Error moving files: ' + error.message);
    }
  }, [xanoService, loadFiles]);

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl font-semibold text-white">Loading files...</p>
        </div>
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl font-semibold text-red-600 mb-4">Error loading files</p>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={loadFiles}
            className="button-primary px-4 py-2 rounded-lg transition-colors"
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
      className="file-manager-container min-h-screen bg-gray-900 text-white flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📁</span>
              <h1 className="text-xl font-bold text-white">HOIBF File Manager</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Home / Media Library / All Files</span>
              <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">FINAL v3.0 - CLOUDINARY FIXED</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Search files..." 
              className="input-dark px-3 py-2 rounded-lg w-64 text-sm"
            />
            <UploadButton 
              onFileSelect={handleFileSelect} 
              isUploading={isUploading} 
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              🔁 VoxPro
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout - 3 Panel */}
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-white font-medium mb-2 text-sm">Storage Used</h3>
              <div className="text-sm text-gray-400">45.18 MB of 10 GB</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '0.45%'}}></div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-gray-400 font-medium mb-3 text-xs uppercase tracking-wider">QUICK ACCESS</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-3 text-white hover:bg-gray-800 p-2 rounded cursor-pointer text-sm">
                  <span className="text-blue-400">📄</span>
                  <span>All Files</span>
                  <span className="ml-auto text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">0</span>
                </div>
                <div className="flex items-center gap-3 text-white hover:bg-gray-800 p-2 rounded cursor-pointer text-sm">
                  <span className="text-green-400">🎵</span>
                  <span>Audio</span>
                  <span className="ml-auto text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">0</span>
                </div>
                <div className="flex items-center gap-3 text-white hover:bg-gray-800 p-2 rounded cursor-pointer text-sm">
                  <span className="text-purple-400">🎬</span>
                  <span>Video</span>
                  <span className="ml-auto text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">0</span>
                </div>
                <div className="flex items-center gap-3 text-white hover:bg-gray-800 p-2 rounded cursor-pointer text-sm">
                  <span className="text-yellow-400">🖼️</span>
                  <span>Images</span>
                  <span className="ml-auto text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">0</span>
                </div>
                <div className="flex items-center gap-3 text-white hover:bg-gray-800 p-2 rounded cursor-pointer text-sm">
                  <span className="text-red-400">📄</span>
                  <span>Documents</span>
                  <span className="ml-auto text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">0</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-gray-400 font-medium mb-3 text-xs uppercase tracking-wider">CATEGORIES</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-3 text-white hover:bg-gray-800 p-2 rounded cursor-pointer text-sm">
                  <span className="text-orange-400">🏷️</span>
                  <span>Commercial</span>
                  <span className="ml-auto text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">0</span>
                </div>
                <div className="flex items-center gap-3 text-white hover:bg-gray-800 p-2 rounded cursor-pointer text-sm">
                  <span className="text-teal-400">🏷️</span>
                  <span>Working II</span>
                  <span className="ml-auto text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">0</span>
                </div>
                <div className="flex items-center gap-3 text-white hover:bg-gray-800 p-2 rounded cursor-pointer text-sm">
                  <span className="text-pink-400">🏷️</span>
                  <span>Image I</span>
                  <span className="ml-auto text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">0</span>
                </div>
                <div className="flex items-center gap-3 text-white hover:bg-gray-800 p-2 rounded cursor-pointer text-sm">
                  <span className="text-indigo-400">🏷️</span>
                  <span>Music</span>
                  <span className="ml-auto text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">0</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-gray-400 font-medium mb-3 text-xs uppercase tracking-wider">COLLECTIONS</h3>
              <div className="text-gray-500 text-sm">No collections</div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                ✓ Select All
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                🗑️ Delete Selected
              </button>
              <button 
                onClick={loadFiles}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                Details
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Small
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Medium
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                ☰
              </button>
            </div>
          </div>

          {/* File Table Header */}
          <div className="grid grid-cols-6 gap-4 p-4 bg-gray-800 border-b border-gray-700 text-gray-300 font-medium text-sm">
            <div>TITLE</div>
            <div>SIZE</div>
            <div>DURATION</div>
            <div>STATION</div>
            <div>MODIFIED</div>
            <div>ACTIONS</div>
          </div>

          {/* File Content Area */}
          <div className="flex-1 bg-gray-900">
            {currentFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 text-lg mb-2">No files found</div>
                  <div className="text-gray-500 text-sm">Drag files here or use the upload button</div>
                </div>
              </div>
            ) : (
              <FileGrid
                files={currentFiles}
                viewMode={viewMode}
                onFileRightClick={handleFileRightClick}
                onFileClick={handleFileClick}
                selectedFiles={selectedFiles}
                onFileSelect={handleFileSelectToggle}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar - File Details */}
        <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
          <div className="p-4">
            <h3 className="text-white font-medium mb-4">File Details</h3>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium text-sm">Media Preview</span>
                <div className="flex gap-2">
                  <button className="text-gray-400 hover:text-white text-sm">⛶</button>
                  <button className="text-gray-400 hover:text-white text-sm">📥</button>
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
                <div className="text-4xl mb-3 text-gray-500">📄</div>
                <div className="text-gray-400 text-sm">Select a file to preview</div>
              </div>
            </div>

            <div>
              <h4 className="text-gray-400 font-medium mb-4 text-xs uppercase tracking-wider">BASIC INFORMATION</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">TITLE</label>
                  <input 
                    type="text" 
                    className="input-dark w-full px-3 py-2 rounded text-sm" 
                    placeholder="Enter title..."
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">DESCRIPTION</label>
                  <textarea 
                    className="input-dark w-full px-3 py-2 rounded h-20 resize-none text-sm" 
                    placeholder="Enter description..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">STATION</label>
                  <input 
                    type="text" 
                    className="input-dark w-full px-3 py-2 rounded text-sm" 
                    placeholder="Enter station..."
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">CATEGORY</label>
                  <select className="input-dark w-full px-3 py-2 rounded text-sm">
                    <option>No Category</option>
                    <option>Commercial</option>
                    <option>Working II</option>
                    <option>Image I</option>
                    <option>Music</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
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

