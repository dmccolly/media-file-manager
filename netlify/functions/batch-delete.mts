import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  try {
    const apiKey = Netlify.env.get("XANO_API_KEY") || process.env.XANO_API_KEY;
    
    if (!apiKey) {
      console.error('XANO_API_KEY environment variable not found');
      return new Response(JSON.stringify({ 
        error: 'XANO_API_KEY environment variable not configured'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const { ids } = await req.json();
    
    if (!ids || !Array.isArray(ids)) {
      return new Response(JSON.stringify({ error: 'IDs array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Batch deleting records:', ids.length);
    
    const promises = ids.map(async (id: string) => {
      const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete record ${id}`);
      }
      
      return { id, success: true };
    });
    
    const results = await Promise.all(promises);
    
    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API /batch-delete error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to batch delete records',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/batch-delete"
};
