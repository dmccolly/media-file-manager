import { CloudinaryService, type CloudinaryUploadResult } from './CloudinaryService';
import { WebflowService, type WebflowSyncResult } from './WebflowService';
import { XanoService } from './XanoService';

export interface IntegratedUploadData {
  file: File;
  title: string;
  description: string;
  category: string;
  tags: string;
  folder_path?: string;
  author?: string;
  station?: string;
  notes?: string;
}

export interface IntegratedUploadResult {
  cloudinary: CloudinaryUploadResult;
  xano: any;
  webflow: {
    assets: WebflowSyncResult;
    collection: WebflowSyncResult;
  };
}

export class IntegratedUploadService {
  private cloudinaryService: CloudinaryService;
  private webflowService: WebflowService;
  private xanoService: XanoService;

  constructor() {
    this.cloudinaryService = new CloudinaryService();
    this.webflowService = new WebflowService();
    this.xanoService = new XanoService();
  }

  async uploadToAllPlatforms(
    uploadData: IntegratedUploadData,
    onProgress?: (progress: number, fileName: string) => void
  ): Promise<IntegratedUploadResult> {
    try {
      console.log('🚀 Starting integrated upload to Cloudinary, Xano, and Webflow...');

      // 1. Upload to Cloudinary
      console.log('📤 Uploading to Cloudinary...');
      const cloudinaryResult = await this.cloudinaryService.uploadFile(uploadData.file, onProgress);

      // 2. Save to Xano (our main database)
      console.log('💾 Saving to Xano...');
      const xanoData = {
        title: uploadData.title,
        description: uploadData.description,
        category: uploadData.category,
        tags: uploadData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        media_url: cloudinaryResult.url,
        thumbnail: cloudinaryResult.thumbnail,
        file_size: cloudinaryResult.size,
        file_type: cloudinaryResult.resourceType + '/' + cloudinaryResult.format,
        author: uploadData.author || 'Unknown',
        station: uploadData.station || '',
        notes: uploadData.notes || '',
        folder_path: uploadData.folder_path || '/',
        created_at: new Date().toISOString()
      };

      const xanoResult = await this.xanoService.saveFile(xanoData);

      // 3. Sync to Webflow (both assets and collection)
      console.log('🔄 Syncing to Webflow...');
      const webflowFileData = {
        name: uploadData.file.name,
        title: uploadData.title,
        url: cloudinaryResult.url,
        thumbnail: cloudinaryResult.thumbnail,
        description: uploadData.description,
        category: uploadData.category,
        type: cloudinaryResult.resourceType,
        size: cloudinaryResult.size,
        tags: uploadData.tags,
        author: uploadData.author || 'Unknown',
        created_at: new Date().toISOString()
      };

      const webflowResults = await this.webflowService.syncFileToWebflow(webflowFileData);

      console.log('✅ Integrated upload complete!', {
        cloudinary: cloudinaryResult.publicId,
        xano: xanoResult.id,
        webflow: webflowResults
      });

      return {
        cloudinary: cloudinaryResult,
        xano: xanoResult,
        webflow: webflowResults
      };

    } catch (error) {
      console.error('❌ Integrated upload failed:', error);
      throw error;
    }
  }

  async uploadMultipleFiles(
    files: IntegratedUploadData[],
    onProgress?: (fileIndex: number, progress: number, fileName: string) => void
  ): Promise<IntegratedUploadResult[]> {
    const results = await Promise.allSettled(
      files.map((uploadData, index) => 
        this.uploadToAllPlatforms(uploadData, (progress, fileName) => {
          if (onProgress) onProgress(index, progress, fileName);
        })
      )
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`❌ Upload failed for file ${index}:`, result.reason);
        throw result.reason;
      }
    });
  }

  async testAllConnections(): Promise<{
    cloudinary: boolean;
    xano: boolean;
    webflow: boolean;
  }> {
    const [cloudinary, xano, webflow] = await Promise.allSettled([
      this.cloudinaryService.uploadFile(new File(['test'], 'test.jpg', { type: 'image/jpeg' })).then(() => true).catch(() => false),
      this.xanoService.fetchAllFiles().then(() => true).catch(() => false),
      this.webflowService.testConnection()
    ]);

    return {
      cloudinary: cloudinary.status === 'fulfilled',
      xano: xano.status === 'fulfilled',
      webflow: webflow.status === 'fulfilled' && webflow.value
    };
  }
}