// Netlify function to save an uploaded asset to Xano and Webflow
exports.handler = async (event) => {
  try {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Set CORS headers for preflight and actual requests
    const origin = event.headers.origin || '';
    const allowedOrigins = (process.env.ALLOW_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
    const corsHeaders = {
      'access-control-allow-origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '*',
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
    const xanoBase = process.env.XANO_BASE_URL;
    const xanoEndpoint = process.env.XANO_ASSETS_ENDPOINT || '/v1/assets';
    if (!xanoBase) throw new Error('XANO_BASE_URL not set');
    const xanoHeaders = { 'content-type': 'application/json' };
    if (process.env.XANO_API_KEY) xanoHeaders['Authorization'] = `Bearer ${process.env.XANO_API_KEY}`;

    const xanoRes = await fetch(`${xanoBase}${xanoEndpoint}`, {
      method: 'POST',
      headers: xanoHeaders,
      body: JSON.stringify({
        title: asset.title || asset.name,
        url: asset.url,
        public_id: asset.publicId,
        resource_type: asset.type,
        size: asset.size,
        width: asset.width || null,
        height: asset.height || null,
        duration: asset.duration || null,
        thumbnail: asset.thumbnail || null,
        format: asset.format || null,
        raw: asset.cloudinaryData || null
      })
    });
    if (!xanoRes.ok) {
      const text = await xanoRes.text();
      throw new Error(`Xano error ${xanoRes.status}: ${text}`);
    }
    const xanoJson = await xanoRes.json();

    // ---- Save to Webflow (optional) ----
    const wfToken = process.env.WEBFLOW_API_TOKEN;
    const wfCollection = process.env.WEBFLOW_COLLECTION_ID;
    if (!wfToken || !wfCollection) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ok: true, xano: xanoJson, webflow: 'skipped' })
      };
    }
    // Build Webflow item payload; adapt field names to your collection schema
    const itemPayload = {
      name: asset.title || asset.name,
      slug: (asset.title || asset.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      _archived: false,
      _draft: String(process.env.WEBFLOW_DRAFT || 'false') === 'true',
      url: asset.url,
      publicId: asset.publicId,
      type: asset.type,
      size: asset.size,
      width: asset.width || null,
      height: asset.height || null,
      duration: asset.duration || null,
      format: asset.format || null,
      thumbnail: asset.thumbnail || null
    };
    const wfHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${wfToken}`,
      'accept-version': '1.0.0'
    };
    const wfRes = await fetch(`https://api.webflow.com/collections/${wfCollection}/items`, {
      method: 'POST',
      headers: wfHeaders,
      body: JSON.stringify({ fields: itemPayload })
    });
    if (!wfRes.ok) {
      const t = await wfRes.text();
      throw new Error(`Webflow error ${wfRes.status}: ${t}`);
    }
    const wfJson = await wfRes.json();
    // Optionally publish; requires WEBFLOW_SITE_ID
    if (String(process.env.WEBFLOW_PUBLISH || 'false') === 'true') {
      const siteId = process.env.WEBFLOW_SITE_ID;
      if (siteId) {
        try {
          await fetch(`https://api.webflow.com/sites/${siteId}/publish`, {
            method: 'POST',
            headers: wfHeaders,
            body: JSON.stringify({ publishToDevelopment: true, publishToPreview: true, publishToLive: true })
          });
        } catch (e) {
          console.warn('Webflow publish failed:', e);
        }
      }
    }
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, xano: xanoJson, webflow: wfJson })
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { statusCode: 500, body: msg };
  }
};
