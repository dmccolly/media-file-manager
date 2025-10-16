/**
 * Webflow Sync Function
 * 
 * This function syncs media assets from Xano to Webflow CMS collection and media assets.
 * It can be triggered manually or via webhook when new assets are added to Cloudinary/Xano.
 */

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST and GET requests
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log(' Webflow Sync: Starting sync process');

    // Get environment variables
    const WEBFLOW_API_TOKEN = process.env.VITE_WEBFLOW_API_TOKEN || process.env.WEBFLOW_API_TOKEN;
    const WEBFLOW_SITE_ID = process.env.VITE_WEBFLOW_SITE_ID || process.env.WEBFLOW_SITE_ID || '688ed8debc05764047afa2a7';
    const WEBFLOW_COLLECTION_ID = process.env.VITE_WEBFLOW_COLLECTION_ID || process.env.WEBFLOW_COLLECTION_ID || '6891479d29ed1066b71124e9';
    const XANO_API_KEY = process.env.XANO_API_KEY;
    const XANO_BASE_URL = process.env.XANO_BASE_URL || 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX';

    // Validate required environment variables
    if (!WEBFLOW_API_TOKEN || !WEBFLOW_SITE_ID || !WEBFLOW_COLLECTION_ID) {
      console.error('❌ Webflow Sync: Missing Webflow API token, site ID or collection ID');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Webflow API token not configured',
          success: false 
        })
      };
    }

    if (!XANO_API_KEY || !XANO_BASE_URL) {
      console.error('❌ Webflow Sync: XANO_API_KEY not configured');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Xano API key not configured',
          success: false 
        })
      };
    }

    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { fileId, syncAll = false } = body;

    let filesToSync = [];

    if (syncAll) {
      // Fetch all files from Xano
      console.log(' Webflow Sync: Fetching all files from Xano');
      const xanoResponse = await fetch(`${XANO_BASE_URL}/user_submission`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${XANO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!xanoResponse.ok) {
        throw new Error(`Failed to fetch files from Xano: ${xanoResponse.status}`);
      }

      filesToSync = await xanoResponse.json();
      console.log(`✅ Webflow Sync: Found ${filesToSync.length} files to sync`);
    } else if (fileId) {
      // Fetch specific file from Xano
      console.log(` Webflow Sync: Fetching file ${fileId} from Xano`);
      const xanoResponse = await fetch(`${XANO_BASE_URL}/user_submission/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${XANO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!xanoResponse.ok) {
        throw new Error(`Failed to fetch file from Xano: ${xanoResponse.status}`);
      }

      const file = await xanoResponse.json();
      filesToSync = [file];
    } else {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Either fileId or syncAll must be provided',
          success: false 
        })
      };
    }

    // Sync each file to Webflow
    const results = {
      successful: [],
      failed: [],
      total: filesToSync.length
    };

    for (const file of filesToSync) {
      try {
        console.log(` Webflow Sync: Processing file: ${file.title || file.id}`);

        let assetResult = { assetId: null, error: null };
        let collectionResult = { itemId: null, error: null };

        // Try to sync to Webflow Media Assets (optional - may fail)
        try {
          assetResult = await syncToWebflowAssets(file, WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID);
          console.log(`✅ Asset synced: ${assetResult.assetId}`);
        } catch (assetError) {
          console.warn(`⚠️ Webflow Assets sync failed (non-critical): ${assetError.message}`);
          assetResult.error = assetError.message;
          // Continue to CMS sync even if Assets fails
        }

        // Sync to Webflow CMS Collection (primary sync target)
        try {
          collectionResult = await syncToWebflowCollection(
            file, 
            WEBFLOW_API_TOKEN, 
            WEBFLOW_COLLECTION_ID
          );
          console.log(`✅ Collection item created: ${collectionResult.itemId}`);
        } catch (collectionError) {
          console.error(`❌ Webflow Collection sync failed: ${collectionError.message}`);
          throw collectionError; // This is critical, so throw
        }

        results.successful.push({
          fileId: file.id,
          title: file.title,
          assetId: assetResult.assetId,
          collectionItemId: collectionResult.itemId,
          assetsError: assetResult.error
        });

        console.log(`✅ Webflow Sync: Successfully synced file: ${file.title || file.id}`);
      } catch (error) {
        console.error(`❌ Webflow Sync: Failed to sync file ${file.id}:`, error.message);
        results.failed.push({
          fileId: file.id,
          title: file.title,
          error: error.message
        });
      }
    }

    console.log(`✅ Webflow Sync: Complete. Success: ${results.successful.length}, Failed: ${results.failed.length}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Webflow sync completed',
        results
      })
    };

  } catch (error) {
    console.error('❌ Webflow Sync: Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      })
    };
  }
};

/**
 * Sync file to Webflow Media Assets
 */
