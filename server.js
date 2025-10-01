const express = require("express");
const path = require("path");
const compression = require("compression");

const app = express();
const buildDir = path.join(__dirname, "build");

app.use(compression());
app.use(express.json());

app.use("/static", express.static(path.join(buildDir, "static"), { maxAge: "1h", etag: true }));
app.use("/assets", express.static(path.join(buildDir, "assets"), { maxAge: "1h", etag: true }));

app.get("/api/media", async (req, res) => {
  try {
    const fetch = require('node-fetch');
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
    res.json({ 
      success: false, 
      error: 'Upload endpoint not fully implemented in Express server' 
    });
  } catch (error) {
    console.error('API /upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get(["/manager", "/manager/*"], (req, res) => {
  res.type("html");
  res.sendFile(path.join(buildDir, "index.html"));
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.type("html");
  res.sendFile(path.join(buildDir, "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`▶ Listening on ${port}`));
