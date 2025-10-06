import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  try {
    const apiKey = process.env.VITE_XANO_API_KEY || Netlify.env.XANO_API_KEY || process.env.XANO_API_KEY;
    
    if (!apiKey) {
      console.error('XANO_API_KEY environment variable not found');
      return new Response(JSON.stringify({ 
        error: 'XANO_API_KEY environment variable not configured',
        debug: 'Environment variables available: ' + Object.keys(Netlify.env || {}).join(', ')
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log('Making request to Xano API...');
    const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Xano API error: ${response.status} - ${errorText}`);
      throw new Error(`Xano API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched data from Xano:', data.length || 0, 'records');
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('API /media error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch media records',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const config: Config = {
  path: "/api/media"
};