async function syncToWebflowAssets(file, apiToken, siteId) {
  console.log(` Syncing to Webflow Assets: ${file.title}`);

  // Extract filename from URL or use title
  let fileName = file.title || file.name || 'untitled';

  // Try to extract filename from media_url
  if (file.media_url) {
    const urlParts = file.media_url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      fileName = lastPart.split('?')[0]; // Remove query params
    } else {
      // Add extension based on file type
      const ext = getFileExtension(file.file_type, file.media_url);
      if (ext && !fileName.includes('.')) {
        fileName = `${fileName}.${ext}`;
      }
    }
  }

  // Generate file hash from URL (Webflow uses this for deduplication)
  const fileHash = await generateFileHash(file.media_url);

  const response = await fetch(`https://api.webflow.com/v2/sites/${siteId}/assets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: file.media_url,
      fileName: fileName,
      fileHash: fileHash,
      displayName: file.title || file.name || 'Untitled',
      altText: file.description || file.title || file.name || ''
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Webflow Assets API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ Asset synced: ${result.id}`);

  return { assetId: result.id };
}

/**
 * Sync file to Webflow CMS Collection
 */
async function syncToWebflowCollection(file, apiToken, collectionId) {
  console.log(` Syncing to Webflow Collection: ${file.title}`);

  // Check for existing item to prevent duplicates
  const existingItem = await checkForExistingItem(file, apiToken, collectionId);
  if (existingItem) {
    console.log(`⚠️ Item already exists in Webflow: ${file.title} (ID: ${existingItem.id})`);
    return { itemId: existingItem.id, existed: true };
  }

  const slug = generateSlug(file.title || file.name || 'untitled');
  const thumbnailUrl = generateThumbnailUrl(file);

  // Convert upload date to ISO 8601 format
  let uploadDate = new Date().toISOString();
  if (file.upload_date) {
    uploadDate = convertToISODate(file.upload_date);
  } else if (file.created_at) {
    uploadDate = convertToISODate(file.created_at);
  }

  const itemData = {
    isArchived: false,
    isDraft: false,
    fieldData: {
      name: file.title || file.name || 'Untitled',
      slug: slug,
      'media-url': file.media_url,
      thumbnail: thumbnailUrl,
      description: file.description || '',
      category: file.category || 'Files',
      station: file.station || '',
      'submitted-by': file.submitted_by || file.author || 'Unknown',
      'file-type': file.file_type || 'file',
      'file-size': file.file_size || 0,
      tags: Array.isArray(file.tags) ? file.tags.join(', ') : (file.tags || ''),
      'upload-date': uploadDate,
      'cloudinary-public-id': extractPublicIdFromUrl(file.media_url)
    }
  };

  const response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(itemData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Webflow Collection API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ Collection item created: ${result.id}`);

  // Auto-publish the item
  try {
    const publishResponse = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items/${result.id}/publish`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (publishResponse.ok) {
      console.log(`✅ Item auto-published: ${result.id}`);
    } else {
      console.warn(`⚠️ Failed to auto-publish item: ${result.id}`);
    }
  } catch (publishError) {
    console.warn(`⚠️ Error auto-publishing item: ${publishError.message}`);
  }

  return { itemId: result.id, existed: false };
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Get file extension from file type or URL
 */
function getFileExtension(fileType, url) {
  // Try to get from URL first
  if (url) {
    const urlParts = url.split('.');
    const lastPart = urlParts[urlParts.length - 1].split('?')[0];
    if (lastPart && lastPart.length <= 5) {
      return lastPart;
    }
  }

  // Fallback to file type mapping
  if (!fileType) return 'file';

  if (fileType.includes('image/jpeg') || fileType.includes('image/jpg')) return 'jpg';
  if (fileType.includes('image/png')) return 'png';
  if (fileType.includes('image/gif')) return 'gif';
  if (fileType.includes('image/webp')) return 'webp';
  if (fileType.includes('image/svg')) return 'svg';
  if (fileType.includes('video/mp4')) return 'mp4';
  if (fileType.includes('video/webm')) return 'webm';
  if (fileType.includes('video/mov')) return 'mov';
  if (fileType.includes('audio/mp3')) return 'mp3';
  if (fileType.includes('audio/wav')) return 'wav';
  if (fileType.includes('audio/ogg')) return 'ogg';
  if (fileType.includes('application/pdf')) return 'pdf';
  if (fileType.includes('application/zip')) return 'zip';
  if (fileType.includes('text/plain')) return 'txt';

  return 'file';
}

/**
 * Generate file hash from URL
 * Webflow uses this for file deduplication
 */
async function generateFileHash(url) {
  if (!url) {
    return 'unknown';
  }

  try {
    // Fetch the file from the URL
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch file for hashing: ${response.status}`);
      // Fallback: use URL-based hash
      return hashString(url);
    }

    // Get the file content as array buffer
    const arrayBuffer = await response.arrayBuffer();

    // Generate SHA-256 hash
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(arrayBuffer));
    return hash.digest('hex');

  } catch (error) {
    console.warn(`Error generating file hash: ${error.message}`);
    // Fallback: use URL-based hash
    return hashString(url);
  }
}

/**
 * Generate hash from string (fallback method)
 */
function hashString(str) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Extract Cloudinary public ID from URL
 */
function extractPublicIdFromUrl(url) {
  if (!url) return '';

  try {
    // Cloudinary URLs typically have format: .../upload/v123456789/folder/filename.ext
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match && match[1]) {
      return match[1];
    }

    // Fallback: use filename
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  } catch (error) {
    console.warn('Error extracting public ID:', error);
    return '';
  }
}

/**
 * Convert various date formats to ISO 8601 string
 */
function convertToISODate(dateValue) {
  if (!dateValue) {
    return new Date().toISOString();
  }

  try {
    // If it's already a valid ISO string, return it
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      return new Date(dateValue).toISOString();
    }

    // If it's a Unix timestamp (number in milliseconds)
    if (typeof dateValue === 'number') {
      return new Date(dateValue).toISOString();
    }

    // Try to parse as date
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    // Fallback to current date
    return new Date().toISOString();
  } catch (error) {
    console.warn('Error converting date:', error);
    return new Date().toISOString();
  }
}

/**
 * Check if item already exists in Webflow collection
 */
async function checkForExistingItem(file, apiToken, collectionId) {
  try {
    const response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (!response.ok) {
      console.warn('Could not check for existing items');
      return null;
    }

    const data = await response.json();
    const items = data.items || [];

    // Check for duplicate by media URL (most reliable)
    if (file.media_url) {
      const existingByUrl = items.find(item => 
        item.fieldData['media-url'] === file.media_url
      );
      if (existingByUrl) return existingByUrl;
    }

    // Check for duplicate by name
    const fileName = file.title || file.name;
    if (fileName) {
      const existingByName = items.find(item => 
        item.fieldData.name === fileName
      );
      if (existingByName) return existingByName;
    }

    return null;
  } catch (error) {
    console.warn('Error checking for existing items:', error);
    return null;
  }
}

/**
 * Generate consistent thumbnail URL for gallery grid
 */
function generateThumbnailUrl(file) {
  const THUMBNAIL_WIDTH = 400;
  const THUMBNAIL_HEIGHT = 300;

  // If file has existing thumbnail and it's from Cloudinary, optimize it
  if (file.thumbnail && file.thumbnail.trim() !== '' && file.thumbnail.includes('cloudinary.com')) {
    return optimizeCloudinaryThumbnail(file.thumbnail, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
  }

  // For images, create consistent thumbnail from media URL
  if (file.file_type && file.file_type.startsWith('image/') && file.media_url) {
    if (file.media_url.includes('cloudinary.com')) {
      return optimizeCloudinaryThumbnail(file.media_url, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
    }
    return file.media_url;
  }

  // For videos, generate consistent video thumbnail
  if (file.file_type && file.file_type.startsWith('video/') && file.media_url) {
    if (file.media_url.includes('cloudinary.com')) {
      return file.media_url
        .replace('/upload/', `/upload/w_${THUMBNAIL_WIDTH},h_${THUMBNAIL_HEIGHT},c_fill,f_auto,q_auto,g_auto,so_0/`)
        .replace(/\.[^.]+$/, '.jpg');
    }
  }

  // For PDFs, generate consistent PDF thumbnail
  if (file.file_type === 'application/pdf' && file.media_url) {
    if (file.media_url.includes('cloudinary.com')) {
      return file.media_url
        .replace('/upload/', `/upload/w_${THUMBNAIL_WIDTH},h_${THUMBNAIL_HEIGHT},c_fill,f_auto,q_auto,g_auto,pg_1/`)
        .replace(/\.pdf$/i, '.jpg');
    }
  }

  // For audio files, use a consistent placeholder
  if (file.file_type && file.file_type.startsWith('audio/')) {
    return `https://via.placeholder.com/${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}/4A90E2/FFFFFF?text=+Audio+File`;
  }

  // Generic file placeholder
  return `https://via.placeholder.com/${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}/6B7280/FFFFFF?text=+${encodeURIComponent(file.file_type || 'File')}`;
}

/**
 * Optimize Cloudinary URL for consistent thumbnails
 */
function optimizeCloudinaryThumbnail(url, width, height) {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Remove existing transformations and add consistent ones
  const baseUrl = url.split('/upload/')[0] + '/upload/';
  const imagePath = url.split('/upload/')[1];

  // Remove existing transformations (everything before the first slash after upload/)
  const cleanImagePath = imagePath.replace(/^[^\/]*\//, '');

  // Add consistent transformations for grid layout
  return `${baseUrl}w_${width},h_${height},c_fill,f_auto,q_auto,g_auto/${cleanImagePath}`;
}

