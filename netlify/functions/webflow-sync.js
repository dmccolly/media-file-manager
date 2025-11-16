/**
 * Enhanced Webflow Sync Function with Video Support
 * 
 * This version properly handles:
 * - Cloudinary video URLs
 * - Video thumbnails
 * - Video-specific metadata
 * - YouTube and Vimeo embeds
 * - Webflow v2 Assets API with proper image field references
 * 
 * Replace your existing netlify/functions/webflow-sync.js with this file
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');

exports.handler = async (event) => {
  // CORS preflight
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
    console.log('🔄 Webflow Sync: Starting');

    // Environment variables
    const WEBFLOW_API_TOKEN = process.env.VITE_WEBFLOW_API_TOKEN || process.env.WEBFLOW_API_TOKEN;
    const WEBFLOW_SITE_ID = process.env.VITE_WEBFLOW_SITE_ID || process.env.WEBFLOW_SITE_ID;
    const WEBFLOW_COLLECTION_ID = process.env.VITE_WEBFLOW_COLLECTION_ID || process.env.WEBFLOW_COLLECTION_ID;
    const XANO_API_KEY = process.env.XANO_API_KEY;
    const XANO_BASE_URL = process.env.XANO_BASE_URL || 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX';

    // Validate configuration
    if (!WEBFLOW_API_TOKEN || !WEBFLOW_SITE_ID || !WEBFLOW_COLLECTION_ID) {
      console.error('❌ Missing Webflow configuration');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: false, error: 'Webflow configuration missing' })
      };
    }
    if (!XANO_API_KEY) {
      console.error('❌ Missing Xano configuration');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: false, error: 'Xano configuration missing' })
      };
    }

    // Parse request body
    let bodyJson = {};
    if (event.httpMethod === 'POST' && event.body) {
      try {
        bodyJson = JSON.parse(event.body);
      } catch (err) {
        console.warn('⚠️ Could not parse request body as JSON');
      }
    }

    const action = bodyJson.action || 'upsert';
    const fileId = bodyJson.fileId || null;
    const debug = bodyJson.debug === true;

    // Handle introspect action - fetch existing items to see thumbnail field format
    if (action === 'introspect') {
      console.log('🔍 Introspecting Webflow collection items');
      try {
        const response = await fetch(
          `https://api.webflow.com/v2/collections/${WEBFLOW_COLLECTION_ID}/items?limit=5`,
          {
            headers: {
              'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
              'accept': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          return {
            statusCode: response.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
              success: false, 
              error: `Failed to fetch items: ${response.status}`,
              details: errorText
            })
          };
        }
        
        const data = await response.json();
        const items = data.items || [];
        
        // Extract thumbnail field info from items that have thumbnails
        const thumbnailInfo = items.map(item => ({
          id: item.id,
          fieldDataKeys: Object.keys(item.fieldData || {}),
          thumbnailValue: item.fieldData?.thumbnail,
          thumbnailType: typeof item.fieldData?.thumbnail,
          thumbnailIsArray: Array.isArray(item.fieldData?.thumbnail),
          name: item.fieldData?.name || item.fieldData?.title
        }));
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            success: true, 
            totalItems: items.length,
            thumbnailInfo,
            sampleItem: items[0]?.fieldData || null
          })
        };
      } catch (err) {
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            success: false, 
            error: err.message,
            stack: err.stack
          })
        };
      }
    }

    // Handle delete action
    if (action === 'delete' && fileId) {
      console.log(`🗑️ Webflow Sync: Deleting file ${fileId}`);
      const delResult = await deleteFileAndItem(
        fileId,
        {
          apiToken: WEBFLOW_API_TOKEN,
          collectionId: WEBFLOW_COLLECTION_ID,
          xanoBaseUrl: XANO_BASE_URL,
          xanoApiKey: XANO_API_KEY
        }
      );
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: true, deleted: delResult })
      };
    }

    // Handle single file sync
    if (fileId) {
      console.log(`🔄 Webflow Sync: Syncing single file ${fileId}`);
      const file = await fetchFileFromXano(fileId, XANO_BASE_URL, XANO_API_KEY);
      if (!file) {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ success: false, error: 'File not found in Xano' })
        };
      }
      
      if (debug) {
        try {
          const debugInfo = {
            fileData: {
              id: file.id,
              title: file.title,
              media_url: file.media_url,
              file_type: file.file_type,
              category: file.category,
              thumbnail: file.thumbnail
            },
            steps: []
          };
          
          const result = await upsertFile(file, WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID, WEBFLOW_COLLECTION_ID, debugInfo);
          
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
              success: true, 
              result,
              debug: debugInfo
            })
          };
        } catch (err) {
          return {
            statusCode: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
              success: false, 
              error: err.message,
              stack: err.stack
            })
          };
        }
      }
      
      const result = await upsertFile(file, WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID, WEBFLOW_COLLECTION_ID);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: true, result })
      };
    }

    // Handle full sync
    console.log('🔄 Webflow Sync: Performing full sync from Xano');
    const allFiles = await fetchAllFilesFromXano(XANO_BASE_URL, XANO_API_KEY);
    const results = { successful: [], failed: [] };
    for (const file of allFiles) {
      try {
        const res = await upsertFile(file, WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID, WEBFLOW_COLLECTION_ID);
        results.successful.push(res);
      } catch (err) {
        results.failed.push({ fileId: file.id, error: err.message });
      }
    }

      // Auto-publish the site to make changes live
      console.log('🚀 Auto-publishing site to make changes live...');
      try {
        const publishResponse = await fetch(`https://api.webflow.com/v2/sites/${WEBFLOW_SITE_ID}/publish`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ publishToWebflowSubdomain: true })
        });
        
        if (publishResponse.ok) {
          console.log('✅ Site published successfully');
          results.published = true;
        } else {
          console.warn('⚠️ Site publish failed, but sync completed');
          results.published = false;
        }
      } catch (publishErr) {
        console.warn('⚠️ Site publish error:', publishErr.message);
        results.published = false;
      }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: true, results })
    };
  } catch (err) {
    console.error('❌ Webflow Sync: Unexpected error', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: false, error: err.message || 'Internal error' })
    };
  }
};

/**
 * Fetch a single file from Xano
 */
