/**
 * Sync All Assets to Webflow
 * 
 * This function triggers a full sync of all assets from Xano to Webflow.
 * Use this for initial setup or to resync all existing assets.
 */

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('🔄 Sync All: Starting full sync to Webflow');

    // Call the webflow-sync function with syncAll flag
    const syncResponse = await fetch(`${event.headers.origin || 'https://eclectic-caramel-34e317.netlify.app'}/.netlify/functions/webflow-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ syncAll: true })
    });

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      throw new Error(`Sync failed: ${syncResponse.status} - ${errorText}`);
    }

    const result = await syncResponse.json();
    console.log('✅ Sync All: Complete', result);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Full sync to Webflow completed',
        ...result
      })
    };

  } catch (error) {
    console.error('❌ Sync All: Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      })
    };
  }
};