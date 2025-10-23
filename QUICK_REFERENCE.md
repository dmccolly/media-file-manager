# Quick Reference - Cloudinary Folder Management

## For Developers

### API Endpoints

#### Create Folder
```bash
POST /api/folder-create
Content-Type: application/json

{
  "name": "blog-posts",
  "parent_path": "/"
}
```

#### Delete Folder
```bash
DELETE /api/folder-delete?path=/blog-posts
```

#### List Folders (from Cloudinary)
```bash
GET /api/folder-list?source=cloudinary
```

### Environment Variables

Add to Netlify:
```env
CLOUDINARY_CLOUD_NAME=dzrw8nopf
CLOUDINARY_API_KEY=your_key_here
CLOUDINARY_API_SECRET=your_secret_here
```

### Test Script

```bash
# Set credentials
export CLOUDINARY_API_KEY=your_key
export CLOUDINARY_API_SECRET=your_secret

# Run test
node test-cloudinary-folders.js
```

## For Users

### Creating a Folder

1. Click **"Create Folder"** button
2. Enter folder name (e.g., `blog-posts`)
3. Click **"Create Folder"**
4. Folder appears in Cloudinary immediately

### Deleting a Folder

1. Click the **trash icon** next to folder name
2. Confirm deletion
3. **Note:** Folder must be empty (no files inside)

### Uploading to a Folder

1. Click **"Upload"** button
2. Select files
3. In Cloudinary widget, choose folder: `blog-posts/images`
4. Complete upload

### Folder URL Structure

Files in folders have this URL format:
```
https://res.cloudinary.com/dzrw8nopf/image/upload/blog-posts/images/photo.jpg
                                                    └─────┬─────┘
                                                      folder path
```

## Common Tasks

### Deploy Changes
```bash
git checkout feature/cloudinary-folders
git push origin feature/cloudinary-folders
# Netlify auto-deploys
```

### Merge to Production
```bash
git checkout voxpro_update
git merge feature/cloudinary-folders
git push origin voxpro_update
```

### Check Function Logs
1. Netlify Dashboard → Functions
2. Click on function name
3. View logs

### Rollback Deployment
1. Netlify → Deploys
2. Find previous deploy
3. Click ⋯ → Publish deploy

## Troubleshooting

### Folder Creation Fails
- Check Cloudinary credentials in Netlify
- Verify environment variables are set
- Redeploy site after adding variables

### Can't Delete Folder
- **Expected:** Cloudinary only deletes empty folders
- **Solution:** Delete or move all files first

### Folder Not in UI
- Refresh page
- Check browser console for errors
- Verify `/api/folder-list` endpoint works

## Important Notes

✅ **Folders are created in Cloudinary** (not just database)  
✅ **Empty folders only** can be deleted  
✅ **Path format:** `blog-posts/images` (no leading slash in Cloudinary)  
✅ **Automatic creation:** Uploading with folder path creates folder  

## Files Changed

- `netlify/functions/lib/cloudinaryService.mts` - New service
- `netlify/functions/folder-create.mts` - Updated
- `netlify/functions/folder-delete.mts` - Updated
- `netlify/functions/folder-list.mts` - Updated
- `src/services/FolderService.ts` - Updated
- `src/App.tsx` - Added delete handler

## Documentation

- **Full Implementation:** `CLOUDINARY_FOLDER_IMPLEMENTATION.md`
- **Deployment Steps:** `DEPLOYMENT_GUIDE.md`
- **This Reference:** `QUICK_REFERENCE.md`

---

**Branch:** `feature/cloudinary-folders`  
**Status:** ✅ Ready for deployment

