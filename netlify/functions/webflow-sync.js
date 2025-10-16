/**
 * Webflow Sync Function with event triggers
 *
 * This Netlify function keeps a Webflow CMS collection in sync with
 * assets stored in Xano/Cloudinary.  It supports three modes of
 * operation:
 *
 *  1. **Scheduled sync** – When invoked by Netlify's scheduler (see
 *     the exported `config` at the bottom of the file), the function
 *     fetches *all* records from the Xano `user_submission` endpoint
 *     and upserts them into the specified Webflow collection.  This
 *     provides a fallback to ensure eventual consistency even if
 *     individual events are missed.
 *
 *  2. **Create/update event** – When invoked via HTTP POST with a
 *     JSON body containing `{ "fileId": "12345" }`, the function
 *     fetches that single record from Xano and upserts it into
 *     Webflow.  This can be used as a webhook target from Xano or
 *     Cloudinary to immediately publish new assets without waiting
 *     for the next scheduled run.
 *
 *  3. **Delete event** – When invoked via HTTP POST with a JSON body
 *     containing `{ "fileId": "12345", "action": "delete" }`, the
 *     function removes the corresponding record from Xano and
 *     deletes the matching item from Webflow.  It identifies the
 *     Webflow item by the file's Cloudinary public ID or name.  This
 *     allows your file manager to stay in sync when assets are
 *     deleted.
 *
 * All configuration values (Webflow token, site ID, collection ID,
 * Xano base URL, API key, etc.) are read from environment variables.
 * You can provide either VITE-prefixed variables (for front-end
 * compatibility) or plain names; the function tries both.
 */

