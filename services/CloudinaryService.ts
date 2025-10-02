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
          thumbnail: cloudinaryResult.thumbnail,
          size: file.size,
          duration: cloudinaryResult.duration?.toString() || '',
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

  generateThumbnailUrl(originalUrl: string, resourceType: string): string {
    if (!originalUrl) return '';
    
    try {
      if (resourceType === 'image') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill/');
      }
      
      if (resourceType === 'video') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,so_0/').replace(/\.[^.]+$/, '.jpg');
      }
      
      return originalUrl;
      
    } catch (error) {
      console.error('❌ CloudinaryService: Error generating thumbnail:', error);
      return originalUrl;
    }
  }
}
