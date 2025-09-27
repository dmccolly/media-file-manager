import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('🔄 Netlify Function: XANO API does not support GET for /voxpro endpoint');
    console.log('📦 Netlify Function: Returning empty files array for now');
    
    // XANO /voxpro endpoint only supports POST (create) operations, not GET (fetch)
    // Return empty array until proper GET endpoint is available or configured
    return new Response(JSON.stringify({ 
      files: [],
      message: 'XANO API /voxpro endpoint does not support GET operations. No files to display.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('❌ Netlify Function: Error:', error);
    
    return new Response(JSON.stringify({ 
      files: [],
      error: `Error in function: ${error.message}` 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const config: Config = {
  path: "/api/files"
};