async function fetchFileFromXano(fileId, baseUrl, apiKey) {
  const res = await fetch(`${baseUrl}/user_submission/${fileId}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (res.ok) {
    return res.json();
  }
  return null;
}

/**
 * Fetch all files from Xano
 */
async function fetchAllFilesFromXano(baseUrl, apiKey) {
  const res = await fetch(`${baseUrl}/user_submission`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch files from Xano: ${res.status}`);
  }
  return res.json();
}

/**
 * Upsert a file into Webflow
 */
async function upsertFile(file, apiToken, siteId, collectionId, debugInfo = null) {
  console.log(`📝 Upserting file: ${file.title || file.name}`);
  
  // Try to upload to Webflow Assets (optional, may fail for videos)
  let assetResult = { assetId: null, error: null };
  try {
    assetResult = await syncToWebflowAssets(file, apiToken, siteId);
  } catch (err) {
    assetResult.error = err.message;
    console.warn(`⚠️ Asset upload failed (non-critical): ${err.message}`);
  }
  
  // Create/update collection item (this is the important part!)
  const collectionRes = await syncToWebflowCollection(file, apiToken, collectionId, siteId, debugInfo);
  
  return {
    fileId: file.id,
    assetId: assetResult.assetId,
    collectionItemId: collectionRes.itemId,
    existed: collectionRes.existed,
    assetError: assetResult.error
  };
}

/**
 * Sync to Webflow CMS Collection (ENHANCED FOR VIDEOS)
 */
