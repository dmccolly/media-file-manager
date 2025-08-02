import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Utility Functions
const getFileTypeFromUrl = (url) => {
  console.log('🔍 Getting file type from URL:', url);
  
  if (!url) {
    console.log('❌ No URL provided');
    return 'unknown';
  }
  
  const urlLower = url.toLowerCase();
  
  // Image types
  if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || 
      urlLower.includes('.png') || urlLower.includes('.gif') || 
      urlLower.includes('.webp') || urlLower.includes('.svg') ||
      urlLower.includes('image/') || urlLower.includes('f_auto')) {
    console.log('✅ Detected as image');
    return 'image';
  }
  
  // Video types
  if (urlLower.includes('.mp4') || urlLower.includes('.avi') || 
      urlLower.includes('.mov') || urlLower.includes('.wmv') || 
      urlLower.includes('.webm') || urlLower.includes('video/')) {
    console.log('✅ Detected as video');
    return 'video';
  }
  
  // Document types
  if (urlLower.includes('.pdf') || urlLower.includes('.doc') || 
      urlLower.includes('.docx') || urlLower.includes('.txt') || 
      urlLower.includes('.rtf')) {
    console.log('✅ Detected as document');
    return 'document';
  }
  
  console.log('⚠️ Unknown file type, defaulting to document');
  return 'document';
};

const generateThumbnailUrl = (originalUrl, fileType) => {
  console.log('🖼️ Generating thumbnail for:', originalUrl, 'Type:', fileType);
  
  if (!originalUrl) {
    console.log('❌ No original URL provided');
    return null;
  }
  
  // If it's a Cloudinary URL, generate proper thumbnail
  if (originalUrl.includes('cloudinary.com')) {
    console.log('☁️ Cloudinary URL detected, generating thumbnail');
    
    if (fileType === 'image') {
      // Replace upload/ with upload/w_300,h_200,c_fill/ for images
      const thumbnailUrl = originalUrl.replace('/upload/', '/upload/w_300,h_200,c_fill/');
      console.log('✅ Image thumbnail generated:', thumbnailUrl);
      return thumbnailUrl;
    } else if (fileType === 'video') {
      // For videos, get first frame as thumbnail
      const thumbnailUrl = originalUrl.replace('/upload/', '/upload/w_300,h_200,c_fill,so_0/');
      console.log('✅ Video thumbnail generated:', thumbnailUrl);
      return thumbnailUrl;
    }
  }
  
  // For non-Cloudinary images, return original if it's an image
  if (fileType === 'image') {
    console.log('✅ Non-Cloudinary image, using original');
    return originalUrl;
  }
  
  console.log('⚠️ No thumbnail generated, will use icon');
  return null;
};

const getFileIcon = (fileType) => {
  const icons = {
    image: '🖼️',
    video: '🎥',
    document: '📄',
    pdf: '📕',
    unknown: '📁'
  };
  return icons[fileType] || icons.unknown;
};

