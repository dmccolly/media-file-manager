import type { Context } from '@netlify/functions'

export default async (req: Context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (req.httpMethod === 'OPTIONS') {
    return new Response('', { status: 200, headers })
  }

  if (req.httpMethod !== 'DELETE') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    )
  }

  try {
    // Extract folder ID from path: /api/folder-delete/123
    const pathParts = req.path.split('/')
    const folderId = pathParts[pathParts.length - 1]

    if (!folderId || folderId === 'folder-delete') {
      return new Response(
        JSON.stringify({ error: 'Folder ID is required' }),
        { status: 400, headers }
      )
    }

    const xanoApiKey = process.env.XANO_API_KEY
    const xanoBaseUrl = process.env.XANO_BASE_URL || 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX'

    // Delete folder from Xano
    const xanoResponse = await fetch(`${xanoBaseUrl}/folders/${folderId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(xanoApiKey && { 'Authorization': `Bearer ${xanoApiKey}` }),
      },
    })

    if (!xanoResponse.ok) {
      const errorText = await xanoResponse.text()
      console.error('Xano folder deletion failed:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete folder from database',
          details: errorText 
        }),
        { status: xanoResponse.status, headers }
      )
    }

    // Note: Files in this folder should be moved to parent folder
    // This should be handled by the frontend before calling delete

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Folder deleted successfully',
      }),
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Error deleting folder:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers }
    )
  }
}