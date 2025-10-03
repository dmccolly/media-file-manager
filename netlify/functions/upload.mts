import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const apiKey = Netlify.env.XANO_API_KEY || process.env.XANO_API_KEY;
    
    if (!apiKey) {
      console.error('XANO_API_KEY environment variable not found');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'XANO_API_KEY environment variable not configured',
        debug: 'Environment variables available: ' + Object.keys(Netlify.env || {}).join(', ')
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const fileData = await req.json();
    
    console.log('🔄 Netlify Function: Saving file to Xano:', fileData);
    
    const xanoData = {
      title: fileData.title,
      description: fileData.description,
      category: fileData.category,
      type: fileData.type,
      station: fileData.station,
      notes: fileData.notes,
      tags: fileData.tags,
      media_url: fileData.url,
      thumbnail: fileData.thumbnail,
      file_size: fileData.size,
      upload_date: new Date().toISOString(),
      duration: fileData.duration || '',
      folder_path: fileData.folder_path || ''
    };
    
    const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(xanoData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Netlify Function: Xano API error:', response.status, errorText);
      throw new Error(`Xano API error: ${response.status} - ${errorText}`);
    }
    
    const savedRecord = await response.json();
    console.log('✅ Netlify Function: File saved to Xano:', savedRecord);
    
    return new Response(JSON.stringify({ 
      success: true, 
      record: savedRecord 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('❌ Netlify Function: Upload error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Upload failed',
      details: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const config: Config = {
  path: "/api/upload"
};
