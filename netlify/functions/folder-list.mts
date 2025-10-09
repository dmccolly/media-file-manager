import type { Context } from '@netlify/functions'

export default async (req: Context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (req.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (req.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const xanoApiKey = process.env.XANO_API_KEY
    const xanoBaseUrl = process.env.XANO_BASE_URL || 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX'

    const xanoResponse = await fetch(`${xanoBaseUrl}/folders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(xanoApiKey && { 'Authorization': `Bearer ${xanoApiKey}` }),
      },
    })

    if (!xanoResponse.ok) {
      const errorText = await xanoResponse.text()
      console.error('Xano folder list failed:', errorText)
      
      // If folders table doesn't exist yet, return empty array
      if (xanoResponse.status === 404) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify([]),
        }
      }
      
      return {
        statusCode: xanoResponse.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to fetch folders from database',
          details: errorText 
        }),
      }
    }

    const folders = await xanoResponse.json()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(folders),
    }
  } catch (error) {
    console.error('Error fetching folders:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    }
  }
}