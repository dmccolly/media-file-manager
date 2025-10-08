import express from "express";
import path from "path";
import compression from "compression";
import cors from "cors";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const buildDir = path.join(__dirname, "dist");

// Cloudinary Service
class BackendCloudinaryService {
  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dzrw8nopf';
    this.uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'HIBF_MASTER';
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
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,q_auto,f_auto/');
      }

      if (resourceType === 'video') {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,q_auto,f_auto,so_0/').replace(/\.[^.]+$/, '.jpg');
      }

      if (fileType?.includes('pdf') || originalUrl.toLowerCase().includes('.pdf')) {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,q_auto,f_auto,pg_1/').replace(/\.pdf$/i, '.jpg');
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

// Xano Service
class BackendXanoService {
  constructor() {
    this.baseUrl = process.env.XANO_BASE_URL || 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX';
  }

  async getAllRecords() {
    console.log("🔄 BackendXanoService: Fetching all records for migration");

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

// Webflow Service (if using Webflow sync)
class WebflowService {
  constructor() {
    this.apiToken = process.env.WEBFLOW_API_TOKEN;
    this.collectionId = process.env.WEBFLOW_COLLECTION_ID;
    this.draft = process.env.WEBFLOW_DRAFT === 'true';
    this.publish = process.env.WEBFLOW_PUBLISH === 'true';
  }

  async syncFileToWebflow(fileData) {
    if (!this.apiToken || !this.collectionId) {
      console.warn("⚠️ WebflowService: Missing configuration, skipping sync");
      return { success: false, error: "Missing configuration" };
    }

    try {
      const fetch = (await import('node-fetch')).default;
      const webflowData = {
        name: fileData.title,
        title: fileData.title,
        url: fileData.url,
        thumbnail: fileData.thumbnail,
        description: fileData.description,
        category: fileData.category,
        type: fileData.type,
        size: fileData.size,
        tags: fileData.tags,
        author: fileData.author || 'Unknown'
      };

      const response = await fetch(`https://api.webflow.com/collections/${this.collectionId}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          fields: webflowData,
          draft: this.draft
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webflow API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ WebflowService: File synced successfully:", result);
      return result;

    } catch (error) {
      console.error("❌ WebflowService: Error syncing to Webflow:", error);
      throw error;
    }
  }
}

const cloudinaryService = new BackendCloudinaryService();
const xanoService = new BackendXanoService();

app.use(cors({
  origin: process.env.ALLOW_ORIGIN ? process.env.ALLOW_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(compression());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(buildDir));

// API Routes
app.get("/api/media", async (req, res) => {
  try {
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
    const fileData = req.body;

    // Validate Cloudinary URL
    if (!fileData.url || !fileData.url.includes('cloudinary.com')) {
      throw new Error('Invalid Cloudinary URL');
    }

    // Generate thumbnail if not provided
    if (!fileData.thumbnail) {
      fileData.thumbnail = cloudinaryService.generateThumbnailForExistingFile(fileData.url, fileData.type);
    }

    if (!process.env.XANO_API_KEY) {
      console.warn("⚠️ Server: XANO_API_KEY not set, returning mock data");
      return res.json({
        success: true,
        record: { ...fileData, id: Date.now().toString() },
        warning: "XANO_API_KEY not set, changes will not be persisted"
      });
    }

    const fetch = (await import('node-fetch')).default;
    const xanoData = {
      title: fileData.title,
      description: fileData.description || '',
      category: fileData.category || 'uncategorized',
      type: fileData.type,
      station: file hover:bg-gray-50 dark:hover:bg-gray-700'} ${
                          selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900' : ''
                        }`}
                      >
                        {viewMode === 'grid' ? (
                          <>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={selectedFiles.includes(file.id)}
                                onChange={() => toggleFileSelection(file.id)}
                                className="absolute top-2 right-2 z-10"
                              />
                              {file.thumbnail && file.thumbnail.includes('cloudinary.com') ? (
                                <img 
                                  src={file.thumbnail} 
                                  alt={file.title}
                                  className="w-full h-32 object-cover rounded mb-3"
                                  onError={(e) => {
                                    e.currentTarget.src = '/icons/file-placeholder.svg'
                                  }}
                                />
                              ) : (
                                <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded mb-3 flex items-center justify-center">
                                  {getFileIcon(file.type)}
                                </div>
                              )}
                            </div>
                            <h4 className="font-medium text-sm truncate">{file.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.file_size)} • {formatDate(file.upload_date)}
                            </p>
                            <div className="mt-2 flex space-x-2">
                              <button
                                onClick={() => window.open(file.media_url, '_blank')}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={() => toggleFileSelection(file.id)}
                            />
                            {file.thumbnail && file.thumbnail.includes('cloudinary.com') ? (
                              <img 
                                src={file.thumbnail} 
                                alt={file.title}
                                className="w-12 h-12 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src = '/icons/file-placeholder.svg'
                                }}
                              />
                            ) : (
                              getFileIcon(file.type)
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium">{file.title}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.file_size)} • {formatDate(file.upload_date)}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => window.open(file.media_url, '_blank')}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Upload Files</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Files</label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              />
            </div>

            {uploadProgress.length > 0 && (
              <div className="mb-4 space-y-2">
                {uploadProgress.map((item, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className={`truncate ${item.status === 'error' ? 'text-red-600' : ''}`}>
                        {item.file}
                      </span>
                      <span className={`${item.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                        {item.status === 'completed' ? '✓' : item.status === 'error' ? '✗' : '...'}
                      </span>
                    </div>
                    {item.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUpload(false)
                  setUploadProgress([])
                }}
                disabled={isUploading}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Folder Name</label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNewFolder(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