// API Service
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiService = {
  async fetchFiles() {
    console.log('📡 Fetching files from API...');
    try {
      const response = await fetch(`${API_BASE_URL}/files`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('✅ Files fetched successfully:', data.length, 'files');
      
      // Process each file to ensure proper type detection
      const processedFiles = data.map(file => {
        const detectedType = getFileTypeFromUrl(file.file_url);
        const thumbnailUrl = generateThumbnailUrl(file.file_url, detectedType);
        
        console.log(`🔍 Processing file: ${file.file_name}`);
        console.log(`   Type: ${detectedType}`);
        console.log(`   Thumbnail: ${thumbnailUrl || 'None'}`);
        
        return {
          ...file,
          file_type: detectedType,
          thumbnail_url: thumbnailUrl
        };
      });
      
      return processedFiles;
    } catch (error) {
      console.error('❌ Error fetching files:', error);
      throw error;
    }
  },

  async uploadFile(file, metadata) {
    console.log('📤 Uploading file:', file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', metadata.title || file.name);
      formData.append('description', metadata.description || '');
      formData.append('tags', metadata.tags || '');

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ File uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  },

  async deleteFile(fileId) {
    console.log('🗑️ Deleting file:', fileId);
    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ File deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw error;
    }
  }
};
// File Thumbnail Component
const FileThumbnail = ({ file, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully:', file.file_name);
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.log('❌ Image failed to load:', file.file_name);
    setImageError(true);
    setImageLoaded(false);
  };

  const renderThumbnail = () => {
    // If we have a thumbnail URL and no error, try to show the image
    if (file.thumbnail_url && !imageError) {
      return (
        <div className="thumbnail-container">
          <img
            src={file.thumbnail_url}
            alt={file.file_name}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              width: '100%',
              height: '150px',
              objectFit: 'cover',
              display: imageLoaded ? 'block' : 'none'
            }}
          />
          {!imageLoaded && (
            <div className="thumbnail-loading">
              <span style={{ fontSize: '48px' }}>
                {getFileIcon(file.file_type)}
              </span>
            </div>
          )}
        </div>
      );
    }

    // Fallback to icon
    return (
      <div className="thumbnail-placeholder">
        <span style={{ fontSize: '48px' }}>
          {getFileIcon(file.file_type)}
        </span>
      </div>
    );
  };

  return (
    <div className="file-item" onClick={() => onClick(file)}>
      {renderThumbnail()}
      <div className="file-details">
        <div className="file-name" title={file.file_name}>
          {file.file_name}
        </div>
        <div className="file-meta">
          <span className="file-type">{file.file_type}</span>
          <span className="file-size">
            {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'Unknown size'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Upload Form Component
const UploadForm = ({ onUpload, onCancel, isUploading }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    tags: ''
  });
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    console.log('📁 File selected:', file?.name);
    setSelectedFile(file);
    if (file && !metadata.title) {
      setMetadata(prev => ({ ...prev, title: file.name }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    console.log('🚀 Starting upload process...');
    await onUpload(selectedFile, metadata);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setMetadata({ title: '', description: '', tags: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onCancel();
  };

  return (
    <div className="upload-form">
      <h3>Upload New File</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select File:</label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            disabled={isUploading}
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          />
        </div>

        {selectedFile && (
          <>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                disabled={isUploading}
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                disabled={isUploading}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Tags (comma-separated):</label>
              <input
                type="text"
                value={metadata.tags}
                onChange={(e) => setMetadata(prev => ({ ...prev, tags: e.target.value }))}
                disabled={isUploading}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </>
        )}

        <div className="form-actions">
          <button type="submit" disabled={!selectedFile || isUploading}>
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
          <button type="button" onClick={handleCancel} disabled={isUploading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// File Detail Modal Component
const FileDetailModal = ({ file, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${file.file_name}"?`)) {
      console.log('🗑️ User confirmed deletion of:', file.file_name);
      setIsDeleting(true);
      try {
        await onDelete(file.id);
        onClose();
      } catch (error) {
        console.error('❌ Delete failed:', error);
        alert('Failed to delete file. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{file.file_name}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="file-preview">
            {file.file_type === 'image' ? (
              <img 
                src={file.file_url} 
                alt={file.file_name}
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                onError={(e) => {
                  console.log('❌ Full image failed to load, showing icon');
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : (
              <div className="file-icon-large">
                <span style={{ fontSize: '64px' }}>
                  {getFileIcon(file.file_type)}
                </span>
              </div>
            )}
            <div style={{ display: 'none', textAlign: 'center', padding: '20px' }}>
              <span style={{ fontSize: '64px' }}>
                {getFileIcon(file.file_type)}
              </span>
            </div>
          </div>

          <div className="file-info">
            <div className="info-row">
              <strong>Type:</strong> {file.file_type}
            </div>
            <div className="info-row">
              <strong>Size:</strong> {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'Unknown'}
            </div>
            <div className="info-row">
              <strong>Uploaded:</strong> {new Date(file.created_at).toLocaleDateString()}
            </div>
            {file.description && (
              <div className="info-row">
                <strong>Description:</strong> {file.description}
              </div>
            )}
            {file.tags && (
              <div className="info-row">
                <strong>Tags:</strong> {file.tags}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <a 
            href={file.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="view-button"
          >
            View Full Size
          </a>
          <button 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="delete-button"
          >
            {isDeleting ? 'Deleting...' : 'Delete File'}
          </button>
        </div>
      </div>
    </div>
  );
};
// Main App Component
function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    console.log('🔄 Loading files...');
    try {
      setLoading(true);
      setError(null);
      const fetchedFiles = await apiService.fetchFiles();
      setFiles(fetchedFiles);
      console.log('✅ Files loaded successfully:', fetchedFiles.length);
    } catch (err) {
      console.error('❌ Failed to load files:', err);
      setError('Failed to load files. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file, metadata) => {
    console.log('📤 Starting upload process for:', file.name);
    try {
      setIsUploading(true);
      const result = await apiService.uploadFile(file, metadata);
      console.log('✅ Upload successful:', result);
      
      // Reload files to get the updated list
      await loadFiles();
      setShowUploadForm(false);
      
      alert('File uploaded successfully!');
    } catch (err) {
      console.error('❌ Upload failed:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    console.log('🗑️ Starting delete process for file ID:', fileId);
    try {
      await apiService.deleteFile(fileId);
      console.log('✅ Delete successful');
      
      // Remove the file from the local state
      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
      
      alert('File deleted successfully!');
    } catch (err) {
      console.error('❌ Delete failed:', err);
      throw err; // Re-throw to let the modal handle it
    }
  };

  const handleFileClick = (file) => {
    console.log('👆 File clicked:', file.file_name);
    setSelectedFile(file);
  };

  const handleCloseModal = () => {
    setSelectedFile(null);
  };

  const handleRefresh = () => {
    console.log('🔄 Refresh requested');
    loadFiles();
  };

  // Render loading state
  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading files...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleRefresh}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📁 Media File Manager</h1>
        <div className="header-actions">
          <button onClick={handleRefresh} className="refresh-button">
            🔄 Refresh
          </button>
          <button 
            onClick={() => setShowUploadForm(true)} 
            className="upload-button"
            disabled={showUploadForm}
          >
            📤 Upload File
          </button>
        </div>
      </header>

      <main className="app-main">
        {showUploadForm && (
          <div className="upload-section">
            <UploadForm
              onUpload={handleUpload}
              onCancel={() => setShowUploadForm(false)}
              isUploading={isUploading}
            />
          </div>
        )}

        <div className="files-section">
          <div className="files-header">
            <h2>Files ({files.length})</h2>
            {files.length > 0 && (
              <div className="files-stats">
                <span>Images: {files.filter(f => f.file_type === 'image').length}</span>
                <span>Videos: {files.filter(f => f.file_type === 'video').length}</span>
                <span>Documents: {files.filter(f => f.file_type === 'document').length}</span>
              </div>
            )}
          </div>

          {files.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No files yet</h3>
              <p>Upload your first file to get started!</p>
              <button 
                onClick={() => setShowUploadForm(true)}
                className="upload-button"
              >
                📤 Upload File
              </button>
            </div>
          ) : (
            <div className="files-grid">
              {files.map((file) => (
                <FileThumbnail
                  key={file.id}
                  file={file}
                  onClick={handleFileClick}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedFile && (
        <FileDetailModal
          file={selectedFile}
          onClose={handleCloseModal}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
export default App;

/* Add this CSS to your App.css file */
/*
.app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.app-header {
  background: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.upload-button, .refresh-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.upload-button {
  background: #007bff;
  color: white;
}

.upload-button:hover {
  background: #0056b3;
}

.refresh-button {
  background: #6c757d;
  color: white;
}

.refresh-button:hover {
  background: #545b62;
}

.app-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.upload-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.upload-form h3 {
  margin-top: 0;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.form-actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.form-actions button[type="submit"] {
  background: #28a745;
  color: white;
}

.form-actions button[type="button"] {
  background: #6c757d;
  color: white;
}

.files-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.files-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.files-header h2 {
  margin: 0;
  color: #333;
}

.files-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  padding: 2rem;
}

.file-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  background: white;
}

.file-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.thumbnail-container,
.thumbnail-placeholder,
.thumbnail-loading {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.file-details {
  padding: 1rem;
}

.file-name {
  font-weight: 500;
  margin-bottom: 0.5rem;
  word-break: break-word;
  color: #333;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
  color: #333;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  word-break: break-word;
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #333;
}

.modal-body {
  padding: 2rem;
}

.file-preview {
  text-align: center;
  margin-bottom: 2rem;
}

.file-icon-large {
  padding: 2rem;
}

.file-info {
  display: grid;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  gap: 1rem;
}

.info-row strong {
  min-width: 100px;
  color: #555;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-button {
  background: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
}

.view-button:hover {
  background: #0056b3;
}

.delete-button {
  background: #dc3545;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.delete-button:hover {
  background: #c82333;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 4rem 2rem;
  color: #dc3545;
}

.error h2 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.error button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 1rem;
}

.error button:hover {
  background: #0056b3;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
    padding: 1rem;
  }
  
  .modal-backdrop {
    padding: 1rem;
  }
  
  .files-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .files-stats {
    justify-content: center;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 1rem;
  }
}
*/
