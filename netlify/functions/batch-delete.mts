import type { Context, Config } from "@netlify/functions";

const MAX_BATCH_SIZE = 50;

export default async (req: Request, context: Context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  const method = req.method;

  // Handle OPTIONS request for CORS
  if (method === 'OPTIONS') {
    return new Response('', { status: 200, headers });
  }

  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    const apiKey = Netlify.env.get("XANO_API_KEY") || process.env.XANO_API_KEY;
    
    if (!apiKey) {
      console.error('XANO_API_KEY environment variable not found');
      return new Response(JSON.stringify({ 
        error: 'XANO_API_KEY environment variable not configured'
      }), {
        status: 500,
        headers
      });
    }
    
    const { ids } = await req.json();
    
    // Validate input
    if (!ids || !Array.isArray(ids)) {
      return new Response(JSON.stringify({ 
        error: 'IDs array is required' 
      }), {
        status: 400,
        headers
      });
    }

    // Check for empty array
    if (ids.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'IDs array cannot be empty' 
      }), {
        status: 400,
        headers
      });
    }

    // Check batch size limit
    if (ids.length > MAX_BATCH_SIZE) {
      return new Response(JSON.stringify({ 
        error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}. Please split into smaller batches.`,
        maxBatchSize: MAX_BATCH_SIZE,
        receivedSize: ids.length
      }), {
        status: 400,
        headers
      });
    }

    // Validate all IDs are strings or numbers
    for (let i = 0; i < ids.length; i++) {
      if (typeof ids[i] !== 'string' && typeof ids[i] !== 'number') {
        return new Response(JSON.stringify({ 
          error: `Invalid ID at index ${i}: must be string or number` 
        }), {
          status: 400,
          headers
        });
      }
    }
    
    console.log(`🗑️ Batch deleting ${ids.length} records`);
    
    // Use Promise.allSettled to handle partial failures
    const promises = ids.map(async (id: string) => {
      try {
        const response = await fetch(
          `https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission/${id}`, 
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${apiKey}`
            }
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to delete record ${id}: ${response.status} - ${errorText}`);
        }
        
        return { id, success: true };
      } catch (error) {
        return { 
          id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    // Process results
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: ids[index],
          success: false,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        };
      }
    });

    const successes = processedResults.filter(r => r.success);
    const failures = processedResults.filter(r => !r.success);

    console.log(`✅ Batch delete complete: ${successes.length} succeeded, ${failures.length} failed`);
    
    return new Response(JSON.stringify({ 
      success: failures.length === 0,
      total: ids.length,
      succeeded: successes.length,
      failed: failures.length,
      results: processedResults
    }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('❌ API /batch-delete error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to batch delete records',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers
    });
  }
};

export const config: Config = {
  path: "/api/batch-delete"
};