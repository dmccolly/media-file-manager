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
}

export class XanoService {
  private baseUrl: string;

  constructor() {
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
      
      const processedFile: XanoFileRecord = {
        id: record.id,
        title: record.title || record.Title || 'Untitled',
        description: record.description || record.Description || '',
        category: record.category || record.Category || 'Files',
        file_type: record.type || record.Type || 'file',
        media_url: record.media_url || record.URL || record.url || '',
        thumbnail: record.thumbnail || record.Thumbnail || record.media_url || record.URL || record.url || '',
        file_size: record.file_size || record['File Size'] || 0,
        created_at: record.upload_date || record['Upload Date'] || record.created_at || new Date().toISOString(),
        tags: typeof record.tags === 'string' ? record.tags.split(',').map((t: string) => t.trim()) : [],
        notes: record.notes || record.Notes || '',
        station: record.station || record.Station || '',
        author: record.author || record.submitted_by || 'Unknown',
        submitted_by: record.submitted_by || record.author || 'Unknown'
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
}
