# Testing the Webflow Sync

This document provides step-by-step instructions for testing the media assets sync functionality.

## Quick Test Checklist

- [ ] Environment variables configured in Netlify
- [ ] Site redeployed after adding environment variables
- [ ] Webflow API token has correct permissions
- [ ] Webflow collection fields are properly configured
- [ ] Test single file upload works
- [ ] Test bulk sync works
- [ ] Files appear in Webflow CMS Collection
- [ ] Files appear in Webflow Media Assets

## Test 1: Single File Upload

### Steps:
1. Open the media manager: https://eclectic-caramel-34e317.netlify.app
2. Click **Upload** button
3. Select a test image file
4. Fill in the metadata (title, description, etc.)
5. Click **Upload**
6. Open browser console (F12)

### Expected Results:
```
🔄 CloudinaryService: Starting upload for: test-image.jpg
✅ CloudinaryService: Upload successful
🔄 App: Saving file to database
🔄 Triggering Webflow sync for asset: [xano-id]
✅ App: File saved to database
```

### Verify in Webflow:
1. Go to Webflow CMS → Media Assets Collection
2. Check if the new item appears
3. Go to Webflow Assets panel
4. Check if the file appears in "All Assets"

## Test 2: Bulk Sync (Sync All Existing Files)

### Using Browser Console:
```javascript
// Open browser console on your site
fetch('/.netlify/functions/sync-all-to-webflow', { 
  method: 'POST' 
})
.then(r => r.json())
.then(result => {
  console.log('Sync Results:', result);
  console.log(`✅ Successful: ${result.results.successful.length}`);
  console.log(`❌ Failed: ${result.results.failed.length}`);
})
.catch(err => console.error('Sync Error:', err));
```

### Using cURL:
```bash
curl -X POST https://eclectic-caramel-34e317.netlify.app/.netlify/functions/sync-all-to-webflow
```

### Expected Response:
```json
{
  "success": true,
  "message": "Full sync to Webflow completed",
  "results": {
    "successful": [
      {
        "fileId": "123",
        "title": "Example File",
        "assetId": "webflow-asset-id",
        "collectionItemId": "webflow-item-id"
      }
    ],
    "failed": [],
    "total": 1
  }
}
```

## Test 3: Verify Netlify Function Logs

### Steps:
1. Go to Netlify Dashboard
2. Select your site
3. Click **Functions** in the sidebar
4. Click on **webflow-sync**
5. View the logs

### Expected Log Messages:
```
🔄 Webflow Sync: Starting sync process
🔄 Webflow Sync: Fetching file [id] from Xano
✅ Webflow Sync: Found 1 files to sync
🔄 Webflow Sync: Processing file: Test Image
🔄 Syncing to Webflow Assets: Test Image
✅ Asset synced: [asset-id]
🔄 Syncing to Webflow Collection: Test Image
✅ Collection item created: [item-id]
✅ Webflow Sync: Successfully synced file: Test Image
✅ Webflow Sync: Complete. Success: 1, Failed: 0
```

## Test 4: Manual API Test

### Test Webflow Connection:
```javascript
// Test if Webflow API token is valid
fetch('https://api.webflow.com/v2/sites/688ed8debc05764047afa2a7', {
  headers: {
    'Authorization': 'Bearer YOUR_WEBFLOW_TOKEN'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Test Xano Connection:
```javascript
// Test if Xano API is accessible
fetch('https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission', {
  headers: {
    'Authorization': 'Bearer YOUR_XANO_KEY'
  }
})
.then(r => r.json())
.then(data => console.log(`Found ${data.length} files in Xano`))
.catch(console.error);
```

## Test 5: Error Handling

### Test Missing Environment Variable:
1. Temporarily remove `VITE_WEBFLOW_API_TOKEN` from Netlify
2. Redeploy the site
3. Try uploading a file
4. Expected: Console shows "⚠️ Webflow API token not configured"
5. File should still save to Xano (sync fails gracefully)

### Test Invalid API Token:
1. Set `VITE_WEBFLOW_API_TOKEN` to an invalid value
2. Redeploy the site
3. Try uploading a file
4. Expected: Console shows "❌ Webflow sync failed (non-critical)"
5. File should still save to Xano

## Test 6: Verify Data in Each System

### Check Cloudinary:
1. Log in to Cloudinary dashboard
2. Go to Media Library
3. Verify uploaded files are in `HIBF_assets` folder
4. Check file URLs match what's in Xano

### Check Xano:
1. Log in to Xano
2. Go to your database
3. Open `user_submission` table
4. Verify records have:
   - `media_url` (Cloudinary URL)
   - `thumbnail` (Cloudinary thumbnail URL)
   - `file_type`, `file_size`, etc.

### Check Webflow CMS Collection:
1. Log in to Webflow
2. Go to CMS → Collections
3. Open "Media Assets" collection
4. Verify items have:
   - Name
   - Media URL (Cloudinary link)
   - Description, category, tags, etc.

### Check Webflow Media Assets:
1. In Webflow Designer
2. Open Assets panel
3. Go to "All Assets"
4. Verify uploaded files appear
5. Check thumbnails display correctly

## Common Issues and Solutions

### Issue: "CORS Error"
**Solution**: This is expected for direct API calls from browser. Use Netlify functions instead.

### Issue: "Rate Limit Exceeded"
**Solution**: Webflow has rate limits. Wait a few minutes and try again.

### Issue: "Field Not Found"
**Solution**: Verify Webflow collection has all required fields with correct names.

### Issue: "Unauthorized"
**Solution**: Check API token is valid and has correct permissions.

### Issue: Files in Xano but not Webflow
**Solution**: Run bulk sync: `POST /.netlify/functions/sync-all-to-webflow`

## Performance Benchmarks

### Single File Upload:
- Cloudinary upload: 2-5 seconds
- Xano save: < 1 second
- Webflow sync: 1-2 seconds
- **Total**: ~5-8 seconds

### Bulk Sync (100 files):
- Fetch from Xano: < 1 second
- Webflow sync per file: ~1-2 seconds
- **Total**: ~2-3 minutes (with rate limiting)

## Success Criteria

✅ **Sync is working correctly if:**
1. Files upload to Cloudinary successfully
2. Metadata saves to Xano
3. Items appear in Webflow CMS Collection
4. Files appear in Webflow Media Assets
5. Thumbnails display correctly
6. No errors in Netlify function logs
7. Console shows success messages

## Next Steps After Testing

1. ✅ Verify all tests pass
2. 📝 Document any custom configurations
3. 🔄 Set up monitoring for sync failures
4. 📊 Track sync performance over time
5. 🎯 Train users on the system