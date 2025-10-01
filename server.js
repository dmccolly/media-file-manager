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

app.use(express.static(buildDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`▶ File Manager Server listening on ${port}`));
