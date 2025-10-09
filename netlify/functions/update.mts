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
    
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Record ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const updates = await req.json();
    
    console.log('Updating record:', id, 'with:', updates);
    const response = await fetch(`https://x3o5-9jqb-qs8e.n7c.xano.io/api:6SHl5baF/media_files/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Xano API error: ${response.status} - ${errorText}`);
      throw new Error(`Xano API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API /update error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update record',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/update/:id"
};
