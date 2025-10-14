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
    console.log('🔄 Webflow Sync: Starting sync process');

    // Get environment variables
    const WEBFLOW_API_TOKEN = process.env.VITE_WEBFLOW_API_TOKEN;
    const WEBFLOW_SITE_ID = process.env.VITE_WEBFLOW_SITE_ID || '688ed8debc05764047afa2a7';
    const WEBFLOW_COLLECTION_ID = process.env.VITE_WEBFLOW_COLLECTION_ID || '6891479d29ed1066b71124e9';
    const XANO_API_KEY = process.env.XANO_API_KEY;
    const XANO_BASE_URL = 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX';

    // Validate required environment variables
    if (!WEBFLOW_API_TOKEN) {
      console.error('❌ Webflow Sync: VITE_WEBFLOW_API_TOKEN not configured');
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

    if (!XANO_API_KEY) {
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
      console.log('🔄 Webflow Sync: Fetching all files from Xano');
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
      console.log(`🔄 Webflow Sync: Fetching file ${fileId} from Xano`);
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
        console.log(`🔄 Webflow Sync: Processing file: ${file.title || file.id}`);

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
  console.log(`🔄 Syncing to Webflow Assets: ${file.title}`);

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
  console.log(`🔄 Syncing to Webflow Collection: ${file.title}`);

  const slug = generateSlug(file.title || file.name || 'untitled');

  const itemData = {
    isArchived: false,
    isDraft: false,
    fieldData: {
      name: file.title || file.name || 'Untitled',
      slug: slug,
      'media-url': file.media_url,
      description: file.description || '',
      category: file.category || 'Files',
      'file-type': file.file_type || 'file',
      'file-size': file.file_size || 0,
      tags: Array.isArray(file.tags) ? file.tags.join(', ') : (file.tags || ''),
      author: file.author || file.submitted_by || 'Unknown',
      'upload-date': file.upload_date || file.created_at || new Date().toISOString()
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
  
  return { itemId: result.id };
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