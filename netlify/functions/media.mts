import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  try {
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '100', 10);
    
    const apiKey = Netlify.env.get("XANO_API_KEY") || process.env.XANO_API_KEY;
    
    if (!apiKey) {
      console.error('XANO_API_KEY environment variable not found');
      return new Response(JSON.stringify({ 
        error: 'XANO_API_KEY environment variable not configured'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
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
    
    let data = await response.json();
    console.log('Successfully fetched data from Xano:', data.length || 0, 'records');
    
    // If search query provided, filter server-side
    if (searchQuery && searchQuery.trim().length >= 2) {
      console.log(`Searching for: "${searchQuery}"`);
      const searchLower = searchQuery.toLowerCase().trim();
      const searchTokens = searchLower.split(/\s+/).filter(t => t.length > 0);
      
      const matchingRecords = data.filter((record: any) => {
        const searchableFields = [
          record.title || '',
          record.description || '',
          record.author || '',
          record.submitted_by || '',
          record.category || '',
          record.station || '',
          record.file_type || '',
          record.notes || '',
          Array.isArray(record.tags) ? record.tags.join(' ') : (record.tags || ''),
          record.media_url || '',
          record.folder_path || ''
        ];
        
        const searchableText = searchableFields.join(' ').toLowerCase();
        return searchTokens.every(token => searchableText.includes(token));
      });
      
      console.log(`Found ${matchingRecords.length} matching records`);
      
      // Paginate results
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedItems = matchingRecords.slice(startIndex, endIndex);
      
      return new Response(JSON.stringify({
        items: paginatedItems,
        total: matchingRecords.length,
        page,
        pageSize,
        query: searchQuery
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // No search query - return all data
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
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
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

export const config: Config = {
  path: "/api/media"
};
