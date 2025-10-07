# Media File Manager

A modern media file management application built with React, TypeScript, and Vite. The application provides a web interface for uploading, organizing, and managing media files with support for images, videos, audio, PDFs, and documents.

## 🚀 Live Application

**Production URL:** [https://sites.super.myninja.ai/56b586d1-be81-4879-80c8-617125fe9da1/bf1e01b7/index.html](https://sites.super.myninja.ai/56b586d1-be81-4879-80c8-617125fe9da1/bf1e01b7/index.html)

✅ **Status:** Fully deployed and operational with all advanced features

## Project Migration History

This project was migrated from a Flask-based Python application to a modern React + TypeScript + Vite frontend with a Node.js server backend. The migration includes:

- **Frontend**: Migrated from Flask templates to React + TypeScript + Vite
- **Backend**: Replaced Flask API with Netlify Functions for serverless deployment
- **Database**: Continues to use Xano as the backend data service
- **File Storage**: Continues to use Cloudinary for media asset storage
- **Deployment**: Migrated from Heroku to Netlify for better performance and CI/CD

### Legacy Files (Preserved for Reference)
- `app_enhanced.py` - Original Flask application
- `app.py` - Legacy Flask app
- `templates/` - Original Flask templates
- `index.html` - Legacy static HTML

## Features

### 🎯 Core Features
- **File Upload**: Support for images, videos, audio, PDFs, and documents
- **Media Preview**: Built-in previews for all supported file types
- **File Management**: Edit, delete, and organize files with metadata
- **Batch Operations**: Select and manage multiple files at once
- **Search & Filter**: Find files by name, description, author, or tags
- **Responsive Design**: Works on desktop and mobile devices

### 🚀 Advanced Features (Live in Production)
- **Advanced Search**: Multi-criteria filtering with file type, date, size, author, and tags
- **Bulk Operations Panel**: Batch file management (move, update, delete multiple files)
- **Folder Tree Navigation**: Hierarchical folder structure with expand/collapse
- **File Selection System**: Individual and bulk file selection with checkboxes
- **Enhanced UI Controls**: Professional interface with dark/light theme toggle
- **Breadcrumb Navigation**: Easy folder navigation with clickable path buttons
- **Grid/List View Toggle**: Multiple display options for file viewing
- **Empty State Handling**: Helpful messaging and guidance for new users

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Netlify Functions (serverless)
- **Database**: Xano API
- **File Storage**: Cloudinary
- **PDF Preview**: Cloudinary transformations (PDF to JPG conversion)
- **Deployment**: Netlify

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager
- Xano API account and API key
- Cloudinary account for file storage

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dmccolly/media-file-manager.git
   cd media-file-manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   - Ensure `XANO_API_KEY` is configured in your Netlify environment variables
   - Cloudinary credentials should be set for upload functionality

## Development

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

2. **Start the Node.js server (for local API testing):**
   ```bash
   npm start
   ```
   The server will be available at `http://localhost:3000`

## Build & Deploy

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Preview production build locally:**
   ```bash
   npm run preview
   ```

3. **Deploy to Netlify:**
   - Push changes to the main branch
   - Netlify will automatically build and deploy
   - Ensure environment variables are configured in Netlify dashboard

## Project Structure

```
media-file-manager/
├── src/
│   ├── components/          # React components
│   ├── services/           # API and service classes
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── netlify/
│   └── functions/         # Serverless functions
├── dist/                  # Production build output
├── public/               # Static assets
├── server.js            # Node.js server for local development
├── netlify.toml        # Netlify configuration
└── vite.config.ts     # Vite configuration
```

## API Endpoints (Netlify Functions)

- `GET /api/media` - List all media files
- `DELETE /api/delete/:id` - Delete a single file
- `PATCH /api/update/:id` - Update file metadata
- `POST /api/batch-delete` - Delete multiple files
- `POST /api/batch-update` - Update multiple files

## Environment Variables

Required environment variables for deployment:

- `XANO_API_KEY` - API key for Xano backend service

## Troubleshooting

### PDF Preview Issues
If PDF previews show "Failed to load PDF", ensure Cloudinary PDFs are publicly accessible:
1. Log into Cloudinary dashboard
2. Navigate to Media Library
3. Find PDF files and change Access Mode from "Authenticated" to "Public"
4. Update upload presets to use "Public" access mode for future uploads

### Build Issues
If you encounter build errors:
1. Clear node_modules: `rm -rf node_modules package-lock.json`
2. Reinstall dependencies: `npm install`
3. Rebuild: `npm run build`

### Legacy Python Environment
If you see `venv/` directories, these are legacy Python virtual environments that can be safely ignored. The project no longer uses Python.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test` (if available)
4. Build the project: `npm run build`
5. Submit a pull request

## License

This project is proprietary software.
