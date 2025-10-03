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

export class XanoService {
  private baseUrl: string;

  constructor() {
    // Use the correct baseUrl for deployed environment
    this.baseUrl = '/api';
  }

  async fetchAllFiles(): Promise<XanoFileRecord[]> {
    console.log('🔄 XanoService: Fetching all files from backend API');
    
    try {
      const response = await fetch(`${this.baseUrl}/media`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 XanoService: Raw response data:', data);
      
      const records = Array.isArray(data) ? data : (data.records || []);
      console.log('✅ XanoService: Fetched', records.length, 'files');
      
      return this.processRecords(records);
    } catch (error) {
      console.error('❌ XanoService: Error fetching files:', error);
      throw error;
    }
  }

  processRecords(records: any[]): XanoFileRecord[] {
    console.log('🔄 XanoService: Processing records...', records);
   
    const processedFiles: XanoFileRecord[] = records.map(record => {
      console.log('🔍 DEBUG: Available fields for record:', record.id, Object.keys(record));
      
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

  async saveFile(fileData: any): Promise<any> {
    console.log('🔄 XanoService: Saving file via backend API:', fileData);
   
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

  async updateFile(recordId: string, updates: any): Promise<any> {
    console.log('🔄 XanoService: Updating file via backend API:', { recordId, updates });
   
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

  async deleteFile(recordId: string): Promise<boolean> {
    console.log('🔄 XanoService: Deleting file via backend API:', recordId);
   
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

  async batchUpdateFiles(updates: Array<{id: string, fields: any}>): Promise<any> {
    console.log('🔄 XanoService: Batch updating files via backend API:', updates);
   
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

  async batchDeleteFiles(recordIds: string[]): Promise<boolean> {
    console.log('🔄 XanoService: Batch deleting files via backend API:', recordIds);
   
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

  async getAllRecords(): Promise<XanoFileRecord[]> {
    console.log('🔄 XanoService: Fetching all records for migration');
    
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

  async updateRecord(recordId: string, updates: any): Promise<any> {
    return this.updateFile(recordId, updates);
  }

  private generateThumbnailFromMediaUrl(mediaUrl: string, fileType: string): string {
    if (!mediaUrl) return '';
    
    try {
      let resourceType = 'raw';
      if (mediaUrl.includes('/image/upload/')) resourceType = 'image';
      if (mediaUrl.includes('/video/upload/')) resourceType = 'video';
      
      if (resourceType === 'image') {
        return mediaUrl.replace('/upload/', '/upload/w_150,h_150,c_fill/');
      }
      
      if (resourceType === 'video') {
        return mediaUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,so_0/').replace(/\.[^.]+$/, '.jpg');
      }
      
      if (fileType?.includes('pdf') || mediaUrl.toLowerCase().includes('.pdf')) {
        return mediaUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,pg_1/').replace(/\.pdf$/i, '.jpg');
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
}
