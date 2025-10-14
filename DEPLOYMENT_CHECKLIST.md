# Deployment Checklist for Webflow Sync Fix

Follow these steps after merging the pull request to get the sync working.

## ✅ Pre-Deployment

- [x] Pull request created: https://github.com/dmccolly/media-file-manager/pull/71
- [ ] Pull request reviewed
- [ ] Pull request merged to main

## 🔧 Configuration Steps

### Step 1: Get Webflow API Token
1. Log in to Webflow: https://webflow.com
2. Go to Account Settings → Integrations → API Access
3. Generate a new API token (or use existing)
4. **Copy the token** - you'll need it in Step 2
5. Ensure token has these permissions:
   - ✅ Sites: Read & Write
   - ✅ CMS: Read & Write  
   - ✅ Assets: Read & Write

### Step 2: Configure Netlify Environment Variables
1. Go to Netlify Dashboard: https://app.netlify.com
2. Select site: **eclectic-caramel-34e317**
3. Go to **Site Settings** → **Environment Variables**
4. Add/Update these variables:

```
VITE_WEBFLOW_API_TOKEN=<your_webflow_token_from_step_1>
VITE_WEBFLOW_SITE_ID=688ed8debc05764047afa2a7
VITE_WEBFLOW_COLLECTION_ID=6891479d29ed1066b71124e9
XANO_API_KEY=<your_existing_xano_key>
```

5. Click **Save**

### Step 3: Redeploy Site
1. In Netlify Dashboard, go to **Deploys**
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete (~2-3 minutes)
4. Verify deployment succeeded

## 🧪 Testing Steps

### Test 1: Verify Environment Variables
```bash
# Check Netlify function logs to ensure variables are loaded
# Should NOT see "API token not configured" errors
```

### Test 2: Test Single File Upload
1. Go to: https://eclectic-caramel-34e317.netlify.app
2. Click **Upload** button
3. Select a test image
4. Fill in metadata
5. Click **Upload**
6. Open browser console (F12)
7. Look for: `🔄 Triggering Webflow sync for asset`
8. Verify no errors

### Test 3: Verify in Webflow
1. Log in to Webflow
2. Go to **CMS** → **Collections** → **Media Assets**
3. Check if new item appears
4. Go to **Assets** panel in Designer
5. Check if file appears in "All Assets"

### Test 4: Bulk Sync Existing Files
```javascript
// Open browser console on your site
fetch('/.netlify/functions/sync-all-to-webflow', { 
  method: 'POST' 
})
.then(r => r.json())
.then(result => {
  console.log('✅ Sync Results:', result);
  console.log(`Successful: ${result.results.successful.length}`);
  console.log(`Failed: ${result.results.failed.length}`);
});
```

### Test 5: Check Netlify Function Logs
1. Go to Netlify Dashboard → **Functions**
2. Click **webflow-sync**
3. View recent logs
4. Look for success messages:
   - `✅ Webflow Sync: Successfully synced file`
   - `✅ Asset synced`
   - `✅ Collection item created`

## 🔍 Troubleshooting

### Issue: "API token not configured"
**Fix**: 
- Verify `VITE_WEBFLOW_API_TOKEN` is set in Netlify
- Redeploy the site after adding variable
- Clear browser cache

### Issue: "Unauthorized" or 401 errors
**Fix**:
- Check Webflow API token is valid
- Verify token has correct permissions
- Generate a new token if needed

### Issue: Files sync to Xano but not Webflow
**Fix**:
- Check Netlify function logs for errors
- Run bulk sync: `POST /.netlify/functions/sync-all-to-webflow`
- Verify Webflow collection fields match expected names

### Issue: Rate limit errors (429)
**Fix**:
- Webflow has rate limits (60 requests/minute)
- Wait a few minutes and try again
- For large syncs, the function handles this automatically

## 📊 Success Criteria

✅ **Deployment is successful when:**
1. No errors in Netlify function logs
2. New uploads appear in Webflow CMS Collection
3. New uploads appear in Webflow Media Assets
4. Bulk sync completes without errors
5. Thumbnails display correctly in Webflow
6. Console shows success messages

## 📝 Post-Deployment

### Monitor for 24 Hours
- [ ] Check Netlify function logs daily
- [ ] Verify new uploads sync correctly
- [ ] Monitor for any error patterns
- [ ] Test with different file types (images, videos, PDFs)

### Documentation
- [ ] Update team on new sync functionality
- [ ] Share SETUP_GUIDE.md with team
- [ ] Document any custom configurations
- [ ] Create runbook for common issues

### Optional: Set Up Monitoring
- [ ] Set up Netlify function alerts
- [ ] Create dashboard for sync metrics
- [ ] Set up error notifications

## 🎯 Next Steps

After successful deployment:
1. ✅ Test thoroughly with various file types
2. 📚 Train team on new functionality
3. 📊 Monitor sync performance
4. 🔄 Consider setting up automated health checks
5. 📝 Document any edge cases discovered

## 🆘 Support

If issues persist:
1. Check `SETUP_GUIDE.md` for detailed setup
2. Review `SYNC_TESTING.md` for testing procedures
3. Check Netlify function logs for specific errors
4. Verify all environment variables are correct
5. Test API tokens directly using Webflow API docs

---

**Pull Request**: https://github.com/dmccolly/media-file-manager/pull/71
**Live Site**: https://eclectic-caramel-34e317.netlify.app