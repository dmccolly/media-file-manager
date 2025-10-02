import express from "express";
import path from "path";
import compression from "compression";
import cors from "cors";
import { fileURLToPath } from 'url';
import { WebflowService } from './src/services/WebflowService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const buildDir = path.join(__dirname, "dist");

class BackendCloudinaryService {
  constructor() {
    this.cloudName = 'dzrw8nopf';
    this.uploadPreset = 'HIBF_MASTER';
  }

  generateThumbnailForExistingFile(mediaUrl, fileType) {
    if (!mediaUrl) return '';
    
    let resourceType = 'raw';
    if (mediaUrl.includes('/image/upload/')) resourceType = 'image';
    if (mediaUrl.includes('/video/upload/')) resourceType = 'video';
    
    return this.generateThumbnailUrl(mediaUrl, resourceType, fileType);
  }

  generateThumbnailUrl(originalUrl, resourceType, fileType) {
    if (!originalUrl) return '';
    
    try {
      if (resourceType === 'image') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill/');
      }
      
      if (resourceType === 'video') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,so_0/').replace(/\.[^.]+$/, '.jpg');
      }
      
      if (fileType?.includes('pdf') || originalUrl.toLowerCase().includes('.pdf')) {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,pg_1/').replace(/\.pdf$/i, '.jpg');
      }
      
      if (resourceType === 'raw' && (fileType?.startsWith('audio/') || this.isAudioFile(originalUrl))) {
        return '/icons/audio-placeholder.svg';
      }
      
      if (this.isOfficeDocument(originalUrl, fileType)) {
        const docType = this.getOfficeDocumentType(originalUrl, fileType);
        return this.getPlaceholderIcon(docType);
      }
      
      return '/icons/file-placeholder.svg';
      
    } catch (error) {
      console.error("❌ CloudinaryService: Error generating thumbnail:", error);
      return originalUrl;
    }
  }

  isAudioFile(url) {
    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];
    return audioExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  isOfficeDocument(url, fileType) {
    const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    return officeExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  getOfficeDocumentType(url, fileType) {
    if (url.toLowerCase().match(/\.(doc|docx)$/)) return 'document';
    if (url.toLowerCase().match(/\.(xls|xlsx|csv)$/)) return 'spreadsheet';
    if (url.toLowerCase().match(/\.(ppt|pptx)$/)) return 'presentation';
    return 'document';
  }

  getPlaceholderIcon(type) {
    const iconMap = {
      'audio': '/icons/audio-placeholder.svg',
      'document': '/icons/document-placeholder.svg',
      'spreadsheet': '/icons/spreadsheet-placeholder.svg',
      'presentation': '/icons/presentation-placeholder.svg',
      'file': '/icons/file-placeholder.svg'
    };
    return iconMap[type] || iconMap['file'];
  }
}

class BackendXanoService {
  constructor() {
    this.baseUrl = 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX';
  }

  async getAllRecords() {
    console.log("🔄 BackendXanoService: Fetching all records for migration");
    
    // Check if XANO_API_KEY is set
    if (!process.env.XANO_API_KEY) {
      console.warn("⚠️ BackendXanoService: XANO_API_KEY not set, returning empty array");
      return [];
    }
    
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${this.baseUrl}/user_submission`, {
        headers: {
          'Authorization': `Bearer ${process.env.XANO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const records = Array.isArray(data) ? data : (data.records || []);
      return records;
    } catch (error) {
      console.error("❌ BackendXanoService: Error fetching all records:", error);
      throw error;
    }
  }

  async updateRecord(recordId, updates) {
    console.log("🔄 BackendXanoService: Updating record:", { recordId, updates });
    
    // Check if XANO_API_KEY is set
    if (!process.env.XANO_API_KEY) {
      console.warn("⚠️ BackendXanoService: XANO_API_KEY not set, skipping update");
      return { success: false, error: "XANO_API_KEY not set" };
    }
    
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${this.baseUrl}/user_submission/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.XANO_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ BackendXanoService: Record updated successfully:", result);
      return result;
     
    } catch (error) {
      console.error("❌ BackendXanoService: Error updating record:", error);
      throw error;
    }
  }
}

const cloudinaryService = new BackendCloudinaryService();
const xanoService = new BackendXanoService();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(compression());
app.use(express.json());

app.use("/assets", express.static(path.join(buildDir, "assets"), { maxAge: "1h", etag: true }));