async function syncToWebflowCollection(file, apiToken, collectionId, siteId, debugInfo = null) {
  console.log(`📋 Syncing to Webflow Collection: ${file.title || file.name}`);
  
  // Check for existing item
  const existingItem = await checkForExistingItem(file, apiToken, collectionId);
  if (existingItem) {
    console.log(`✅ Item already exists: ${existingItem.id}`);
    return { itemId: existingItem.id, existed: true };
  }

  const slug = generateSlug(file.title || file.name || 'untitled');
  const thumbnailUrl = generateThumbnailUrl(file);
  
  if (debugInfo) {
    debugInfo.steps.push({
      step: 'thumbnail_generation',
      thumbnailUrl,
      fileType: file.file_type,
      category: file.category
    });
  }
  
  console.log(`🖼️ Uploading thumbnail for: ${file.title || file.name}`);
  const fileName = `${file.id || 'file'}-thumb.jpg`;
  const assetResult = await uploadImageAssetToWebflow(file, fileName, apiToken, siteId, debugInfo);
  const thumbnailAssetId = assetResult.assetId;
  console.log(`✅ Thumbnail uploaded, asset ID: ${thumbnailAssetId}`);
  
  // Determine upload date
  let uploadDate = new Date().toISOString();
  if (file.upload_date) {
    uploadDate = convertToISODate(file.upload_date);
  } else if (file.created_at) {
    uploadDate = convertToISODate(file.created_at);
  }

  // Determine media type (for video gallery)
  let mediaType = 'Upload'; // Default for Cloudinary uploads
  if (file.media_url && file.media_url.includes('youtube.com')) {
    mediaType = 'YouTube';
  } else if (file.media_url && file.media_url.includes('vimeo.com')) {
    mediaType = 'Vimeo';
  }

  // Extract video IDs if applicable
  let youtubeId = '';
  let vimeoId = '';
  if (mediaType === 'YouTube') {
    youtubeId = extractYouTubeId(file.media_url);
  } else if (mediaType === 'Vimeo') {
    vimeoId = extractVimeoId(file.media_url);
  }

  // Build item data with ALL fields
  const itemData = {
    isArchived: false,
    isDraft: false,
    fieldData: {
      'name': file.title || file.name || 'Untitled',
      'slug': slug,
      'media-url': file.media_url,
      'description': file.description || '',
      'category': file.category || 'Files',
      'station': file.station || '',
      'submitted-by': file.submitted_by || file.author || 'Unknown',
      'file-type': file.file_type || 'file',
      'file-size': file.file_size || 0,
      'tags': Array.isArray(file.tags) ? file.tags.join(', ') : (file.tags || ''),
      'upload-date': uploadDate,
      'cloudinary-public-id': extractPublicIdFromUrl(file.media_url),
      'file-id': file.id,
      'media-type': mediaType,
      'youtube-video-id': youtubeId,
      'vimeo-video-id': vimeoId,
      'duration': file.duration || ''
    }
  };
  
  if (!thumbnailAssetId) {
    throw new Error('Thumbnail upload failed - asset ID is null');
  }
  
  console.log(`🔍 DEBUG: thumbnailAssetId type: ${typeof thumbnailAssetId}, value: ${thumbnailAssetId}`);
  itemData.fieldData['thumbnail'] = { id: thumbnailAssetId };

  console.log('📤 Sending to Webflow:', JSON.stringify(itemData, null, 2));

  // Create the item
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
    console.error('❌ Webflow Collection API error:', response.status, errorText);
    throw new Error(`Webflow Collection API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Collection item created:', result.id);

  // Try to publish the item
  try {
    await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items/${result.id}/publish`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
    console.log('✅ Item published');
  } catch (err) {
    console.warn(`⚠️ Failed to auto-publish item ${result.id}: ${err.message}`);
  }

  return { itemId: result.id, existed: false };
}

/**
 * Generate thumbnail URL for videos
 */
