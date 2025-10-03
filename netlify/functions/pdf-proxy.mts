import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  try {
    const url = new URL(req.url);
    const pdfUrl = url.searchParams.get('url');
    
    if (!pdfUrl) {
      return new Response(JSON.stringify({ error: 'PDF URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Proxying PDF from:', pdfUrl);
    
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Netlify/1.0)',
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch PDF: ${response.status} - ${response.statusText}`);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch PDF',
        status: response.status 
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const pdfBuffer = await response.arrayBuffer();
    
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('PDF proxy error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to proxy PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/pdf-proxy"
};
