# Media File Manager

A modern, feature-rich media file management application built with React, TypeScript, and Vite. Seamlessly integrates with Xano backend and Cloudinary for media storage.

## 🚀 Features

- **📁 File Management**: Upload, organize, and manage media files with an intuitive interface
- **🖼️ Universal Preview**: Preview images, videos, audio, PDFs, and DOCX files inline
- **📂 Folder Organization**: Create and manage folders for better file organization
- **🔍 Search & Filter**: Quickly find files with search and category filtering
- **☁️ Cloud Storage**: Integrated with Cloudinary for reliable media hosting
- **🎨 Modern UI**: Clean, responsive design with Tailwind CSS and shadcn/ui components
- **⚡ Fast Performance**: Built with Vite for lightning-fast development and production builds

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Xano API
- **Storage**: Cloudinary
- **Deployment**: Netlify
- **Functions**: Netlify Serverless Functions

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/dmccolly/media-file-manager.git

# Navigate to project directory
cd media-file-manager

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

## 🔑 Environment Variables

Create a `.env` file with the following variables:

```env
VITE_XANO_API_BASE_URL=your_xano_api_url
VITE_XANO_API_KEY=your_xano_api_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Project Structure

```
media-file-manager/
├── src/
│   ├── components/     # React components
│   ├── services/       # API services
│   ├── lib/           # Utility functions
│   └── App.tsx        # Main application component
├── netlify/
│   └── functions/     # Serverless functions
├── public/            # Static assets
└── dist/              # Production build
```

## 🌐 Deployment

This project is configured for deployment on Netlify:

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

**Live Site**: https://eclectic-caramel-34e317.netlify.app

## 🔧 API Endpoints

The application uses Netlify Functions as a proxy to Xano:

- `GET /api/user_submission` - Fetch all media files
- `POST /api/save-asset` - Upload new media file
- `PUT /api/user_submission/:id` - Update file metadata
- `DELETE /api/user_submission/:id` - Delete file
- `POST /api/folder-create` - Create new folder
- `GET /api/folder-list` - List all folders
- `DELETE /api/folder-delete/:id` - Delete folder

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Built with ❤️ using React, TypeScript, and Vite