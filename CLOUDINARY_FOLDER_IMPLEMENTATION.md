# Cloudinary Folder Management Implementation

## Overview

This document describes the implementation of **real Cloudinary folder creation and deletion** functionality in the Media File Manager application. Previously, folders were only managed virtually in the Xano database. Now, folders are created and deleted directly in Cloudinary using the Cloudinary Admin API.

## Implementation Summary

### 1. ✅ Cloudinary Service Module Created

**File:** `netlify/functions/lib/cloudinaryService.mts`

A new service module has been created with the following functions:

- **`createFolder(path)`** - Creates a folder in Cloudinary
- **`deleteFolder(path)`** - Deletes an empty folder from Cloudinary
- **`listFolders()`** - Lists all root folders in Cloudinary
- **`listSubfolders(path)`** - Lists subfolders within a specific folder
- **`getFolderResources(path)`** - Gets all files in a specific folder

**Key Features:**
- Proper error handling for existing folders and non-empty folder deletion
- Detailed console logging for debugging
- Handles Cloudinary-specific constraints (e.g., can't delete non-empty folders)

### 2. ✅ API Endpoints Updated

#### **POST /api/folder-create**
**File:** `netlify/functions/folder-create.mts`

- Now creates **real folders in Cloudinary** using the Admin API
- Sanitizes folder names (alphanumeric, hyphens, underscores only)
- Handles path conversion between database format (with `/`) and Cloudinary format (without leading `/`)
- Returns folder information including both database path and Cloudinary path

**Request Body:**
```json
{
  "name": "blog-posts",
  "parent_path": "/"
}
```

**Response:**
```json
{
  "success": true,
  "folder": {
    "id": 1729654321000,
    "name": "blog-posts",
    "path": "/blog-posts",
    "cloudinary_path": "blog-posts",
    "parent_path": "/",
    "created_at": 1729654321000
  },
  "message": "Folder created in Cloudinary successfully"
}
```

#### **DELETE /api/folder-delete**
**File:** `netlify/functions/folder-delete.mts`

- Deletes folders from **Cloudinary** (not just database)
- Checks if folder contains files before deletion
- Returns detailed error messages for non-empty folders
- Accepts folder path via query parameter: `?path=/blog-posts`

**Request:**
```
DELETE /api/folder-delete?path=/blog-posts
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Folder deleted successfully from Cloudinary",
  "path": "/blog-posts",
  "cloudinary_path": "blog-posts"
}
```

**Response (Error - Non-empty folder):**
```json
{
  "error": "Cannot delete non-empty folder",
  "message": "Folder contains 5 file(s). Please move or delete all files first.",
  "file_count": 5
}
```

#### **GET /api/folder-list**
**File:** `netlify/functions/folder-list.mts`

- Enhanced to support listing folders from **Cloudinary** or database
- Use `?source=cloudinary` to fetch directly from Cloudinary
- Use `?parent=/path` to list subfolders of a specific path

**Examples:**
```
GET /api/folder-list                    # List from database (default)
GET /api/folder-list?source=cloudinary  # List from Cloudinary
GET /api/folder-list?source=cloudinary&parent=/blog-posts  # List subfolders
```

### 3. ✅ Frontend Service Updated

**File:** `src/services/FolderService.ts`

- Updated `deleteFolder()` method to accept `folderPath` instead of `folderId`
- Now returns `{ success: boolean; error?: string }` for better error handling
- Uses query parameter for folder path: `?path=...`

### 4. ✅ Frontend UI Updated

**File:** `src/App.tsx`

- Added `handleDeleteFolder()` function with user confirmation
- Displays helpful error messages from the API
- Automatically switches to root folder if currently viewing a deleted folder
- Removes deleted folders from the UI state

**User Experience:**
1. User clicks delete button on a folder
2. Confirmation dialog explains Cloudinary's empty-folder requirement
3. If folder is not empty, user sees error with file count
4. If successful, folder is removed from UI and Cloudinary

### 5. ✅ Dependencies Installed

- **`cloudinary` package** (v2.7.0) installed via npm
- Already listed in `package.json` but wasn't being used by backend functions

## Environment Variables Required

Add these to your Netlify environment variables (or `.env` file):

```env
# Cloudinary Admin API Credentials
CLOUDINARY_CLOUD_NAME=dzrw8nopf
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Frontend Cloudinary Config (already exists)
VITE_CLOUDINARY_CLOUD_NAME=dzrw8nopf
VITE_CLOUDINARY_UPLOAD_PRESET=HIBF_MASTER
```

**Where to find these values:**
1. Log in to [Cloudinary Console](https://console.cloudinary.com/)
2. Go to **Settings** → **API Keys**
3. Copy your **API Key** and **API Secret**

## Testing Instructions

### 1. Test Folder Creation

```bash
# Create a root-level folder
curl -X POST https://your-app.netlify.app/api/folder-create \
  -H "Content-Type: application/json" \
  -d '{"name": "blog-posts", "parent_path": "/"}'

# Create a nested folder
curl -X POST https://your-app.netlify.app/api/folder-create \
  -H "Content-Type: application/json" \
  -d '{"name": "images", "parent_path": "/blog-posts"}'
```

**Verify in Cloudinary:**
- Go to Cloudinary Media Library
- You should see `blog-posts` folder
- Inside it, you should see `images` subfolder

### 2. Test File Upload to Folder

Use the Media Manager UI:
1. Upload an image
2. In the Cloudinary widget, select folder: `blog-posts/images`
3. Complete the upload
4. Verify the image URL contains `/blog-posts/images/` in the path

**Expected URL format:**
```
https://res.cloudinary.com/dzrw8nopf/image/upload/blog-posts/images/filename.jpg
```

### 3. Test Folder Deletion (Empty Folder)

```bash
# Try to delete the images subfolder (should succeed if empty)
curl -X DELETE "https://your-app.netlify.app/api/folder-delete?path=/blog-posts/images"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Folder deleted successfully from Cloudinary"
}
```

### 4. Test Folder Deletion (Non-Empty Folder)

```bash
# Try to delete a folder with files (should fail)
curl -X DELETE "https://your-app.netlify.app/api/folder-delete?path=/blog-posts"
```

**Expected response:**
```json
{
  "error": "Cannot delete non-empty folder",
  "message": "Folder contains 3 file(s). Please move or delete all files first.",
  "file_count": 3
}
```

### 5. Test in UI

1. Open the Media Manager
2. Click "Create Folder" button
3. Enter folder name: `test-folder`
4. Verify it appears in Cloudinary dashboard
5. Try to delete it (should work if empty)
6. Upload a file to the folder
7. Try to delete it again (should show error message)

## Deployment Checklist

### Before Deploying to Production

- [ ] Add Cloudinary API credentials to Netlify environment variables
- [ ] Test folder creation in staging environment
- [ ] Test folder deletion in staging environment
- [ ] Verify file uploads use correct folder paths
- [ ] Test error handling for non-empty folder deletion
- [ ] Check that folder paths are displayed correctly in UI

### Deployment Steps

1. **Create feature branch:**
   ```bash
   git checkout -b feature/cloudinary-folders
   ```

2. **Commit changes:**
   ```bash
   git add .
   git commit -m "Add Cloudinary folder creation and deletion functionality"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin feature/cloudinary-folders
   ```

4. **Deploy to staging:**
   - Netlify will auto-deploy the branch
   - Test all functionality in staging

5. **Merge to production:**
   ```bash
   git checkout voxpro_update  # or your production branch
   git merge feature/cloudinary-folders
   git push origin voxpro_update
   ```

6. **Verify in production:**
   - Test folder creation
   - Test folder deletion
   - Verify file uploads

## Important Notes

### Cloudinary Folder Constraints

1. **Empty Folders Only**: Cloudinary only allows deleting empty folders
2. **Path Format**: Cloudinary paths don't have leading slashes (e.g., `blog-posts/images` not `/blog-posts/images`)
3. **Automatic Creation**: Folders are automatically created when uploading files with a folder path
4. **No Folder Metadata**: Cloudinary folders don't store metadata like creation date

### Error Handling

The implementation includes comprehensive error handling:

- **Folder already exists**: Returns success (idempotent operation)
- **Folder not empty**: Returns clear error message with file count
- **Folder doesn't exist**: Returns success for deletion (idempotent)
- **Invalid folder name**: Sanitizes names automatically

### Path Conversion

The code handles two path formats:

- **Database format**: `/blog-posts/images` (with leading slash)
- **Cloudinary format**: `blog-posts/images` (without leading slash)

Conversion happens automatically in the API endpoints.

## Files Modified

### New Files
- `netlify/functions/lib/cloudinaryService.mts` - Cloudinary service module

### Modified Files
- `netlify/functions/folder-create.mts` - Updated to use Cloudinary API
- `netlify/functions/folder-delete.mts` - Updated to use Cloudinary API
- `netlify/functions/folder-list.mts` - Added Cloudinary listing option
- `src/services/FolderService.ts` - Updated delete method signature
- `src/App.tsx` - Added delete folder handler
- `.env.example` - Added Cloudinary API credentials template
- `package.json` - Cloudinary package already present

## Next Steps

1. **Add environment variables** to Netlify
2. **Test in staging** environment
3. **Deploy to production** after successful testing
4. **Optional enhancements:**
   - Add folder rename functionality
   - Add folder move functionality
   - Add bulk folder operations
   - Add folder metadata storage in Xano
   - Implement folder tree view in UI

## Support

If you encounter issues:

1. Check Netlify function logs for errors
2. Verify Cloudinary credentials are correct
3. Check that folders exist in Cloudinary dashboard
4. Verify API endpoints are accessible
5. Check browser console for frontend errors

## API Reference

### Cloudinary Admin API

Documentation: https://cloudinary.com/documentation/admin_api

**Relevant endpoints used:**
- `cloudinary.api.create_folder(path)` - Create folder
- `cloudinary.api.delete_folder(path)` - Delete folder
- `cloudinary.api.root_folders()` - List root folders
- `cloudinary.api.sub_folders(path)` - List subfolders
- `cloudinary.api.resources({ prefix: path })` - List files in folder

---

**Implementation Date:** October 23, 2025  
**Status:** ✅ Complete and ready for testing