app.get("/api/media", async (req, res) => {
  try {
    // Check if XANO_API_KEY is set
    if (!process.env.XANO_API_KEY) {
      console.warn("⚠️ Server: XANO_API_KEY not set, returning empty array");
      return res.json([]);
    }
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission`, {
      headers: {
        'Authorization': `Bearer ${process.env.XANO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Xano API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('API /media error:', error);
    res.status(500).json({ error: 'Failed to fetch media records' });
  }
});

app.post("/api/upload", async (req, res) => {
  try {
    // Check if XANO_API_KEY is set
    if (!process.env.XANO_API_KEY) {
      console.warn("⚠️ Server: XANO_API_KEY not set, upload will not be saved to Xano");
      return res.json({ 
        success: true, 
        record: { ...req.body, id: Date.now().toString() },
        warning: "XANO_API_KEY not set, changes will not be persisted"
      });
    }
    
    const fetch = (await import('node-fetch')).default;
    const fileData = req.body;
    
    console.log("🔄 Server: Saving file to Xano:", fileData);
    
    const xanoData = {
      title: fileData.title,
      description: fileData.description,
      category: fileData.category,
      type: fileData.type,
      station: fileData.station,
      notes: fileData.notes,
      tags: fileData.tags,
      media_url: fileData.url,
      thumbnail: fileData.thumbnail,
      file_size: fileData.size,
      upload_date: new Date().toISOString(),
      duration: fileData.duration || '',
      author: fileData.author || 'Unknown'
    };
    
    const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XANO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(xanoData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Server: Xano API error:", response.status, errorText);
      throw new Error(`Xano API error: ${response.status} - ${errorText}`);
    }
    
    const savedRecord = await response.json();
    console.log("✅ Server: File saved to Xano:", savedRecord);
    
    try {
      console.log("🔄 Server: Starting Webflow sync for:", fileData.title);
      const webflowService = new WebflowService();
      
      const webflowData = {
        title: fileData.title,
        name: fileData.name,
        url: fileData.url,
        thumbnail: fileData.thumbnail,
        description: fileData.description,
        category: fileData.category,
        type: fileData.type,
        size: fileData.size,
        tags: fileData.tags,
        author: fileData.author || 'Unknown'
      };
      
      const webflowResult = await webflowService.syncFileToWebflow(webflowData);
      console.log("✅ Server: Webflow sync result:", webflowResult);
      
    } catch (webflowError) {
      console.error("❌ Server: Webflow sync failed (non-blocking):", webflowError);
    }
    
    res.json({ 
      success: true, 
      record: savedRecord 
    });
    
  } catch (error) {
    console.error("❌ Server: Upload error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Upload failed' 
    });
  }
});

app.post('/api/batch-update', async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: 'Invalid updates array' });
    }

    const results = [];
    
    for (const update of updates) {
      try {
        const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission/${update.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.XANO_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(update.fields)
        });

        if (response.ok) {
          const result = await response.json();
          results.push({ id: update.id, success: true, data: result });
        } else {
          results.push({ id: update.id, success: false, error: `HTTP ${response.status}` });
        }
      } catch (error) {
        results.push({ id: update.id, success: false, error: error.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(500).json({ error: 'Batch update failed' });
  }
});

app.post('/api/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid ids array' });
    }

    const results = [];
    
    for (const id of ids) {
      try {
        const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.XANO_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          results.push({ id, success: true });
        } else {
          results.push({ id, success: false, error: `HTTP ${response.status}` });
        }
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Batch delete error:', error);
    res.status(500).json({ error: 'Batch delete failed' });
  }
});

app.patch('/api/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.XANO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Xano API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Update failed', details: error.message });
  }
});

app.post('/api/migrate-thumbnails', async (req, res) => {
  try {
    console.log("🔄 Starting thumbnail migration...");
    
    // Check if XANO_API_KEY is set
    if (!process.env.XANO_API_KEY) {
      console.warn("⚠️ Server: XANO_API_KEY not set, thumbnail migration skipped");
      return res.json({ 
        success: false, 
        error: "XANO_API_KEY not set" 
      });
    }
    
    const allFiles = await xanoService.getAllRecords();
    console.log(`📋 Found ${allFiles.length} files to process`);
    
    let updatedCount = 0;
    
    for (const file of allFiles) {
      if (file.media_url && file.media_url !== file.thumbnail) {
        const newThumbnail = cloudinaryService.generateThumbnailForExistingFile(
          file.media_url, 
          file.file_type || ''
        );
        
        if (newThumbnail !== file.media_url) {
          await xanoService.updateRecord(file.id, { thumbnail: newThumbnail });
          updatedCount++;
          console.log(`✅ Updated thumbnail for: ${file.title}`);
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: `Migration complete. Updated ${updatedCount} thumbnails.`,
      totalFiles: allFiles.length,
      updatedFiles: updatedCount
    });
  } catch (error) {
    console.error("❌ Thumbnail migration error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.XANO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Xano API error: ${response.status} - ${errorText}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed', details: error.message });
  }
});

app.use(express.static(buildDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`▶ File Manager Server listening on ${port}`));