export interface CloudinaryUploadResult {
  url: string;
  thumbnail: string;
  publicId: string;
  resourceType: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  originalResult: any;
}

export interface FileUploadData {
  name: string;
  title: string;
  category: string;
  type: string;
  station: string;
  description: string;
  notes: string;
  tags: string;
  url: string;
  thumbnail: string;
  size: number;
  duration?: string;
  folder_path?: string;
  originalFile: File;
  cloudinaryData: CloudinaryUploadResult;
  error?: string;
  failed?: boolean;
}

export interface BatchUploadResult {
  successful: FileUploadData[];
  failed: FileUploadData[];
  total: number;
}

export class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private baseUrl: string;

  constructor() {
    this.cloudName = 'dzrw8nopf';
    this.uploadPreset = 'HIBF_MASTER';
    this.baseUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`;
  }

  async uploadFile(file: File, onProgress?: (progress: number, fileName: string) => void): Promise<CloudinaryUploadResult> {
    console.log('🔄 CloudinaryService: Starting upload for:', file.name);
    
    try {
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
                thumbnail: this.generateThumbnailUrl(result.secure_url, result.resource_type, result.format),
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
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              const errorMessage = errorResponse?.error?.message || `Upload failed with status: ${xhr.status}`;
              console.error('❌ CloudinaryService: Upload failed:', errorMessage);
              reject(new Error(errorMessage));
            } catch (parseError) {
              console.error('❌ CloudinaryService: Upload failed with status:', xhr.status);
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
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

  async uploadMultipleFiles(
    files: FileList | File[], 
    sharedMetadata: any = {}, 
    onProgress?: (fileIndex: number, progress: number, fileName: string) => void
  ): Promise<BatchUploadResult> {
    console.log('🔄 CloudinaryService: Starting batch upload for', files.length, 'files');
    console.log('📋 CloudinaryService: Shared metadata:', sharedMetadata);
    
    const uploadPromises = Array.from(files).map(async (file, index) => {
      try {
        const fileProgress = (progress: number, fileName: string) => {
          if (onProgress) {
            onProgress(index, progress, fileName);
          }
        };

        const cloudinaryResult = await this.uploadFile(file, fileProgress);
        
        const fileData: FileUploadData = {
          name: file.name,
          title: sharedMetadata.title || file.name.split('.')[0],
          category: sharedMetadata.category || this.categorizeFile(file),
          type: this.getFileType(file),
          station: sharedMetadata.station || '',
          description: sharedMetadata.description || '',
          notes: sharedMetadata.notes || '',
          tags: sharedMetadata.tags || '',
          url: cloudinaryResult.url,
          thumbnail: this.generateThumbnailUrl(cloudinaryResult.url, cloudinaryResult.resourceType, file.type),
          size: file.size,
          duration: cloudinaryResult.duration?.toString() || '',
          folder_path: sharedMetadata.folder_path || '',
          originalFile: file,
          cloudinaryData: cloudinaryResult
        };

        console.log('✅ CloudinaryService: File processed:', fileData);
        return fileData;

      } catch (error: any) {
        console.error('❌ CloudinaryService: Error uploading file:', file.name, error);
        return {
          name: file.name,
          title: file.name,
          category: 'Files',
          type: 'file',
          station: '',
          description: '',
          notes: '',
          tags: '',
          url: '',
          thumbnail: '',
          size: file.size,
          duration: '',
          folder_path: sharedMetadata.folder_path || '',
          originalFile: file,
          cloudinaryData: {} as CloudinaryUploadResult,
          error: error?.message || 'Upload failed',
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

  categorizeFile(file: File): string {
    const type = file.type.toLowerCase();
    
    if (type.startsWith('image/')) return 'Images';
    if (type.startsWith('video/')) return 'Video';
    if (type.startsWith('audio/')) return 'Audio';
    if (type.includes('pdf')) return 'Documents';
    if (type.includes('text/') || type.includes('document')) return 'Documents';
    
    return 'Files';
  }

  getFileType(file: File): string {
    const type = file.type.toLowerCase();
    
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf')) return 'document';
    
    return 'file';
  }

  generateThumbnailUrl(originalUrl: string, resourceType: string, fileType?: string): string {
    if (!originalUrl) return '';
    
    try {
      if (fileType?.includes('pdf') || originalUrl.toLowerCase().includes('.pdf')) {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,pg_1/').replace(/\.pdf$/i, '.jpg');
      }
      
      if (resourceType === 'image') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill/');
      }
      
      if (resourceType === 'video') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,so_0/').replace(/\.[^.]+$/, '.jpg');
      }
      
      if (resourceType === 'raw' && (fileType?.startsWith('audio/') || this.isAudioFile(originalUrl))) {
        return this.getPlaceholderIcon('audio');
      }
      
      if (this.isOfficeDocument(originalUrl, fileType)) {
        const docType = this.getOfficeDocumentType(originalUrl, fileType);
        return this.getPlaceholderIcon(docType);
      }
      
      if (this.isTextDocument(originalUrl, fileType)) {
        return this.getPlaceholderIcon('document');
      }
      
      if (this.isArchiveFile(originalUrl, fileType)) {
        return this.getPlaceholderIcon('archive');
      }
      
      return this.getPlaceholderIcon('file');
      
    } catch (error) {
      console.error('❌ CloudinaryService: Error generating thumbnail:', error);
      return originalUrl;
    }
  }

  private isAudioFile(url: string): boolean {
    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];
    return audioExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  private isOfficeDocument(url: string, fileType?: string): boolean {
    const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const officeTypes = ['document', 'spreadsheet', 'presentation'];
    
    return officeExtensions.some(ext => url.toLowerCase().includes(ext)) ||
           officeTypes.some(type => fileType?.includes(type));
  }

  private getOfficeDocumentType(url: string, fileType?: string): string {
    if (url.toLowerCase().match(/\.(doc|docx)$/) || fileType?.includes('document')) {
      return 'document';
    }
    if (url.toLowerCase().match(/\.(xls|xlsx|csv)$/) || fileType?.includes('spreadsheet')) {
      return 'spreadsheet';
    }
    if (url.toLowerCase().match(/\.(ppt|pptx)$/) || fileType?.includes('presentation')) {
      return 'presentation';
    }
    return 'document';
  }

  private isTextDocument(url: string, fileType?: string): boolean {
    const textExtensions = ['.txt', '.rtf', '.md', '.json', '.xml', '.csv'];
    return textExtensions.some(ext => url.toLowerCase().includes(ext)) ||
           (fileType?.startsWith('text/') ?? false);
  }

  private isArchiveFile(url: string, fileType?: string): boolean {
    const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz'];
    return archiveExtensions.some(ext => url.toLowerCase().includes(ext)) ||
           (fileType?.includes('archive') ?? false) || (fileType?.includes('compressed') ?? false);
  }

  private getPlaceholderIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'audio': '/icons/audio-placeholder.svg',
      'document': '/icons/document-placeholder.svg',
      'spreadsheet': '/icons/spreadsheet-placeholder.svg',
      'presentation': '/icons/presentation-placeholder.svg',
      'archive': '/icons/archive-placeholder.svg',
      'file': '/icons/file-placeholder.svg'
    };
    
    return iconMap[type] || iconMap['file'];
  }

  generateThumbnailForExistingFile(mediaUrl: string, fileType: string): string {
    if (!mediaUrl) return '';
    
    let resourceType = 'raw';
    if (mediaUrl.includes('/image/upload/')) resourceType = 'image';
    if (mediaUrl.includes('/video/upload/')) resourceType = 'video';
    
    return this.generateThumbnailUrl(mediaUrl, resourceType, fileType);
  }
}
