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
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', 'HIBF_assets');
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        if (onProgress) { xhr.upload.onprogress = event => { if (event.lengthComputable) { const progress = Math.round((event.loaded / event.total) * 100); onProgress(progress, file.name); } }; }
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              const processedResult = {
                url: result.secure_url, thumbnail: result.secure_url, publicId: result.public_id, resourceType: result.resource_type, format: result.format,
                size: result.bytes, width: result.width, height: result.height, duration: result.duration, originalResult: result
              };
              resolve(processedResult);
            } catch (parseError) { reject(parseError); }
          } else { reject(new Error(`Upload failed with status: ${xhr.status}`)); }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('POST', this.baseUrl);
        xhr.send(formData);
      });
    } catch (error) {
      throw error;
    }
  }

  async uploadMultipleFiles(files, sharedMetadata = {}, onProgress = null) {
    const uploadPromises = Array.from(files).map(async (file, index) => {
      try {
        const fileProgress = (progress, fileName) => { if (onProgress) onProgress(index, progress, fileName); };
        const cloudinaryResult = await this.uploadFile(file, fileProgress);
        const fileData = {
          name: file.name, title: sharedMetadata.title || file.name.split('.')[0], category: sharedMetadata.category || this.categorizeFile(file), type: this.getFileType(file),
          station: sharedMetadata.station || '', description: sharedMetadata.description || '', notes: sharedMetadata.notes || '', tags: sharedMetadata.tags || '',
          url: cloudinaryResult.url, thumbnail: cloudinaryResult.thumbnail, size: file.size, duration: cloudinaryResult.duration || '', originalFile: file, cloudinaryData: cloudinaryResult
        };
        return fileData;
      } catch (error) {
        return { name: file.name, error: error.message, failed: true };
      }
    });
    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => !r.failed);
    const failed = results.filter(r => r.failed);
    return { successful, failed, total: files.length };
  }

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

  getFileType(file) {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.includes('pdf')) return 'document';
    if (type.includes('text/') || type.includes('document')) return 'document';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'spreadsheet';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'presentation';
    return 'file';
  }

  generateThumbnailUrl(originalUrl) {
    if (!originalUrl) return '';
    return originalUrl;
  }
}
JavaScript

