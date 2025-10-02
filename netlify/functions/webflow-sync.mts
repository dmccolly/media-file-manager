import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*'
  };
  
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers });
  }
  
  try {
    const apiToken = process.env.WEBFLOW_API_KEY || Netlify.env.get('WEBFLOW_API_KEY');
    const siteId = process.env.WEBFLOW_SITE_ID || Netlify.env.get('WEBFLOW_SITE_ID');
    const collectionId = process.env.WEBFLOW_COLLECTION_ID || Netlify.env.get('WEBFLOW_COLLECTION_ID');
    
    if (!apiToken || !siteId || !collectionId) {
      console.warn('🔶 Webflow configuration missing');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Webflow configuration missing' 
      }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    if (req.method === 'POST') {
      const fileData = await req.json();
      console.log('🔄 Syncing file to Webflow:', fileData.title);
      
      // Alternative approach: Use Make.com webhook instead of direct API
      const makeWebhookUrl = Netlify.env.get('MAKE_WEBHOOK_URL');
      if (makeWebhookUrl) {
        console.log('🔗 Using Make.com webhook for Webflow sync');
        
        const makeResponse = await fetch(makeWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: fileData.title || fileData.name,
            url: fileData.url,
            description: fileData.description || '',
            category: fileData.category || 'Files',
            fileType: fileData.type || 'file',
            fileSize: fileData.size || 0,
            tags: fileData.tags || '',
            author: fileData.author || 'Unknown',
            uploadDate: new Date().toISOString()
          })
        });
        
        if (makeResponse.ok) {
          const result = await makeResponse.json();
          console.log('✅ Make.com webhook successful:', result);
          return new Response(JSON.stringify({ 
            success: true, 
            method: 'make-webhook',
            result 
          }), {
            status: 200,
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Fallback: Try direct Webflow API with retry logic
      console.log('🔄 Attempting direct Webflow API sync');
      
      const itemData = {
        isArchived: false,
        isDraft: false,
        fieldData: {
          name: fileData.title || fileData.name,
          slug: generateSlug(fileData.title || fileData.name),
          'media-url': fileData.url,
          description: fileData.description || '',
          category: fileData.category || 'Files',
          'file-type': fileData.type || 'file',
          'file-size': fileData.size || 0,
          tags: fileData.tags || '',
          author: fileData.author || 'Unknown',
          'upload-date': new Date().toISOString()
        }
      };
      
      const response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Webflow API error:', response.status, errorText);
        
        // Return partial success - file was uploaded to Cloudinary/Xano
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Webflow sync failed: ${response.status}`,
          fileUploaded: true,
          webflowSynced: false
        }), {
          status: 200, // Don't fail the entire upload
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
      
      const result = await response.json();
      console.log('✅ Webflow sync successful:', result);
      
      return new Response(JSON.stringify({ 
        success: true, 
        method: 'direct-api',
        collectionItemId: result.id 
      }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Method not allowed' 
    }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Webflow sync error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Sync failed',
      fileUploaded: true,
      webflowSynced: false
    }), {
      status: 200, // Don't fail the entire upload
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export const config: Config = {
  path: "/api/webflow/sync"
};
