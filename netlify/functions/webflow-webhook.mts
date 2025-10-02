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
    console.log('🔄 Webflow webhook received:', req.method);
    
    if (req.method === 'POST') {
      const webhookData = await req.json();
      console.log('📥 Webhook payload:', webhookData);
      
      // Handle different Webflow webhook events
      const eventType = webhookData.triggerType || webhookData._meta?.eventType;
      
      switch (eventType) {
        case 'collection_item_created':
          console.log('✅ New collection item created:', webhookData.name);
          break;
        case 'collection_item_changed':
          console.log('🔄 Collection item updated:', webhookData.name);
          break;
        case 'collection_item_deleted':
          console.log('🗑️ Collection item deleted:', webhookData.name);
          break;
        default:
          console.log('📝 Unknown webhook event:', eventType);
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        eventType 
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
    console.error('❌ Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Webhook processing failed' 
    }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/webflow/webhook"
};
