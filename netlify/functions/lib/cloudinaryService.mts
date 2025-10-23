import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Create a folder in Cloudinary
 * @param path - The folder path to create (e.g., "blog-posts/images")
 * @returns The created folder information
 */
export async function createFolder(path: string) {
  try {
    console.log(`📁 Creating Cloudinary folder: ${path}`);
    const result = await cloudinary.api.create_folder(path);
    console.log('✅ Cloudinary folder created:', result);
    return result;
  } catch (error: any) {
    console.error('❌ Error creating Cloudinary folder:', error);
    // If folder already exists, Cloudinary returns a 400 error
    if (error.http_code === 400 && error.message?.includes('already exists')) {
      console.log('ℹ️ Folder already exists in Cloudinary');
      return { success: true, message: 'Folder already exists', path };
    }
    throw error;
  }
}

/**
 * Delete a folder from Cloudinary
 * Note: Cloudinary only allows deleting empty folders
 * @param path - The folder path to delete (e.g., "blog-posts/images")
 * @returns The deletion result
 */
export async function deleteFolder(path: string) {
  try {
    console.log(`🗑️ Deleting Cloudinary folder: ${path}`);
    const result = await cloudinary.api.delete_folder(path);
    console.log('✅ Cloudinary folder deleted:', result);
    return result;
  } catch (error: any) {
    console.error('❌ Error deleting Cloudinary folder:', error);
    // Cloudinary returns specific errors for non-empty folders
    if (error.http_code === 400 && error.message?.includes('not empty')) {
      throw new Error('Cannot delete non-empty folder. Please move or delete all files first.');
    }
    if (error.http_code === 404) {
      console.log('ℹ️ Folder does not exist in Cloudinary');
      return { success: true, message: 'Folder does not exist' };
    }
    throw error;
  }
}

/**
 * List all folders in Cloudinary
 * @returns Array of folder information
 */
export async function listFolders() {
  try {
    console.log('📂 Listing Cloudinary folders');
    const result = await cloudinary.api.root_folders();
    console.log('✅ Cloudinary folders retrieved:', result);
    return result;
  } catch (error) {
    console.error('❌ Error listing Cloudinary folders:', error);
    throw error;
  }
}

/**
 * List subfolders within a specific folder
 * @param path - The parent folder path
 * @returns Array of subfolder information
 */
export async function listSubfolders(path: string) {
  try {
    console.log(`📂 Listing Cloudinary subfolders in: ${path}`);
    const result = await cloudinary.api.sub_folders(path);
    console.log('✅ Cloudinary subfolders retrieved:', result);
    return result;
  } catch (error) {
    console.error('❌ Error listing Cloudinary subfolders:', error);
    throw error;
  }
}

/**
 * Get resources (files) in a specific folder
 * @param path - The folder path
 * @returns Array of resources in the folder
 */
export async function getFolderResources(path: string) {
  try {
    console.log(`📄 Getting resources in Cloudinary folder: ${path}`);
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: path,
      max_results: 500
    });
    console.log('✅ Cloudinary folder resources retrieved:', result);
    return result;
  } catch (error) {
    console.error('❌ Error getting Cloudinary folder resources:', error);
    throw error;
  }
}

