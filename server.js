const path = require('path');
const express = require('express');
const fs = require('fs');
const app = express();

const buildPath = path.join(__dirname, 'build');
console.log('=== Express.js Server Debug Info ===');
console.log('Build path:', buildPath);
console.log('Build folder exists:', fs.existsSync(buildPath));

if (fs.existsSync(buildPath)) {
  console.log('Build folder contents:', fs.readdirSync(buildPath));
  const staticPath = path.join(buildPath, 'static');
  if (fs.existsSync(staticPath)) {
    console.log('Static folder contents:', fs.readdirSync(staticPath));
    const cssPath = path.join(staticPath, 'css');
    if (fs.existsSync(cssPath)) {
      console.log('CSS folder contents:', fs.readdirSync(cssPath));
    } else {
      console.log('CSS folder does not exist');
    }
  } else {
    console.log('Static folder does not exist');
  }
} else {
  console.log('Build folder does not exist - this is the problem!');
}

app.use(express.static(buildPath));

app.get('/debug', (req, res) => {
  res.json({
    buildPath,
    buildExists: fs.existsSync(buildPath),
    buildContents: fs.existsSync(buildPath) ? fs.readdirSync(buildPath) : null,
    staticExists: fs.existsSync(path.join(buildPath, 'static')),
    cssExists: fs.existsSync(path.join(buildPath, 'static', 'css'))
  });
});

app.get('/manager', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