function generateThumbnailUrl(file) {
  const width = 400;
  const height = 300;

  // Use existing thumbnail if available
  if (file.thumbnail && file.thumbnail.trim() && file.thumbnail.includes('cloudinary.com')) {
    return optimizeCloudinaryThumbnail(file.thumbnail, width, height);
  }

  // For images, use the media URL
  // Determine if this is an image by checking file_type, category, or URL extension
    const isImage = (file.file_type && (file.file_type.startsWith('image/') || file.file_type === 'image')) ||
                  (file.category && (file.category === 'images' || file.category === 'image')) ||
                  (file.media_url && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.media_url));

  if (isImage && file.media_url) {
    if (file.media_url.includes('cloudinary.com')) {
      return optimizeCloudinaryThumbnail(file.media_url, width, height);
    }
    return file.media_url;
  }

  // For videos, generate thumbnail from Cloudinary
  // Determine if this is a video by checking file_type, category, or URL
  const isVideo = (file.file_type && file.file_type.startsWith('video/')) ||
                  (file.category && (file.category === 'video' || file.category === 'videos')) ||
                  (file.media_url && /\.(mp4|mov|avi|webm|mkv)$/i.test(file.media_url));

  if (isVideo && file.media_url) {
    if (file.media_url.includes('cloudinary.com')) {
      // Extract first frame as thumbnail
      return file.media_url
        .replace('/upload/', `/upload/w_${width},h_${height},c_fill,f_auto,q_auto,g_auto,so_0/`)
        .replace(/\.[^.]+$/, '.jpg');
    }
  }

  // For PDFs, generate thumbnail
  // Determine if this is a PDF by checking file_type, category, or URL
  const isPDF = (file.file_type === 'application/pdf') ||
                (file.file_type === 'document') ||
                (file.category && file.category === 'documents') ||
                (file.media_url && /\.pdf$/i.test(file.media_url));

  if (isPDF && file.media_url) {
    if (file.media_url.includes('cloudinary.com')) {
      return file.media_url
        .replace('/upload/', `/upload/w_${width},h_${height},c_fill,f_auto,q_auto,g_auto,pg_1/`)
        .replace(/\.pdf$/i, '.jpg');
    }
  }

  // Fallback placeholders
  // Determine if this is audio by checking file_type, category, or URL
  const isAudio = (file.file_type && (file.file_type.startsWith('audio/') || file.file_type === 'audio')) ||
                  (file.category && (file.category === 'audio' || file.category === 'Audio')) ||
                  (file.media_url && /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.media_url));
  
  if (isAudio) {
    return `https://via.placeholder.com/${width}x${height}/4A90E2/FFFFFF?text=Audio+File`;
  }

  // Determine file type for final fallback
  let fileTypeLabel = 'File';
  if (file.category) {
    fileTypeLabel = file.category.charAt(0).toUpperCase() + file.category.slice(1);
  } else if (file.file_type) {
    fileTypeLabel = file.file_type;
  }

  return `https://via.placeholder.com/${width}x${height}/6B7280/FFFFFF?text=${encodeURIComponent(fileTypeLabel)}`;
}

/**
 * Optimize Cloudinary thumbnail URLs
 */
function optimizeCloudinaryThumbnail(url, width, height) {
  if (!url || !url.includes('cloudinary.com')) return url;
  const baseUrl = url.split('/upload/')[0] + '/upload/';
  const imagePath = url.split('/upload/')[1];
  const cleanImage = imagePath.replace(/^[^\/]*\//, '');
  return `${baseUrl}w_${width},h_${height},c_fill,f_auto,q_auto,g_auto/${cleanImage}`;
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url) {
  if (!url) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
    /youtube\.com\/v\/([^&\s]+)/
  ];
  for (let pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return '';
}

/**
 * Extract Vimeo video ID from URL
 */
function extractVimeoId(url) {
  if (!url) return '';
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : '';
}

/**
 * Generate URL-friendly slug
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
 * Extract Cloudinary public ID from URL
 */
function extractPublicIdFromUrl(url) {
  if (!url) return '';
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match && match[1]) return match[1];
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  } catch (err) {
    console.warn(`Public ID extraction error: ${err.message}`);
    return '';
  }
}

/**
 * Convert various date formats to ISO 8601
 */
