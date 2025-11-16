/**
 * Sync All Assets to Webflow (Improved)
 *
 * This version eliminates the external network call and directly invokes
 * the webflow-sync Netlify function as a local module. Invoking it with
 * an event that uses the GET method triggers a full synchronisation of
 * Xano assets into your Webflow CMS collection. This approach avoids
 * cross-domain issues on branch deploys and ensures the sync runs in the
 * same environment with the correct environment variables.
 */

const webflowSync = require('./webflow-sync');

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

  // Only allow POST requests for this endpoint
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

    // Build a synthetic event to trigger a full sync in the webflow-sync function
    const syncEvent = { httpMethod: 'GET', headers: {}, body: '' };

    // Invoke the webflow-sync handler directly
    const syncResult = await webflowSync.handler(syncEvent);

    // The handler returns an object with a body property (stringified JSON)
    let parsed;
    try {
      parsed = JSON.parse(syncResult.body || '{}');
    } catch (parseErr) {
      parsed = { success: false, error: 'Invalid JSON returned from sync function' };
    }

    console.log('✅ Sync All: Complete', parsed);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Full sync to Webflow completed',
        result: parsed
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
