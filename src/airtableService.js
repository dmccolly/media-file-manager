// AirtableService.js - All database operations
export class AirtableService {
  constructor() {
    this.baseId = 'appTK2fgCwe039t5J';
    this.apiKey = 'patbQMUOfJRtJ1S5d.be54ccdaf03c795c8deca53ae7c05ddbda8efe584e9a07a613a79fd0f0c04dc9';
    this.baseUrl = `https://api.airtable.com/v0/${this.baseId}/Media%20Assets`;
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Fetch all files from Airtable with pagination
  async fetchAllFiles() {
    console.log('🔄 AirtableService: Fetching files from Airtable...');
    
    try {
      let allRecords = [];
      let offset = null;
      
      do {
        const url = offset 
          ? `${this.baseUrl}?offset=${offset}` 
          : this.baseUrl;
        
        console.log('📡 AirtableService: Fetching page...', { offset });
        
        const response = await fetch(url, {
          method: 'GET',
          headers: this.headers
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 AirtableService: Raw response data:', data);
        
        allRecords = allRecords.concat(data.records || []);
        offset = data.offset;
        
        console.log(`📊 AirtableService: Page fetched. Records this page: ${data.records?.length || 0}, Total so far: ${allRecords.length}`);
        
      } while (offset);

      console.log(`✅ AirtableService: Total records fetched: ${allRecords.length}`);
      return this.processRecords(allRecords);
      
    } catch (error) {
      console.error('❌ AirtableService: Error fetching files:', error);
      throw error;
    }
  }

  // Process raw Airtable records into app format
  processRecords(records) {
    console.log('🔄 AirtableService: Processing records...', records);
    
    const processedFiles = records.map(record => {
      const fields = record.fields || {};
      
      return {
        id: record.id,
        title: fields['Title'] || fields['Name'] || 'Untitled',
        url: fields['URL'] || fields['File URL'] || '',
        category: fields['Category'] || 'uncategorized', 
        type: fields['Type'] || this.detectFileType(fields['URL'] || ''),
        station: fields['Station'] || '',
        description: fields['Description'] || '',
        notes: fields['Notes'] || '',
        tags: fields['Tags'] || '',
        uploadDate: fields['Upload Date'] || fields['Created'] || new Date().toISOString(),
        thumbnail: fields['Thumbnail'] || fields['URL'] || '',
        fileSize: fields['File Size'] || 0,
        duration: fields['Duration'] || '',
        originalRecord: record
      };
    });

    console.log('✅ AirtableService: Processed files:', processedFiles);
    return processedFiles;
  }

  // Detect file type from URL
  detectFileType(url) {
    if (!url) return 'unknown';
    
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) return 'audio';
    if (['pdf'].includes(extension)) return 'document';
    
    return 'file';
  }

  // Save new file to Airtable
  async saveFile(fileData) {
    console.log('🔄 AirtableService: Saving file to Airtable:', fileData);
    
    try {
      const airtableData = {
        fields: {
          'Title': fileData.title || fileData.name,
          'URL': fileData.url,
          'Category': fileData.category,
          'Type': fileData.type,
          'Station': fileData.station || '',
          'Description': fileData.description || '',
          'Notes': fileData.notes || '',
          'Tags': fileData.tags || '',
          'Upload Date': new Date().toISOString().split('T')[0],
          'File Size': fileData.size || 0,
          'Thumbnail': fileData.thumbnail || fileData.url
        }
      };

      console.log('📡 AirtableService: Sending to Airtable:', airtableData);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(airtableData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ AirtableService: Airtable error:', errorData);
        throw new Error(`Airtable error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ AirtableService: File saved successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ AirtableService: Error saving file:', error);
      throw error;
    }
  }

  // Update existing file in Airtable
  async updateFile(recordId, updates) {
    console.log('🔄 AirtableService: Updating file:', { recordId, updates });
    
    try {
      const response = await fetch(`${this.baseUrl}/${recordId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          fields: updates
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ AirtableService: File updated successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ AirtableService: Error updating file:', error);
      throw error;
    }
  }

  // Delete file from Airtable
  async deleteFile(recordId) {
    console.log('🔄 AirtableService: Deleting file:', recordId);
    
    try {
      const response = await fetch(`${this.baseUrl}/${recordId}`, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ AirtableService: File deleted successfully');
      return true;
      
    } catch (error) {
      console.error('❌ AirtableService: Error deleting file:', error);
      throw error;
    }
  }

  // Create new folder (category) in Airtable
  async createFolder(folderName) {
    console.log('🔄 AirtableService: Creating folder:', folderName);
    
    const folderData = {
      title: `${folderName} (Folder)`,
      category: folderName.toLowerCase(),
      type: 'folder',
      url: '',
      description: `Folder: ${folderName}`
    };

    return await this.saveFile(folderData);
  }
}
