import express from "express";
import path from "path";
import compression from "compression";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const buildDir = path.join(__dirname, "dist");

app.use(compression());
app.use(express.json());

app.use("/assets", express.static(path.join(buildDir, "assets"), { maxAge: "1h", etag: true }));

app.get("/api/media", async (req, res) => {
  try {
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
    const fetch = (await import('node-fetch')).default;
    const fileData = req.body;
    
    console.log('🔄 Server: Saving file to Xano:', fileData);
    
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
      duration: fileData.duration || ''
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
      console.error('❌ Server: Xano API error:', response.status, errorText);
      throw new Error(`Xano API error: ${response.status} - ${errorText}`);
    }
    
    const savedRecord = await response.json();
    console.log('✅ Server: File saved to Xano:', savedRecord);
    
    res.json({ 
      success: true, 
      record: savedRecord 
    });
    
  } catch (error) {
    console.error('❌ Server: Upload error:', error);
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
