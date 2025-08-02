// src/AirtableService.js - All database operations
export class AirtableService {
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
        if (!data) {
          throw new Error('Airtable API returned an empty or invalid response.');
        }
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
  
  // Utility to get a value from a list of possible field names
  getFieldValue(fields, fieldNames) {
    for (const name of fieldNames) {
        if (fields[name]) {
            return fields[name];
        }
    }
    return null;
  }

  // FIXED - Process raw Airtable records into app format
  processRecords(records) {
    console.log('🔄 AirtableService: Processing records...', records);
    
    const processedFiles = records.map(record => {
      const fields = record.fields || {};
      
      // NEW: Iterate through all fields to find a file attachment
      let fileAttachment = null;
      for (const fieldName in fields) {
        if (Array.isArray(fields[fieldName]) && fields[fieldName].length > 0 && fields[fieldName][0]?.url) {
          fileAttachment = fields[fieldName][0];
          break;
        }
      }
     
      const url = fileAttachment?.url || this.getFieldValue(fields, this.airtableFields.url) || '';
      const thumbnail = fileAttachment?.thumbnails?.small?.url || url;
      console.log(`🖼️ Final thumbnail URL for ${this.getFieldValue(fields, this.airtableFields.title)}: ${thumbnail}`);

      const detectedType = fileAttachment?.type?.split('/')[0] || this.detectFileTypeFromUrl(url);

      const processedFile = {
        id: record.id,
        title: this.getFieldValue(fields, this.airtableFields.title) || 'Untitled',
        url: url,
        category: this.getFieldValue(fields, this.airtableFields.category) || 'uncategorized', 
        type: detectedType,
        station: this.getFieldValue(fields, this.airtableFields.station) || '',
        description: this.getFieldValue(fields, this.airtableFields.description) || '',
        notes: this.getFieldValue(fields, this.airtableFields.notes) || '',
        tags: this.getFieldValue(fields, this.airtableFields.tags) || '',
        uploadDate: this.getFieldValue(fields, this.airtableFields.uploadDate) || new Date().toISOString(),
        thumbnail: thumbnail,
        fileSize: fileAttachment?.size || 0,
        duration: this.getFieldValue(fields, ['Duration']) || '',
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
  generateThumbnailFromUrl(originalUrl) {
    if (!originalUrl) return '';
    return originalUrl;
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
                thumbnail: result.secure_url, // For now, use the full URL.
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
  generateThumbnailUrl(originalUrl) {
    if (!originalUrl) return '';
    return originalUrl;
  }
}
