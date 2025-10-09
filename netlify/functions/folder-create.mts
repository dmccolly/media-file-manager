import type { Context } from '@netlify/functions'

export default async (req: Context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (req.httpMethod === 'OPTIONS') {
    return new Response('', { status: 200, headers })
  }

  if (req.httpMethod !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    )
  }

  try {
    const { name, parent_path = '/' } = JSON.parse(req.body || '{}')

    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ error: 'Folder name is required' }),
        { status: 400, headers }
      )
    }

    // Sanitize folder name
    const sanitizedName = name.trim().replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '_')
    
    // Build full path
    const fullPath = parent_path === '/' 
      ? `/${sanitizedName}`
      : `${parent_path}/${sanitizedName}`

    // Create folder in Xano
    const xanoApiKey = process.env.XANO_API_KEY
    const xanoBaseUrl = process.env.XANO_BASE_URL || 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX'

    const xanoResponse = await fetch(`${xanoBaseUrl}/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(xanoApiKey && { 'Authorization': `Bearer ${xanoApiKey}` }),
      },
      body: JSON.stringify({
        name: sanitizedName,
        path: fullPath,
        parent_path: parent_path,
        created_at: Date.now(),
      }),
    })

    if (!xanoResponse.ok) {
      const errorText = await xanoResponse.text()
      console.error('Xano folder creation failed:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create folder in database',
          details: errorText 
        }),
        { status: xanoResponse.status, headers }
      )
    }

    const folder = await xanoResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        folder: {
          id: folder.id,
          name: sanitizedName,
          path: fullPath,
          parent_path: parent_path,
          created_at: folder.created_at,
        },
      }),
      { status: 201, headers }
    )
  } catch (error) {
    console.error('Error creating folder:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers }
    )
  }
}