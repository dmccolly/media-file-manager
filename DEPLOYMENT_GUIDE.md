# Deployment Guide - Cloudinary Folder Management

## Quick Start

This guide walks you through deploying the Cloudinary folder management feature to your production environment.

## Prerequisites

- [x] Code changes committed to `feature/cloudinary-folders` branch
- [ ] Cloudinary API credentials ready
- [ ] Access to Netlify dashboard
- [ ] Access to GitHub repository

## Step 1: Configure Environment Variables

### Get Cloudinary Credentials

1. Go to [Cloudinary Console](https://console.cloudinary.com/)
2. Navigate to **Settings** → **API Keys**
3. Copy the following values:
   - **Cloud Name**: `dzrw8nopf` (already configured)
   - **API Key**: Copy from dashboard
   - **API Secret**: Copy from dashboard (click "Reveal")

### Add to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your site: **media-file-manager**
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable** and add these three:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `CLOUDINARY_CLOUD_NAME` | `dzrw8nopf` | Your cloud name |
| `CLOUDINARY_API_KEY` | `[your-api-key]` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | `[your-api-secret]` | From Cloudinary dashboard |

5. Click **Save**

**Important:** Environment variables are only loaded during build/deploy. You'll need to redeploy after adding them.

## Step 2: Test Locally (Optional)

If you want to test before deploying:

```bash
# Set environment variables in your terminal
export CLOUDINARY_CLOUD_NAME=dzrw8nopf
export CLOUDINARY_API_KEY=your_api_key_here
export CLOUDINARY_API_SECRET=your_api_secret_here

# Run the test script
node test-cloudinary-folders.js
```

Expected output:
```
🧪 Testing Cloudinary Folder Operations

Configuration:
  Cloud Name: dzrw8nopf
  API Key: ✅ SET
  API Secret: ✅ SET

Test 1: Creating root folder...
  ✅ Success: test-folder-1729654321000

...

🎉 All tests passed!
```

## Step 3: Deploy to Staging

### Push Feature Branch

```bash
git push origin feature/cloudinary-folders
```

### Deploy Branch Preview

Netlify automatically creates a deploy preview for branches:

1. Go to **Deploys** tab in Netlify
2. Find the deploy for `feature/cloudinary-folders`
3. Click on the deploy URL (e.g., `feature-cloudinary-folders--your-site.netlify.app`)

### Test in Staging

1. **Test Folder Creation:**
   - Open the media manager
   - Click "Create Folder"
   - Enter name: `test-blog-posts`
   - Click "Create Folder"
   - Verify it appears in the folder list

2. **Verify in Cloudinary:**
   - Go to Cloudinary Media Library
   - You should see `test-blog-posts` folder

3. **Test File Upload:**
   - Upload an image
   - Select folder: `test-blog-posts`
   - Complete upload
   - Verify image URL contains `/test-blog-posts/` in path

4. **Test Folder Deletion (Empty):**
   - Try to delete `test-blog-posts` (should work if empty)
   - Verify it's removed from Cloudinary

5. **Test Folder Deletion (Non-Empty):**
   - Create folder: `test-with-files`
   - Upload an image to it
   - Try to delete folder
   - Should see error: "Folder contains X file(s)..."

## Step 4: Merge to Production

### Option A: Direct Merge (Recommended)

```bash
# Switch to production branch
git checkout voxpro_update  # or your production branch name

# Merge feature branch
git merge feature/cloudinary-folders

# Push to production
git push origin voxpro_update
```

### Option B: Pull Request (If using GitHub workflow)

1. Go to GitHub repository
2. Click **Pull requests** → **New pull request**
3. Base: `voxpro_update`, Compare: `feature/cloudinary-folders`
4. Click **Create pull request**
5. Add description and reviewers
6. After approval, click **Merge pull request**

### Netlify Auto-Deploy

Netlify will automatically deploy when you push to your production branch:

1. Go to **Deploys** tab in Netlify
2. Wait for build to complete (usually 2-3 minutes)
3. Status should show **Published**

## Step 5: Verify Production Deployment

### Check Build Logs

1. Click on the latest deploy in Netlify
2. Check **Deploy log** for any errors
3. Look for successful build message:
   ```
   ✓ built in X.XXs
   ```

### Test Production

Repeat all tests from Step 3 on your production URL:

- [ ] Folder creation works
- [ ] Folder appears in Cloudinary
- [ ] File upload to folder works
- [ ] Folder deletion works (empty folders)
- [ ] Error message shows for non-empty folders
- [ ] UI updates correctly after operations

### Check Function Logs

1. Go to **Functions** tab in Netlify
2. Click on `folder-create`, `folder-delete`, or `folder-list`
3. Check **Function log** for any errors
4. Look for success messages:
   ```
   📁 Creating Cloudinary folder: blog-posts
   ✅ Cloudinary folder created
   ```

## Step 6: Monitor and Troubleshoot

### Common Issues

#### Issue: "Cloudinary credentials not configured"

**Solution:**
1. Verify environment variables are set in Netlify
2. Redeploy the site (environment variables only load on deploy)
3. Check variable names match exactly:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

#### Issue: "Cannot delete non-empty folder"

**Expected behavior:** This is correct! Cloudinary doesn't allow deleting folders with files.

**Solution:**
1. Move or delete all files in the folder first
2. Then delete the folder

#### Issue: Folder not appearing in UI

**Solution:**
1. Refresh the page
2. Check browser console for errors
3. Verify API endpoint is accessible: `/api/folder-list`
4. Check Netlify function logs

#### Issue: 404 on API endpoints

**Solution:**
1. Check `netlify.toml` redirects are correct
2. Verify functions are in `netlify/functions/` directory
3. Check function file extensions are `.mts` or `.js`
4. Redeploy the site

### Monitoring

Set up monitoring for:

1. **Function Errors:**
   - Netlify → Functions → Check error count
   - Set up alerts for high error rates

2. **Cloudinary Usage:**
   - Cloudinary Dashboard → Usage
   - Monitor API calls and storage

3. **User Feedback:**
   - Watch for user reports of folder issues
   - Check browser console errors

## Rollback Plan

If something goes wrong:

### Quick Rollback

1. Go to Netlify → **Deploys**
2. Find the last working deploy
3. Click **⋯** → **Publish deploy**
4. Confirm rollback

### Code Rollback

```bash
# Revert the merge commit
git revert HEAD

# Or reset to previous commit
git reset --hard HEAD~1

# Push to production
git push origin voxpro_update --force
```

## Post-Deployment Checklist

- [ ] Environment variables configured in Netlify
- [ ] Feature branch pushed to GitHub
- [ ] Staging deployment tested successfully
- [ ] Production deployment completed
- [ ] All folder operations tested in production
- [ ] Function logs checked for errors
- [ ] Cloudinary dashboard verified
- [ ] User documentation updated (if needed)
- [ ] Team notified of new feature

## Next Steps

### Optional Enhancements

Consider implementing these in future updates:

1. **Folder Rename:**
   - Add `renameFolder(oldPath, newPath)` function
   - Update all file paths in folder

2. **Folder Move:**
   - Move folders between parent folders
   - Update nested folder paths

3. **Bulk Operations:**
   - Create multiple folders at once
   - Delete multiple folders

4. **Folder Metadata:**
   - Store folder descriptions in Xano
   - Add folder tags and categories

5. **Folder Tree View:**
   - Implement `FolderTree` component in main UI
   - Add drag-and-drop folder organization

6. **Folder Permissions:**
   - Add user-based folder access control
   - Implement folder sharing

## Support

If you need help:

1. Check `CLOUDINARY_FOLDER_IMPLEMENTATION.md` for technical details
2. Review Netlify function logs for errors
3. Check Cloudinary API documentation: https://cloudinary.com/documentation/admin_api
4. Contact Cloudinary support for API issues

## Resources

- [Cloudinary Admin API Docs](https://cloudinary.com/documentation/admin_api)
- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

---

**Last Updated:** October 23, 2025  
**Feature Branch:** `feature/cloudinary-folders`  
**Status:** Ready for deployment ✅

