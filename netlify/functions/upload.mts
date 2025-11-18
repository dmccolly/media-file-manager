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
    const apiKey = Netlify.env.get("XANO_API_KEY") || process.env.XANO_API_KEY;
    
    if (!apiKey) {
      console.error('XANO_API_KEY environment variable not found');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'XANO_API_KEY environment variable not configured'
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
      type: fileData.file_type || fileData.type,
      station: fileData.station,
      notes: fileData.notes,
      tags: fileData.tags,
      media_url: fileData.media_url || fileData.url,
      thumbnail: fileData.thumbnail,
      file_size: fileData.file_size ?? fileData.size ?? 0,
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
    
    // Sync to Webflow Media Assets collection
    try {
      console.log('🔄 Netlify Function: Syncing to Webflow...');
      const webflowData = {
        name: fileData.title,
        title: fileData.title,
        url: fileData.media_url || fileData.url,
        thumbnail: fileData.thumbnail,
        description: fileData.description || '',
        category: fileData.category || 'Files',
        type: fileData.file_type || fileData.type || 'file',
        size: fileData.file_size ?? fileData.size ?? 0,
        tags: fileData.tags || '',
        author: fileData.author || 'Unknown',
        created_at: savedRecord.created_at || new Date().toISOString()
      };
      
      // Call the webflow sync endpoint
      const webflowSyncUrl = `${new URL(req.url).origin}/api/webflow/sync`;
      const webflowResponse = await fetch(webflowSyncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webflowData)
      });
      
      if (webflowResponse.ok) {
        const webflowResult = await webflowResponse.json();
        console.log('✅ Netlify Function: Webflow sync successful:', webflowResult);
      } else {
        const webflowError = await webflowResponse.text();
        console.warn('⚠️ Netlify Function: Webflow sync failed (non-critical):', webflowError);
      }
    } catch (webflowError) {
      console.warn('⚠️ Netlify Function: Webflow sync error (non-critical):', webflowError);
      // Don't fail the upload if Webflow sync fails
    }
    
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
