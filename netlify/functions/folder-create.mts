import type { Context } from '@netlify/functions'
import { createFolder } from './lib/cloudinaryService.mjs'

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

    // Sanitize folder name - Cloudinary allows alphanumeric, hyphens, underscores, and forward slashes
    const sanitizedName = name.trim().replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '_')
    
    // Build full path for Cloudinary
    // Remove leading slash for Cloudinary paths
    let cloudinaryPath = parent_path === '/' 
      ? sanitizedName
      : `${parent_path.replace(/^\//, '')}/${sanitizedName}`
    
    // Ensure no leading slash for Cloudinary
    cloudinaryPath = cloudinaryPath.replace(/^\//, '')

    console.log(`📁 Creating folder in Cloudinary: ${cloudinaryPath}`)

    // Create folder in Cloudinary
    try {
      await createFolder(cloudinaryPath)
    } catch (cloudinaryError: any) {
      console.error('❌ Cloudinary folder creation failed:', cloudinaryError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create folder in Cloudinary',
          message: cloudinaryError.message || 'Unknown error'
        }),
        { status: 500, headers }
      )
    }

    // Build full path for database (with leading slash)
    const fullPath = parent_path === '/' 
      ? `/${sanitizedName}`
      : `${parent_path}/${sanitizedName}`

    // Return success with folder information
    const folder = {
      id: Date.now(),
      name: sanitizedName,
      path: fullPath,
      cloudinary_path: cloudinaryPath,
      parent_path: parent_path,
      created_at: Date.now(),
    }

    console.log('✅ Folder created successfully:', folder)

    return new Response(
      JSON.stringify({
        success: true,
        folder: folder,
        message: 'Folder created in Cloudinary successfully'
      }),
      { status: 201, headers }
    )
  } catch (error) {
    console.error('❌ Error creating folder:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers }
    )
  }
}

