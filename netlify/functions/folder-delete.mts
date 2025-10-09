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
    return { statusCode: 200, headers, body: '' }
  }

  if (req.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    // Extract folder ID from path: /api/folder-delete/123
    const pathParts = req.path.split('/')
    const folderId = pathParts[pathParts.length - 1]

    if (!folderId || folderId === 'folder-delete') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Folder ID is required' }),
      }
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
      return {
        statusCode: xanoResponse.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to delete folder from database',
          details: errorText 
        }),
      }
    }

    // Note: Files in this folder should be moved to parent folder
    // This should be handled by the frontend before calling delete

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Folder deleted successfully',
      }),
    }
  } catch (error) {
    console.error('Error deleting folder:', error)
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