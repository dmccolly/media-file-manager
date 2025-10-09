// Netlify function to save an uploaded asset to Xano and Webflow
exports.handler = async (event) => {
  try {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Set CORS headers for preflight and actual requests
    const origin = event.headers.origin || '';
    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'POST, OPTIONS'
    };
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    const asset = JSON.parse(event.body || '{}');
    if (!asset?.url || !asset?.publicId) {
      return { statusCode: 400, headers: corsHeaders, body: 'Missing asset url/publicId' };
    }

    // ---- Save to Xano ----
    const apiKey = process.env.XANO_API_KEY;
    if (!apiKey) {
      throw new Error('XANO_API_KEY not set');
    }

    // Determine file_type based on asset type and format
    let file_type = 'application/octet-stream';
    if (asset.type === 'image') {
      file_type = `image/${asset.format || 'jpeg'}`;
    } else if (asset.type === 'video') {
      file_type = `video/${asset.format || 'mp4'}`;
    } else if (asset.type === 'raw') {
      // Handle PDF and DOCX files
      if (asset.format === 'pdf') {
        file_type = 'application/pdf';
      } else if (asset.format === 'docx') {
        file_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (asset.format === 'doc') {
        file_type = 'application/msword';
      } else {
        file_type = `application/${asset.format || 'octet-stream'}`;
      }
    }

    const xanoData = {
      title: asset.title || asset.name,
      description: '',
      category: asset.type === 'image' ? 'images' : asset.type === 'video' ? 'videos' : 'documents',
      type: asset.type,
      station: '',
      notes: '',
      tags: [],
      media_url: asset.url,
      thumbnail: asset.thumbnail || asset.url,
      file_type: file_type,
      file_size: asset.size || 0,
      upload_date: new Date().toISOString(),
      duration: asset.duration || '',
      folder_path: ''
    };

    const xanoRes = await fetch(`https://x3o5-9jqb-qs8e.n7c.xano.io/api:6SHl5baF/media_files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(xanoData)
    });
    if (!xanoRes.ok) {
      const text = await xanoRes.text();
      throw new Error(`Xano error ${xanoRes.status}: ${text}`);
    }
    const xanoJson = await xanoRes.json();

    // ---- Webflow sync (non-blocking, optional) ----
    // Don't wait for Webflow to complete - just trigger it in background
    const wfToken = process.env.VITE_WEBFLOW_API_TOKEN;
    const wfCollection = process.env.VITE_WEBFLOW_COLLECTION_ID;
    if (wfToken && wfCollection) {
      // Trigger Webflow sync but don't wait for it
      fetch('/.netlify/functions/webflow-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: xanoJson.id })
      }).catch(err => console.warn('Webflow sync failed:', err));
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, xano: xanoJson, webflow: 'triggered' })
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Save asset error:', msg);
    return { 
      statusCode: 500, 
      headers: {
        'Content-Type': 'application/json',
        'access-control-allow-origin': '*'
      },
      body: JSON.stringify({ error: msg })
    };
  }
};