exports.handler = async (event) => {
  // CORS preflight for browsers
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

  // Only allow GET or POST.  GET is reserved for scheduled invocations,
  // POST is used for event-driven triggers.
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
    console.log('Webflow Sync: Starting');

    // Read environment variables.  Support both VITE_ and plain names.
    const WEBFLOW_API_TOKEN = process.env.VITE_WEBFLOW_API_TOKEN || process.env.WEBFLOW_API_TOKEN;
    const WEBFLOW_SITE_ID = process.env.VITE_WEBFLOW_SITE_ID || process.env.WEBFLOW_SITE_ID;
    const WEBFLOW_COLLECTION_ID = process.env.VITE_WEBFLOW_COLLECTION_ID || process.env.WEBFLOW_COLLECTION_ID;
    const XANO_API_KEY = process.env.XANO_API_KEY;
    const XANO_BASE_URL = process.env.XANO_BASE_URL;

    // Validate required variables.  Without these the function cannot proceed.
    if (!WEBFLOW_API_TOKEN || !WEBFLOW_SITE_ID || !WEBFLOW_COLLECTION_ID) {
      console.error('Missing Webflow configuration');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: false, error: 'Webflow configuration missing' })
      };
    }
    if (!XANO_API_KEY || !XANO_BASE_URL) {
      console.error('Missing Xano configuration');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: false, error: 'Xano configuration missing' })
      };
    }

    // Parse the request body (if present).  Invalid JSON is ignored.
    let bodyJson = {};
    if (event.httpMethod === 'POST' && event.body) {
      try {
        bodyJson = JSON.parse(event.body);
      } catch (err) {
        console.warn('Could not parse request body as JSON');
      }
    }

    const action = bodyJson.action || 'upsert';
    const fileId = bodyJson.fileId || null;

    // Determine mode: delete, upsert single, or full sync
    if (action === 'delete' && fileId) {
      console.log(`Webflow Sync: Deleting file ${fileId}`);
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

    // If a specific fileId is provided, upsert just that record
    if (fileId) {
      console.log(`Webflow Sync: Syncing single file ${fileId}`);
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

    // Default: fetch all files from Xano and upsert them.  This is
    // triggered either by a scheduled invocation or a GET request.
    console.log('Webflow Sync: Performing full sync from Xano');
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
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: true, results })
    };
  } catch (err) {
    console.error('Webflow Sync: Unexpected error', err);
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
 * Fetch a single file record from Xano by ID
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
 * Fetch all file records from Xano
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
 * Upsert a file into Webflow.  This helper encapsulates the logic
 * to upload the asset (if possible) and create the CMS item.  It
 * returns an object containing IDs of the created asset and
 * collection item.
 */
async function upsertFile(file, apiToken, siteId, collectionId) {
  // First attempt to upload the asset into Webflow's media library.
  let assetResult = { assetId: null, error: null };
  try {
    assetResult = await syncToWebflowAssets(file, apiToken, siteId);
  } catch (err) {
    assetResult.error = err.message;
    console.warn(`Asset upload failed: ${err.message}`);
  }
  const collectionRes = await syncToWebflowCollection(file, apiToken, collectionId);
  return {
    fileId: file.id,
    assetId: assetResult.assetId,
    collectionItemId: collectionRes.itemId,
    existed: collectionRes.existed,
    assetError: assetResult.error
  };
}

/**
 * Delete a file from Xano and its corresponding item from Webflow
 */
async function deleteFileAndItem(fileId, { apiToken, collectionId, xanoBaseUrl, xanoApiKey }) {
  const result = { removedFromXano: false, removedFromWebflow: false };
  // Remove from Xano
  try {
    const delRes = await fetch(`${xanoBaseUrl}/user_submission/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${xanoApiKey}` }
    });
    result.removedFromXano = delRes.ok;
  } catch (err) {
    console.warn(`Xano delete error: ${err.message}`);
  }
  // Remove from Webflow by finding the matching item
  try {
    const items = await listWebflowItems(collectionId, apiToken);
    const match = items.find(itm => {
      const fd = itm.fieldData || {};
      if (fd['file-id'] && String(fd['file-id']) === String(fileId)) return true;
      const pubId = fd['cloudinary-public-id'];
      if (pubId && pubId.includes(fileId)) return true;
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
 * List all items in a Webflow collection
 */
async function listWebflowItems(collectionId, apiToken) {
  const response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
    headers: { Authorization: `Bearer ${apiToken}` }
  });
  if (!response.ok) {
    throw new Error(`Failed to list Webflow items: ${response.status}`);
  }
  const data = await response.json();
  return data.items || [];
}

/**
 * Delete a specific item from a Webflow collection
 */
async function deleteWebflowItem(collectionId, itemId, apiToken) {
  const response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiToken}` }
  });
  if (!response.ok) {
    throw new Error(`Failed to delete Webflow item: ${response.status}`);
  }
}

/* Existing helper functions copied from the robust version.  These
 * include syncToWebflowAssets, syncToWebflowCollection, generateSlug,
 * generateFileHash, hashString, extractPublicIdFromUrl, convertToISODate,
 * checkForExistingItem, generateThumbnailUrl, optimizeCloudinaryThumbnail.
 * They are unchanged and reused here to avoid duplication.
 */

/**
 * Sync file to Webflow Media Assets
 */
async function syncToWebflowAssets(file, apiToken, siteId) {
  console.log(`Syncing to Webflow Assets: ${file.title || file.name}`);
  let fileName = file.title || file.name || 'untitled';
  if (file.media_url) {
    const urlParts = file.media_url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      fileName = lastPart.split('?')[0];
    } else {
      const ext = getFileExtension(file.file_type, file.media_url);
      if (ext && !fileName.includes('.')) {
        fileName = `${fileName}.${ext}`;
      }
    }
  }
  const fileHash = await generateFileHash(file.media_url);
  const response = await fetch(`https://api.webflow.com/v2/sites/${siteId}/assets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
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
  return { assetId: result.id };
}

/**
 * Sync file to Webflow CMS Collection
 */
