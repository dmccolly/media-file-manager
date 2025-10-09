import type { Context } from '@netlify/functions'

export default async (req: Context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  const method = req.httpMethod || req.method
  
  if (method === 'OPTIONS') {
    return new Response('', { status: 200, headers })
  }

  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    )
  }

  try {
    // Handle both v1 (string body) and v2 (ReadableStream body)
    let bodyText = ''
    if (typeof req.body === 'string') {
      bodyText = req.body
    } else if (req.body) {
      bodyText = await req.text()
    }
    
    const { name, parent_path = '/' } = JSON.parse(bodyText || '{}')

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

    // Return success - folders are managed client-side via folder_path in user_submission
    const folder = {
      id: Date.now(),
      name: sanitizedName,
      path: fullPath,
      parent_path: parent_path,
      created_at: Date.now(),
    }

    return new Response(
      JSON.stringify({
        success: true,
        folder: folder,
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