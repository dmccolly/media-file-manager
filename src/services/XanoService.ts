export interface XanoFileRecord {
  id: string;
  title: string;
  description: string;
  media_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
  tags: string[];
  category: string;
  thumbnail?: string;
  notes?: string;
  station?: string;
  author?: string;
  submitted_by?: string;
  folder_path?: string;
}

/**
 * Service class encapsulating all calls to the Xano backend API. This
 * abstraction centralizes fetch logic and processing of the raw API
 * responses into a consistent shape consumed by the React UI.
 */
export class XanoService {
  private baseUrl: string;

  constructor() {
    // Use Netlify functions as API proxy to Xano
    // Your Netlify functions handle the Xano integration at /api endpoints
    this.baseUrl = '/api';
  }

  /**
   * Fetch all file records from the backend. This method is designed to
   * gracefully handle non‑OK responses by returning an empty list instead
   * of throwing, preventing the UI from blanking out on startup when the
   * API fails. Parsing errors are also caught and logged.
   */
  async fetchAllFiles(): Promise<XanoFileRecord[]> {
    console.log('🔄 XanoService: Fetching all files from backend API');
    try {
      const response = await fetch(`${this.baseUrl}/media`, { credentials: 'same-origin' });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('Xano /api/media failed', response.status, text);
        // Fail‑soft: return empty so UI renders "no files" instead of crashing
        return [];
      }
      const data = await response.json().catch((e) => {
        console.error('Xano /api/media JSON parse failed', e);
        return [];
      });
      const records = Array.isArray(data) ? data : (data.records || []);
      console.log('✅ XanoService: Fetched', records.length, 'files');
      return this.processRecords(records);
    } catch (error) {
      console.error('❌ XanoService: Error fetching files (network?):', error);
      // Fail‑soft on unexpected exceptions too
      return [];
    }
  }

  /**
   * Converts raw records returned from the API into the XanoFileRecord shape
   * expected by the UI. Handles various optional field names for backwards
   * compatibility and filters out entries without a media URL.
   */
  processRecords(records: any[]): XanoFileRecord[] {
    const processedFiles: XanoFileRecord[] = records.map(record => {

      const mediaUrl = record.media_url || record.URL || record.url || '';
      const detectedFileType = this.detectFileTypeFromUrl(mediaUrl);

      const processedFile: XanoFileRecord = {
        id: record.id,
        title: record.title || record.Title || 'Untitled',
        description: record.description || record.Description || '',
        category: record.category || record.Category || 'Files',
        file_type: detectedFileType,
        media_url: mediaUrl,
        thumbnail: this.generateThumbnailFromMediaUrl(mediaUrl, detectedFileType),
        file_size: record.file_size || record['File Size'] || 0,
        created_at: record.upload_date || record['Upload Date'] || record.created_at || new Date().toISOString(),
        tags: typeof record.tags === 'string' ? record.tags.split(',').map((t: string) => t.trim()) : [],
        notes: record.notes || record.Notes || '',
        station: record.station || record.Station || '',
        author: record.author || record.submitted_by || 'Unknown',
        submitted_by: record.submitted_by || record.author || 'Unknown',
        folder_path: record.folder_path || ''
      };

      return processedFile;
    });

    const filteredFiles = processedFiles.filter(file => {
      return file.media_url && file.media_url.trim() !== '';
    });

    console.log(`✅ XanoService: Processed ${processedFiles.length} records, ${filteredFiles.length} with valid URLs`);
    return filteredFiles;
  }

  /**
   * Persist a new file record to the backend API. Throws when the API
   * returns an error or the response does not indicate success.
   */
  async saveFile(fileData: any): Promise<any> {
    console.log(' XanoService: Saving file via backend API:', fileData);
    try {
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fileData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ XanoService: Backend API error:', response.status, errorText);
        throw new Error(`Backend API error: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      console.log('✅ XanoService: File saved via backend:', result);
      if (result.success && result.record) {
        return result.record;
      } else {
        throw new Error(result.error || 'Save failed');
      }
    } catch (error) {
      console.error('❌ XanoService: Error saving file:', error);
      throw error;
    }
  }

  /**
   * Update a file record by ID. Errors are propagated to the caller.
   */
  async updateFile(recordId: string, updates: any): Promise<any> {
    console.log(' XanoService: Updating file via backend API:', { recordId, updates });
    try {
      const response = await fetch(`${this.baseUrl}/update/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
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

  /**
   * Remove a single file record from the backend. Returns true on success.
   */
  async deleteFile(recordId: string): Promise<boolean> {
    console.log(' XanoService: Deleting file via backend API:', recordId);
    try {
      const response = await fetch(`${this.baseUrl}/delete/${recordId}`, {
        method: 'DELETE'
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

  /**
   * Update multiple file records in a single request.
   */
  async batchUpdateFiles(updates: Array<{ id: string, fields: any }>): Promise<any> {
    console.log(' XanoService: Batch updating files via backend API:', updates);
    try {
      const response = await fetch(`${this.baseUrl}/batch-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('✅ XanoService: Batch update successful:', result);
      return result;
    } catch (error) {
      console.error('❌ XanoService: Error batch updating files:', error);
      throw error;
    }
  }

  /**
   * Delete multiple file records in one API call.
   */
  async batchDeleteFiles(recordIds: string[]): Promise<boolean> {
    console.log(' XanoService: Batch deleting files via backend API:', recordIds);
    try {
      const response = await fetch(`${this.baseUrl}/batch-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: recordIds })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('✅ XanoService: Batch delete successful');
      return true;
    } catch (error) {
      console.error('❌ XanoService: Error batch deleting files:', error);
      throw error;
    }
  }

  /**
   * Search the entire Xano database for files matching the query.
   * Searches across all fields: title, description, author, tags, category, station, file_type.
   * Returns paginated results from the server.
   */
  async searchFiles(query: string, page: number = 1, pageSize: number = 100, signal?: AbortSignal): Promise<{ items: XanoFileRecord[], total: number, page: number, pageSize: number }> {
    console.log(`🔍 XanoService: Searching database for: "${query}"`);
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      
      const response = await fetch(`${this.baseUrl}/media?${params}`, {
        credentials: 'same-origin',
        signal
      });
      
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('Xano /api/media search failed', response.status, text);
        return { items: [], total: 0, page, pageSize };
      }
      
      const data = await response.json().catch((e) => {
        console.error('Xano /api/media JSON parse failed', e);
        return { items: [], total: 0, page, pageSize };
      });
      
      if (data.items && Array.isArray(data.items)) {
        const processedItems = this.processRecords(data.items);
        console.log(`✅ XanoService: Search found ${data.total} total matches, returning ${processedItems.length} items`);
        
        return {
          items: processedItems,
          total: data.total || 0,
          page: data.page || page,
          pageSize: data.pageSize || pageSize
        };
      } else if (Array.isArray(data)) {
        const processedItems = this.processRecords(data);
        return {
          items: processedItems,
          total: processedItems.length,
          page: 1,
          pageSize: processedItems.length
        };
      }
      
      return { items: [], total: 0, page, pageSize };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🚫 XanoService: Search request aborted');
        throw error;
      }
      console.error('❌ XanoService: Error searching files:', error);
      return { items: [], total: 0, page, pageSize };
    }
  }

  /**
   * Infer a MIME type from the file extension in a URL. Defaults to
   * application/octet-stream when no specific type can be determined.
   */
  private detectFileTypeFromUrl(url: string): string {
    if (!url) return 'application/octet-stream';
    const extension = url.toLowerCase().split('.').pop() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
      return `image/${extension === 'jpg' ? 'jpeg' : extension}`;
    }
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
      return `video/${extension}`;
    }
    if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(extension)) {
      return `audio/${extension}`;
    }
    if (['pdf'].includes(extension)) {
      return 'application/pdf';
    }
    if (['doc', 'docx'].includes(extension)) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    if (['xls', 'xlsx'].includes(extension)) {
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
    if (['ppt', 'pptx'].includes(extension)) {
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }
    if (['txt'].includes(extension)) {
      return 'text/plain';
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return 'application/zip';
    }
    return 'application/octet-stream';
  }

  /**
   * Fetch all raw records from the backend without processing. Used for
   * migration or administrative tasks where the original payload is needed.
   */
  async getAllRecords(): Promise<XanoFileRecord[]> {
    console.log(' XanoService: Fetching all records for migration');
    try {
      const response = await fetch(`${this.baseUrl}/media`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const records = Array.isArray(data) ? data : (data.records || []);
      return records;
    } catch (error) {
      console.error('❌ XanoService: Error fetching all records:', error);
      throw error;
    }
  }

  /**
   * Delegates to updateFile for backwards compatibility. See updateFile().
   */
  async updateRecord(recordId: string, updates: any): Promise<any> {
    return this.updateFile(recordId, updates);
  }

  /**
   * Generate a Cloudinary thumbnail URL or placeholder icon based on file
   * type. Falls back to returning the original URL on error.
   */
  private generateThumbnailFromMediaUrl(mediaUrl: string, fileType: string): string {
    if (!mediaUrl) return '';
    try {
      let resourceType = 'raw';
      if (mediaUrl.includes('/image/upload/')) resourceType = 'image';
      if (mediaUrl.includes('/video/upload/')) resourceType = 'video';
      if (resourceType === 'image') {
        return mediaUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,f_auto,q_auto,g_auto:face/');
      }
      if (resourceType === 'video') {
        // Use Cloudinary's automatic best-frame selection for video thumbnails
        // This analyzes the video and picks the most representative frame
        return mediaUrl
          .replace('/upload/', '/upload/w_150,h_150,c_fill,f_auto,q_auto,g_auto:face,so_auto/')
          .replace(/\.[^.]+$/, '.jpg');
      }
      if (fileType?.includes('pdf') || mediaUrl.toLowerCase().includes('.pdf')) {
        return mediaUrl
          .replace('/upload/', '/upload/w_150,h_150,c_fill,f_auto,q_auto,g_auto:face,pg_1/')
          .replace(/\.pdf$/i, '.jpg');
      }
      if (fileType?.startsWith('audio/') || this.isAudioFile(mediaUrl)) {
        return '/icons/audio-placeholder.svg';
      }
      if (this.isOfficeDocument(mediaUrl, fileType)) {
        const docType = this.getOfficeDocumentType(mediaUrl, fileType);
        return `/icons/${docType}-placeholder.svg`;
      }
      if (this.isTextDocument(mediaUrl, fileType)) {
        return '/icons/document-placeholder.svg';
      }
      if (this.isArchiveFile(mediaUrl, fileType)) {
        return '/icons/archive-placeholder.svg';
      }
      return '/icons/file-placeholder.svg';
    } catch (error) {
      console.error('❌ XanoService: Error generating thumbnail:', error);
      return mediaUrl;
    }
  }

  /**
   * Determines if a URL points to an audio file based on its extension.
   */
  private isAudioFile(url: string): boolean {
    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];
    return audioExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  /**
   * Determines if a URL points to an Office document or if the fileType hints
   * that it is an Office document.
   */
  private isOfficeDocument(url: string, fileType?: string): boolean {
    const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const officeTypes = ['document', 'spreadsheet', 'presentation'];
    return (
      officeExtensions.some(ext => url.toLowerCase().includes(ext)) ||
      officeTypes.some(type => fileType?.includes(type))
    );
  }

  /**
   * Maps a URL and fileType to one of three high‑level Office document types.
   */
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

  /**
   * Determines if a URL points to a text document based on its extension or
   * MIME type prefix.
   */
  private isTextDocument(url: string, fileType?: string): boolean {
    const textExtensions = ['.txt', '.rtf', '.md', '.json', '.xml', '.csv'];
    return (
      textExtensions.some(ext => url.toLowerCase().includes(ext)) ||
      (fileType?.startsWith('text/') ?? false)
    );
  }

  /**
   * Determines if a URL points to an archive based on its extension or MIME
   * type.
   */
  private isArchiveFile(url: string, fileType?: string): boolean {
    const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz'];
    return (
      archiveExtensions.some(ext => url.toLowerCase().includes(ext)) ||
      (fileType?.includes('archive') ?? false) ||
      (fileType?.includes('compressed') ?? false)
    );
  }
}
