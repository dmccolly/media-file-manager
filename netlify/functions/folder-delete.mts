import type { Context } from '@netlify/functions'
import { deleteFolder, getFolderResources } from './lib/cloudinaryService.mjs'

export default async (req: Context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Content-Type': 'application/json',
  }

  const method = req.httpMethod || req.method
  
  if (method === 'OPTIONS') {
    return new Response('', { status: 200, headers })
  }

  if (method !== 'DELETE') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    )
  }

  try {
    // Extract folder path from query parameters or body
    const url = new URL(req.url)
    let folderPath = url.searchParams.get('path')
    
    // If not in query params, try to get from body
    if (!folderPath) {
      let bodyText = ''
      if (typeof req.body === 'string') {
        bodyText = req.body
      } else if (req.body) {
        bodyText = await req.text()
      }
      
      if (bodyText) {
        const body = JSON.parse(bodyText)
        folderPath = body.path
      }
    }

    if (!folderPath) {
      return new Response(
        JSON.stringify({ error: 'Folder path is required' }),
        { status: 400, headers }
      )
    }

    // Convert database path (with leading slash) to Cloudinary path (without leading slash)
    const cloudinaryPath = folderPath.replace(/^\//, '')

    console.log(`🗑️ Attempting to delete folder from Cloudinary: ${cloudinaryPath}`)

    // Check if folder has any resources before attempting deletion
    try {
      const resources = await getFolderResources(cloudinaryPath)
      if (resources.resources && resources.resources.length > 0) {
        console.log(`⚠️ Folder contains ${resources.resources.length} files`)
        return new Response(
          JSON.stringify({ 
            error: 'Cannot delete non-empty folder',
            message: `Folder contains ${resources.resources.length} file(s). Please move or delete all files first.`,
            file_count: resources.resources.length
          }),
          { status: 400, headers }
        )
      }
    } catch (resourceError: any) {
      console.warn('⚠️ Could not check folder resources:', resourceError.message)
      // Continue with deletion attempt even if resource check fails
    }

    // Attempt to delete folder from Cloudinary
    try {
      await deleteFolder(cloudinaryPath)
      console.log('✅ Folder deleted successfully from Cloudinary')
    } catch (cloudinaryError: any) {
      console.error('❌ Cloudinary folder deletion failed:', cloudinaryError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete folder from Cloudinary',
          message: cloudinaryError.message || 'Unknown error'
        }),
        { status: 500, headers }
      )
    }

    // Optionally: Delete folder from Xano database if you're tracking folders there
    // This part is commented out since the original implementation didn't seem to use Xano for folders
    /*
    const xanoApiKey = process.env.XANO_API_KEY
    const xanoBaseUrl = process.env.XANO_BASE_URL || 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX'
    
    if (xanoApiKey && folderId) {
      try {
        const xanoResponse = await fetch(`${xanoBaseUrl}/folder/${folderId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${xanoApiKey}`,
          },
        })
        
        if (!xanoResponse.ok) {
          console.warn('⚠️ Failed to delete folder from Xano database')
        }
      } catch (xanoError) {
        console.warn('⚠️ Xano deletion error:', xanoError)
      }
    }
    */

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Folder deleted successfully from Cloudinary',
        path: folderPath,
        cloudinary_path: cloudinaryPath
      }),
      { status: 200, headers }
    )
  } catch (error) {
    console.error('❌ Error deleting folder:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers }
    )
  }
}

