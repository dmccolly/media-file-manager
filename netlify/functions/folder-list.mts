import type { Context } from '@netlify/functions'
import { listFolders, listSubfolders } from './lib/cloudinaryService.mjs'

export default async (req: Context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  }

  const method = req.httpMethod || req.method
  
  if (method === 'OPTIONS') {
    return new Response('', { status: 200, headers })
  }

  if (method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    )
  }

  try {
    const url = new URL(req.url)
    const source = url.searchParams.get('source') // 'cloudinary' or 'database'
    const parentPath = url.searchParams.get('parent')

    // If source is explicitly set to cloudinary, fetch from Cloudinary
    if (source === 'cloudinary') {
      console.log('📂 Fetching folders from Cloudinary')
      
      try {
        let cloudinaryFolders
        
        if (parentPath && parentPath !== '/') {
          // List subfolders of a specific path
          const cleanPath = parentPath.replace(/^\//, '')
          cloudinaryFolders = await listSubfolders(cleanPath)
        } else {
          // List root folders
          cloudinaryFolders = await listFolders()
        }

        // Transform Cloudinary folder structure to match our format
        const folders = (cloudinaryFolders.folders || []).map((folder: any) => ({
          name: folder.name,
          path: folder.path,
          cloudinary_path: folder.path,
        }))

        return new Response(JSON.stringify(folders), { status: 200, headers })
      } catch (cloudinaryError: any) {
        console.error('❌ Cloudinary folder list failed:', cloudinaryError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch folders from Cloudinary',
            message: cloudinaryError.message || 'Unknown error'
          }),
          { status: 500, headers }
        )
      }
    }

    // Default: Fetch from Xano database
    const xanoApiKey = process.env.XANO_API_KEY
    const xanoBaseUrl = process.env.XANO_BASE_URL || 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX'

    console.log('📂 Fetching folders from Xano database')

    const xanoResponse = await fetch(`${xanoBaseUrl}/folders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(xanoApiKey && { 'Authorization': `Bearer ${xanoApiKey}` }),
      },
    })

    if (!xanoResponse.ok) {
      const errorText = await xanoResponse.text()
      console.error('❌ Xano folder list failed:', errorText)
      
      // If folders table doesn't exist yet, return empty array
      if (xanoResponse.status === 404) {
        return new Response(JSON.stringify([]), { status: 200, headers })
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch folders from database',
          details: errorText 
        }),
        { status: xanoResponse.status, headers }
      )
    }

    const folders = await xanoResponse.json()

    return new Response(JSON.stringify(folders), { status: 200, headers })
  } catch (error) {
    console.error('❌ Error fetching folders:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers }
    )
  }
}