async function syncToWebflowCollection(file, apiToken, collectionId) {
  console.log(`Syncing to Webflow Collection: ${file.title || file.name}`);
  const existingItem = await checkForExistingItem(file, apiToken, collectionId);
  if (existingItem) {
    return { itemId: existingItem.id, existed: true };
  }
  const slug = generateSlug(file.title || file.name || 'untitled');
  const thumbnailUrl = generateThumbnailUrl(file);
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
      'cloudinary-public-id': extractPublicIdFromUrl(file.media_url),
      'file-id': file.id
    }
  };
  const response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(itemData)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Webflow Collection API error: ${response.status} - ${errorText}`);
  }
  const result = await response.json();
  try {
    await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items/${result.id}/publish`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${apiToken}` }
    });
  } catch (err) {
    console.warn(`Failed to auto-publish item ${result.id}: ${err.message}`);
  }
  return { itemId: result.id, existed: false };
}

/**
 * Generate a URL-friendly slug
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
 * Determine a file extension from type or URL
 */
function getFileExtension(fileType, url) {
  if (url) {
    const parts = url.split('.');
    const last = parts[parts.length - 1].split('?')[0];
    if (last && last.length <= 5) return last;
  }
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
 * Generate a SHA-256 hash for a file URL
 */
async function generateFileHash(url) {
  if (!url) return 'unknown';
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`File hash fetch failed: ${res.status}`);
      return hashString(url);
    }
    const buf = await res.arrayBuffer();
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(buf));
    return hash.digest('hex');
  } catch (err) {
    console.warn(`File hash error: ${err.message}`);
    return hashString(url);
  }
}

/**
 * Fallback: hash a string with SHA-256
 */
function hashString(str) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Extract Cloudinary public ID from a URL
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
      headers: { Authorization: `Bearer ${apiToken}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items = data.items || [];
    if (file.media_url) {
      const existingByUrl = items.find(it => it.fieldData && it.fieldData['media-url'] === file.media_url);
      if (existingByUrl) return existingByUrl;
    }
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
 * Generate a consistent thumbnail URL
 */
function generateThumbnailUrl(file) {
  const width = 400;
  const height = 300;
  if (file.thumbnail && file.thumbnail.trim() && file.thumbnail.includes('cloudinary.com')) {
    return optimizeCloudinaryThumbnail(file.thumbnail, width, height);
  }
  if (file.file_type && file.file_type.startsWith('image/') && file.media_url) {
    if (file.media_url.includes('cloudinary.com')) {
      return optimizeCloudinaryThumbnail(file.media_url, width, height);
    }
    return file.media_url;
  }
  if (file.file_type && file.file_type.startsWith('video/') && file.media_url) {
    if (file.media_url.includes('cloudinary.com')) {
      return file.media_url
        .replace('/upload/', `/upload/w_${width},h_${height},c_fill,f_auto,q_auto,g_auto,so_0/`)
        .replace(/\.[^.]+$/, '.jpg');
    }
  }
  if (file.file_type === 'application/pdf' && file.media_url) {
    if (file.media_url.includes('cloudinary.com')) {
      return file.media_url
        .replace('/upload/', `/upload/w_${width},h_${height},c_fill,f_auto,q_auto,g_auto,pg_1/`)
        .replace(/\.pdf$/i, '.jpg');
    }
  }
  if (file.file_type && file.file_type.startsWith('audio/')) {
    return `https://via.placeholder.com/${width}x${height}/4A90E2/FFFFFF?text=+Audio+File`;
  }
  return `https://via.placeholder.com/${width}x${height}/6B7280/FFFFFF?text=+${encodeURIComponent(file.file_type || 'File')}`;
}

/**
 * Optimize Cloudinary URLs for consistent thumbnail sizes
 */
function optimizeCloudinaryThumbnail(url, width, height) {
  if (!url || !url.includes('cloudinary.com')) return url;
  const baseUrl = url.split('/upload/')[0] + '/upload/';
  const imagePath = url.split('/upload/')[1];
  const cleanImage = imagePath.replace(/^[^\/]*\//, '');
  return `${baseUrl}w_${width},h_${height},c_fill,f_auto,q_auto,g_auto/${cleanImage}`;
}

// Tell Netlify to run this function on a schedule.  You can adjust
// the cron expression below; the minimum interval is every 15 minutes.
exports.config = {
  schedule: '@hourly'
};
