export interface WebflowAsset {
  id: string;
  url: string;
  displayName: string;
  altText?: string;
  fileName: string;
  fileSize: number;
  createdOn: string;
}

export interface WebflowSyncResult {
  success: boolean;
  assetId?: string;
  collectionItemId?: string;
  error?: string;
}

export class WebflowService {
  private apiToken: string;
  private siteId: string;
  private collectionId: string;
  private baseUrl: string = 'https://api.webflow.com/v2';

  constructor() {
    this.apiToken = import.meta.env.VITE_WEBFLOW_API_TOKEN || '';
    this.siteId = import.meta.env.VITE_WEBFLOW_SITE_ID || '688ed8debc05764047afa2a7';
    this.collectionId = import.meta.env.VITE_WEBFLOW_COLLECTION_ID || '6891479d29ed1066b71124e9';
  }

  async syncToMediaAssets(fileData: any): Promise<WebflowSyncResult> {
    if (!this.apiToken || !this.siteId) {
      console.warn('🔶 WebflowService: API token or site ID not configured, skipping sync');
      return { success: false, error: 'Configuration missing' };
    }

    try {
      console.log('🔄 WebflowService: Syncing to Webflow media assets:', fileData.title);

      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/assets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: fileData.url,
          displayName: fileData.title,
          altText: fileData.description || fileData.title,
          fileName: fileData.name
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ WebflowService: Assets API error:', response.status, errorData);
        throw new Error(`Webflow Assets API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('✅ WebflowService: Asset synced successfully:', result);
      
      return { 
        success: true, 
        assetId: result.id 
      };

    } catch (error: any) {
      console.error('❌ WebflowService: Error syncing to assets:', error);
      return { 
        success: false, 
        error: error.message || 'Sync failed' 
      };
    }
  }

  async syncToCollection(fileData: any): Promise<WebflowSyncResult> {
    if (!this.apiToken || !this.siteId || !this.collectionId) {
      console.warn('🔶 WebflowService: Collection sync not configured, skipping');
      return { success: false, error: 'Collection configuration missing' };
    }

    try {
      console.log('🔄 WebflowService: Syncing to Webflow collection:', fileData.title);

      const itemData = {
        isArchived: false,
        isDraft: false,
        fieldData: {
          name: fileData.title,
          slug: this.generateSlug(fileData.title),
          'media-url': fileData.url,
          'thumbnail-url': fileData.thumbnail,
          description: fileData.description || '',
          category: fileData.category || 'Files',
          'file-type': fileData.type || 'file',
          'file-size': fileData.size || 0,
          tags: fileData.tags || '',
          author: fileData.author || 'Unknown',
          'upload-date': new Date().toISOString()
        }
      };

      const response = await fetch(`${this.baseUrl}/collections/${this.collectionId}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ WebflowService: Collection API error:', response.status, errorData);
        throw new Error(`Webflow Collection API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('✅ WebflowService: Collection item created successfully:', result);
      
      return { 
        success: true, 
        collectionItemId: result.id 
      };

    } catch (error: any) {
      console.error('❌ WebflowService: Error syncing to collection:', error);
      return { 
        success: false, 
        error: error.message || 'Collection sync failed' 
      };
    }
  }

  async syncFileToWebflow(fileData: any): Promise<{ assets: WebflowSyncResult; collection: WebflowSyncResult }> {
    console.log('🔄 WebflowService: Starting comprehensive Webflow sync for:', fileData.title);

    const [assetsResult, collectionResult] = await Promise.all([
      this.syncToMediaAssets(fileData),
      this.syncToCollection(fileData)
    ]);

    console.log('✅ WebflowService: Sync complete:', { 
      assets: assetsResult.success, 
      collection: collectionResult.success 
    });

    return {
      assets: assetsResult,
      collection: collectionResult
    };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiToken || !this.siteId) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('❌ WebflowService: Connection test failed:', error);
      return false;
    }
  }
}
