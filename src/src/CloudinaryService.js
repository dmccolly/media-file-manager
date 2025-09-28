// CloudinaryService.js - All file upload operations
export class CloudinaryService {
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

  // Delete file from Cloudinary
  async deleteFile(publicId) {
    console.log('🔄 CloudinaryService: Deleting file:', publicId);
    
    try {
      // Note: Deletion requires authentication with API secret
      // This would typically be done on the backend
      console.log('⚠️ CloudinaryService: File deletion should be handled by backend');
      return true;
      
    } catch (error) {
      console.error('❌ CloudinaryService: Error deleting file:', error);
      throw error;
    }
  }

  // Get file info from Cloudinary
  async getFileInfo(publicId) {
    console.log('🔄 CloudinaryService: Getting file info for:', publicId);
    
    try {
      // This would require backend API call with authentication
      console.log('⚠️ CloudinaryService: File info should be retrieved from backend');
      return null;
      
    } catch (error) {
      console.error('❌ CloudinaryService: Error getting file info:', error);
      throw error;
    }
  }
}
