// A proxy for serving PDFs through Netlify with a size guard.
const MAX_STREAM_BYTES = 15 * 1024 * 1024; // ~15MB limit for proxying

exports.handler = async (event) => {
  try {
    const origin = event.headers.origin || '';
    const allowed = (process.env.ALLOW_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
    const cors = {
      'access-control-allow-origin': allowed.includes(origin) ? origin : allowed[0] || '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET, OPTIONS'
    };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };

    const url = new URL(event.rawUrl).searchParams.get('url');
    if (!url) return { statusCode: 400, headers: cors, body: 'Missing url param' };
    // Check size via HEAD
    const head = await fetch(url, { method: 'HEAD' });
    const len = Number(head.headers.get('content-length') || '0');
    if (len && len > MAX_STREAM_BYTES) {
      return {
        statusCode: 413,
        headers: cors,
        body: JSON.stringify({ error: 'PDF too large for proxy', useDirectUrl: url })
      };
    }
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      statusCode: res.status,
      headers: { ...cors, 'content-type': res.headers.get('content-type') || 'application/pdf' },
      body: buf.toString('base64'),
      isBase64Encoded: true
    };
  } catch (e) {
    return { statusCode: 500, body: e?.message || 'proxy error' };
  }
};