function convertToISODate(value) {
  if (!value) return new Date().toISOString();
  try {
    if (typeof value === 'string' && value.includes('T')) return new Date(value).toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date.toISOString();
    return new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Check for existing items in Webflow collection
 */
async function checkForExistingItem(file, apiToken, collectionId) {
  try {
    const res = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items = data.items || [];
    
    // Check by file ID first (most reliable)
    if (file.id) {
      const existingById = items.find(it => it.fieldData && String(it.fieldData['file-id']) === String(file.id));
      if (existingById) return existingById;
    }
    
    // Check by media URL
    if (file.media_url) {
      const existingByUrl = items.find(it => it.fieldData && it.fieldData['media-url'] === file.media_url);
      if (existingByUrl) return existingByUrl;
    }
    
    // Check by name
    const fname = file.title || file.name;
    if (fname) {
      const existingByName = items.find(it => it.fieldData && it.fieldData.name === fname);
      if (existingByName) return existingByName;
    }
    
    return null;
  } catch (err) {
    console.warn(`Existing item check failed: ${err.message}`);
    return null;
  }
}

/**
 * Download image from URL and return buffer
 */
async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Get thumbnail buffer for a file - uses Cloudinary transformations or fallback
 */
async function getThumbnailBuffer(file) {
  const mediaUrl = file.media_url || file.cloudinary_url || file.file_url;
  
  // Fallback: base64-encoded 1x1 transparent PNG for files without media_url
  if (!mediaUrl) {
    console.log('⚠️ No media URL, using fallback transparent PNG');
    const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    return Buffer.from(base64PNG, 'base64');
  }
  
  // Determine file type
  const fileType = file.file_type || '';
  const category = (file.category || '').toLowerCase();
  
  let thumbnailUrl;
  
  const isCloudinary = mediaUrl.includes('cloudinary.com');
  
  if (isCloudinary) {
    // Extract public ID and build transformation URL
    const publicIdMatch = mediaUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    const publicId = publicIdMatch ? publicIdMatch[1] : null;
    
    if (publicId) {
      const cloudName = mediaUrl.match(/https?:\/\/res\.cloudinary\.com\/([^/]+)/)?.[1];
      
      if (fileType.includes('video') || category.includes('video')) {
        thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/w_150,h_150,c_fill,f_jpg,q_auto,g_auto,so_0/${publicId}.jpg`;
      } else if (fileType.includes('pdf') || category.includes('pdf')) {
        thumbnailUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_150,h_150,c_fill,f_jpg,q_auto,g_auto,pg_1/${publicId}.jpg`;
      } else if (fileType.includes('image') || category.includes('image') || category.includes('photo')) {
        // Image: standard thumbnail
        thumbnailUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_150,h_150,c_fill,f_jpg,q_auto,g_auto/${publicId}.jpg`;
      } else {
        console.log('⚠️ Audio/other file type, using fallback transparent PNG');
        const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        return Buffer.from(base64PNG, 'base64');
      }
    } else {
      console.log('⚠️ Could not extract Cloudinary public ID, using fallback');
      const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      return Buffer.from(base64PNG, 'base64');
    }
  } else {
    thumbnailUrl = mediaUrl;
  }
  
  // Download the thumbnail
  try {
    console.log(`📥 Downloading thumbnail from: ${thumbnailUrl}`);
    return await downloadImage(thumbnailUrl);
  } catch (error) {
    console.error(`❌ Failed to download thumbnail: ${error.message}`);
    // Fallback to transparent PNG
    const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    return Buffer.from(base64PNG, 'base64');
  }
}

/**
 * Upload image to Webflow Assets API (two-step process)
 */
async function uploadImageAssetToWebflow(file, fileName, apiToken, siteId, debugInfo = null) {
  console.log(`📦 Uploading image asset to Webflow: ${fileName}`);
  console.log(`🔍 File data: media_url=${file.media_url}, file_type=${file.file_type}, category=${file.category}`);
  
  try {
    const imageBuffer = await getThumbnailBuffer(file);
    console.log(`✅ Got thumbnail buffer, size: ${imageBuffer.length} bytes`);
    
    if (debugInfo) {
      debugInfo.steps.push({
        step: 'thumbnail_buffer',
        bufferSize: imageBuffer.length,
        fileName
      });
    }
    
    const md5Hash = crypto.createHash('md5').update(imageBuffer).digest('hex');
    console.log(`✅ Calculated MD5 hash: ${md5Hash}`);
    
    if (debugInfo) {
      debugInfo.steps.push({
        step: 'md5_hash',
        hash: md5Hash
      });
    }
    
    const initResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/assets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: fileName,
        fileHash: md5Hash
      })
    });
    
    console.log(`📡 Webflow Assets init response status: ${initResponse.status}`);
    
    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error(`❌ Webflow Assets init failed: ${errorText}`);
      
      if (debugInfo) {
        debugInfo.steps.push({
          step: 'webflow_assets_init',
          status: initResponse.status,
          error: errorText
        });
      }
      
      throw new Error(`Webflow Assets init error: ${initResponse.status} - ${errorText}`);
    }
    
    const initResult = await initResponse.json();
    console.log(`✅ Asset init successful, ID: ${initResult.id}, uploadUrl present: ${!!initResult.uploadUrl}`);
    
    if (debugInfo) {
      debugInfo.steps.push({
        step: 'webflow_assets_init',
        status: initResponse.status,
        assetId: initResult.id,
        hasUploadUrl: !!initResult.uploadUrl,
        hasUploadDetails: !!initResult.uploadDetails
      });
    }
    
    if (initResult.uploadUrl && initResult.uploadDetails) {
      console.log(`📤 Uploading to S3...`);
      await uploadToS3(initResult.uploadUrl, initResult.uploadDetails, imageBuffer);
      console.log(`✅ Asset uploaded to S3`);
      
      if (debugInfo) {
        debugInfo.steps.push({
          step: 's3_upload',
          success: true
        });
      }
    } else {
      console.log(`⚠️ No uploadUrl/uploadDetails in response, skipping S3 upload`);
      
      if (debugInfo) {
        debugInfo.steps.push({
          step: 's3_upload',
          skipped: true,
          reason: 'No uploadUrl or uploadDetails'
        });
      }
    }
    
    return { assetId: initResult.id, hostedUrl: initResult.hostedUrl };
  } catch (error) {
    console.error(`❌ Failed to upload asset: ${error.message}`);
    console.error(`❌ Error stack: ${error.stack}`);
    
    if (debugInfo) {
      debugInfo.steps.push({
        step: 'upload_error',
        error: error.message,
        stack: error.stack
      });
    }
    
    throw error;
  }
}

/**
 * Upload file to S3 using Webflow's upload details
 */
async function uploadToS3(uploadUrl, uploadDetails, fileBuffer) {
  return new Promise((resolve, reject) => {
    // Create multipart form data
    const boundary = `----WebflowFormBoundary${Date.now()}`;
    const parts = [];
    
    for (const [key, value] of Object.entries(uploadDetails)) {
      parts.push(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
        `${value}\r\n`
      );
    }
    
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="file"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`
    );
    
    const header = Buffer.from(parts.join(''), 'utf8');
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const body = Buffer.concat([header, fileBuffer, footer]);
    
    const url = new URL(uploadUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 204) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Sync to Webflow Assets (legacy function, kept for compatibility)
 */
async function syncToWebflowAssets(file, apiToken, siteId) {
  console.log(`📦 Syncing to Webflow Assets: ${file.title || file.name}`);
  
  let fileName = file.title || file.name || 'untitled';
  if (file.media_url) {
    const urlParts = file.media_url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      fileName = lastPart.split('?')[0];
    }
  }

  return await uploadImageAssetToWebflow(file.media_url, fileName, apiToken, siteId);
}

/**
 * Delete file and item
 */
async function deleteFileAndItem(fileId, { apiToken, collectionId, xanoBaseUrl, xanoApiKey }) {
  const result = { removedFromXano: false, removedFromWebflow: false };
  
  // Remove from Xano
  try {
    const delRes = await fetch(`${xanoBaseUrl}/user_submission/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${xanoApiKey}` }
    });
    result.removedFromXano = delRes.ok;
  } catch (err) {
    console.warn(`Xano delete error: ${err.message}`);
  }
  
  // Remove from Webflow
  try {
    const items = await listWebflowItems(collectionId, apiToken);
    const match = items.find(itm => {
      const fd = itm.fieldData || {};
      if (fd['file-id'] && String(fd['file-id']) === String(fileId)) return true;
      return false;
    });
    if (match) {
      await deleteWebflowItem(collectionId, match.id, apiToken);
      result.removedFromWebflow = true;
    }
  } catch (err) {
    console.warn(`Webflow delete error: ${err.message}`);
  }
  
  return result;
}

/**
 * List Webflow items
 */
async function listWebflowItems(collectionId, apiToken) {
  const response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
    headers: { 'Authorization': `Bearer ${apiToken}` }
  });
  if (!response.ok) {
    throw new Error(`Failed to list Webflow items: ${response.status}`);
  }
  const data = await response.json();
  return data.items || [];
}

/**
 * Delete Webflow item
 */
async function deleteWebflowItem(collectionId, itemId, apiToken) {
  const response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${apiToken}` }
  });
  if (!response.ok) {
    throw new Error(`Failed to delete Webflow item: ${response.status}`);
  }
}

// Schedule this function to run hourly
exports.config = {
  schedule: '@hourly'
};
