import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('🔄 Netlify Function: Fetching files from XANO API...');
    
    const XANO_API_BASE = 'https://x8ki-letl-twmt.n7.xano.io/api:pYeqCtV';
    const fetchUrl = `${XANO_API_BASE}/voxpro`;
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📦 Netlify Function: Successfully fetched files from XANO');
      
      return new Response(JSON.stringify({ files: data }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      console.error(`❌ Netlify Function: XANO API error: ${response.status}`);
      
      return new Response(JSON.stringify({ 
        error: `Failed to fetch files: ${response.status}` 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Netlify Function: Error fetching files:', error);
    
    return new Response(JSON.stringify({ 
      error: `Error fetching files: ${error.message}` 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const config: Config = {
  path: "/api/files"
};
