export interface CloudinaryUploadResult {
  success: boolean;
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  duration?: number;
  thumbnail: string;
  error?: string;
}

export interface FileUploadData {
  title: string;
  description?: string;
  category?: string;
  type: string;
  station?: string;
  notes?: string;
  tags?: string;
  url: string;
  thumbnail: string;
  size: number;
  duration?: string;
  author?: string;
}

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private apiKey: string;

  constructor() {
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dzrw8nopf';
    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'HIBF_MASTER';
    this.apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || '';
  }

  async uploadFile(file: File, folder: string = 'media-manager'): Promise<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', folder);
    formData.append('resource_type', this.getResourceType(file.type));

    // Add context metadata
    formData.append('context', `filename=${file.name}`);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        duration: result.duration,
        thumbnail: this.generateThumbnailUrl(result.secure_url, result.resource_type, result.format, result.duration)
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        url: '',
        publicId: '',
        resourceType: '',
        format: '',
        bytes: 0,
        thumbnail: '',
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async uploadMultipleFiles(files: File[], folder: string = 'media-manager'): Promise<CloudinaryUploadResult[]> {
    const results: CloudinaryUploadResult[] = [];
    
    for (const file of files) {
      const result = await this.uploadFile(file, folder);
      results.push(result);
      
      // Add small delay between uploads to avoid rate limiting
      if (files.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  private getResourceType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'raw';
    return 'raw';
  }

  generateThumbnailUrl(originalUrl: string, resourceType: string, format: string, duration?: number): string {
    if (!originalUrl) return '/icons/file-placeholder.svg';

    try {
      if (resourceType === 'image') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,q_auto,f_auto/');
      }

      if (resourceType === 'video') {
        // For videos, generate thumbnail from first frame
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,q_auto,f_auto,so_0/').replace(/\.[^.]+$/, '.jpg');
      }

      if (format === 'pdf' || originalUrl.toLowerCase().includes('.pdf')) {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,q_auto,f_auto,pg_1/').replace(/\.pdf$/i, '.jpg');
      }

      if (this.isAudioFile(originalUrl)) {
        return '/icons/audio-placeholder.svg';
      }

      if (this.isOfficeDocument(originalUrl)) {
        const docType = this.getOfficeDocumentType(originalUrl);
        return this.getPlaceholderIcon(docType);
      }

      return '/icons/file-placeholder.svg';

    } catch (error) {
      console.error("Error generating thumbnail:", error);
      return '/icons/file-placeholder.svg';
    }
  }

  generatePreviewUrl(originalUrl: string, resourceType: string): string {
    if (!originalUrl) return '';

    try {
      if (resourceType === 'image') {
        return originalUrl.replace('/upload/', '/upload/w_800,h_600,c_fit,q_auto,f_auto/');
      }

      if (resourceType === 'video') {
        return originalUrl.replace('/upload/', '/upload/w_800,h_600,c_fit,q_auto,f_auto/');
      }

      return originalUrl;
    } catch (error) {
      console.error("Error generating preview:", error);
      return originalUrl;
    }
  }

  private isAudioFile(url: string): boolean {
    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];
    return audioExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  private isOfficeDocument(url: string): boolean {
    const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    return officeExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  private getOfficeDocumentType(url: string): string {
    if (url.toLowerCase().match(/\.(doc|docx)$/)) return 'document';
    if (url.toLowerCase().match(/\.(xls|xlsx|csv)$/)) return 'spreadsheet';
    if (url.toLowerCase().match(/\.(ppt|pptx)$/)) return 'presentation';
    return 'document';
  }

  private getPlaceholderIcon(type: string): string {
    const iconMap = {
      'audio': '/icons/audio-placeholder.svg',
      'document': '/icons/document-placeholder.svg',
      'spreadsheet': '/icons/spreadsheet-placeholder.svg',
      'presentation': '/icons/presentation-placeholder.svg',
      'file': '/icons/file-placeholder.svg'
    };
    return iconMap[type as keyof typeof iconMap] || iconMap['file'];
  }

  // Validate Cloudinary URL
  isValidCloudinaryUrl(url: string): boolean {
    return url.includes('cloudinary.com') && url.includes('/upload/');
  }

  // Extract public ID from Cloudinary URL
  extractPublicId(url: string): string {
    if (!this.isValidCloudinaryUrl(url)) return '';
    
    try {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      return match ? match[1] : '';
    } catch (error) {
      console.error("Error extracting public ID:", error);
      return '';
    }
  }
}

export const cloudinaryService = new CloudinaryService();
