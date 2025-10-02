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
    
    const { updates } = await req.json();
    
    if (!updates || !Array.isArray(updates)) {
      return new Response(JSON.stringify({ error: 'Updates array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Batch updating records:', updates.length);
    
    const promises = updates.map(async ({ id, fields }: { id: string, fields: any }) => {
      const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fields)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update record ${id}`);
      }
      
      return response.json();
    });
    
    const results = await Promise.all(promises);
    
    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API /batch-update error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to batch update records',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/batch-update"
};
